import { useState } from 'react';

interface ActionButtonsProps {
  task: any;
  canApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
  onForward: () => void;
  onComplete: () => void;
  onStart: () => void;
  onBackToOpen: () => void;
}

export default function ActionButtons({
  task,
  canApprove,
  onApprove,
  onReject,
  onForward,
  onComplete,
  onStart,
  onBackToOpen,
}: ActionButtonsProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const renderPrimary = () => {
    switch (task.status) {
      case 'open':
        return { label: 'Start Task', onClick: onStart, className: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-600' };
      case 'in_progress':
        return { label: 'Submit for Approval', onClick: onComplete, className: 'bg-cyan-400 text-slate-900 hover:bg-cyan-300 focus:ring-cyan-400' };
      case 'pending_approval':
        return { label: 'Approve', onClick: onApprove, className: `bg-cyan-400 text-slate-900 hover:bg-cyan-300 focus:ring-cyan-400 ${!canApprove ? 'opacity-60 cursor-not-allowed' : ''}`, disabled: !canApprove, title: !canApprove ? 'Only approvers can perform this action' : 'Approve' };
      default:
        return undefined;
    }
  };

  const primary = renderPrimary();

  return (
    <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
      <div className="relative flex flex-wrap items-center gap-3">
        {primary && (
          <button
            onClick={primary.onClick}
            disabled={primary.disabled}
            title={primary.title}
            className={`px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${primary.className}`}
          >
            {primary.label}
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600"
          >
            More actions
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                role="menu"
                className="absolute z-20 mt-2 min-w-[220px] rounded-md border border-slate-600 bg-slate-900 p-1 shadow-xl"
              >
                {task.status === 'in_progress' && (
                  <>
                    <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
                      Assignee actions
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); onForward(); }}
                      className="inline-flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      Forward…
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onBackToOpen(); }}
                      className="inline-flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      Mark Back to Open
                    </button>
                  </>
                )}
                {task.status === 'pending_approval' && (
                  <>
                    <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
                      Approver actions
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); onReject(); }}
                      className="inline-flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-900 transition hover:bg-amber-500/80"
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Request Changes…
                    </button>
                  </>
                )}
                {task.status === 'open' && (
                  <>
                    <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
                      Available actions
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); onForward(); }}
                      className="inline-flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-700"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      Forward…
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}


