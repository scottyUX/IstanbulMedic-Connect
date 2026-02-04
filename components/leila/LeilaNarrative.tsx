"use client";

import Image from "next/image";

const sections = [
  {
    id: "fast-free",
    eyebrow: null,
    title: "Meet Leila. Your personal hair-restoration assistant.",
    description:
      "Upload your scalp photos. Leila reviews your hairline, density, and thinning patterns to help determine your current stage and prepare you for a professional consultation.",
    image: "/assets/image1.png",
    imageAlt: "Patient surrounded by care team portraits",
  },
  {
    id: "chat",
    eyebrow: null,
    title: "You can discuss your hair concerns in plain, everyday language",
    description:
      "Share photos, past treatments, or any questions you have. I ask smart follow-up questions, keep track of everything you share, and guide you with clear next steps.",
    image: "https://static.doctronic.ai/img/home/chat.png",
    imageAlt: "Chat preview bubble",
  },
  {
    id: "handoff",
    eyebrow: null,
    title: "Ready to talk to a real specialist? I'll set up a free consultation.",
    description:
      "I send your history, photos, and questions in advance so your doctor starts fully informed.",
    image: "https://static.doctronic.ai/img/home/doctors.png",
    imageAlt: "Row of smiling physicians",
  },
  {
    id: "memory",
    eyebrow: null,
    title: "I'll remember your health history so you don't have to",
    description:
      "Every conversation is organized into a living medical journal. I track medications, allergies, travel plans, and future reminders so you can pick up any chat right where you left off.",
    image: "/assets/image2.png",
    imageAlt: "Person surrounded by medical icons",
  },
  {
    id: "privacy",
    eyebrow: null,
    title: "Don't worry, everything is private, GDPR secure, and your data is yours",
    description:
      "You are in control of what you share and who sees it. Your consults live in an encrypted vault, and nothing is released unless you ask me to share it with a clinician.",
    image: "https://static.doctronic.ai/img/home/person-and-privacy.png",
    imageAlt: "Portrait with privacy blur and lock icon",
  },
];

const LeilaNarrative = () => {
  return (
    <section className="bg-[#FAFAFA] py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-24 px-6">
        {sections.map((section) => (
          <article key={section.id} className="space-y-6 text-center">
            <div className="space-y-5">
              {section.eyebrow ? (
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                  {section.eyebrow}
                </p>
              ) : null}
              <h2 className="text-3xl font-semibold text-gray-900 md:text-4xl">
                {section.title}
              </h2>
              <p className="text-lg text-gray-600">{section.description}</p>
            </div>
            <div className="flex items-center justify-center">
              <ImageCard src={section.image} alt={section.imageAlt} />
            </div>
          </article>
        ))}

        <div className="rounded-[32px] bg-white p-12 text-center shadow-lg shadow-gray-200/60">
          <h3 className="text-3xl font-semibold text-gray-900">
            Ready to talk to a human specialist?
          </h3>
          <p className="mt-4 text-lg text-gray-600">
            Schedule your free hair-transplant consultation today.
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href="https://cal.com/team/istanbul-medic/istanbul-medic-15-minutes-consultation"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full max-w-md items-center justify-center rounded-full bg-[#102544] px-10 py-4 text-lg font-semibold text-white shadow-xl shadow-[#102544]/30 transition hover:scale-[1.02]"
            >
              Schedule Free Consultation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

const ImageCard = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <div className="relative inline-flex w-full max-w-xl overflow-hidden rounded-[36px] border border-gray-200 bg-white">
      <Image
        src={src}
        alt={alt}
        width={1024}
        height={768}
        className="h-full w-full object-cover"
        sizes="(min-width: 1024px) 480px, 100vw"
      />
    </div>
  );
};

export default LeilaNarrative;
