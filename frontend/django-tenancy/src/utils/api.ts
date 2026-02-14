// API utilities for Django Ninja backend

const API_BASE_URL = 'http://localhost:8000/api';

// Interface para respostas da API
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    tenant?: {
      id: number;
      name: string;
      schema_name: string;
    };
  };
  redirect_url?: string;
  csrf_token?: string;
}

// Interface para dados de login
export interface LoginData {
  username: string;
  password: string;
}

// Interface para dados de registro
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  organization: string;
  first_name?: string;
  last_name?: string;
}

// Gerenciar token CSRF
let csrfToken: string | null = null;

// Obter token CSRF
export const getCSRFToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/csrf`, {
      headers: {
        accept: 'application/json'
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrf_token || '';
      return csrfToken || '';
    } else {
      throw new Error(`CSRF endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw new Error(`Failed to fetch CSRF token: ${error}`);
  }
  
  return '';
};

// Login
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const token = await getCSRFToken();
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['X-CSRFToken'] = token;
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    // Não fazer redirecionamento automático aqui
    // Deixar que o hook useAuth trate o redirecionamento via React Router
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Registro
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const token = await getCSRFToken();
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['X-CSRFToken'] = token;
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    // Não fazer redirecionamento automático aqui
    // Deixar que o hook useAuth trate o redirecionamento via React Router
    return result;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Logout
export const logout = async (): Promise<{ success: boolean; message: string }> => {
  const token = await getCSRFToken();
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['X-CSRFToken'] = token;
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    return await response.json();
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Verificar autenticação
export const checkAuth = async (): Promise<{
  is_authenticated: boolean;
  user?: any;
  tenant_info?: any;
  csrf_token?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-auth`, {
      credentials: 'include',
    });

    return await response.json();
  } catch (error) {
    console.error('Check auth error:', error);
    return { is_authenticated: false };
  }
};

// Obter perfil do usuário
export const getProfile = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      credentials: 'include',
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Obter informações do tenant
export const getTenantInfo = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/tenant-info`, {
      credentials: 'include',
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Get tenant info error:', error);
    throw error;
  }
};
