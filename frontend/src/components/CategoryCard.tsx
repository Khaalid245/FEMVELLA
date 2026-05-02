import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export interface CategoryItem {
  title: string;
  slug: string;
  image: string;
  count?: string;
}

function CategoryCard({ item, index }: { item: CategoryItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/products?category__slug=${item.slug}`}
        className="group relative block overflow-hidden"
        style={{ aspectRatio: "4/5" }}
        aria-label={`Shop ${item.title}`}
      >
        {/* Background image */}
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={{ filter: "saturate(0.82) contrast(1.04)" }}
        />

        {/* Gradient overlay — resting state */}
        <div
          className="absolute inset-0 transition-opacity duration-400"
          style={{
            background:
              "linear-gradient(to top, rgba(44,36,32,0.78) 0%, rgba(44,36,32,0.18) 45%, transparent 100%)",
          }}
        />

        {/* Gradient overlay — hover state (darker) */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{
            background:
              "linear-gradient(to top, rgba(44,36,32,0.92) 0%, rgba(44,36,32,0.35) 55%, transparent 100%)",
          }}
        />

        {/* Content — slides up on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 p-7 translate-y-1 group-hover:-translate-y-1 transition-transform duration-400 ease-out"
        >
          {/* Item count */}
          {item.count && (
            <p
              className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#C4985A",
              }}
            >
              {item.count}
            </p>
          )}

          {/* Category name */}
          <h3
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(22px, 2.4vw, 30px)",
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: "14px",
              letterSpacing: "0.01em",
            }}
          >
            {item.title}
          </h3>

          {/* Shop Now */}
          <span
            className="inline-flex items-center gap-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)",
              fontWeight: 400,
              transition: "color 0.2s ease",
            }}
          >
            Shop Now
            <svg
              width="14"
              height="10"
              viewBox="0 0 16 10"
              fill="none"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M1 5h14M10 1l5 4-5 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        {/* Thin gold border on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{ border: "1px solid rgba(196,152,90,0.35)" }}
        />
      </Link>
    </motion.div>
  );
}

export default memo(CategoryCard);
