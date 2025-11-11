import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { ApprovalTemplate } from '../types';

const AdminTemplates = () => {
  const [templates, setTemplates] = useState<ApprovalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    amount_min: '',
    isActive: true,
    stages: [{ levelOrder: 1, approverType: 'user', approverValue: '' }],
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/admin/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const conditionJson: any = {};
      if (formData.department) conditionJson.department = formData.department;
      if (formData.amount_min) conditionJson.amount_min = parseFloat(formData.amount_min);

      await api.post('/admin/templates', {
        name: formData.name,
        conditionJson,
        isActive: formData.isActive,
        stages: formData.stages,
      });

      alert('Template created successfully');
      setShowForm(false);
      setFormData({
        name: '',
        department: '',
        amount_min: '',
        isActive: true,
        stages: [{ levelOrder: 1, approverType: 'user', approverValue: '' }],
      });
      fetchTemplates();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create template');
    }
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        {
          levelOrder: formData.stages.length + 1,
          approverType: 'user',
          approverValue: '',
        },
      ],
    });
  };

  const removeStage = (index: number) => {
    const newStages = formData.stages.filter((_, i) => i !== index);
    setFormData({ ...formData, stages: newStages });
  };

  const updateStage = (index: number, field: string, value: string) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setFormData({ ...formData, stages: newStages });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Approval Templates</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Create Template'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
            <h2 className="text-xl font-bold mb-4">New Template</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Name *</label>
                <input
                  type="text"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Department (condition)
                </label>
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Accounts, Finance"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Minimum Amount (condition)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  value={formData.amount_min}
                  onChange={(e) => setFormData({ ...formData, amount_min: e.target.value })}
                  placeholder="e.g., 100000"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Stages</label>
                {formData.stages.map((stage, index) => (
                  <div key={index} className="mb-2 p-3 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Level {stage.levelOrder}</span>
                      {formData.stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStage(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="border rounded py-2 px-3"
                        value={stage.approverType}
                        onChange={(e) => updateStage(index, 'approverType', e.target.value)}
                      >
                        <option value="user">Specific User</option>
                        <option value="role">Role</option>
                        <option value="dynamic_role">Dynamic Role</option>
                      </select>
                      <input
                        type="text"
                        className="border rounded py-2 px-3"
                        value={stage.approverValue}
                        onChange={(e) => updateStage(index, 'approverValue', e.target.value)}
                        placeholder={
                          stage.approverType === 'user'
                            ? 'User ID'
                            : stage.approverType === 'role'
                            ? 'Role name'
                            : 'HOD, CFO, etc.'
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStage}
                  className="mt-2 text-indigo-600 hover:text-indigo-800"
                >
                  + Add Stage
                </button>
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Create Template
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {templates.map((template) => {
              let conditions: any = {};
              try {
                conditions = JSON.parse(template.conditionJson);
              } catch {}

              return (
                <li key={template.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{template.name}</h3>
                      <div className="mt-1 text-sm text-gray-500">
                        {conditions.department && <span>Dept: {conditions.department} • </span>}
                        {conditions.amount_min && (
                          <span>Min Amount: ${conditions.amount_min.toLocaleString()}</span>
                        )}
                      </div>
                      {template.stages && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Stages: </span>
                          {template.stages.map((s, i) => (
                            <span key={s.id}>
                              {i > 0 && ' → '}
                              {s.approverType === 'dynamic_role'
                                ? s.approverValue
                                : s.approverType}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        template.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default AdminTemplates;



