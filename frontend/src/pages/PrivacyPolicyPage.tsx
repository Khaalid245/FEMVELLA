import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const LAST_UPDATED = "January 1, 2025";

const sections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: [
      {
        subtitle: "Personal Information",
        body: "When you create an account, place an order, or contact us, we collect information you provide directly — including your name, email address, shipping address, phone number, and payment details. Payment card data is processed exclusively through our secure payment partner, Stripe, and is never stored on our servers.",
      },
      {
        subtitle: "Automatically Collected Information",
        body: "When you visit Femvelle, we automatically collect certain technical information including your IP address, browser type, device identifiers, pages visited, time spent on pages, and referring URLs. This data helps us understand how our platform is used and improve your experience.",
      },
      {
        subtitle: "Cookies & Tracking Technologies",
        body: "We use cookies, pixel tags, and similar technologies to remember your preferences, maintain your shopping cart, and analyse site traffic. You may control cookie settings through your browser; however, disabling certain cookies may affect the functionality of our platform.",
      },
    ],
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Order Fulfilment",
        body: "We use your personal information to process and fulfil your orders, send order confirmations and shipping updates, handle returns and exchanges, and provide customer support.",
      },
      {
        subtitle: "Communications",
        body: "With your consent, we may send you newsletters, styling inspiration, exclusive offers, and information about new arrivals. You may unsubscribe at any time via the link in any email or by contacting us directly.",
      },
      {
        subtitle: "Platform Improvement",
        body: "We analyse usage data to improve our website, personalise your shopping experience, develop new features, and ensure the security and integrity of our platform.",
      },
    ],
  },
  {
    id: "sharing",
    title: "Sharing Your Information",
    content: [
      {
        subtitle: "Service Providers",
        body: "We share your information with trusted third-party service providers who assist us in operating our business — including payment processors (Stripe), shipping carriers, email service providers, and analytics platforms. These partners are contractually obligated to protect your data and use it only for the services they provide to us.",
      },
      {
        subtitle: "Legal Requirements",
        body: "We may disclose your information when required by law, court order, or governmental authority, or when we believe disclosure is necessary to protect our rights, your safety, or the safety of others.",
      },
      {
        subtitle: "Business Transfers",
        body: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you via email and/or prominent notice on our website of any such change.",
      },
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    content: [
      {
        subtitle: "Our Commitment",
        body: "We implement industry-standard security measures including SSL/TLS encryption, secure data storage, access controls, and regular security audits to protect your personal information from unauthorised access, alteration, disclosure, or destruction.",
      },
      {
        subtitle: "Your Responsibility",
        body: "You are responsible for maintaining the confidentiality of your account credentials. Please notify us immediately at privacy@femvelle.com if you suspect any unauthorised use of your account.",
      },
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    content: [
      {
        subtitle: "Access & Portability",
        body: "You have the right to request a copy of the personal information we hold about you, in a structured, machine-readable format.",
      },
      {
        subtitle: "Correction & Deletion",
        body: "You may request that we correct inaccurate information or delete your personal data, subject to certain legal obligations that may require us to retain certain records.",
      },
      {
        subtitle: "Opt-Out",
        body: "You may opt out of marketing communications at any time. You may also request that we restrict the processing of your data in certain circumstances.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    content: [
      {
        subtitle: "Privacy Enquiries",
        body: "For any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our Privacy Team at privacy@femvelle.com or write to us at Femvelle, New York Atelier. We will respond to all requests within 30 days.",
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ padding: "80px 0 64px", borderBottom: "1px solid #EDE8E3" }}
        >
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#C4985A",
            marginBottom: "20px",
          }}>
            Legal
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(40px, 5vw, 64px)",
            fontWeight: 400,
            color: "#2C2420",
            lineHeight: 1.1,
            marginBottom: "24px",
          }}>
            Privacy Policy
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#6B5B55",
            maxWidth: "600px",
          }}>
            At Femvelle, your privacy is a matter of the highest importance. This policy explains how we collect, use, and protect your personal information when you engage with our platform.
          </p>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#9E8E88",
            marginTop: "20px",
            letterSpacing: "0.04em",
          }}>
            Last updated: {LAST_UPDATED}
          </p>
        </motion.div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16" style={{ padding: "64px 0 100px" }}>

          {/* Sidebar TOC */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <div style={{ position: "sticky", top: "100px" }}>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#9E8E88",
                marginBottom: "20px",
              }}>
                Contents
              </p>
              <nav className="flex flex-col gap-3">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      color: "#9E8E88",
                      textDecoration: "none",
                      lineHeight: 1.5,
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C4985A")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#9E8E88")}
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3"
          >
            <div className="flex flex-col gap-16">
              {sections.map((section, i) => (
                <motion.section
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                >
                  <h2 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "28px",
                    fontWeight: 400,
                    color: "#2C2420",
                    marginBottom: "28px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #EDE8E3",
                  }}>
                    {section.title}
                  </h2>

                  <div className="flex flex-col gap-8">
                    {section.content.map((item, j) => (
                      <div key={j}>
                        <h3 style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "#C4985A",
                          marginBottom: "12px",
                        }}>
                          {item.subtitle}
                        </h3>
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "15px",
                          lineHeight: 1.8,
                          color: "#4A3F3A",
                        }}>
                          {item.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>

            {/* Related Links */}
            <div style={{
              marginTop: "64px",
              paddingTop: "40px",
              borderTop: "1px solid #EDE8E3",
            }}>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#9E8E88",
                marginBottom: "20px",
              }}>
                Related Policies
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: "Terms & Conditions", to: "/terms" },
                  { label: "Shipping Policy", to: "/shipping-policy" },
                  { label: "Return Policy", to: "/returns" },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "13px",
                      color: "#2C2420",
                      textDecoration: "none",
                      border: "1px solid #EDE8E3",
                      padding: "10px 20px",
                      borderRadius: "2px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#C4985A";
                      (e.currentTarget as HTMLElement).style.color = "#C4985A";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#EDE8E3";
                      (e.currentTarget as HTMLElement).style.color = "#2C2420";
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}