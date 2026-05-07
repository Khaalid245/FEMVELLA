import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { openWhatsApp } from "@/utils/whatsapp";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface FooterLink {
  label: string;
  to: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────
const QUICK_LINKS: FooterLink[] = [
  { label: "Shop",      to: "/products" },
  { label: "About",     to: "/about" },
  { label: "Lookbook",  to: "/products?is_featured=true" },
  { label: "Contact",   to: "/contact" },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: "Help Center",     to: "/help" },
  { label: "Returns",         to: "/returns" },
  { label: "Shipping",        to: "/shipping" },
  { label: "Privacy Policy",  to: "/privacy" },
];

const CHAT_LINKS = [
  {
    label: "Chat With Us",
    action: () => openWhatsApp("Hello Femvelle, I need assistance with my order."),
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
  },
];

const SOCIAL = [
  {
    label: "Instagram",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Pinterest",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.641 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.564 0-2.387-1.715-4.057-4.163-4.057-2.836 0-4.5 2.127-4.5 4.326 0 .856.33 1.775.741 2.276a.3.3 0 01.069.286c-.076.313-.244.995-.277 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────
// FooterColumn
// ─────────────────────────────────────────────
function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#E8D5B4",
          fontWeight: 500,
          marginBottom: "20px",
        }}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="group inline-flex items-center gap-1.5 transition-all duration-200"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "rgba(232,213,180,0.65)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#E8D5B4";
                (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "rgba(232,213,180,0.65)";
                (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// Newsletter
// ─────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <div>
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#E8D5B4",
          fontWeight: 500,
          marginBottom: "20px",
        }}
      >
        Newsletter
      </p>

      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "20px",
          fontWeight: 400,
          color: "#E8D5B4",
          lineHeight: 1.3,
          marginBottom: "20px",
        }}
      >
        Join the Inner Circle
      </p>

      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "12px",
          color: "rgba(232,213,180,0.55)",
          lineHeight: 1.7,
          marginBottom: "20px",
        }}
      >
        Exclusive access to new arrivals, private sales and atelier stories.
      </p>

      {submitted ? (
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "12px",
            color: "#C4985A",
            letterSpacing: "0.08em",
          }}
        >
          ✓ You're on the list.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <input
              type="email"
              required
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(232,213,180,0.3)",
                padding: "8px 0",
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                color: "#E8D5B4",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) =>
                ((e.target as HTMLInputElement).style.borderBottomColor = "#C4985A")
              }
              onBlur={(e) =>
                ((e.target as HTMLInputElement).style.borderBottomColor =
                  "rgba(232,213,180,0.3)")
              }
            />
          </div>
          <button
            type="submit"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#2C2420",
              background: "#C4985A",
              border: "none",
              padding: "9px 16px",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "#D4AF7A")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "#C4985A")
            }
          >
            Join
          </button>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Footer
// ─────────────────────────────────────────────
export default function Footer() {
  return (
    <footer style={{ background: "#2C2420", width: "100%" }}>
      {/* Main grid */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: "80px", paddingBottom: "64px" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Col 1 — Brand */}
          <div>
            <Link
              to="/"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "26px",
                fontWeight: 400,
                color: "#E8D5B4",
                letterSpacing: "0.06em",
                textDecoration: "none",
                display: "block",
                marginBottom: "16px",
              }}
            >
              Femvelle
            </Link>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "13px",
                lineHeight: 1.8,
                color: "rgba(232,213,180,0.6)",
                marginBottom: "28px",
                maxWidth: "220px",
              }}
            >
              Curated modest fashion for the refined woman. Crafted with intention, worn with grace.
            </p>

            {/* Social icons */}
            <div className="flex gap-4">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    color: "rgba(232,213,180,0.5)",
                    transition: "color 0.2s ease",
                    display: "flex",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#C4985A")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "rgba(232,213,180,0.5)")
                  }
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Quick Links */}
          <FooterColumn title="Quick Links" links={QUICK_LINKS} />

          {/* Col 3 — Support */}
          <div>
            <FooterColumn title="Support" links={SUPPORT_LINKS} />
            
            {/* WhatsApp Chat */}
            <div className="mt-8">
              {CHAT_LINKS.map((chat) => (
                <button
                  key={chat.label}
                  onClick={chat.action}
                  className="group inline-flex items-center gap-2 transition-all duration-200"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(196, 152, 90, 0.3)",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#C4985A",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(196, 152, 90, 0.1)";
                    (e.currentTarget as HTMLElement).style.borderColor = "#C4985A";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(196, 152, 90, 0.3)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {chat.icon}
                  {chat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Col 4 — Newsletter */}
          <Newsletter />
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{
          borderTop: "1px solid rgba(232,213,180,0.1)",
          paddingTop: "24px",
          paddingBottom: "28px",
        }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Left — copyright */}
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              color: "rgba(232,213,180,0.4)",
              letterSpacing: "0.06em",
            }}
          >
            © {new Date().getFullYear()} Femvelle. All rights reserved.
          </p>

          {/* Center — legal links */}
          <div className="flex items-center gap-1">
            {["Privacy", "Terms", "Cookies"].map((item, i) => (
              <span key={item} className="flex items-center">
                {i > 0 && (
                  <span style={{ color: "rgba(232,213,180,0.2)", margin: "0 8px", fontSize: "10px" }}>
                    ·
                  </span>
                )}
                <Link
                  to={`/${item.toLowerCase()}`}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "11px",
                    color: "rgba(232,213,180,0.4)",
                    textDecoration: "none",
                    letterSpacing: "0.06em",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "#E8D5B4")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "rgba(232,213,180,0.4)")
                  }
                >
                  {item}
                </Link>
              </span>
            ))}
          </div>

          {/* Right — trust badges */}
          <div className="flex items-center gap-3">
            {["Visa", "Mastercard", "PayPal"].map((badge) => (
              <span
                key={badge}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(232,213,180,0.35)",
                  border: "1px solid rgba(232,213,180,0.15)",
                  padding: "4px 8px",
                  borderRadius: "2px",
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
