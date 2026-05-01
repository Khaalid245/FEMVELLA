import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/Button";
import { useProducts } from "@/api/products";

export default function HomePage() {
  const { data, isLoading } = useProducts({ is_featured: "true" });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden bg-brand-50 mb-16">
        <div className="px-8 py-20 md:py-32 max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-5xl md:text-6xl font-bold text-brand-900 leading-tight mb-6"
          >
            Modest Fashion, Elevated.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 text-lg mb-8"
          >
            Discover curated modest wear that blends elegance with everyday comfort.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Button size="lg" as={Link} to="/products">Shop Now</Button>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="font-serif text-3xl font-semibold text-gray-900 mb-8">Featured Pieces</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {data?.results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </Layout>
  );
}
