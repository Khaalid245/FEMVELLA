import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Button from "@/components/Button";
import { useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="text-center py-24">
          <p className="text-gray-400 text-lg mb-4">Your cart is empty.</p>
          <Button variant="outline" onClick={() => window.history.back()}>Continue Shopping</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="font-serif text-3xl font-semibold text-gray-900 mb-8">Your Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl">
              <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-lg bg-gray-50" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-brand-600 font-semibold mt-1">${item.price}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.variant_id, item.customization_text)} className="w-7 h-7 border rounded flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant_id, item.customization_text)} className="w-7 h-7 border rounded flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                </div>
              </div>
              <button onClick={() => removeItem(item.id, item.variant_id, item.customization_text)} className="text-gray-300 hover:text-red-400 text-sm self-start">✕</button>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-xl p-6 h-fit">
          <h2 className="font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Subtotal</span><span>${total().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>Shipping</span><span>Calculated at checkout</span>
          </div>
          <div className="border-t pt-4 flex justify-between font-semibold text-gray-900 mb-6">
            <span>Total</span><span>${total().toFixed(2)}</span>
          </div>
          <Button size="lg" className="w-full" onClick={() => navigate("/checkout")}>Proceed to Checkout</Button>
          <button onClick={clearCart} className="w-full mt-3 text-sm text-gray-400 hover:text-red-400">Clear Cart</button>
        </div>
      </div>
    </Layout>
  );
}
