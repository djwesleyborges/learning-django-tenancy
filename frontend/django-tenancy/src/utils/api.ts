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
  access_token?: string;
}

// Interface para respostas JWT
export interface JWTAuthResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
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

// Gerenciar token JWT
let accessToken: string | null = null;

// Salvar e recuperar token do localStorage
const saveToken = (token: string) => {
  console.log('💾 saveToken chamado com:', token.substring(0, 20) + '...');
  accessToken = token;
  localStorage.setItem('access_token', token);
  console.log('✅ Token salvo no localStorage');
  console.log('📍 accessToken definido:', !!accessToken);
};

const getToken = (): string | null => {
  if (!accessToken) {
    accessToken = localStorage.getItem('access_token');
  }
  return accessToken;
};

const removeToken = () => {
  accessToken = null;
  localStorage.removeItem('access_token');
};

// Gerenciar token CSRF (manter para compatibilidade)
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

// Login JWT (recomendado)
export const loginJWT = async (data: LoginData): Promise<JWTAuthResponse> => {
  try {
    console.log('🔐 Fazendo requisição JWT para:', `${API_BASE_URL}/auth/login-jwt`);
    console.log('📤 Dados do login:', data);
    
    const response = await fetch(`${API_BASE_URL}/auth/login-jwt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('📥 Resposta da API:', result);
    
    if (result.success && result.access_token) {
      console.log('💾 Salvando token...');
      saveToken(result.access_token);
      console.log('✅ Token salvo com sucesso!');
    }
    
    return result;
  } catch (error) {
    console.error('❌ JWT Login error:', error);
    throw error;
  }
};

// Verificar autenticação JWT
export const checkAuthJWT = async (): Promise<{
  is_authenticated: boolean;
  user?: any;
  tenant_info?: any;
}> => {
  const token = getToken();
  
  if (!token) {
    return { is_authenticated: false };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-auth-jwt`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      // Token inválido, remover
      removeToken();
      return { is_authenticated: false };
    }
  } catch (error) {
    console.error('Check JWT auth error:', error);
    return { is_authenticated: false };
  }
};

// Obter perfil JWT
export const getProfileJWT = async (): Promise<any> => {
  const token = getToken();
  
  if (!token) {
    throw new Error('No token available');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile-jwt`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch profile');
    }
  } catch (error) {
    console.error('Get JWT profile error:', error);
    throw error;
  }
};

// Logout JWT
export const logoutJWT = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout-jwt`, {
      method: 'POST',
    });

    removeToken(); // Remover token do lado do cliente
    
    return await response.json();
  } catch (error) {
    console.error('JWT Logout error:', error);
    // Remover token mesmo em caso de erro
    removeToken();
    throw error;
  }
};
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
