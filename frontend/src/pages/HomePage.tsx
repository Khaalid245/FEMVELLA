import Layout from "@/components/Layout";
import CategorySection from "@/components/CategorySection";
import HeroSection from "@/components/HeroSection";
import ProductsSection from "@/components/ProductsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ProductShelf from "@/components/ProductShelf";
import RecentlyViewedShelf from "@/components/RecentlyViewedShelf";
import CollectionsSection from "@/components/CollectionsSection";
import LookbookSection from "@/components/LookbookSection";
import ErrorBoundary from "@/components/ErrorBoundary";
import { usePersonalizedFeed, useTrendingProducts } from "@/api/recommendations";

function PersonalizedSection() {
  const { data: feed = [], isLoading: feedLoading } = usePersonalizedFeed(8);
  const { data: trending = [], isLoading: trendingLoading } = useTrendingProducts(8);

  return (
    <>
      {/* Personalized feed — shown when there's signal */}
      {(feedLoading || feed.length > 0) && (
        <ProductShelf
          eyebrow="Curated for You"
          title="Your Personal Edit"
          products={feed}
          isLoading={feedLoading}
          layout="grid"
          columns={4}
          skeletonCount={4}
          viewAllHref="/products"
          viewAllLabel="Explore All"
        />
      )}

      {/* Recently viewed */}
      <RecentlyViewedShelf />

      {/* Trending */}
      {(trendingLoading || trending.length > 0) && (
        <ProductShelf
          eyebrow="Right Now"
          title="Trending This Week"
          products={trending}
          isLoading={trendingLoading}
          layout="scroll"
          skeletonCount={4}
          viewAllHref="/products?ordering=-created_at"
          viewAllLabel="See All"
        />
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Layout hero={<ErrorBoundary section="hero"><HeroSection /></ErrorBoundary>}>
      <ErrorBoundary section="collections"><CollectionsSection /></ErrorBoundary>
      <ErrorBoundary section="categories"><CategorySection /></ErrorBoundary>
      <ErrorBoundary section="products"><ProductsSection /></ErrorBoundary>
      <ErrorBoundary section="personalized"><PersonalizedSection /></ErrorBoundary>
      <ErrorBoundary section="lookbook"><LookbookSection /></ErrorBoundary>
      <ErrorBoundary section="testimonials"><TestimonialsSection /></ErrorBoundary>
    </Layout>
  );
}
