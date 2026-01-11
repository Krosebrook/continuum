import Hero from '@/components/Hero';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Hero />
      <div className="flex-grow" />
      <Footer />
    </main>
  );
}
