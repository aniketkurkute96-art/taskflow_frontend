import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { isEagleEyeUIEnabled } from '../lib/featureFlags';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  departmentId?: string;
  amount?: number;
  startDate?: string;
  dueDate?: string;
  approvalType: string;
}

const TaskEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const eagleEye = isEagleEyeUIEnabled();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    departmentId: '',
    amount: '',
    startDate: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [taskRes, usersRes, deptsRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get('/users'),
        api.get('/departments'),
      ]);

      const taskData = taskRes.data;
      setTask(taskData);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);

      // Populate form data
      setFormData({
        title: taskData.title || '',
        description: taskData.description || '',
        assigneeId: taskData.assigneeId || '',
        departmentId: taskData.departmentId || '',
        amount: taskData.amount ? taskData.amount.toString() : '',
        startDate: taskData.startDate ? new Date(taskData.startDate).toISOString().split('T')[0] : '',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load task data');
      navigate('/dashboard');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        assigneeId: formData.assigneeId || null,
        departmentId: formData.departmentId || null,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      };

      await api.patch(`/tasks/${id}`, payload);

      alert('Task updated successfully!');
      navigate(`/tasks/${id}`);
    } catch (error: any) {
      console.error('Failed to update task:', error);
      alert(error.response?.data?.error || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignees = useMemo(() => {
    if (!formData.departmentId) return users;
    return users.filter((u) => (u as any).departmentId ? (u as any).departmentId === formData.departmentId : true);
  }, [users, formData.departmentId]);

  if (loadingData) {
    if (!eagleEye) {
      return (
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </Layout>
      );
    }
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-300">Loading task…</p>
        </div>
      </div>
    );
  }

  if (!task) {
    if (!eagleEye) {
      return (
        <Layout>
          <div className="text-center py-12">
            <p className="text-gray-600">Task not found</p>
          </div>
        </Layout>
      );
    }
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-300">Task not found</p>
      </div>
    );
  }

  // EagleEye UI
  if (eagleEye) {
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

    const onDepartmentChange = (value: string) => {
      setFormData((prev) => {
        const present = users.find((u) => u.id === prev.assigneeId);
        const departmentMatches = (present as any)?.departmentId === value || value === '';
        return {
          ...prev,
          departmentId: value,
          assigneeId: departmentMatches ? prev.assigneeId : '',
        };
      });
    };

    return (
      <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="text-xs uppercase tracking-wide text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                ← Back
              </button>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Edit Task
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/tasks/${id}`)}
                className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                form="task-edit-form"
                type="submit"
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </header>

        <form
          id="task-edit-form"
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-6 lg:flex-row"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-6 pb-24 lg:pb-0">
            <SectionCard title="Task Details" subtitle="Update the core information for this task.">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                      onChange={handleChange}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select teammate…</option>
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
                      onChange={(e) => onDepartmentChange(e.target.value)}
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

                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
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
                      onChange={handleChange}
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
                      onChange={handleChange}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Notes">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Approval type can’t be changed after creation. Adjust core details and scheduling here.
              </p>
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
                  <span>Amount</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formData.amount || '—'}
                  </span>
                </li>
              </ul>
            </SectionCard>
          </aside>
        </form>
      </div>
    );
  }

  // Legacy UI (fallback)
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task description"
              />
            </div>

            {/* Start Date and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Assignee and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (if applicable)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can edit task details, but the approval type cannot be changed after creation.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/tasks/${id}`)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default TaskEdit;

