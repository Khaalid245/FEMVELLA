import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContactSubmission } from "@/api/contact";

interface ContactFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactForm({ onSuccess, onError }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const contactMutation = useContactSubmission();

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        return undefined;
      case "email":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address";
        return undefined;
      case "message":
        if (!value.trim()) return "Message is required";
        if (value.trim().length < 10) return "Message must be at least 10 characters";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof FormData]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({ name: true, email: true, message: true });
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await contactMutation.mutateAsync(formData);
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
      setTouched({});
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          "Failed to send message. Please try again.";
      onError(errorMessage);
    }
  };

  const inputStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    color: "#2C2420",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #DDD5CE",
    padding: "12px 0",
    outline: "none",
    transition: "border-color 0.3s ease",
    width: "100%",
  };

  const labelStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "10px",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#6B5B55",
    marginBottom: "8px",
    display: "block",
  };

  return (
    <div
      style={{
        background: "#FEFEFE",
        border: "1px solid #F0EBE6",
        borderRadius: "8px",
        padding: "40px",
        boxShadow: "0 4px 20px rgba(44, 36, 32, 0.08)",
      }}
    >
      <h3
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "28px",
          fontWeight: 400,
          color: "#2C2420",
          marginBottom: "32px",
          textAlign: "center",
        }}
      >
        Send a Message
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            style={{
              ...inputStyle,
              borderBottomColor: errors.name && touched.name ? "#E57373" : 
                               formData.name ? "#C4985A" : "#DDD5CE",
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = "#C4985A")}
            onBlur={(e) => {
              handleBlur("name");
              e.target.style.borderBottomColor = errors.name && touched.name ? "#E57373" : 
                                                formData.name ? "#C4985A" : "#DDD5CE";
            }}
          />
          <AnimatePresence>
            {errors.name && touched.name && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  color: "#E57373",
                  marginTop: "4px",
                }}
              >
                {errors.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Email Field */}
        <div>
          <label style={labelStyle}>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            style={{
              ...inputStyle,
              borderBottomColor: errors.email && touched.email ? "#E57373" : 
                               formData.email ? "#C4985A" : "#DDD5CE",
            }}
            onFocus={(e) => (e.target.style.borderBottomColor = "#C4985A")}
            onBlur={(e) => {
              handleBlur("email");
              e.target.style.borderBottomColor = errors.email && touched.email ? "#E57373" : 
                                                formData.email ? "#C4985A" : "#DDD5CE";
            }}
          />
          <AnimatePresence>
            {errors.email && touched.email && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  color: "#E57373",
                  marginTop: "4px",
                }}
              >
                {errors.email}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Message Field */}
        <div>
          <label style={labelStyle}>Message *</label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            onBlur={() => handleBlur("message")}
            rows={5}
            style={{
              ...inputStyle,
              borderBottom: "1px solid #DDD5CE",
              border: "1px solid #DDD5CE",
              borderRadius: "4px",
              padding: "12px",
              resize: "none" as const,
              borderColor: errors.message && touched.message ? "#E57373" : 
                          formData.message ? "#C4985A" : "#DDD5CE",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C4985A")}
            onBlur={(e) => {
              handleBlur("message");
              e.target.style.borderColor = errors.message && touched.message ? "#E57373" : 
                                          formData.message ? "#C4985A" : "#DDD5CE";
            }}
          />
          <AnimatePresence>
            {errors.message && touched.message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "12px",
                  color: "#E57373",
                  marginTop: "4px",
                }}
              >
                {errors.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={contactMutation.isPending}
          className="w-full h-12 transition-all duration-300"
          style={{
            background: contactMutation.isPending ? "#9E8E88" : "#2C2420",
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 500,
            border: "none",
            borderRadius: "4px",
            cursor: contactMutation.isPending ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!contactMutation.isPending) {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 25px rgba(44, 36, 32, 0.15)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {contactMutation.isPending ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}