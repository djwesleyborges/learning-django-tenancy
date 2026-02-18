import React, { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginJWT, registerJWT, checkAuthJWT, logoutJWT, getCurrentTenantInfo, type LoginData, type RegisterData, type JWTAuthResponse } from '../utils/api';

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
  const [justLoggedIn, setJustLoggedIn] = useState(false); // Para evitar warning após login
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
        // Verificação simples de tenant - apenas log, sem redirecionamento
        const { domain, isSubdomain } = getCurrentTenantInfo();
        
        if (isSubdomain && authData.user.tenant) {
          const expectedDomain = `${authData.user.tenant.schema_name}.localhost`;
          
          if (domain !== expectedDomain) {
            // Mostrar warning apenas se não for logo após redirecionamento de login
            // (ou seja, se o usuário acessou diretamente o URL errado)
            if (!justLoggedIn) {
              toast.error(`Você está no domínio ${domain} mas seu tenant é ${expectedDomain}`, {
                duration: 5000,
              });
            }
          }
        }
        
        setUser(authData.user);
        if (authData.tenant_info) {
          setTenant(authData.tenant_info);
        }
        
        // Resetar flag após primeira verificação
        setJustLoggedIn(false);
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
      const response = await loginJWT(data);
      
      if (response.success) {
        // Mostrar toast de sucesso
        toast.success('Login realizado com sucesso!');
        
        setUser(response.user);
        if (response.user?.tenant) {
          setTenant(response.user.tenant);
        }
        setIsAuthenticated(true);
        
        // Marcar que acabou de fazer login para evitar warning de domínio
        setJustLoggedIn(true);
        
        // Usar redirect_url da API se disponível
        if (response.redirect_url) {
          // Redirecionar para o subdomínio correto
          window.location.href = response.redirect_url;
        } else {
          navigate('/');  // Redirecionar para Home
        }
      } else {
        // Mostrar toast de erro se a API retornar erro
        toast.error(response.message || 'Credenciais inválidas');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      // Mostrar toast de erro
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
      throw error;
    }
  };

  const handleRegister = async (data: RegisterData): Promise<JWTAuthResponse> => {
    try {
      const response = await registerJWT(data);
      
      if (response.success) {
        // Mostrar toast de sucesso
        toast.success('Usuário criado com sucesso! Redirecionando para login...');
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        console.log('❌ Erro no registro:', response.message);
        // Mostrar toast de erro se a API retornar erro
        toast.error(response.message || 'Erro ao criar usuário.');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Registration error:', error);
      // Mostrar toast de erro
      toast.error('Erro ao criar usuário. Tente novamente.');
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutJWT();
      setUser(null);
      setTenant(null);
      setIsAuthenticated(false);
      setJustLoggedIn(false); // Resetar flag
      
      // Mostrar toast de logout
      toast.success('Logout realizado com sucesso!');
      
      // Redirecionar para o domínio principal para evitar conflito de tenants
      const { isSubdomain } = getCurrentTenantInfo();
      if (isSubdomain) {
        window.location.href = 'http://localhost:5173/login';
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Mostrar toast de erro
      toast.error('Erro ao fazer logout.');
      throw error;
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
