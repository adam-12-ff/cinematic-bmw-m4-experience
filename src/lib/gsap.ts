import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

// Premium defaults — never linear for time-based tweens
gsap.defaults({ ease: "power3.out", duration: 1 });

export { gsap, ScrollTrigger };
