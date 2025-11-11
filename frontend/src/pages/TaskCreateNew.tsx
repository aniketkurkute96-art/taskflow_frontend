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
  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
    <header className="border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </header>
    <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
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

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const attachmentData = new FormData();
          attachmentData.append('file', file);
          await api.post(`/tasks/${taskId}/attachments`, attachmentData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      if (initialComment.trim()) {
        await api.post(`/tasks/${taskId}/comments`, { content: initialComment.trim() });
      }

      navigate(`/tasks/${taskId}`);
    } catch (error: any) {
      console.error('Failed to create task', error);
      alert(error.response?.data?.error || 'Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Create Task
            </p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              New Work Item
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              form="task-create-form"
              type="submit"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Create Task'}
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
          <SectionCard title="Task Details" subtitle="Give your task a clear identity.">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Review vendor invoice #453"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Share context, goals, and expectations"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Assign To
                  </label>
                  <select
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select teammate…</option>
                    {filteredAssignees.length === 0 && formData.departmentId && (
                      <option disabled value="">
                        No users in selected department
                      </option>
                    )}
                    {filteredAssignees.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.name} ({candidate.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Department
                  </label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Approval Type
                  </label>
                  <select
                    name="approvalType"
                    value={formData.approvalType}
                    onChange={(event) => {
                      handleInputChange(event);
                      if (event.target.value !== 'specific') {
                        setManualApprovers([]);
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="360">360° approval (auto route)</option>
                    <option value="specific">Specific approvers</option>
                    <option value="predefined" disabled>
                      Predefined template (coming soon)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Budget / Amount (optional)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Priority & Flags" subtitle="Call attention to what matters most.">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Priority Flag
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                  {TASK_FLAGS.map((flag) => (
                    <button
                      key={flag}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          priorityFlag: flag,
                        }))
                      }
                      className={`flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                        formData.priorityFlag === flag
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {flag.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                  Priority Notes
                </label>
                <textarea
                  name="priorityNotes"
                  value={formData.priorityNotes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Why is this urgent or blocked?"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Schedule & Recurrence"
            subtitle="Automate future instances or reminders."
          >
            <div className="space-y-4">
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
                <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
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

                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Ends
                    </p>
                    <div className="mt-2 space-y-2">
                      {(['never', 'on_date', 'after'] as RecurrenceEnds[]).map((option) => (
                        <label
                          key={option}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="recurrenceEnds"
                              value={option}
                              checked={recurrence.ends === option}
                              onChange={() =>
                                setRecurrence((prev) => ({
                                  ...prev,
                                  ends: option,
                                }))
                              }
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="capitalize text-slate-600 dark:text-slate-300">
                              {option === 'on_date'
                                ? 'On specific date'
                                : option === 'after'
                                ? 'After number of occurrences'
                                : 'Never'}
                            </span>
                          </span>

                          {option === 'on_date' && recurrence.ends === 'on_date' && (
                            <input
                              type="date"
                              value={recurrence.endDate}
                              onChange={(event) =>
                                setRecurrence((prev) => ({
                                  ...prev,
                                  endDate: event.target.value,
                                }))
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                          )}

                          {option === 'after' && recurrence.ends === 'after' && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={recurrence.occurrences}
                                onChange={(event) =>
                                  setRecurrence((prev) => ({
                                    ...prev,
                                    occurrences: Math.max(Number(event.target.value) || 1, 1),
                                  }))
                                }
                                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              />
                              <span>occurrence(s)</span>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

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

          <SectionCard title="Approvals Workflow">
            <div className="space-y-4">
              {formData.approvalType === 'specific' && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-800/40 dark:bg-indigo-900/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                        Approval levels
                      </h4>
                      <p className="mt-1 text-xs text-indigo-500 dark:text-indigo-400">
                        Define who approves and in what order.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addManualApprover}
                      className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      + Add approver
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {manualApprovers.length === 0 && (
                      <p className="rounded-lg border border-dashed border-indigo-200 px-3 py-4 text-center text-sm text-indigo-500 dark:border-indigo-700 dark:text-indigo-300">
                        No approvers yet. Add the first reviewer to get started.
                      </p>
                    )}
                    {manualApprovers.map((approver) => (
                      <div
                        key={approver.id}
                        className="rounded-lg border border-indigo-200 bg-white px-3 py-3 shadow-sm dark:border-indigo-700 dark:bg-slate-900"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                            <div className="flex-1">
                              <label className="text-xs font-medium uppercase tracking-wide text-indigo-500">
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
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              >
                                <option value="">Select approver…</option>
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="w-full sm:w-32">
                              <label className="text-xs font-medium uppercase tracking-wide text-indigo-500">
                                Level
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
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeManualApprover(approver.id)}
                            className="inline-flex items-center rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

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
