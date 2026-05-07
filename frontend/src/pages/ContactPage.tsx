import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import ContactForm from "@/components/ContactForm";
import { openWhatsApp, getFormattedWhatsAppNumber } from "@/utils/whatsapp";

interface ContactMethod {
  icon: React.ReactNode;
  label: string;
  primary: string;
  description: string;
  action?: () => void;
  href?: string;
}

export default function ContactPage() {
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSuccess = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 5000);
  };

  const contactMethods: ContactMethod[] = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      label: "WhatsApp Concierge",
      primary: getFormattedWhatsAppNumber(),
      description: "Instant styling advice and personalized support",
      action: () => openWhatsApp(),
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      label: "Email Support",
      primary: "hello@femvelle.com",
      description: "For orders, returns, and general inquiries",
      href: "mailto:hello@femvelle.com",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      label: "Studio Location",
      primary: "New York Atelier",
      description: "Private appointments and bespoke consultations",
    },
  ];

  const Toast = ({ message, type, show }: { message: string; type: 'success' | 'error'; show: boolean }) => (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50"
          style={{
            background: type === 'success' ? "#F8FDF8" : "#FDF8F8",
            border: `1px solid ${type === 'success' ? "#81C784" : "#E57373"}`,
            borderRadius: "8px",
            padding: "16px 24px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: type === 'success' ? "#81C784" : "#E57373",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {type === 'success' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              )}
            </div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                color: type === 'success' ? "#2E7D32" : "#C62828",
                margin: 0,
              }}
            >
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <Layout>
      {/* Success Toast */}
      <Toast 
        message="Message sent successfully. We'll get back to you soon." 
        type="success" 
        show={showSuccessToast} 
      />
      
      {/* Error Toast */}
      <Toast 
        message={errorMessage} 
        type="error" 
        show={showErrorToast} 
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
          style={{ padding: "80px 0 60px" }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(42px, 5vw, 64px)",
              fontWeight: 400,
              color: "#2C2420",
              lineHeight: 1.1,
              marginBottom: "24px",
            }}
          >
            Contact Us
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "18px",
              lineHeight: 1.6,
              color: "#6B5B55",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            We are here to assist you with styling advice, orders, and personalized support. 
            Our team is dedicated to providing you with an exceptional luxury experience.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pb-20">
          {/* Left Column - Contact Methods */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12"
          >
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-6 group cursor-pointer"
                onClick={() => {
                  if (method.action) {
                    method.action();
                  } else if (method.href) {
                    window.open(method.href, '_blank');
                  }
                }}
                style={{
                  transition: "transform 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (method.href || method.action) {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {/* Icon Container */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#F8F6F3",
                    border: "1px solid #EDE8E3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#C4985A",
                    transition: "all 0.3s ease",
                    flexShrink: 0,
                  }}
                  className="group-hover:bg-white group-hover:shadow-lg"
                >
                  {method.icon}
                </div>

                {/* Content */}
                <div>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#C4985A",
                      marginBottom: "8px",
                    }}
                  >
                    {method.label}
                  </p>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 400,
                      color: "#2C2420",
                      marginBottom: "8px",
                      transition: "color 0.3s ease",
                    }}
                    className={method.href || method.action ? "group-hover:text-[#C4985A]" : ""}
                  >
                    {method.primary}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "14px",
                      lineHeight: 1.5,
                      color: "#6B5B55",
                    }}
                  >
                    {method.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <ContactForm onSuccess={handleSuccess} onError={handleError} />
          </motion.div>
        </div>

        {/* Brand Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
          style={{
            padding: "60px 0 80px",
            borderTop: "1px solid #EDE8E3",
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#9E8E88",
              maxWidth: "500px",
              margin: "0 auto",
              fontStyle: "italic",
            }}
          >
            "At Femvelle, every conversation is an opportunity to create something beautiful together. 
            We look forward to hearing from you."
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}