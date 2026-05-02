import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Button from "@/components/Button";

export default function OrderFailedPage() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center py-24">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3">Payment Failed</h1>
          <p className="text-gray-500 mb-2">
            Your payment could not be processed. Your cart has been saved.
          </p>
          {orderId && (
            <p className="text-sm text-gray-400 mb-8">Order #{orderId}</p>
          )}
          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" as={Link} to="/cart">
              Return to Cart
            </Button>
            <Button size="lg" variant="outline" className="w-full" as={Link} to="/products">
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
