import React from 'react';
import { Link } from 'react-router-dom';

const BrandLogo = () => {
  return (
    <Link
      to="/"
      aria-label="EagleEye by Nagrik — go to dashboard"
      className="flex items-center gap-3 hover:translate-y-[-1px] hover:scale-[1.01] transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400"
      role="link"
    >
      <div className="rounded-md p-1 bg-gradient-to-br from-slate-800/40 to-slate-700/30 dark:from-slate-700/40 dark:to-slate-800/30 text-cyan-400">
        <svg
          className="w-6 h-6 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          role="img"
        >
          <path
            d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          EagleEye
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">by Nagrik</div>
      </div>
    </Link>
  );
};

export default BrandLogo;

