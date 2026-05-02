import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const categories = [
  {
    title: "Abayas",
    subtitle: "Timeless silhouettes",
    slug: "abayas",
    bg: "bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80')]",
  },
  {
    title: "Modest Dresses",
    subtitle: "Effortless elegance",
    slug: "modest-dresses",
    bg: "bg-[url('https://images.unsplash.com/photo-1594938298603-c8148c4b4e5b?w=800&q=80')]",
  },
  {
    title: "Scarves & Hijabs",
    subtitle: "Refined draping",
    slug: "scarves-hijabs",
    bg: "bg-[url('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&q=80')]",
  },
];

export default function CategoryCards() {
  return (
    <section className="mb-16">
      <div className="flex items-end justify-between mb-8">
        <h2 className="font-serif text-3xl font-semibold text-gray-900">Shop by Category</h2>
        <Link
          to="/products"
          className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors hidden sm:block"
        >
          All categories →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link
              to={`/products?category__slug=${cat.slug}`}
              className="group relative block aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100"
            >
              {/* Background image */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 ${cat.bg}`}
              />

              {/* Gradient overlay — stronger at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white/60 text-xs tracking-widest uppercase mb-1.5 font-medium">
                  {cat.subtitle}
                </p>
                <h3 className="font-serif text-2xl font-bold text-white mb-4 leading-tight">
                  {cat.title}
                </h3>

                {/* Shop Now pill */}
                <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  Shop Now
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
