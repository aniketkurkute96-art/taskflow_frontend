import ModalConfirm from './ModalConfirm';
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
  const [prevent] = useState(false);

  const renderForStatus = () => {
    switch (task.status) {
      case 'open':
        return (
          <>
            <button
              onClick={onStart}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
            >
              Start Task
            </button>
          </>
        );
      case 'in_progress':
        return (
          <>
            <button
              onClick={onComplete}
              className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-900 transition-colors hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400"
            >
              Submit for Approval
            </button>
            <button
              onClick={onForward}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
            >
              Forward
            </button>
            <button
              onClick={onBackToOpen}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600"
            >
              Mark Back to Open
            </button>
          </>
        );
      case 'pending_approval':
        return (
          <>
            <button
              onClick={onApprove}
              className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-900 transition-colors hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:opacity-50"
              disabled={!canApprove || prevent}
              aria-pressed={prevent}
              aria-label="Approve task"
              title={!canApprove ? 'Only approvers can perform this action' : 'Approve'}
            >
              Approve
            </button>
            <button
              onClick={onReject}
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 transition-colors hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Request Changes
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
      <div className="flex flex-wrap gap-3">
        {renderForStatus()}
        <button
          className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600"
        >
          More
        </button>
      </div>
    </section>
  );
}


