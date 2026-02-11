import HeroBanner from '@/components/landing/HeroBanner';
import PrecisionClinicMatching from '@/components/landing/PrecisionClinicMatching';
import RealPeopleSection from '@/components/landing/RealPeopleSection';
import PersonalMedicalConcierge from '@/components/landing/PersonalMedicalConcierge';
import JourneyToConfidence from '@/components/landing/JourneyToConfidence';
import EliteMedicalPartners from '@/components/landing/EliteMedicalPartners';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <HeroBanner />
      <PrecisionClinicMatching />
      <RealPeopleSection />
      <PersonalMedicalConcierge />
      <JourneyToConfidence />
      <EliteMedicalPartners />
    </main>
  );
}
