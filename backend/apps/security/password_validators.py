from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
import re


class CustomPasswordValidator:
    """Custom password validator with enterprise security requirements"""
    
    def validate(self, password, user=None):
        """Validate password against security requirements"""
        errors = []
        
        # Check minimum length (already handled by MinimumLengthValidator)
        if len(password) < 8:
            errors.append(_("Password must be at least 8 characters long."))
        
        # Check for character variety
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
        
        character_types = sum([has_upper, has_lower, has_digit, has_special])
        
        if character_types < 3:
            errors.append(_(
                "Password must contain at least 3 of the following: "
                "uppercase letter, lowercase letter, number, special character."
            ))
        
        # Check for common weak patterns
        weak_patterns = [
            (r'(.)\1{2,}', "Password cannot contain 3 or more repeated characters."),
            (r'123456|654321', "Password cannot contain sequential numbers."),
            (r'qwerty|asdfgh|zxcvbn', "Password cannot contain keyboard patterns."),
            (r'password|admin|login|user', "Password cannot contain common words."),
        ]
        
        for pattern, message in weak_patterns:
            if re.search(pattern, password.lower()):
                errors.append(_(message))
        
        # Check against user information if provided
        if user:
            user_info = [
                getattr(user, 'email', '').split('@')[0].lower(),
                getattr(user, 'first_name', '').lower(),
                getattr(user, 'last_name', '').lower(),
                getattr(user, 'username', '').lower(),
            ]
            
            for info in user_info:
                if info and len(info) > 2 and info in password.lower():
                    errors.append(_("Password cannot contain personal information."))
                    break
        
        # Check for dictionary words (basic check)
        common_words = [
            'femvelle', 'fashion', 'clothing', 'dress', 'style',
            'welcome', 'hello', 'test', 'demo', 'sample'
        ]
        
        for word in common_words:
            if word in password.lower():
                errors.append(_("Password cannot contain common dictionary words."))
                break
        
        if errors:
            raise ValidationError(errors)
    
    def get_help_text(self):
        return _(
            "Your password must contain at least 8 characters with at least 3 of: "
            "uppercase letter, lowercase letter, number, special character. "
            "Avoid common patterns and personal information."
        )