import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import { useProduct } from "@/api/products";
import { useCartStore } from "@/store/cartStore";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug!);
  const addItem = useCartStore((s) => s.addItem);

  if (isLoading) return <Layout><div className="animate-pulse h-96 bg-gray-100 rounded-xl" /></Layout>;
  if (!product) return <Layout><p className="text-gray-500">Product not found.</p></Layout>;

  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];

  return (
    <Layout>
      <div className="grid md:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden">
          {primaryImage && <img src={primaryImage.image} alt={product.name} className="w-full h-full object-cover" />}
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
          <p className="text-sm text-gray-400 mb-2">{product.category?.name}</p>
          <h1 className="font-serif text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
          <div className="flex items-center gap-3 mb-6">
            {product.sale_price ? (
              <>
                <span className="text-2xl font-bold text-brand-600">${product.sale_price}</span>
                <span className="text-lg text-gray-400 line-through">${product.price}</span>
              </>
            ) : (
              <span className="text-2xl font-bold text-gray-900">${product.price}</span>
            )}
          </div>
          <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
          <Button
            size="lg"
            onClick={() => addItem({ id: product.id, name: product.name, price: product.sale_price ?? product.price, quantity: 1, image: primaryImage?.image ?? "", slug: product.slug })}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
          <p className="text-sm text-gray-400 mt-3">{product.stock} items left</p>
        </motion.div>
      </div>
    </Layout>
  );
}
