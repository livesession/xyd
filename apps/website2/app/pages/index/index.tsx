import { Hero } from "./Hero";
import { Navbar } from "../../components/Navbar";
import { FeaturesSection } from "../../components/ThreeTwoOne";
import { StatementSection } from "../../components/StatementSection";
import { BentoSection } from "../../components/BentoSection";
import { SlideFooter } from "../../components/SlideFooter";
import { Footer } from "../../components/Footer";
import { Pacman } from "../../components/Pacman";

export function PageIndex() {
    return <>
      <Pacman />
      <Navbar />
      <Hero />
      <FeaturesSection />
      <StatementSection />
      <BentoSection />
      <SlideFooter />
      <Footer />
    </>
}