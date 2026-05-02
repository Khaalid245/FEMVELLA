import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import CategoryCard, { type CategoryItem } from "./CategoryCard";

// Static data — swap `image` for category.image from API when ready
const CATEGORIES: CategoryItem[] = [
  {
    title: "Abaya",
    slug: "abayas",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&auto=format&fit=crop&crop=top",
    count: "32 pieces",
  },
  {
    title: "Evening Wear",
    slug: "evening-wear",
    image:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=85&auto=format&fit=crop&crop=top",
    count: "18 pieces",
  },
  {
    title: "Dresses",
    slug: "dresses",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4b4e5b?w=800&q=85&auto=format&fit=crop&crop=top",
    count: "24 pieces",
  },
];

export default function CategorySection() {
  return (
    <section className="mb-20">
      {/* Section header */}
      <div className="flex items-end justify-between mb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C4985A",
              marginBottom: "8px",
            }}
          >
            Explore
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 400,
              color: "#2C2420",
              lineHeight: 1.1,
            }}
          >
            Shop by Category
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            to="/products"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6B5B55",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "#2C2420")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "#6B5B55")
            }
          >
            All Categories →
          </Link>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {CATEGORIES.map((cat, i) => (
          <CategoryCard key={cat.slug} item={cat} index={i} />
        ))}
      </div>
    </section>
  );
}
