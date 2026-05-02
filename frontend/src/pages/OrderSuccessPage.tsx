import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Button from "@/components/Button";

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <Layout>
      <div className="max-w-md mx-auto text-center py-24">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
          <p className="text-gray-500 mb-2">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
          {orderId && (
            <p className="text-sm text-gray-400 mb-8">Order #{orderId}</p>
          )}
          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" as={Link} to="/products">
              Continue Shopping
            </Button>
            <Button size="lg" variant="outline" className="w-full" as={Link} to="/profile/orders">
              View My Orders
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
