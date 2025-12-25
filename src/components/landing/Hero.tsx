"use client";
import Link from "next/link";

export default function Hero() {
  return (
    <header className="relative bg-gradient-to-br from-rose-50 via-amber-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm font-semibold text-amber-600 uppercase">
              Église | RCCG
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-gray-900">
              RCCG PRESENCE DIVINE
            </h1>
            <p className="mt-6 text-lg text-gray-700 max-w-xl">
              Rejoignez-nous pour des moments de louange, d&apos;enseignement
              biblique et de communion fraternelle. Une famille spirituelle
              accueillante où Dieu change des vies.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#service"
                className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-md font-medium shadow hover:bg-amber-700"
              >
                Participer au culte
              </Link>
              <Link
                href="#contact"
                className="inline-flex items-center px-6 py-3 border border-amber-600 text-amber-600 rounded-md font-medium hover:bg-amber-50"
              >
                Nous contacter
              </Link>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <span className="font-semibold">Heures de culte:</span> Dimanche
              9:00 & 11:00 — Mercredi 19:00
            </div>
          </div>

          <div className="flex items-center justify-center">
            <svg
              width="320"
              height="240"
              viewBox="0 0 320 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <rect width="320" height="240" rx="20" fill="url(#grad)" />
              <g fill="#fff" opacity="0.9">
                <path d="M160 60c20 0 36 16 36 36s-16 36-36 36-36-16-36-36 16-36 36-36z" />
                <rect x="90" y="130" width="140" height="12" rx="6" />
                <rect x="90" y="154" width="100" height="10" rx="5" />
              </g>
              <defs>
                <linearGradient id="grad" x1="0" x2="1">
                  <stop offset="0" stopColor="#fef3c7" />
                  <stop offset="1" stopColor="#fee2e2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}
