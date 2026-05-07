import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const LAST_UPDATED = "January 1, 2025";

const returnSteps = [
  {
    step: "01",
    title: "Initiate Your Return",
    description: "Contact us at returns@femvelle.com or through your account dashboard within 30 days of delivery. Include your order number and reason for return.",
  },
  {
    step: "02",
    title: "Receive Your Label",
    description: "We will email you a prepaid return shipping label within 1 business day. Simply print and attach it to your parcel.",
  },
  {
    step: "03",
    title: "Pack & Ship",
    description: "Carefully repack your item in its original packaging. Drop it off at any authorised carrier location within 7 days of receiving your label.",
  },
  {
    step: "04",
    title: "Refund Processed",
    description: "Once we receive and inspect your return, your refund will be processed within 5–7 business days to your original payment method.",
  },
];

const sections = [
  {
    id: "eligibility",
    title: "Return Eligibility",
    content: [
      {
        subtitle: "Eligible Items",
        body: "Items are eligible for return if they are in their original, unworn condition with all tags attached, free from perfume, makeup, or any signs of wear. Items must be returned in their original Femvelle packaging within 30 days of the delivery date.",
      },
      {
        subtitle: "Non-Eligible Items",
        body: "The following items are not eligible for return: items marked as 'Final Sale', intimate apparel and swimwear (for hygiene reasons), customised or personalised items, items that have been altered, worn, washed, or damaged after delivery, and items returned without their original tags or packaging.",
      },
      {
        subtitle: "Condition Assessment",
        body: "All returned items are inspected upon receipt. If an item does not meet our return criteria, we will notify you and return the item to you at your expense. We reserve the right to refuse returns that do not comply with our policy.",
      },
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    content: [
      {
        subtitle: "Refund Method",
        body: "Approved refunds are issued to the original payment method used at the time of purchase. We are unable to process refunds to a different card or account. If your original payment method is no longer available, please contact us to arrange an alternative.",
      },
      {
        subtitle: "Refund Timeline",
        body: "Once your return is received and inspected, we will process your refund within 5–7 business days. Please allow an additional 3–5 business days for the refund to appear on your statement, depending on your bank or card issuer.",
      },
      {
        subtitle: "Shipping Costs",
        body: "Original shipping fees are non-refundable unless the return is due to a Femvelle error (incorrect item, defective product). For standard returns, we provide a prepaid return label at no cost to you; however, the original shipping fee will be deducted from your refund.",
      },
      {
        subtitle: "Store Credit",
        body: "If you prefer, we are happy to issue store credit in lieu of a refund. Store credit is valid for 12 months from the date of issue and can be applied to any future purchase on our platform.",
      },
    ],
  },
  {
    id: "exchanges",
    title: "Exchanges",
    content: [
      {
        subtitle: "Size & Colour Exchanges",
        body: "We offer complimentary exchanges for a different size or colour of the same item, subject to availability. To request an exchange, please contact us at returns@femvelle.com with your order number and the details of the item you would like instead.",
      },
      {
        subtitle: "Exchange Process",
        body: "Exchanges are processed as a return and new order. Once we receive your returned item, we will dispatch your exchange order within 1–2 business days. You will receive a new order confirmation and tracking information.",
      },
      {
        subtitle: "Availability",
        body: "Exchanges are subject to stock availability. If your requested exchange item is unavailable, we will issue a full refund or store credit at your preference.",
      },
    ],
  },
  {
    id: "defective",
    title: "Defective or Incorrect Items",
    content: [
      {
        subtitle: "Reporting Issues",
        body: "If you receive a defective, damaged, or incorrect item, please contact us within 48 hours of delivery at support@femvelle.com. Please include your order number, a description of the issue, and clear photographs of the item and packaging.",
      },
      {
        subtitle: "Resolution",
        body: "For defective or incorrect items, we will arrange a free return and offer you the choice of a replacement, exchange, or full refund including original shipping costs. We aim to resolve all such cases within 3 business days.",
      },
    ],
  },
  {
    id: "international",
    title: "International Returns",
    content: [
      {
        subtitle: "International Return Process",
        body: "International customers are responsible for return shipping costs unless the return is due to a Femvelle error. We recommend using a tracked shipping service, as we cannot be held responsible for returns lost in transit.",
      },
      {
        subtitle: "Customs & Duties",
        body: "When returning items from outside the United States, please mark the parcel as 'Returned Goods' on the customs declaration to avoid additional duties. Any customs charges incurred on returned items are the responsibility of the sender.",
      },
    ],
  },
];

export default function ReturnPolicyPage() {
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
            Customer Care
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(40px, 5vw, 64px)",
            fontWeight: 400,
            color: "#2C2420",
            lineHeight: 1.1,
            marginBottom: "24px",
          }}>
            Return Policy
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#6B5B55",
            maxWidth: "600px",
          }}>
            Your satisfaction is our priority. We offer a straightforward 30-day return policy to ensure you shop with complete confidence.
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

        {/* Return Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ padding: "64px 0 0" }}
        >
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "#2C2420",
            marginBottom: "48px",
          }}>
            How to Return
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {returnSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ position: "relative" }}
              >
                {/* Connector line */}
                {i < returnSteps.length - 1 && (
                  <div
                    className="hidden lg:block"
                    style={{
                      position: "absolute",
                      top: "20px",
                      left: "calc(100% - 16px)",
                      width: "calc(100% - 32px)",
                      height: "1px",
                      background: "#EDE8E3",
                      zIndex: 0,
                    }}
                  />
                )}

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#F8F6F3",
                    border: "1px solid #EDE8E3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}>
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "16px",
                      color: "#C4985A",
                      fontWeight: 400,
                    }}>
                      {step.step}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "20px",
                    fontWeight: 400,
                    color: "#2C2420",
                    marginBottom: "12px",
                  }}>
                    {step.title}
                  </h3>

                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "13px",
                    lineHeight: 1.7,
                    color: "#6B5B55",
                  }}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 30-Day Highlight Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            margin: "64px 0 0",
            padding: "40px",
            background: "#2C2420",
            borderRadius: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
          className="sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "32px",
              fontWeight: 400,
              color: "#E8D5B4",
              lineHeight: 1.2,
            }}>
              30-Day Free Returns
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "14px",
              color: "rgba(232,213,180,0.65)",
              marginTop: "8px",
            }}>
              Shop with confidence. Free prepaid return labels on all eligible orders.
            </p>
          </div>
          <Link
            to="/contact"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#2C2420",
              background: "#C4985A",
              textDecoration: "none",
              padding: "14px 28px",
              borderRadius: "2px",
              transition: "background 0.2s ease",
              display: "inline-block",
              flexShrink: 0,
              marginTop: "16px",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#D4AF7A")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#C4985A")}
          >
            Start a Return
          </Link>
        </motion.div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16" style={{ padding: "64px 0 100px" }}>

          {/* Sidebar TOC */}
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
                  { label: "Terms & Conditions", to: "/terms" },
                  { label: "Shipping Policy", to: "/shipping-policy" },
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