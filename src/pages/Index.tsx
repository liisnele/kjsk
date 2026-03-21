import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SportCards from "@/components/SportCards";
import CenterCards from "@/components/CenterCards";
import HowItWorks from "@/components/HowItWorks";
import BookingCalendar from "@/components/BookingCalendar";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <SportCards />
      <CenterCards />
      <HowItWorks />
      <BookingCalendar />
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 Kohtla-Järve Spordikeskus. Kõik õigused kaitstud.
        </div>
      </footer>
    </div>
  );
}
