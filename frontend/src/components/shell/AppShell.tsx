import { ReactNode } from 'react';

interface AppShellProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
}

const AppShell = ({ header, sidebar, children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100 transition-colors">
      <div className="flex min-h-screen">
        {sidebar ? (
          <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex h-full w-full flex-col">{sidebar}</div>
          </aside>
        ) : null}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-slate-900/80">
            <div className="flex w-full items-center justify-between px-4 py-3">
              {header ?? (
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Nagrik TaskFlow
                </div>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppShell;


