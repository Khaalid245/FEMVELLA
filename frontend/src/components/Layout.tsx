import { ReactNode } from "react";
import Navbar from "./Navbar";
import TrustBar from "./TrustBar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  hero?: ReactNode;
}

export default function Layout({ children, hero }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {hero}
      <TrustBar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
