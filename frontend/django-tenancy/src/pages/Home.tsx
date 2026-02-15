import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { projectsApi, type Project } from '../utils/projectsApi';
import Header from '../components/Header';

const Home = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

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
      {/* Header com navegação e informações do usuário */}
      <Header user={user} onLogout={logout} />

      {/* Seção de projetos */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {tenant?.name ? `Projetos - ${tenant.name}` : 'Seus Projetos'}
          </h2>
          <Link
            to="/projects/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Criar Projeto
          </Link>
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
                  onClick={() => navigate(`/projects/${project.id}/tasks`)}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ver Tarefas
                </button>
                <button
                  onClick={() => navigate(`/projects/${project.id}/edit`)}
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
