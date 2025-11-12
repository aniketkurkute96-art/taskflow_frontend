interface Approver {
  id: string;
  approverUserId: string;
  levelOrder: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string | null;
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ApprovalPreviewProps {
  approvers: Approver[];
  approvalType: string;
}

export default function ApprovalPreview({ approvers, approvalType }: ApprovalPreviewProps) {
  if (!approvers || approvers.length === 0) {
    return null;
  }

  // Sort approvers by level order
  const sortedApprovers = [...approvers].sort((a, b) => a.levelOrder - b.levelOrder);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-300 dark:border-green-700',
          text: 'text-green-900 dark:text-green-200',
          icon: 'text-green-600 dark:text-green-400',
          ring: 'ring-green-500/20',
        };
      case 'rejected':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-300 dark:border-red-700',
          text: 'text-red-900 dark:text-red-200',
          icon: 'text-red-600 dark:text-red-400',
          ring: 'ring-red-500/20',
        };
      case 'pending':
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800/50',
          border: 'border-slate-300 dark:border-slate-600',
          text: 'text-slate-600 dark:text-slate-400',
          icon: 'text-slate-400 dark:text-slate-500',
          ring: 'ring-slate-500/10',
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 p-4 dark:border-violet-800/50 dark:from-violet-900/20 dark:to-indigo-900/20">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h4 className="text-xs font-bold uppercase tracking-wider text-violet-900 dark:text-violet-200">
          Approval Chain {approvalType === '360' ? '(360°)' : ''}
        </h4>
      </div>

      <div className="space-y-2">
        {sortedApprovers.map((approver, index) => {
          const colors = getStatusColor(approver.status);
          const isCompleted = approver.status === 'approved' || approver.status === 'rejected';
          
          return (
            <div key={approver.id} className="relative">
              {index < sortedApprovers.length - 1 && (
                <div
                  className={`absolute left-[18px] top-9 h-full w-0.5 ${
                    isCompleted ? 'bg-violet-300 dark:bg-violet-700' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  aria-hidden="true"
                />
              )}
              
              <div
                className={`relative flex items-start gap-3 rounded-lg border-2 p-3 transition-all ${
                  colors.bg
                } ${colors.border} ${isCompleted ? 'shadow-sm' : ''}`}
              >
                {/* Level Badge */}
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? 'border-violet-500 bg-gradient-to-br from-violet-500 to-indigo-600 dark:border-violet-400'
                      : 'border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isCompleted ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {approver.levelOrder}
                  </span>
                </div>

                {/* Approver Info */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${colors.text}`}>
                        {approver.approver?.name || 'Unknown User'}
                      </p>
                      {approver.approver?.email && (
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {approver.approver.email}
                        </p>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className={`flex-shrink-0 ${colors.icon}`}>
                      {getStatusIcon(approver.status)}
                    </div>
                  </div>

                  {/* Status Label */}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        approver.status === 'approved'
                          ? 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : approver.status === 'rejected'
                          ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {approver.status}
                    </span>
                    {approver.approvedAt && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(approver.approvedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-violet-200 pt-3 text-xs dark:border-violet-800/50">
        <span className="text-violet-700 dark:text-violet-300">
          <span className="font-bold">
            {sortedApprovers.filter((a) => a.status === 'approved').length}
          </span>{' '}
          / {sortedApprovers.length} approved
        </span>
        <span className="text-slate-600 dark:text-slate-400">
          Level {sortedApprovers.filter((a) => a.status === 'approved').length + 1} pending
        </span>
      </div>
    </div>
  );
}

