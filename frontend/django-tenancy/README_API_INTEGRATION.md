# Integração Frontend com API Django Ninja

## 📁 Estrutura de Arquivos

```
src/
├── utils/
│   └── api.ts              # Utilitários da API
├── hooks/
│   └── useAuth.ts          # Hook de autenticação
├── components/
│   └── ProtectedRoute.tsx  # Componente de rota protegida
├── pages/
│   ├── Login.tsx           # Página de login atualizada
│   └── Register.tsx        # Página de registro atualizada
└── App.example.tsx         # Exemplo de configuração do App
```

## 🔧 Configuração

### 1. Instalar dependências

```bash
npm install react-router-dom
# ou
yarn add react-router-dom
```

### 2. Configurar o App.tsx

Use o arquivo `App.example.tsx` como referência:

```tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/projects" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
```

## 🚀 Funcionalidades Implementadas

### ✅ Autenticação Completa

- **Login**: Autenticação com CSRF token
- **Registro**: Criação automática de tenant
- **Logout**: Encerramento de sessão
- **Verificação**: Status de autenticação em tempo real

### ✅ Gestão de Tenants

- **Redirecionamento Automático**: Após login/registro
- **Isolamento**: Cada usuário em seu próprio tenant
- **Informações**: Dados do tenant disponíveis globalmente

### ✅ Estados de Loading

- **Botões**: Indicadores visuais durante requisições
- **Páginas**: Loading states para melhor UX
- **Erros**: Tratamento amigável de falhas

## 📚 Uso dos Hooks

### useAuth Hook

```tsx
import { useAuth } from '../hooks/useAuth';

const MyComponent = () => {
  const { 
    user, 
    tenant, 
    isAuthenticated, 
    isLoading, 
    login, 
    register, 
    logout 
  } = useAuth();

  // Exemplo de logout
  const handleLogout = async () => {
    await logout();
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.username}!</p>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
};
```

### ProtectedRoute Component

```tsx
import ProtectedRoute from '../components/ProtectedRoute';

// Rota protegida
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### useRequireAuth Hook

```tsx
import { useRequireAuth } from '../hooks/useAuth';

const ProtectedPage = () => {
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading) return <div>Loading...</div>;
  
  // Componente só renderiza se estiver autenticado
  return <div>Protected content</div>;
};
```

## 🔌 Endpoints da API

### Base URL: `http://localhost:8000/api/auth`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/csrf` | Token CSRF |
| POST | `/login` | Login |
| POST | `/register` | Registro |
| POST | `/logout` | Logout |
| GET | `/profile` | Perfil |
| GET | `/check-auth` | Verificar auth |
| GET | `/tenant-info` | Info tenant |

## 🛡️ Segurança

- **CSRF Protection**: Token obrigatório para POST
- **Session Management**: Cookies seguros
- **Type Safety**: TypeScript em toda a aplicação
- **Error Handling**: Tratamento robusto de erros

## 🔄 Fluxo de Autenticação

### 1. Login
```
Usuário preenche formulário → 
Obter CSRF token → 
Enviar credenciais → 
API autentica → 
Redirecionar para tenant
```

### 2. Registro
```
Usuário preenche formulário → 
Obter CSRF token → 
Enviar dados → 
API cria usuário + tenant → 
Redirecionar para novo tenant
```

### 3. Acesso Protegido
```
Usuário acessa rota → 
AuthProvider verifica sessão → 
Se autenticado: mostra conteúdo → 
Se não: redireciona para login
```

## 🎨 Componentes UI

### Estados dos Botões

```tsx
// Login
<button disabled={isLoading}>
  {isLoading ? 'Signing in...' : 'Sign in'}
</button>

// Registro
<button disabled={isLoading}>
  {isLoading ? 'Creating account...' : 'Sign up'}
</button>
```

### Mensagens de Erro

```tsx
{error && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
)}
```

## 🧪 Testes

### Testar Login Manual

```javascript
// No console do navegador
import { login } from './utils/api';

login({
  username: 'testuser',
  password: 'testpass'
}).then(response => {
  console.log('Login response:', response);
});
```

### Testar Registro Manual

```javascript
import { register } from './utils/api';

register({
  username: 'newuser',
  email: 'newuser@test.com',
  password: 'newpass123',
  password_confirm: 'newpass123',
  organization: 'Test Company'
}).then(response => {
  console.log('Register response:', response);
});
```

## 🔧 Configuração de Desenvolvimento

### CORS no Backend

Certifique-se que o backend está configurado para permitir CORS:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://localhost:5173",  # Vite dev server
]
```

### Variáveis de Ambiente

```bash
# .env.local
REACT_APP_API_URL=http://localhost:8000
```

## 🚀 Deploy

### Produção

1. Atualizar `API_BASE_URL` em `utils/api.ts`
2. Configurar CORS para domínio de produção
3. Configurar HTTPS (obrigatório para cookies seguros)
4. Testar fluxo completo de autenticação

### Considerações

- **Cookies**: Requerem HTTPS em produção
- **CSRF**: Necessário para segurança
- **Tenants**: Cada tenant terá seu próprio subdomínio
- **Sessões**: Configurar tempo de expiração adequado

## 🐛 Troubleshooting

### Problemas Comuns

1. **CORS Error**: Verificar configuração no backend
2. **CSRF Error**: Obter token antes de requisições POST
3. **404 Errors**: Verificar se backend está rodando
4. **Redirect Loop**: Verificar configuração de rotas

### Debug

```tsx
// Adicionar logs para debug
console.log('Auth state:', { user, tenant, isAuthenticated });
console.log('API response:', response);
```

## 📝 Próximos Passos

1. **Formulários**: Adicionar validações mais robustas
2. **UI/UX**: Melhorar feedback visual
3. **Testes**: Implementar testes unitários
4. **Performance**: Otimizar requisições
5. **Offline**: Implementar cache local
