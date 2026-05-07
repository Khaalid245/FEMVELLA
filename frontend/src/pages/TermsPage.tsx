import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const LAST_UPDATED = "January 1, 2025";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: [
      {
        subtitle: null,
        body: "By accessing or using the Femvelle website, mobile application, or any of our services, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our platform. We reserve the right to update these terms at any time; continued use of our services following any changes constitutes your acceptance of the revised terms.",
      },
    ],
  },
  {
    id: "account",
    title: "Your Account",
    content: [
      {
        subtitle: "Registration",
        body: "To access certain features of our platform, you may be required to create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated.",
      },
      {
        subtitle: "Account Security",
        body: "You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at support@femvelle.com of any unauthorised use of your account.",
      },
      {
        subtitle: "Account Termination",
        body: "We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, third parties, or the integrity of our platform.",
      },
    ],
  },
  {
    id: "orders",
    title: "Orders & Purchases",
    content: [
      {
        subtitle: "Order Acceptance",
        body: "All orders placed through Femvelle are subject to acceptance. We reserve the right to refuse or cancel any order at any time for reasons including product availability, errors in product or pricing information, or concerns identified by our fraud detection systems.",
      },
      {
        subtitle: "Pricing",
        body: "All prices are displayed in US Dollars and are subject to change without notice. We make every effort to ensure pricing accuracy; however, in the event of a pricing error, we reserve the right to cancel the affected order and notify you accordingly.",
      },
      {
        subtitle: "Payment",
        body: "Payment is processed securely through Stripe. By providing your payment information, you represent that you are authorised to use the payment method and authorise us to charge the applicable amount. All transactions are encrypted using industry-standard SSL technology.",
      },
    ],
  },
  {
    id: "products",
    title: "Products & Descriptions",
    content: [
      {
        subtitle: "Accuracy",
        body: "We endeavour to display our products as accurately as possible, including colours, textures, and dimensions. However, we cannot guarantee that your device's display will accurately reflect the actual product. Minor variations in colour or texture are inherent to handcrafted and artisanal items.",
      },
      {
        subtitle: "Availability",
        body: "All products are subject to availability. We reserve the right to discontinue any product at any time. In the event that a product you have ordered becomes unavailable, we will notify you promptly and offer a full refund or suitable alternative.",
      },
    ],
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: [
      {
        subtitle: "Ownership",
        body: "All content on the Femvelle platform — including but not limited to text, photography, graphics, logos, product designs, and software — is the exclusive property of Femvelle or its licensors and is protected by applicable intellectual property laws.",
      },
      {
        subtitle: "Permitted Use",
        body: "You may access and use our platform for personal, non-commercial purposes only. You may not reproduce, distribute, modify, create derivative works from, publicly display, or exploit any content from our platform without our prior written consent.",
      },
    ],
  },
  {
    id: "prohibited",
    title: "Prohibited Conduct",
    content: [
      {
        subtitle: null,
        body: "You agree not to: (i) use our platform for any unlawful purpose; (ii) attempt to gain unauthorised access to any part of our platform or systems; (iii) transmit any harmful, offensive, or disruptive content; (iv) use automated tools to scrape, crawl, or extract data from our platform; (v) impersonate any person or entity; or (vi) engage in any conduct that could damage, disable, or impair our platform or interfere with other users' enjoyment of it.",
      },
    ],
  },
  {
    id: "limitation",
    title: "Limitation of Liability",
    content: [
      {
        subtitle: "Disclaimer",
        body: "Our platform and products are provided on an 'as is' basis. To the fullest extent permitted by law, Femvelle disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.",
      },
      {
        subtitle: "Liability Cap",
        body: "To the maximum extent permitted by applicable law, Femvelle's total liability to you for any claims arising from your use of our platform or products shall not exceed the amount you paid for the specific product or service giving rise to the claim.",
      },
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: [
      {
        subtitle: null,
        body: "These Terms & Conditions shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in New York County, New York.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    content: [
      {
        subtitle: null,
        body: "For questions regarding these Terms & Conditions, please contact us at legal@femvelle.com or write to Femvelle Legal, New York Atelier. We aim to respond to all enquiries within 5 business days.",
      },
    ],
  },
];

export default function TermsPage() {
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
            Terms & Conditions
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#6B5B55",
            maxWidth: "600px",
          }}>
            Please read these terms carefully before using our platform. They govern your relationship with Femvelle and outline the rights and responsibilities of both parties.
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
                  transition={{ duration: 0.6, delay: i * 0.04 }}
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
                        {item.subtitle && (
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
                        )}
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
            <div style={{ marginTop: "64px", paddingTop: "40px", borderTop: "1px solid #EDE8E3" }}>
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
                  { label: "Privacy Policy", to: "/privacy" },
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