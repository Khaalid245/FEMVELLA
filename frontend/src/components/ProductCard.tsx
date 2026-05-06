import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Product } from "@/api/products";
import { useCartStore } from "@/store/cartStore";
import Button from "./Button";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const primaryImage = product.images.find((i) => i.is_primary) ?? product.images[0];
  const productPath = product.slug && !/^\d+$/.test(product.slug)
    ? `/products/${product.slug}`
    : `/products/${product.id}`;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <Link to={productPath}>
        <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-1">{product.category?.name}</p>
          <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {product.sale_price ? (
              <>
                <span className="text-brand-600 font-semibold">${product.sale_price}</span>
                <span className="text-gray-400 line-through text-sm">${product.price}</span>
              </>
            ) : (
              <span className="text-gray-900 font-semibold">${product.price}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Button
          size="sm"
          className="w-full"
          onClick={() =>
            addItem({
              id: product.id,
              name: product.name,
              price: product.sale_price ?? product.price,
              quantity: 1,
              image: primaryImage?.image ?? "",
              slug: product.slug,
            })
          }
          disabled={product.total_stock === 0}
        >
          {product.total_stock === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </motion.div>
  );
}
