import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Project } from '../types';

const Home = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenant, logout } = useAuth();

  useEffect(() => {
    // TODO: Implement API call to fetch projects
    const fetchProjects = async () => {
      try {
        // Mock data for now
        const mockProjects: Project[] = [
          {
            id: 1,
            name: 'Sample Project 1',
            description: 'This is a sample project description',
            is_completed: false,
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            tasks: []
          },
          {
            id: 2,
            name: 'Sample Project 2',
            description: 'Another sample project with more details',
            is_completed: true,
            created_at: '2024-01-10T14:20:00Z',
            updated_at: '2024-01-12T09:15:00Z',
            tasks: []
          }
        ];
        
        setProjects(mockProjects);
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
      {/* Header com informações do usuário e logout */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bem-vindo, {user?.username}!
            </h1>
            <p className="text-gray-600 mt-1">
              {tenant?.name ? `Organização: ${tenant.name}` : 'Sem organização'}
            </p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Seção de projetos */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {tenant?.name ? `Projetos - ${tenant.name}` : 'Seus Projetos'}
          </h2>
          <a
            href="/projects/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Criar Projeto
          </a>
        </div>
      </div>

      {projects.length > 0 ? (
        <div className="mb-4">
          <p className="text-gray-600">
            Total de Projetos: <strong>{projects.length}</strong>
          </p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum projeto encontrado.</p>
          <p className="text-gray-400 mt-2">
            Crie seu primeiro projeto para começar!
          </p>
        </div>
      )}

      {/* Grid de projetos */}
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
                  {project.is_completed ? 'Concluído' : 'Em Andamento'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-3">
                {project.description}
              </p>
              <div className="flex items-center text-xs text-gray-400">
                <span>
                  Criado: {new Date(project.created_at).toLocaleDateString()}
                </span>
                {project.tasks && (
                  <span className="ml-4">
                    Tarefas: {project.tasks.length}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6">
              <div className="flex space-x-3">
                <button
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ver Tarefas
                </button>
                <button
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
