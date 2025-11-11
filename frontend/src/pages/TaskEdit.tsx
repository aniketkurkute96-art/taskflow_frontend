import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

  if (loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Task not found</p>
        </div>
      </Layout>
    );
  }

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

