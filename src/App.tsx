import { useCallback, useEffect, useState } from "react";
import { ScrollTrigger } from "./lib/gsap";
import Grain from "./components/Grain";
import MuteToggle from "./components/MuteToggle";
import BookingModal from "./components/BookingModal";
import Intro from "./sections/Intro";
import CarReveal from "./sections/CarReveal";
import Specs from "./sections/Specs";
import EngineSound from "./sections/EngineSound";
import Gallery from "./sections/Gallery";
import Customizer from "./sections/Customizer";
import Cta from "./sections/Cta";
import Footer from "./sections/Footer";

export default function App() {
  const [booking, setBooking] = useState(false);
  const openBooking = useCallback(() => setBooking(true), []);
  const closeBooking = useCallback(() => setBooking(false), []);

  // Re-measure every trigger once fonts + images have settled
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh).catch(() => undefined);
    const t = window.setTimeout(refresh, 900);
    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <main className="relative bg-black text-white">
      <Grain />
      <MuteToggle />

      <Intro />
      <CarReveal />
      <Specs />
      <EngineSound />
      <Gallery />
      <Customizer />
      <Cta onBook={openBooking} />
      <Footer />

      <BookingModal open={booking} onClose={closeBooking} />
    </main>
  );
}
