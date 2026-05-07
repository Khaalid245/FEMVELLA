import re
import html
import bleach
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils.html import strip_tags
import logging

logger = logging.getLogger('security')


class InputValidator:
    """Enterprise-grade input validation and sanitization"""

    # Allowed HTML tags for rich content
    ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
    ]
    
    ALLOWED_ATTRIBUTES = {
        '*': ['class'],
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'width', 'height'],
    }

    # Dangerous patterns to detect
    DANGEROUS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*=',
        r'onclick\s*=',
        r'onmouseover\s*=',
        r'eval\s*\(',
        r'document\.cookie',
        r'window\.location',
        r'<iframe[^>]*>',
        r'<object[^>]*>',
        r'<embed[^>]*>',
        r'<form[^>]*>',
        r'<input[^>]*>',
        r'<meta[^>]*>',
    ]

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r'union\s+select',
        r'drop\s+table',
        r'delete\s+from',
        r'insert\s+into',
        r'update\s+.*\s+set',
        r'exec\s*\(',
        r'sp_executesql',
        r'xp_cmdshell',
        r';\s*--',
        r'1\s*=\s*1',
        r'1\'\s*=\s*\'1',
        r'or\s+1\s*=\s*1',
        r'and\s+1\s*=\s*1',
    ]

    @classmethod
    def sanitize_html(cls, content, allow_tags=True):
        """Sanitize HTML content"""
        if not content:
            return content

        try:
            if allow_tags:
                # Use bleach to clean HTML
                cleaned = bleach.clean(
                    content,
                    tags=cls.ALLOWED_TAGS,
                    attributes=cls.ALLOWED_ATTRIBUTES,
                    strip=True
                )
            else:
                # Strip all HTML tags
                cleaned = strip_tags(content)
            
            # Additional sanitization
            cleaned = html.escape(cleaned, quote=False)
            
            return cleaned.strip()
            
        except Exception as e:
            logger.warning(f"HTML sanitization failed: {e}")
            return strip_tags(content)

    @classmethod
    def validate_and_sanitize_text(cls, text, max_length=None, min_length=None, 
                                  field_name='field', allow_html=False):
        """Comprehensive text validation and sanitization"""
        if not isinstance(text, str):
            raise ValidationError(f"{field_name} must be a string")

        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Check length limits
        if max_length and len(text) > max_length:
            raise ValidationError(f"{field_name} exceeds maximum length of {max_length}")
        
        if min_length and len(text.strip()) < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters")

        # Check for dangerous patterns
        cls._check_dangerous_patterns(text, field_name)
        
        # Sanitize based on context
        if allow_html:
            sanitized = cls.sanitize_html(text, allow_tags=True)
        else:
            sanitized = cls.sanitize_html(text, allow_tags=False)
        
        return sanitized

    @classmethod
    def validate_email_field(cls, email):
        """Validate email with additional security checks"""
        if not email:
            raise ValidationError("Email is required")

        # Basic Django validation
        try:
            validate_email(email)
        except ValidationError:
            raise ValidationError("Invalid email format")

        # Additional security checks
        email = email.lower().strip()
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'[<>"\']',  # HTML/script injection
            r'javascript:',
            r'data:',
            r'\s',  # No spaces allowed
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, email, re.IGNORECASE):
                raise ValidationError("Email contains invalid characters")

        # Length check
        if len(email) > 254:  # RFC 5321 limit
            raise ValidationError("Email address too long")

        return email

    @classmethod
    def validate_phone_number(cls, phone):
        """Validate phone number"""
        if not phone:
            return phone

        # Remove all non-digit characters except +
        cleaned = re.sub(r'[^\d+]', '', phone)
        
        # Basic validation
        if not re.match(r'^\+?[\d]{7,15}$', cleaned):
            raise ValidationError("Invalid phone number format")

        return cleaned

    @classmethod
    def validate_url(cls, url):
        """Validate URL with security checks"""
        if not url:
            return url

        url = url.strip()
        
        # Check for dangerous protocols
        dangerous_protocols = ['javascript:', 'data:', 'vbscript:', 'file:']
        for protocol in dangerous_protocols:
            if url.lower().startswith(protocol):
                raise ValidationError("URL contains dangerous protocol")

        # Ensure HTTPS for external URLs
        if url.startswith('http://') and not url.startswith('http://localhost'):
            logger.warning(f"Non-HTTPS URL detected: {url}")

        # Basic URL pattern validation
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)

        if not url_pattern.match(url):
            raise ValidationError("Invalid URL format")

        return url

    @classmethod
    def validate_json_field(cls, data, max_size=None):
        """Validate JSON data"""
        if data is None:
            return data

        # Check size if specified
        if max_size:
            import json
            json_str = json.dumps(data)
            if len(json_str) > max_size:
                raise ValidationError(f"JSON data exceeds maximum size of {max_size} bytes")

        # Check for dangerous content in JSON values
        def check_json_values(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if isinstance(value, str):
                        cls._check_dangerous_patterns(value, f"JSON field '{key}'")
                    elif isinstance(value, (dict, list)):
                        check_json_values(value)
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    if isinstance(item, str):
                        cls._check_dangerous_patterns(item, f"JSON array item {i}")
                    elif isinstance(item, (dict, list)):
                        check_json_values(item)

        check_json_values(data)
        return data

    @classmethod
    def _check_dangerous_patterns(cls, text, field_name):
        """Check for dangerous patterns in text"""
        text_lower = text.lower()
        
        # Check for XSS patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE | re.DOTALL):
                logger.warning(f"Dangerous pattern detected in {field_name}: {pattern}")
                raise ValidationError(f"{field_name} contains potentially dangerous content")

        # Check for SQL injection patterns
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"SQL injection pattern detected in {field_name}: {pattern}")
                raise ValidationError(f"{field_name} contains potentially dangerous content")

    @classmethod
    def sanitize_filename(cls, filename):
        """Sanitize filename for safe storage"""
        if not filename:
            return filename

        # Remove path separators and dangerous characters
        filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', filename)
        
        # Remove leading/trailing dots and spaces
        filename = filename.strip('. ')
        
        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
            filename = name[:250] + ('.' + ext if ext else '')

        # Ensure not empty
        if not filename:
            filename = 'unnamed_file'

        return filename

    @classmethod
    def validate_password_strength(cls, password):
        """Validate password strength"""
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")

        # Check for character variety
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)

        strength_score = sum([has_upper, has_lower, has_digit, has_special])
        
        if strength_score < 3:
            raise ValidationError(
                "Password must contain at least 3 of: uppercase letter, "
                "lowercase letter, number, special character"
            )

        # Check for common patterns
        common_patterns = [
            r'123456',
            r'password',
            r'qwerty',
            r'abc123',
            r'admin',
        ]
        
        for pattern in common_patterns:
            if pattern in password.lower():
                raise ValidationError("Password contains common patterns")

        return password