import { memo } from "react";
import { motion } from "framer-motion";

export interface Testimonial {
  id: number;
  name: string;
  location: string;
  message: string;
  rating: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 mb-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={i < rating ? "#C4985A" : "none"}
          stroke="#C4985A"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  const initial = testimonial.name.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(44,36,32,0.10)" }}
      style={{
        background: "#fff",
        border: "1px solid #E8DDD8",
        borderRadius: "12px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.25s ease",
        boxShadow: "0 2px 12px rgba(44,36,32,0.05)",
      }}
    >
      {/* Stars */}
      <StarRating rating={testimonial.rating} />

      {/* Quote mark */}
      <span
        aria-hidden
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "48px",
          lineHeight: 0.8,
          color: "#E8DDD8",
          marginBottom: "8px",
          display: "block",
          userSelect: "none",
        }}
      >
        "
      </span>

      {/* Message */}
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "19px",
          fontStyle: "italic",
          fontWeight: 400,
          lineHeight: 1.75,
          color: "#2C2420",
          flex: 1,
          marginBottom: "24px",
        }}
      >
        {testimonial.message}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 mt-auto">
        {/* Avatar */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "#EDD8D0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "17px",
              fontWeight: 500,
              color: "#2C2420",
            }}
          >
            {initial}
          </span>
        </div>

        <div>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#2C2420",
              fontWeight: 500,
              marginBottom: "2px",
            }}
          >
            {testimonial.name}
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              color: "#A89490",
              letterSpacing: "0.04em",
            }}
          >
            {testimonial.location}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialCardSkeleton() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E8DDD8",
        borderRadius: "12px",
        padding: "28px",
      }}
      className="animate-pulse"
    >
      {/* Stars */}
      <div className="flex gap-1 mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-3 h-3 rounded-full" style={{ background: "#EDE8E3" }} />
        ))}
      </div>
      {/* Quote */}
      <div className="h-6 w-6 rounded mb-3" style={{ background: "#EDE8E3" }} />
      {/* Text lines */}
      <div className="space-y-2 mb-6">
        <div className="h-4 rounded" style={{ background: "#EDE8E3" }} />
        <div className="h-4 w-5/6 rounded" style={{ background: "#EDE8E3" }} />
        <div className="h-4 w-4/6 rounded" style={{ background: "#EDE8E3" }} />
      </div>
      {/* Author */}
      <div className="flex items-center gap-3 mt-6">
        <div className="w-10 h-10 rounded-full" style={{ background: "#EDE8E3" }} />
        <div className="space-y-1.5">
          <div className="h-3 w-24 rounded" style={{ background: "#EDE8E3" }} />
          <div className="h-3 w-16 rounded" style={{ background: "#EDE8E3" }} />
        </div>
      </div>
    </div>
  );
}

export default memo(TestimonialCard);
