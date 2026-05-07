import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";

const LAST_UPDATED = "January 1, 2025";

const shippingZones = [
  {
    region: "United States",
    methods: [
      { name: "Standard Shipping", time: "5–7 business days", cost: "$9.99", free: "Orders over $75" },
      { name: "Express Shipping", time: "2–3 business days", cost: "$19.99", free: "Orders over $150" },
      { name: "Overnight Shipping", time: "Next business day", cost: "$39.99", free: null },
    ],
  },
  {
    region: "Canada",
    methods: [
      { name: "Standard Shipping", time: "7–10 business days", cost: "$14.99", free: "Orders over $100" },
      { name: "Express Shipping", time: "3–5 business days", cost: "$29.99", free: null },
    ],
  },
  {
    region: "United Kingdom & Europe",
    methods: [
      { name: "Standard Shipping", time: "8–12 business days", cost: "$19.99", free: "Orders over $150" },
      { name: "Express Shipping", time: "4–6 business days", cost: "$39.99", free: null },
    ],
  },
  {
    region: "Rest of World",
    methods: [
      { name: "Standard Shipping", time: "10–18 business days", cost: "$24.99", free: "Orders over $200" },
    ],
  },
];

const sections = [
  {
    id: "processing",
    title: "Order Processing",
    content: [
      {
        subtitle: "Processing Time",
        body: "All orders are processed within 1–2 business days of payment confirmation. Orders placed on weekends or public holidays will be processed on the next business day. During peak periods — including sale events and the holiday season — processing may take up to 3 business days.",
      },
      {
        subtitle: "Order Confirmation",
        body: "Upon placing your order, you will receive an email confirmation with your order details. Once your order has been dispatched, you will receive a second email containing your tracking number and a link to track your shipment in real time.",
      },
      {
        subtitle: "Cut-Off Times",
        body: "Orders placed before 12:00 PM EST on business days are typically processed the same day. Orders placed after this time will be processed the following business day.",
      },
    ],
  },
  {
    id: "packaging",
    title: "Packaging",
    content: [
      {
        subtitle: "Luxury Presentation",
        body: "Every Femvelle order is carefully packaged in our signature tissue-lined boxes, sealed with our embossed ribbon. We believe the unboxing experience is an extension of the luxury you deserve.",
      },
      {
        subtitle: "Gift Packaging",
        body: "Complimentary gift wrapping is available at checkout. You may include a personalised handwritten note with your order. Gift packaging includes our premium box, satin ribbon, and a Femvelle gift card.",
      },
      {
        subtitle: "Sustainability",
        body: "Our packaging materials are FSC-certified and recyclable. We are committed to reducing our environmental footprint while maintaining the premium presentation our clients expect.",
      },
    ],
  },
  {
    id: "tracking",
    title: "Tracking Your Order",
    content: [
      {
        subtitle: "Real-Time Tracking",
        body: "Once your order is dispatched, you will receive a tracking number via email. You can track your shipment directly through our website or via the carrier's tracking portal. Please allow up to 24 hours for tracking information to become active.",
      },
      {
        subtitle: "Delivery Notifications",
        body: "Our shipping partners provide SMS and email delivery notifications. We recommend ensuring your contact details are accurate at checkout to receive timely updates about your delivery.",
      },
    ],
  },
  {
    id: "customs",
    title: "International Orders & Customs",
    content: [
      {
        subtitle: "Customs & Duties",
        body: "International orders may be subject to customs duties, taxes, and import fees levied by the destination country. These charges are the sole responsibility of the recipient and are not included in our shipping fees. Femvelle has no control over these charges and cannot predict their amount.",
      },
      {
        subtitle: "Customs Delays",
        body: "International shipments may be subject to customs inspection, which can cause delays beyond our estimated delivery times. We recommend allowing additional time for international orders, particularly during peak periods.",
      },
      {
        subtitle: "Restricted Countries",
        body: "We are unable to ship to certain countries due to legal restrictions or carrier limitations. If your country is not available at checkout, please contact us at shipping@femvelle.com and we will do our best to assist you.",
      },
    ],
  },
  {
    id: "issues",
    title: "Delivery Issues",
    content: [
      {
        subtitle: "Lost or Delayed Shipments",
        body: "If your order has not arrived within the estimated delivery window, please first check your tracking information. If the tracking shows no movement for more than 5 business days, please contact us at support@femvelle.com and we will investigate with the carrier on your behalf.",
      },
      {
        subtitle: "Incorrect Address",
        body: "Please ensure your shipping address is accurate at the time of ordering. Femvelle is not responsible for orders delivered to an incorrect address provided by the customer. If you notice an error after placing your order, please contact us immediately — we will do our best to update the address before dispatch.",
      },
      {
        subtitle: "Damaged in Transit",
        body: "In the rare event that your order arrives damaged, please photograph the packaging and contents immediately and contact us within 48 hours at support@femvelle.com. We will arrange a replacement or refund promptly.",
      },
    ],
  },
];

export default function ShippingPolicyPage() {
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
            Shipping Policy
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#6B5B55",
            maxWidth: "600px",
          }}>
            We ship worldwide with care and precision. Every order is handled with the attention it deserves, from our atelier to your door.
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

        {/* Shipping Rates Table */}
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
            marginBottom: "40px",
          }}>
            Shipping Rates & Delivery Times
          </h2>

          <div className="flex flex-col gap-10">
            {shippingZones.map((zone, i) => (
              <motion.div
                key={zone.region}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#C4985A",
                  marginBottom: "16px",
                }}>
                  {zone.region}
                </p>

                <div style={{ border: "1px solid #EDE8E3", borderRadius: "4px", overflow: "hidden" }}>
                  {/* Table Header */}
                  <div
                    className="grid grid-cols-3"
                    style={{
                      background: "#F8F6F3",
                      padding: "12px 20px",
                      borderBottom: "1px solid #EDE8E3",
                    }}
                  >
                    {["Method", "Delivery Time", "Cost"].map((h) => (
                      <p key={h} style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "10px",
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#9E8E88",
                      }}>
                        {h}
                      </p>
                    ))}
                  </div>

                  {/* Table Rows */}
                  {zone.methods.map((method, j) => (
                    <div
                      key={j}
                      className="grid grid-cols-3"
                      style={{
                        padding: "16px 20px",
                        borderBottom: j < zone.methods.length - 1 ? "1px solid #EDE8E3" : "none",
                        background: "white",
                      }}
                    >
                      <div>
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "14px",
                          color: "#2C2420",
                          fontWeight: 500,
                        }}>
                          {method.name}
                        </p>
                        {method.free && (
                          <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "11px",
                            color: "#C4985A",
                            marginTop: "4px",
                          }}>
                            Free — {method.free}
                          </p>
                        )}
                      </div>
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        color: "#4A3F3A",
                      }}>
                        {method.time}
                      </p>
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "14px",
                        color: "#4A3F3A",
                        fontWeight: 500,
                      }}>
                        {method.cost}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
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

            {/* CTA */}
            <div style={{
              marginTop: "64px",
              padding: "40px",
              background: "#F8F6F3",
              border: "1px solid #EDE8E3",
              borderRadius: "4px",
            }}>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "22px",
                fontWeight: 400,
                color: "#2C2420",
                marginBottom: "12px",
              }}>
                Questions about your shipment?
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#6B5B55",
                marginBottom: "24px",
              }}>
                Our concierge team is available to assist you with any shipping enquiries.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "white",
                    background: "#C4985A",
                    textDecoration: "none",
                    padding: "12px 24px",
                    borderRadius: "2px",
                    transition: "background 0.2s ease",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#D4AF7A")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#C4985A")}
                >
                  Contact Us
                </Link>
                <Link
                  to="/returns"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#2C2420",
                    textDecoration: "none",
                    border: "1px solid #2C2420",
                    padding: "12px 24px",
                    borderRadius: "2px",
                    transition: "all 0.2s ease",
                    display: "inline-block",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#C4985A";
                    (e.currentTarget as HTMLElement).style.color = "#C4985A";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2C2420";
                    (e.currentTarget as HTMLElement).style.color = "#2C2420";
                  }}
                >
                  Return Policy
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}