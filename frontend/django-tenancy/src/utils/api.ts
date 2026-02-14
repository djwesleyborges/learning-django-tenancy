// API utilities for Django Ninja backend

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

// Limpar TODOS os dados de autenticação
export const clearAllAuthData = () => {
  console.log('🗑️ Limpando TODOS os dados de autenticação...');
  
  // Limpar localStorage
  console.log('🧹 Limpando localStorage...');
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('token') || 
      key.includes('auth') || 
      key.includes('user') || 
      key.includes('tenant') ||
      key.includes('csrf')
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    console.log(`  - Removendo localStorage: ${key}`);
    localStorage.removeItem(key);
  });
  
  // Limpar sessionStorage
  console.log('🧹 Limpando sessionStorage...');
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes('token') || 
      key.includes('auth') || 
      key.includes('user') || 
      key.includes('tenant') ||
      key.includes('csrf')
    )) {
      sessionKeysToRemove.push(key);
    }
  }
  sessionKeysToRemove.forEach(key => {
    console.log(`  - Removendo sessionStorage: ${key}`);
    sessionStorage.removeItem(key);
  });
  
  // Limpar cookies relacionados à autenticação
  console.log('🧹 Limpando cookies...');
  document.cookie.split(';').forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name && (
      name.includes('token') || 
      name.includes('auth') || 
      name.includes('user') || 
      name.includes('tenant') ||
      name.includes('csrf') ||
      name.includes('session')
    )) {
      console.log(`  - Removendo cookie: ${name}`);
      // Remover cookie para todos os domínios e caminhos
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.localhost;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
    }
  });
  
  // Resetar variáveis em memória
  accessToken = null;
  csrfToken = null;
  
  console.log('✅ Todos os dados de autenticação foram limpos');
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

// Registro JWT (recomendado)
export const registerJWT = async (data: RegisterData): Promise<JWTAuthResponse> => {
  try {
    console.log('🔐 Fazendo requisição de registro JWT para:', `${API_BASE_URL}/auth/register-jwt`);
    console.log('📤 Dados do registro:', data);
    
    const response = await fetch(`${API_BASE_URL}/auth/register-jwt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('📥 Resposta da API de registro:', result);
    
    // Não salvar token no registro - usuário deve fazer login manualmente
    if (result.success && result.access_token) {
      console.log('ℹ️ Token recebido mas não será salvo - usuário deve fazer login');
    }
    
    return result;
  } catch (error) {
    console.error('❌ JWT Register error:', error);
    throw error;
  }
};
export const checkAuthJWT = async (): Promise<{
  is_authenticated: boolean;
  user?: any;
  tenant_info?: any;
}> => {
  const token = getToken();
  
  console.log('🔍 checkAuthJWT chamado, token presente:', !!token);
  
  if (!token) {
    console.log('❌ Sem token, retornando não autenticado');
    return { is_authenticated: false };
  }

  try {
    console.log('🔄 Fazendo requisição para check-auth-jwt...');
    const response = await fetch(`${API_BASE_URL}/auth/check-auth-jwt`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📥 Resposta do check-auth-jwt:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ checkAuthJWT sucesso:', result);
      return result;
    } else {
      console.log('❌ Resposta não ok, limpando todos os dados');
      // Token inválido, limpar TODOS os dados
      clearAllAuthData();
      return { is_authenticated: false };
    }
  } catch (error) {
    console.error('❌ Check JWT auth error:', error);
    // Em caso de erro, limpar todos os dados
    clearAllAuthData();
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
export const logoutJWT = async (): Promise<void> => {
  try {
    const token = getToken();
    console.log('🚪 Fazendo logout JWT...');
    console.log('📍 Token presente:', !!token);
    
    if (token) {
      const response = await fetch(`${API_BASE_URL}/auth/logout-jwt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Resposta do logout:', response.status);
      
      if (!response.ok) {
        console.warn('⚠️ Logout JWT falhou, mas continuando...');
      }
    }
    
    // Limpar TODOS os dados de autenticação localmente
    console.log('🗑️ Limpando dados locais...');
    clearAllAuthData();
    console.log('✅ Logout concluído');
  } catch (error) {
    console.error('❌ JWT Logout error:', error);
    // Mesmo com erro, limpar todos os dados localmente
    clearAllAuthData();
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

// Obter informações do tenant atual baseado no subdomínio
export const getCurrentTenantInfo = (): { domain: string; isSubdomain: boolean } => {
  const hostname = window.location.hostname;
  
  return {
    domain: hostname,
    isSubdomain: hostname !== 'localhost' && hostname !== '127.0.0.1'
  };
};

// Verificar se o usuário pode acessar este tenant
export const validateUserTenantAccess = async (user: any): Promise<boolean> => {
  const { domain, isSubdomain } = getCurrentTenantInfo();
  
  console.log('🔍 validateUserTenantAccess:');
  console.log('  - domain:', domain);
  console.log('  - isSubdomain:', isSubdomain);
  console.log('  - user.tenant:', user.tenant);
  
  // Se não for subdomínio, permitir acesso (página de login/registro)
  if (!isSubdomain) {
    console.log('✅ Não é subdomínio, acesso permitido');
    return true;
  }
  
  // Verificar se o usuário tem tenant e se o domínio corresponde
  if (!user.tenant) {
    console.log('❌ Usuário não tem tenant');
    return false;
  }
  
  try {
    console.log('🔄 Fazendo requisição de validação...');
    const response = await fetch(`${API_BASE_URL}/auth/validate-tenant-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        tenant_id: user.tenant.id,
        domain: domain
      })
    });
    
    const result = await response.json();
    console.log('📥 Resposta da validação:', result);
    return result.valid;
  } catch (error) {
    console.error('❌ Erro na validação:', error);
    return false;
  }
};
