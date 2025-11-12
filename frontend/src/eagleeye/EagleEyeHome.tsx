import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TasksListView from '../components/tasks/TasksListView';
import ColumnsMenu from '../components/tasks/ColumnsMenu';
import { useProjectStore } from '../stores/projectStore';

const EagleEyeHome = () => {
  const navigate = useNavigate();
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const { selectedProjectId, getProjectById } = useProjectStore();
  const selectedProject = selectedProjectId
    ? getProjectById(selectedProjectId)
    : null;

  const handleCreateTask = () => {
    navigate('/tasks/create');
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Project Header */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedProject && (
              <div
                className="h-6 w-6 rounded-md flex-shrink-0"
                style={{ backgroundColor: selectedProject.color || '#6366f1' }}
              />
            )}
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {selectedProject?.name || 'All Tasks'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColumnsMenu(true)}
              className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Columns
            </button>
            <button
              onClick={handleCreateTask}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              + New Task
            </button>
          </div>
        </div>
      </div>

      {/* Columns Menu */}
      <ColumnsMenu
        isOpen={showColumnsMenu}
        onClose={() => setShowColumnsMenu(false)}
      />

      {/* Task List */}
      <div className="flex-1 overflow-hidden">
        <TasksListView showColumnsButton={false} />
      </div>
    </div>
  );
};

export default EagleEyeHome;


