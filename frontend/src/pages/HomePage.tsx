import Layout from "@/components/Layout";
import CategorySection from "@/components/CategorySection";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";

export default function HomePage() {
  return (
    <Layout hero={<HeroSection />}>
      <CategorySection />
      <ProductsSection />
    </Layout>
  );
}
