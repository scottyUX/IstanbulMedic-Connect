"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Merriweather } from "next/font/google";
import { useAuth } from "@/contexts/AuthContext";

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

interface LeilaHeroProps {
  onGetStarted: (question: string) => void;
  pending?: boolean;
}

const LeilaHero = ({ onGetStarted, pending = false }: LeilaHeroProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    if (pending) return;
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // Redirect will happen automatically via OAuth flow
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] pt-10">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 max-w-4xl mx-auto w-full">
        {/* Large Leila Image */}
        <div className="mt-[75px] mb-8 flex items-center justify-center">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
            <Image
              src="/leila.png"
              alt="Leila"
              width={256}
              height={256}
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <h1
          className={`${merriweather.className} text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-6`}
        >
          Hi, I&apos;m Leila
        </h1>

        {/* Supporting Text */}
        <div className="space-y-4 mb-12 text-center max-w-3xl">
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            I&apos;m your private and personal AI assistant. I am here to answer your questions, help schedule your treatment, and support you in your own language, anytime you need.
          </p>
          <p className="text-xl md:text-2xl font-semibold text-gray-900 mt-6">
            What can I help you with today?
          </p>
        </div>

        {/* Login + Terms */}
        <div className="w-full max-w-2xl flex flex-col items-center">
          <Button
            type="button"
            disabled={pending || isLoading}
            onClick={handleGoogleLogin}
            className="h-14 px-10 bg-white border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl shadow-lg transition-all hover:shadow-xl text-lg font-semibold text-gray-700 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Login with Google</span>
              </>
            )}
          </Button>

          {/* Terms Message */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              By logging in, I agree to the terms and will discuss all output with a doctor.
            </p>
          </div>

          {/* Privacy Statement */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Lock className="w-4 h-4" />
            <span>GDPR - Private</span>
          </div>
        </div>
      </div>

      {/* Bottom Badge */}
      <div className="pb-8 flex justify-center">
        <div className="flex items-center gap-4 px-8 py-4 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-blue-200">
            <Image
              src="/leila.png"
              alt="Leila"
              width={64}
              height={64}
              className="object-cover"
              priority
            />
          </div>
          <span className="text-base font-semibold text-gray-700">
            Over 18.7M+ consultations
          </span>
        </div>
      </div>
    </div>
  );
};

export default LeilaHero;
