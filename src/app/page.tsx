import  Hero  from "@/components/landing/Hero";
import About from "@/components/landing/About";
import Events from "@/components/landing/Events";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />

      <div className="max-w-7xl mx-auto px-6">
        <About />
        <Events />
        <Contact />
      </div>

      <Footer />
    </main>
  );
}
