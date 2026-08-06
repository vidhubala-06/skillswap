import HomeNavbar from '../components/home/HomeNavbar';
import SkillMarquee from '../components/home/SkillMarquee';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import Features from '../components/home/Features';
import StatsBand from '../components/home/StatsBand';
import FAQ from '../components/home/FAQ';
import HomeFooter from '../components/home/HomeFooter';

function Home() {
  return (
    <div className="bg-paper">
      <HomeNavbar />
      <SkillMarquee />
      <Hero />
      <HowItWorks />
      <Features />
      <StatsBand />
      <FAQ />
      <HomeFooter />
    </div>
  );
}

export default Home;