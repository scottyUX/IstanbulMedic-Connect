'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'connect';
};

export default function Logo({ className = '', onClick, variant = 'default' }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn('flex items-center', variant === 'connect' && 'gap-2', className)}
      onClick={onClick}
    >
      <Image
        src="/nav_logo.png"
        alt="Istanbul Medic Logo"
        width={300}
        height={48}
        priority
        className="w-40 h-auto sm:w-52 md:w-60"
      />
      {variant === 'connect' && (
        <span
          className="text-[#17375B] font-bold text-xl sm:text-2xl md:text-3xl"
          style={{ fontFamily: 'var(--im-font-script), cursive' }}
        >
          Connect
        </span>
      )}
    </Link>
  );
}
