'use client';

import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  className?: string;
  onClick?: () => void;
};

export default function Logo({ className = '', onClick }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center ${className}`} onClick={onClick}>
      <Image
        src="/nav_logo.png"
        alt="Istanbul Medic Logo"
        width={300}
        height={48}
        priority
        className="
          w-40    /* Mobile (160px wide) */
          sm:w-52 /* Tablet (208px wide) */
          md:w-60 /* Desktop (240px wide) */
          h-auto
        "
      />
    </Link>
  );
}
