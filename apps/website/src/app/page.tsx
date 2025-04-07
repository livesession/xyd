import PrimerProvider from "./PrimerProvider";

import {Footer} from "@/app/components";
import {
    Home,
    MainSectionIntro,
    HomeSubNav,
    DeveloperExperience,
    BuiltInStandards,
    Ecosystem,
    CTAFooter,
    Customization
} from "@/app/pages/index"

export default async function HomePage() {
    return <PrimerProvider>
        <Home/>
        <MainSectionIntro/>
        <HomeSubNav/>
        <DeveloperExperience/>
        <BuiltInStandards/>
        <Customization/>
        <Ecosystem/>
        <CTAFooter/>
        <Footer/>
    </PrimerProvider>
} 