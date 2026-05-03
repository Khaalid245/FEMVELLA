import { motion } from "framer-motion";
import TestimonialCard, {
  TestimonialCardSkeleton,
  type Testimonial,
} from "./TestimonialCard";

// ─────────────────────────────────────────────
// Static data — swap for useQuery when backend
// GET /api/testimonials/ is ready
// ─────────────────────────────────────────────
const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Fatima Al-Rashid",
    location: "Dubai, UAE",
    rating: 5,
    message:
      "Every piece I've received has been crafted with such care and intention. The abaya I ordered fits like it was made for me — the fabric drapes beautifully and the quality is unlike anything I've found elsewhere.",
  },
  {
    id: 2,
    name: "Nour Benali",
    location: "Paris, France",
    rating: 5,
    message:
      "I was searching for modest evening wear that didn't compromise on elegance. Zehrada understood exactly what I needed. The gown arrived perfectly packaged and exceeded every expectation.",
  },
  {
    id: 3,
    name: "Amira Hassan",
    location: "London, UK",
    rating: 5,
    message:
      "The attention to detail is extraordinary. From the stitching to the packaging, everything speaks of a brand that truly values its craft. I've recommended Zehrada to every woman in my circle.",
  },
];

interface Props {
  isLoading?: boolean;
}

export default function TestimonialsSection({ isLoading = false }: Props) {
  return (
    // Full-width breakout — negative horizontal margins cancel the Layout padding
    <section
      className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-0"
      style={{
        background: "#F5EEE8",
        paddingTop: "80px",
        paddingBottom: "80px",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#C4985A",
              marginBottom: "14px",
            }}
          >
            Our Community
          </p>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(34px, 4vw, 44px)",
              fontWeight: 400,
              color: "#2C2420",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              marginBottom: "16px",
            }}
          >
            The Zehrada Woman
          </h2>

          {/* Gold rule */}
          <div
            aria-hidden
            style={{
              width: "40px",
              height: "1px",
              background: "#C4985A",
              margin: "0 auto",
            }}
          />
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <TestimonialCardSkeleton key={i} />
              ))
            : TESTIMONIALS.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} index={i} />
              ))}
        </div>
      </div>
    </section>
  );
}
