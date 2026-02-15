import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { projectsApi, type Project } from '../utils/projectsApi';
import Header from '../components/Header';

const ProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenant, logout } = useAuth();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await projectsApi.list();
        setProjects(projectsData);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <Header user={user} onLogout={logout} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {tenant?.name || user?.username}'s Projects
        </h1>
        <a
          href="/projects/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Project
        </a>
      </div>

      {projects.length > 0 ? (
        <div className="mb-4">
          <p className="text-gray-600">
            Total Projects Found: <strong>{projects.length}</strong>
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No projects found.</p>
          <p className="text-gray-400 mt-2">
            Create your first project to get started!
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {project.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.is_completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {project.is_completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-3">
                {project.description}
              </p>
              <div className="flex items-center text-xs text-gray-400">
                <span>
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </span>
                {project.tasks && (
                  <span className="ml-4">
                    Tasks: {project.tasks.length}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6">
              <div className="flex space-x-3">
                <button
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Tasks
                </button>
                <button
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
