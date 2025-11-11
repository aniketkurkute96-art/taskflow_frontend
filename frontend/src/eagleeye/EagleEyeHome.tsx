import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectsSidebar from '../components/sidebar/ProjectsSidebar';
import TasksListView from '../components/tasks/TasksListView';
import { useProjectStore } from '../stores/projectStore';

const EagleEyeHome = () => {
  const navigate = useNavigate();
  const { selectedProjectId, getProjectById } = useProjectStore();
  const selectedProject = selectedProjectId
    ? getProjectById(selectedProjectId)
    : null;

  const handleCreateTask = () => {
    navigate('/tasks/create');
  };

  return (
    <div className="flex h-full">
      {/* Projects Sidebar */}
      <ProjectsSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Project Header */}
        <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedProject && (
                <div
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: selectedProject.color || '#6366f1' }}
                />
              )}
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {selectedProject?.name || 'All Tasks'}
              </h1>
            </div>
            <button
              onClick={handleCreateTask}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              + New Task
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-hidden">
          <TasksListView />
        </div>
      </div>
    </div>
  );
};

export default EagleEyeHome;


