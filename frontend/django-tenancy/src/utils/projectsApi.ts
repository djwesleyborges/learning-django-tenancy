// Obter a URL base da API dinamicamente baseada no subdomínio atual
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const port = hostname === 'localhost' ? '8000' : '8000';
  
  // Se estamos em um subdomínio, usar o mesmo subdomínio para a API
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:${port}/api`;
  }
  
  // Fallback para localhost (desenvolvimento)
  return `http://localhost:8000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Tipos
export interface Project {
  id: number;
  name: string;
  description: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

export interface Task {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description: string;
  is_completed: boolean;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  is_completed?: boolean;
}

// Obter token JWT
const getToken = (): string | null => {
  const token = localStorage.getItem('access_token');
  return token;
};

// Headers com autenticação
const getAuthHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  return {
    ...headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// API de Projetos
export const projectsApi = {
  // Listar todos os projetos
  list: async (): Promise<Project[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Obter projeto específico
  get: async (id: number): Promise<Project> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  // Criar novo projeto
  create: async (data: ProjectCreate): Promise<Project> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to create project: ${response.status}`);
        } else {
          // Se não for JSON, pegar o texto (provavelmente HTML de erro)
          const errorText = await response.text();
          console.error('Backend error response:', errorText);
          throw new Error(`Server error: ${response.status}. Check console for details.`);
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Atualizar projeto
  update: async (id: number, data: ProjectUpdate): Promise<Project> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update project: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Excluir projeto
  delete: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete project: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Listar tarefas de um projeto
  listTasks: async (projectId: number): Promise<Task[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },
};
