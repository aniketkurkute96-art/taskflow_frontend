import { format } from 'date-fns';
import ApprovalPreview from './ApprovalPreview';

interface TimelineItem {
  id: string;
  type: 'activity' | 'comment';
  action: string;
  description: string;
  user?: { id: string; name: string; email: string };
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  approvalData?: {
    approvers: Array<{
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
    }>;
    approvalType: string;
  };
}

interface TimelineProps {
  items: TimelineItem[];
}

const Timeline = ({ items }: TimelineProps) => {
  const getActionIcon = (action: string) => {
    const iconClass = "w-8 h-8 rounded-full flex items-center justify-center";
    
    switch (action) {
      case 'created':
        return (
          <div className={`${iconClass} bg-green-100`}>
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'assigned':
        return (
          <div className={`${iconClass} bg-blue-100`}>
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      case 'status_changed':
        return (
          <div className={`${iconClass} bg-yellow-100`}>
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        );
      case 'forwarded':
        return (
          <div className={`${iconClass} bg-purple-100`}>
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        );
      case 'submitted_for_approval':
        return (
          <div className={`${iconClass} bg-indigo-100`}>
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'approval_workflow_created':
        return (
          <div className={`${iconClass} bg-indigo-100`}>
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        );
      case 'approved':
        return (
          <div className={`${iconClass} bg-green-100`}>
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'rejected':
        return (
          <div className={`${iconClass} bg-red-100`}>
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'completed':
        return (
          <div className={`${iconClass} bg-green-100`}>
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'edited':
      case 'field_changed':
        return (
          <div className={`${iconClass} bg-orange-100`}>
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'commented':
        return (
          <div className={`${iconClass} bg-gray-100`}>
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'attachment_added':
        return (
          <div className={`${iconClass} bg-sky-100`}>
            <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </div>
        );
      case 'attachment_removed':
        return (
          <div className={`${iconClass} bg-rose-100`}>
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${iconClass} bg-gray-100`}>
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-600';
      case 'assigned': return 'text-blue-600';
      case 'status_changed': return 'text-yellow-600';
      case 'forwarded': return 'text-purple-600';
      case 'submitted_for_approval': return 'text-indigo-600';
      case 'approval_workflow_created': return 'text-indigo-600';
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'completed': return 'text-green-600';
      case 'edited': return 'text-orange-600';
      case 'field_changed': return 'text-orange-600';
      case 'commented': return 'text-gray-600';
      case 'attachment_added': return 'text-sky-600';
      case 'attachment_removed': return 'text-rose-600';
      default: return 'text-gray-600';
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by working on this task.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {items.map((item, itemIdx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {itemIdx !== items.length - 1 ? (
                <span
                  className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  {getActionIcon(item.action)}
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${getActionColor(item.action)}`}>
                      {item.type === 'comment' ? 'Comment' : item.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {item.description}
                    </p>
                    {/* Show old and new values if available */}
                    {item.oldValue && item.newValue && item.action === 'field_changed' && (
                      <div className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-md p-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">From:</span>
                          <span className="font-medium text-red-600 line-through">{item.oldValue}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-gray-500">To:</span>
                          <span className="font-medium text-green-600">{item.newValue}</span>
                        </div>
                      </div>
                    )}
                    {/* Show Approval Preview for approval-related actions */}
                    {item.approvalData && (item.action === 'submitted_for_approval' || item.action === 'approval_workflow_created' || item.action === 'approved' || item.action === 'rejected') && (
                      <ApprovalPreview
                        approvers={item.approvalData.approvers}
                        approvalType={item.approvalData.approvalType}
                      />
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                      {item.user && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                            {getUserInitials(item.user.name)}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{item.user.name}</span>
                        </div>
                      )}
                      {!item.user && (
                        <span className="text-xs text-gray-500 font-medium">System</span>
                      )}
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Timeline;

