import React, { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginJWT, logoutJWT, checkAuthJWT, type LoginData, type RegisterData, type JWTAuthResponse } from '../utils/api';

interface AuthContextType {
  user: any;
  tenant: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<JWTAuthResponse>;
  register: (data: RegisterData) => Promise<JWTAuthResponse>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

// Criar um contexto simples para autenticação
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar status de autenticação ao montar o componente
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authData = await checkAuthJWT();
      setIsAuthenticated(authData.is_authenticated);
      
      if (authData.is_authenticated && authData.user) {
        setUser(authData.user);
        if (authData.tenant_info) {
          setTenant(authData.tenant_info);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      setTenant(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginData): Promise<JWTAuthResponse> => {
    try {
      console.log('🚀 Iniciando login...');
      const response = await loginJWT(data);
      console.log('📥 Resposta do login:', response);
      
      if (response.success) {
        console.log('✅ Login successful, atualizando estado...');
        setUser(response.user);
        if (response.user?.tenant) {
          setTenant(response.user.tenant);
        }
        setIsAuthenticated(true);
        
        console.log('🔄 Verificando redirecionamento...');
        console.log('redirect_url:', response.redirect_url);
        
        // Usar redirect_url da API se disponível, senão redirecionar para /
        if (response.redirect_url) {
          console.log('🔗 Redirecionando para URL da API:', response.redirect_url);
          // Verificar se é URL base (termina com /) ou pathname específico
          const url = new URL(response.redirect_url);
          console.log('📍 Path extraído:', url.pathname);
          
          // Se o pathname for vazio ou apenas "/", redirecionar para Home (/)
          if (!url.pathname || url.pathname === '/') {
            console.log('🏠 URL base detectada, redirecionando para Home (/)');
            navigate('/');  // Redirecionar para Home
          } else {
            console.log('📂 Path específico detectado, redirecionando para:', url.pathname);
            navigate(url.pathname);  // Redirecionar para pathname específico
          }
        } else {
          console.log('🏠 Sem redirect_url, redirecionando para Home (/)');
          navigate('/');  // Redirecionar para Home
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const handleRegister = async (data: RegisterData): Promise<JWTAuthResponse> => {
    try {
      // Por enquanto, register ainda usa o método antigo
      // Futuramente podemos criar um register-jwt
      const response = await loginJWT(data);
      
      if (response.success) {
        setUser(response.user);
        if (response.user?.tenant) {
          setTenant(response.user.tenant);
        }
        setIsAuthenticated(true);
        
        // Usar redirect_url da API se disponível, senão redirecionar para /
        if (response.redirect_url) {
          console.log('🔗 Redirecionando para URL da API:', response.redirect_url);
          // Verificar se é URL base (termina com /) ou pathname específico
          const url = new URL(response.redirect_url);
          console.log('📍 Path extraído:', url.pathname);
          
          // Se o pathname for vazio ou apenas "/", redirecionar para Home (/)
          if (!url.pathname || url.pathname === '/') {
            console.log('🏠 URL base detectada, redirecionando para Home (/)');
            navigate('/');  // Redirecionar para Home
          } else {
            console.log('📂 Path específico detectado, redirecionando para:', url.pathname);
            navigate(url.pathname);  // Redirecionar para pathname específico
          }
        } else {
          console.log('🏠 Sem redirect_url, redirecionando para Home (/)');
          navigate('/');  // Redirecionar para Home
        }
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutJWT();
      setUser(null);
      setTenant(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Forçar logout mesmo em caso de erro
      setUser(null);
      setTenant(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const value: AuthContextType = {
    user,
    tenant,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    checkAuthStatus,
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};

// Hook para redirecionamento baseado em autenticação
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
};
