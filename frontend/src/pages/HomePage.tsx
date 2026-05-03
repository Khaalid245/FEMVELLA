import Layout from "@/components/Layout";
import CategorySection from "@/components/CategorySection";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";
import TestimonialsSection from "@/components/TestimonialsSection";

export default function HomePage() {
  return (
    <Layout hero={<HeroSection />}>
      <CategorySection />
      <ProductsSection />
      <TestimonialsSection />
    </Layout>
  );
}
