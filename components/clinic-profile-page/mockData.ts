// mockData.ts
// All mock data in one place. This matches what's shown in the Figma screenshots.
// When connecting to a real API, you'd replace this with a fetch call
// and the ClinicData type ensures your components still work.

import { ClinicData } from "./types";

export const clinicData: ClinicData = {
  name: "Istanbul Hair Center",
  location: "Şişli, Istanbul",
  rating: 4.8,
  reviewCount: 347,
  specialties: ["Hair Transplant", "FUE Technique", "DHI Method", "Beard Transplant"],

  // Unsplash images of modern medical clinics
  images: [
    "https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtZWRpY2FsJTIwY2xpbmljJTIwaW50ZXJpb3IlMjBsb2JieXxlbnwxfHx8fDE3NzAxNTQ5MTF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMG9wZXJhdGluZyUyMHJvb20lMjBtb2Rlcm58ZW58MXx8fHwxNzcwMTU0OTEzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZXF1aXBtZW50JTIwY2xpbmljfGVufDF8fHx8MTc3MDEzNzE2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1720180244339-95e56d52e182?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3NwaXRhbCUyMGNsaW5pYyUyMGludGVyaW9yfGVufDF8fHx8MTc3MDEwMDAwN3ww&ixlib=rb-4.1.0&q=80&w=1080",
  ],

  transparencyScore: 96,
  yearsInOperation: 15,
  proceduresPerformed: "12,000+",
  languages: ["English", "Turkish", "Arabic", "German"],

  about:
    "Istanbul Hair Center is a leading hair restoration facility specializing in advanced FUE and DHI techniques. With over 15 years of experience and more than 12,000 successful procedures, our clinic combines cutting-edge technology with personalized patient care. Our internationally trained team is committed to delivering natural-looking results while maintaining the highest standards of safety and medical excellence.",

  doctors: [
    {
      name: "Dr. Mehmet Yilmaz",
      specialty: "Hair Restoration Surgeon",
      photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face",
      credentials: ["Board Certified", "ISHRS Member"],
      education: "Istanbul University Medical School",
      experience: 18,
    },
    {
      name: "Dr. Ayşe Demir",
      specialty: "Dermatologist & Hair Specialist",
      photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=300&fit=crop&crop=face",
      credentials: ["Dermatology Board Certified", "Trichology Specialist"],
      education: "Hacettepe University",
      experience: 12,
    },
    {
      name: "Dr. Can Öztürk",
      specialty: "Cosmetic & Hair Surgeon",
      photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop&crop=face",
      credentials: ["Board Certified Surgeon", "International Training"],
      education: "Ankara University Medical School",
      experience: 10,
    },
  ],

  communityPosts: [
    {
      id: "1",
      platform: "Reddit",
      content:
        "Had my consultation at Istanbul Hair Center last week. The doctor was thorough and explained everything in detail. Prices were competitive and transparent. Scheduling my procedure for next month.",
      timeAgo: "2 days ago",
      sourceUrl: "#",
    },
    {
      id: "2",
      platform: "Reddit",
      content:
        "Just finished my 6-month follow-up. Really happy with the results so far. The clinic staff has been responsive to all my questions via WhatsApp. Would definitely recommend.",
      timeAgo: "1 week ago",
      sourceUrl: "#",
    },
    {
      id: "3",
      platform: "Reddit",
      content:
        "Comparing clinics in Istanbul for hair transplant. Istanbul Hair Center seems to have good credentials and the doctors have international training. Anyone have recent experience?",
      timeAgo: "2 weeks ago",
      sourceUrl: "#",
    },
  ],

  communitySummary: {
    totalMentions: 89,
    sentiment: "Positive",
    themes: ["Clear pricing", "Professional communication", "Quality aftercare"],
  },

  transparencyItems: [
    {
      title: "Verified Medical Licenses",
      description: "All physicians licensed by Turkish Ministry of Health",
    },
    {
      title: "International Accreditations",
      description: "JCI accredited facility with ISO 9001 certification",
    },
    {
      title: "Hospital Affiliations",
      description: "Partner agreements with major Istanbul hospitals",
    },
    {
      title: "Clear Procedure Documentation",
      description: "Detailed treatment protocols and informed consent processes",
    },
    {
      title: "Before/After Case Transparency",
      description: "Extensive photo documentation with patient consent",
    },
    {
      title: "Published Outcomes Data",
      description: "Regular reporting of success rates and patient satisfaction",
    },
  ],

  transparencyExplanation:
    "How Transparency Scores Work: We evaluate clinics based on publicly available documentation, verified credentials, accreditations, patient outcome data, and communication practices. Higher scores indicate greater transparency and evidence-based care.",

  aiInsights: [
    "Strong documentation of surgical procedures with comprehensive pre-operative planning and post-operative care protocols.",
    "Well-suited for patients seeking minimally invasive hair restoration options with FUE and DHI techniques.",
    "High patient satisfaction scores in follow-up care, with dedicated support staff for international patients.",
    "Advanced technology integration including microscopic graft preparation and sapphire blade techniques.",
  ],

  reviews: [
    {
      id: "1",
      name: "James Mitchell",
      verified: true,
      date: "January 15, 2026",
      rating: 5,
      content:
        "Exceptional care from start to finish. Dr. Yilmaz took the time to explain every step of the procedure and the results exceeded my expectations. The staff was incredibly helpful with travel arrangements and translation.",
    },
    {
      id: "2",
      name: "Ahmed Al-Rahman",
      verified: true,
      date: "January 8, 2026",
      rating: 5,
      content:
        "Very professional clinic with modern facilities. The team speaks excellent English and Arabic which made communication easy. Follow-up care has been thorough and responsive.",
    },
    {
      id: "3",
      name: "Thomas Weber",
      verified: true,
      date: "December 28, 2025",
      rating: 4,
      content:
        "Good results overall. The procedure was well-explained and the clinic was clean and modern. I would recommend for anyone considering hair restoration in Istanbul.",
    },
  ],

  commonlyMentioned: ["Helpful staff", "Clear communication", "Natural results", "Good aftercare"],

  address: "Halaskargazi Cad. No: 124, Şişli, Istanbul 34371, Turkey",

  openingHours: [
    { days: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
    { days: "Saturday", hours: "9:00 AM - 3:00 PM" },
    { days: "Sunday", hours: "Closed" },
  ],

  paymentMethods: ["Credit Card", "Bank Transfer", "Cash", "Cryptocurrency"],

  additionalServices: [
    { name: "Accommodation Support", available: true },
    { name: "Airport Transfer", available: true },
  ],
};
