import { useMemo } from 'react';

interface CommentsPanelProps {
  taskId: string;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user?: { id: string; name: string; role?: string };
  }>;
  commentValue: string;
  onChangeComment: (v: string) => void;
  onSubmit: (value: string) => void | Promise<void>;
  headerExtras?: React.ReactNode;
  isSubmitting?: boolean;
}

export default function CommentsPanel({
  comments,
  commentValue,
  onChangeComment,
  onSubmit,
  headerExtras,
  isSubmitting = false,
}: CommentsPanelProps) {
  const placeholder = useMemo(
    () => 'Share progress, ask questions, or mention teammate (@name)',
    []
  );
  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4 sm:p-6 backdrop-blur-sm shadow-lg dark:shadow-cyan-900/20 transition-all duration-200">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-200 leading-none">Comments</h3>
        <div className="ml-auto flex items-center gap-2">{headerExtras}</div>
      </header>
      <div className="mt-3 sm:mt-4 space-y-4">
        <div className="rounded-lg border border-slate-600 bg-slate-900 p-3">
          <textarea
            aria-label="Add a comment"
            placeholder={placeholder}
            value={commentValue}
            onChange={(e) => onChangeComment(e.target.value)}
            rows={3}
            className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Supports basic markdown: <b>bold</b>, <i>italic</i>
            </div>
            <button
              type="button"
              disabled={isSubmitting || !commentValue.trim()}
              onClick={() => onSubmit(commentValue)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>

        <ul className="space-y-3 max-h-[36vh] overflow-auto pr-1">
          {comments.length === 0 && (
            <li className="text-xs text-slate-400">No comments yet</li>
          )}
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-semibold text-white">
                    {c.user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {c.user?.name} <span className="text-xs text-slate-400">{c.user?.role || ''}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Owner actions (edit/delete) could be enabled later */}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{c.content}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}


