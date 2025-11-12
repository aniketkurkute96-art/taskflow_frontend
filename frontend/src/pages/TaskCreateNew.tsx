import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { TASK_FLAGS } from '../types/task';

interface User {
  id: string;
  name: string;
  email: string;
  departmentId?: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface ManualApprover {
  id: string;
  approverUserId: string;
  levelOrder: number;
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
type RecurrenceEnds = 'never' | 'on_date' | 'after';

const WEEKDAYS = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
];

const SectionCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-800/60">
    <header className="border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700/80">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </header>
    <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
  </section>
);

const TaskCreateNew = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [manualApprovers, setManualApprovers] = useState<ManualApprover[]>([]);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [initialComment, setInitialComment] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    departmentId: '',
    amount: '',
    startDate: '',
    dueDate: '',
    approvalType: '360',
    priorityFlag: 'NONE',
    priorityNotes: '',
  });

  const [recurrence, setRecurrence] = useState({
    type: 'none' as RecurrenceType,
    interval: 1,
    weekdays: [] as string[],
    monthlyDay: 1,
    ends: 'never' as RecurrenceEnds,
    endDate: '',
    occurrences: 10,
  });

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          api.get('/users'),
          api.get('/departments'),
        ]);
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
      } catch (error) {
        console.error('Failed to load users/departments', error);
        alert('Failed to load users and departments. Please refresh.');
      }
    };
    fetchData();
  }, []);

  const filteredAssignees = useMemo(() => {
    if (!formData.departmentId) return users;
    return users.filter((candidate) => candidate.departmentId === formData.departmentId);
  }, [users, formData.departmentId]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === 'departmentId') {
        const present = users.find((candidate) => candidate.id === prev.assigneeId);
        const departmentMatches = present?.departmentId === value || value === '';
        if (!departmentMatches) {
          next.assigneeId = '';
        }
      }

      return next;
    });
  };

  const toggleWeekday = (weekday: string) => {
    setRecurrence((prev) => {
      const exists = prev.weekdays.includes(weekday);
      return {
        ...prev,
        weekdays: exists
          ? prev.weekdays.filter((d) => d !== weekday)
          : [...prev.weekdays, weekday],
      };
    });
  };

  const handleFilesSelected = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const existingNames = new Set(selectedFiles.map((file) => file.name));
    const filtered = incoming.filter((file) => !existingNames.has(file.name));
    if (filtered.length === 0) {
      setAttachmentsError('These files are already attached.');
      return;
    }
    setAttachmentsError(null);
    setSelectedFiles((prev) => [...prev, ...filtered]);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      handleFilesSelected(event.target.files);
      event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files?.length) {
      handleFilesSelected(event.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addManualApprover = () => {
    setManualApprovers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        approverUserId: '',
        levelOrder: prev.length + 1,
      },
    ]);
  };

  const updateManualApprover = (
    id: string,
    field: 'approverUserId' | 'levelOrder',
    value: string | number
  ) => {
    setManualApprovers((prev) =>
      prev.map((approver) =>
        approver.id === id ? { ...approver, [field]: value } : approver
      )
    );
  };

  const removeManualApprover = (id: string) => {
    setManualApprovers((prev) => prev.filter((approver) => approver.id !== id));
  };

  const buildRecurrenceRule = () => {
    if (recurrence.type === 'none') return null;

    const rule = {
      interval: recurrence.interval,
      weekdays: recurrence.type === 'weekly' ? recurrence.weekdays : undefined,
      monthlyDay: recurrence.type === 'monthly' ? recurrence.monthlyDay : undefined,
      ends: recurrence.ends,
      endDate: recurrence.ends === 'on_date' ? recurrence.endDate : undefined,
      occurrences: recurrence.ends === 'after' ? recurrence.occurrences : undefined,
    };

    return JSON.stringify(rule);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        assigneeId: formData.assigneeId || null,
        departmentId: formData.departmentId || null,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        approvalType: formData.approvalType,
        priorityFlag: formData.priorityFlag,
        priorityNotes: formData.priorityNotes || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        recurrenceType: recurrence.type,
        recurrenceRule: buildRecurrenceRule(),
      };

      if (formData.approvalType === 'specific' && manualApprovers.length > 0) {
        payload.manualApprovers = manualApprovers
          .filter((approver) => approver.approverUserId)
          .map((approver) => ({
            approverUserId: approver.approverUserId,
            levelOrder: Number(approver.levelOrder) || 1,
          }));
      }

      const response = await api.post('/tasks', payload);
      const taskId: string = response.data.id;

      // Upload files sequentially (request queue handles rate limiting)
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const attachmentData = new FormData();
          attachmentData.append('file', file);
          
          try {
            await api.post(`/tasks/${taskId}/attachments`, attachmentData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (uploadError) {
            console.error(`Failed to upload file ${file.name}:`, uploadError);
            // Continue with other uploads even if one fails
          }
        }
      }

      if (initialComment.trim()) {
        await api.post(`/tasks/${taskId}/comments`, { content: initialComment.trim() });
      }

      navigate(`/tasks/${taskId}`);
    } catch (error: any) {
      console.error('Failed to create task', error);
      
      // Handle specific error cases
      if (error.response?.status === 429) {
        alert('Too many requests. The server is busy. Please wait a moment and try again.');
      } else if (error.message?.includes('Server is busy')) {
        alert(error.message);
      } else {
        alert(error.response?.data?.error || 'Failed to create task. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm dark:border-slate-800/80 dark:bg-slate-900/95">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Create Task
            </p>
            <h1 className="mt-0.5 text-xl font-semibold text-slate-900 dark:text-slate-100">
              New Work Item
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              form="task-create-form"
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSubmitting ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </div>
      </header>

      <form
        id="task-create-form"
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-6 lg:flex-row"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-6 pb-24 lg:pb-0">
          <SectionCard title="Task Details" subtitle="Core information about this work item">
            <div className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  placeholder="e.g., Review vendor invoice #453"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-150 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                  aria-required="true"
                  aria-describedby="title-help"
                />
                <p id="title-help" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Give your task a clear, short identity. Max 200 characters.
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Share context, goals, and expectations. Markdown supported."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-150 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                  aria-describedby="description-help"
                />
                <p id="description-help" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Add details, background, or requirements. Supports <strong>**bold**</strong> and <em>*italic*</em>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="assigneeId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Assign To
                  </label>
                  <select
                    id="assigneeId"
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-150 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                  >
                    <option value="">Select teammate…</option>
                    {filteredAssignees.length === 0 && formData.departmentId && (
                      <option disabled value="">
                        No users in selected department
                      </option>
                    )}
                    {filteredAssignees.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name} · {candidate.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="departmentId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Department
                  </label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-150 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                  >
                    <option value="">Select department…</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="priorityFlag" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Priority Flag
                  </label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {TASK_FLAGS.map((flag) => (
                      <button
                        key={flag}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priorityFlag: flag }))}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 ${
                          formData.priorityFlag === flag
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm dark:border-cyan-400 dark:bg-cyan-900/30 dark:text-cyan-300'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-cyan-300 hover:bg-cyan-50/60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-600'
                        }`}
                      >
                        {flag.replace(/_/g, ' ').toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start and Due in a single row */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Date Range
                  </label>
                  <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <label htmlFor="startDate" className="sr-only">Start Date</label>
                      <input
                        id="startDate"
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-150 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                        placeholder="Start date"
                      />
                    </div>
                    <span className="hidden text-slate-400 sm:inline-block">→</span>
                    <div className="flex-1">
                      <label htmlFor="dueDate" className="sr-only">Due Date</label>
                      <input
                        id="dueDate"
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        min={formData.startDate || undefined}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-150 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-400"
                        placeholder="Due date"
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Optional. Due date must be after start date.
                  </p>
                </div>

                {/* Recurrence inline (replaces separate section and budget field) */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Recurrence
                  </label>
                  <div className="mt-2 space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setRecurrence((prev) => ({
                              ...prev,
                              type,
                            }))
                          }
                          className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                            recurrence.type === type
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {recurrence.type !== 'none' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                            Repeat every
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={recurrence.interval}
                              onChange={(event) =>
                                setRecurrence((prev) => ({
                                  ...prev,
                                  interval: Number(event.target.value) || 1,
                                }))
                              }
                              className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {recurrence.type === 'daily'
                                ? 'day(s)'
                                : recurrence.type === 'weekly'
                                ? 'week(s)'
                                : 'month(s)'}
                            </span>
                          </div>
                        </div>
                        {recurrence.type === 'weekly' && (
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              On
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {WEEKDAYS.map((day) => {
                                const active = recurrence.weekdays.includes(day.value);
                                return (
                                  <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleWeekday(day.value)}
                                    className={`rounded-full border px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                                      active
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                    }`}
                                  >
                                    {day.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {recurrence.type === 'monthly' && (
                          <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                              Day of month
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={31}
                              value={recurrence.monthlyDay}
                              onChange={(event) =>
                                setRecurrence((prev) => ({
                                  ...prev,
                                  monthlyDay: Math.min(Math.max(Number(event.target.value) || 1, 1), 31),
                                }))
                              }
                              className="mt-1 w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Approval Type + Manual Approvers inline */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Approval Type
                  </label>
                  <div className="mt-2 space-y-2.5">
                    {/* 360 Approval Option */}
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all duration-150 ${
                      formData.approvalType === '360'
                        ? 'border-violet-500 bg-violet-50/60 shadow-sm dark:border-violet-400 dark:bg-violet-900/20'
                        : 'border-slate-200 bg-white hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-violet-600'
                    }`}>
                      <input
                        type="radio"
                        name="approvalType"
                        value="360"
                        checked={formData.approvalType === '360'}
                        onChange={(event) => {
                          handleInputChange(event);
                          setManualApprovers([]);
                        }}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 border-slate-300 text-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            360° Approval
                          </span>
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                            Auto
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          Automatically routes approval requests in reverse order of the forward path.
                        </p>
                      </div>
                    </label>

                    {/* Specific Approvers Option */}
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all duration-150 ${
                      formData.approvalType === 'specific'
                        ? 'border-violet-500 bg-violet-50/60 shadow-sm dark:border-violet-400 dark:bg-violet-900/20'
                        : 'border-slate-200 bg-white hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-violet-600'
                    }`}>
                      <input
                        type="radio"
                        name="approvalType"
                        value="specific"
                        checked={formData.approvalType === 'specific'}
                        onChange={handleInputChange}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 border-slate-300 text-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Specific Approvers
                          </span>
                          <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300">
                            Manual
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          Manually select reviewers and define the approval order.
                        </p>
                      </div>
                    </label>

                    {/* Predefined Template Option */}
                    <label className="flex cursor-not-allowed items-start gap-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 p-3.5 opacity-50 dark:border-slate-700 dark:bg-slate-900/30">
                      <input
                        type="radio"
                        name="approvalType"
                        value="predefined"
                        disabled
                        className="mt-0.5 h-4 w-4 flex-shrink-0 border-slate-300 text-slate-400"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Predefined Template
                          </span>
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            Soon
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
                          Use admin-defined templates based on department, amount, or task type.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
                {formData.approvalType === 'specific' && (
                  <div className="sm:col-span-2 rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 p-5 shadow-sm dark:border-violet-800/50 dark:from-violet-900/20 dark:to-indigo-900/20">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 className="text-sm font-bold text-violet-900 dark:text-violet-200">
                            Approval Chain
                          </h4>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-violet-700/80 dark:text-violet-300/80">
                          Define reviewers in sequence. Lower level numbers are reviewed first.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addManualApprover}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-violet-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:bg-violet-500 dark:hover:bg-violet-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Approver
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {manualApprovers.length === 0 ? (
                        <div className="rounded-xl border-2 border-dashed border-violet-300 bg-white/50 px-4 py-8 text-center dark:border-violet-700/50 dark:bg-slate-900/30">
                          <svg className="mx-auto h-10 w-10 text-violet-400 dark:text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="mt-3 text-sm font-medium text-violet-900 dark:text-violet-200">
                            No approvers added yet
                          </p>
                          <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
                            Click "Add Approver" to build your approval chain
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Approval Chain Preview */}
                          {manualApprovers.length > 0 && (
                            <div className="rounded-lg border border-violet-200 bg-white/70 p-3 backdrop-blur-sm dark:border-violet-700/50 dark:bg-slate-900/50">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                  Preview
                                </span>
                                <div className="h-px flex-1 bg-gradient-to-r from-violet-300 to-transparent dark:from-violet-700"></div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                {[...manualApprovers]
                                  .sort((a, b) => a.levelOrder - b.levelOrder)
                                  .map((approver, index) => {
                                    const user = users.find((u) => u.id === approver.approverUserId);
                                    return (
                                      <div key={approver.id} className="flex items-center gap-2">
                                        <div className="group relative flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-900 dark:bg-violet-900/40 dark:text-violet-200">
                                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white dark:bg-violet-500">
                                            {approver.levelOrder}
                                          </span>
                                          <span className="max-w-[120px] truncate">
                                            {user ? user.name : 'Select user'}
                                          </span>
                                        </div>
                                        {index < manualApprovers.length - 1 && (
                                          <svg className="h-4 w-4 text-violet-400 dark:text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                          </svg>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Approver Cards */}
                          {manualApprovers.map((approver, index) => (
                            <div
                              key={approver.id}
                              className="group rounded-xl border border-violet-200 bg-white p-4 shadow-sm transition-all duration-150 hover:shadow-md dark:border-violet-700/50 dark:bg-slate-900/70"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                                {/* Level Badge */}
                                <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2">
                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-md">
                                    {approver.levelOrder}
                                  </div>
                                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400 sm:text-center">
                                    Level {approver.levelOrder}
                                  </span>
                                </div>

                                {/* Approver Selection */}
                                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                                  <div className="flex-1">
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                      Approver
                                    </label>
                                    <select
                                      value={approver.approverUserId}
                                      onChange={(event) =>
                                        updateManualApprover(
                                          approver.id,
                                          'approverUserId',
                                          event.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-150 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-violet-500"
                                    >
                                      <option value="">Select approver…</option>
                                      {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                          {user.name} · {user.email}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="w-full sm:w-28">
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                      Order
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={approver.levelOrder}
                                      onChange={(event) =>
                                        updateManualApprover(
                                          approver.id,
                                          'levelOrder',
                                          Number(event.target.value) || 1
                                        )
                                      }
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-sm text-slate-900 shadow-sm transition-all duration-150 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-violet-500"
                                    />
                                  </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => removeManualApprover(approver.id)}
                                  className="inline-flex items-center gap-1.5 self-start rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm transition-all duration-150 hover:border-red-300 hover:bg-red-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-800/50 dark:bg-slate-800 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900/20"
                                  title="Remove this approver"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Priority now lives inside Task Details as a dropdown */}

          {/* Recurrence moved into Task Details */}

          <SectionCard title="Attachments & Supporting Docs">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-400/70"
            >
              <svg
                className="h-10 w-10 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v4a1 1 0 001 1h16a1 1 0 001-1V7m-4 10H8m8-10l-4-4m0 0L8 7m4-4v16"
                />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Drag and drop files here, or
                <label className="ml-1 cursor-pointer text-indigo-600 underline decoration-dashed hover:text-indigo-700 dark:text-indigo-400">
                  browse
                  <input
                    type="file"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                PDF, DOCX, XLSX, PNG, JPG up to 25 MB each
              </p>
              {attachmentsError && (
                <p className="mt-2 text-xs text-red-600">{attachmentsError}</p>
              )}
            </div>

            {selectedFiles.length > 0 && (
              <ul className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {file.name.split('.').pop()?.toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200">{file.name}</p>
                        <p className="text-xs text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Approvals Workflow now lives inside Task Details */}

          <SectionCard title="Kick-off Comment (optional)">
            <textarea
              value={initialComment}
              onChange={(event) => setInitialComment(event.target.value)}
              rows={3}
              placeholder="Leave a note for the assignee or approvers…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </SectionCard>
        </div>

        <aside className="flex w-full flex-shrink-0 flex-col gap-6 lg:w-80">
          <SectionCard title="Summary">
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center justify-between">
                <span>Assignee</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {users.find((u) => u.id === formData.assigneeId)?.name || '—'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Department</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {departments.find((d) => d.id === formData.departmentId)?.name || '—'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Start → Due</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formData.startDate || '—'} → {formData.dueDate || '—'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Priority</span>
                <span className="font-medium text-slate-900 capitalize dark:text-slate-100">
                  {formData.priorityFlag.toLowerCase()}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Approval</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formData.approvalType}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Attachments</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {selectedFiles.length}
                </span>
              </li>
            </ul>
          </SectionCard>

          {!isMobile && selectedFiles.length > 0 && (
            <SectionCard title="Attachment Preview">
              <ul className="space-y-2">
                {selectedFiles.slice(0, 3).map((file, index) => (
                  <li
                    key={`${file.name}-preview-${index}`}
                    className="truncate text-sm text-slate-600 dark:text-slate-300"
                  >
                    • {file.name}
                  </li>
                ))}
                {selectedFiles.length > 3 && (
                  <li className="text-xs text-slate-400">
                    + {selectedFiles.length - 3} more file(s)
                  </li>
                )}
              </ul>
            </SectionCard>
          )}
        </aside>
      </form>
    </div>
  );
};

export default TaskCreateNew;
