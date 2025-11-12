import React from 'react';

interface OverviewCardProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
}

export default function OverviewCard({
  title,
  subtitle,
  rightContent,
  children,
}: OverviewCardProps) {
  return (
    <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">{rightContent}</div>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}


