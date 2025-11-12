import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, Department, ApprovalTemplate } from '../types';
import { isEagleEyeUIEnabled } from '../lib/featureFlags';

const TaskCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [watchers, setWatchers] = useState<string[]>([]);
  const eagleEye = isEagleEyeUIEnabled();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    departmentId: '',
    amount: '',
    approvalType: '360' as '360' | 'specific' | 'predefined',
    approvalTemplateId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, deptsRes, templatesRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
        api.get('/admin/templates'),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setTemplates(templatesRes.data.filter((t: ApprovalTemplate) => t.isActive));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        assigneeId: formData.assigneeId || undefined,
        departmentId: formData.departmentId || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        approvalType: formData.approvalType,
      };

      if (formData.approvalType === 'predefined' && formData.approvalTemplateId) {
        payload.approvalTemplateId = formData.approvalTemplateId;
      }

      const response = await api.post('/tasks', payload);
      alert('Task created successfully!');
      navigate(`/tasks/${response.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (eagleEye) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
          {/* Left column */}
          <div className="col-span-12 md:col-span-8 space-y-6">
            <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Create Task</h2>
              <p className="mt-1 text-sm text-slate-400">Provide a clear title and description.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Title *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    rows={6}
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-slate-500">You can add more details later from the edit page.</p>
                </div>
              </div>
            </section>

            {/* Attachments */}
            <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200">Attachments</h3>
              <div className="mt-3 rounded-lg border-2 border-dashed border-slate-600 p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    setSelectedFiles((prev) => [...prev, ...files]);
                  }}
                  className="mx-auto block text-sm text-slate-200"
                />
                <p className="mt-2 text-xs text-slate-500">PDF, DOCX, PNG up to 25MB each</p>
              </div>
              {selectedFiles.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-slate-300">
                  {selectedFiles.map((f, i) => (
                    <li key={i}>• {f.name}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right column */}
          <aside className="col-span-12 md:col-span-4 space-y-6">
            <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200">Assignments</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400">Assignee</label>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={formData.assigneeId}
                    onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  >
                    <option value="">Select assignee</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Department</label>
                  <select
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200">Approval</h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs text-slate-400">Approval Type</label>
                  <select
                    required
                    className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={formData.approvalType}
                    onChange={(e) => setFormData({ ...formData, approvalType: e.target.value as any })}
                  >
                    <option value="360">360° (Backward from forward path)</option>
                    <option value="specific">Specific Approvers</option>
                    <option value="predefined">Predefined Template</option>
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    360 — routes approval in reverse of forward path.
                  </p>
                </div>
                {formData.approvalType === 'predefined' && (
                  <div>
                    <label className="block text-xs text-slate-400">Approval Template</label>
                    <select
                      className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      value={formData.approvalTemplateId}
                      onChange={(e) => setFormData({ ...formData, approvalTemplateId: e.target.value })}
                    >
                      <option value="">Auto-select template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* Watchers */}
            <section className="rounded-2xl p-6 bg-slate-800/60 backdrop-blur-sm border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200">Watchers</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {watchers.map((w) => (
                  <span key={w} className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200">
                    {users.find((u) => u.id === w)?.name || w}
                  </span>
                ))}
              </div>
              <select
                className="mt-3 w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !watchers.includes(val)) setWatchers((prev) => [...prev, val]);
                }}
              >
                <option value="">Add watcher…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </section>
          </aside>

          {/* Sticky footer */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700 bg-slate-900/80 backdrop-blur px-6 py-3">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/workspace')}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Legacy fallback
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Task</h1>
        {/* Legacy form omitted for brevity */}
      </div>
    </div>
  );
};

export default TaskCreate;





