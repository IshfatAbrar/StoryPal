"use client";

import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden pt-36">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid  gap-8 items-center">
          <div className="md:col-span-7 text-center">
            <h1 className="leading-tight">
              <span className="block text-6xl sm:text-8xl text-[#5b217f]">
                Welcome to
              </span>

              <span className="block text-6xl sm:text-8xl text-[#5b217f]">
                <span className="ml-3 relative inline-block">
                  <span className="relative z-10 text-[#f97316]">
                    Story Pal
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -inset-x-3 -bottom-1 h-6 rounded-full bg-[#ffd34d]/80 rotate-[-4deg]"
                  />
                </span>
              </span>
            </h1>
            <p className="mt-8 text-[#7c2da3] text-lg lg:text-2xl font-semibold sm:w-[500px] md:w-[600px] lg:w-[500px] xl:w-[600px] mx-auto">
              Where every playful scene sparks imagination. Personalize stories
              using your child’s passport to reduce stress and build
              skills—joyfully.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link
                href="/parent"
                className="rounded-full px-6 py-3 bg-[#5b217f] text-white hover:bg-[#7c2da3] transition-colors"
              >
                I am a Parent
              </Link>
              <Link
                href="/child"
                className="rounded-full px-6 py-3 bg-[#ffd34d] text-[#5b217f] hover:brightness-95 border border-[#e8e2cf]"
              >
                I am a Child
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
