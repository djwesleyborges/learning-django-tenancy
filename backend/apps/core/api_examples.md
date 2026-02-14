# Django Ninja API - Endpoints de Autenticação

## Base URL
```
http://localhost:8000/api/auth/
```

## Endpoints Disponíveis

### 1. Obter Token CSRF
**GET** `/csrf`

Retorna o token CSRF necessário para requisições POST.

**Response:**
```json
{
  "csrf_token": "abc123..."
}
```

### 2. Login
**POST** `/login`

**Body:**
```json
{
  "username": "usuario",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@email.com",
    "first_name": "Nome",
    "last_name": "Sobrenome",
    "tenant": {
      "id": 1,
      "name": "Nome da Organização",
      "schema_name": "tenant_schema"
    }
  },
  "redirect_url": "http://tenant.localhost:8000/",
  "csrf_token": "abc123..."
}
```

### 3. Registro
**POST** `/register`

**Body:**
```json
{
  "username": "novousuario",
  "email": "novo@email.com",
  "password": "senha123",
  "password_confirm": "senha123",
  "organization": "Nome da Empresa",
  "first_name": "Nome",
  "last_name": "Sobrenome"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "user": {
    "id": 2,
    "username": "novousuario",
    "email": "novo@email.com",
    "first_name": "Nome",
    "last_name": "Sobrenome",
    "tenant": {
      "id": 2,
      "name": "Nome da Empresa",
      "schema_name": "nome_da_empresa"
    }
  },
  "redirect_url": "http://nome-da-empresa.localhost:8000/",
  "csrf_token": "abc123..."
}
```

### 4. Logout
**POST** `/logout`

**Response:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### 5. Perfil do Usuário
**GET** `/profile`

Requer autenticação.

**Response:**
```json
{
  "id": 1,
  "username": "usuario",
  "email": "usuario@email.com",
  "first_name": "Nome",
  "last_name": "Sobrenome",
  "tenant": {
    "id": 1,
    "name": "Nome da Organização",
    "schema_name": "tenant_schema"
  }
}
```

### 6. Verificar Autenticação
**GET** `/check-auth`

**Response (autenticado):**
```json
{
  "is_authenticated": true,
  "csrf_token": "abc123...",
  "user": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@email.com",
    "first_name": "Nome",
    "last_name": "Sobrenome",
    "tenant": {
      "id": 1,
      "name": "Nome da Organização",
      "schema_name": "tenant_schema"
    }
  },
  "tenant_info": {
    "id": 1,
    "name": "Nome da Organização",
    "schema_name": "tenant_schema",
    "redirect_url": "http://tenant.localhost:8000/"
  }
}
```

**Response (não autenticado):**
```json
{
  "is_authenticated": false,
  "csrf_token": null
}
```

### 7. Informações do Tenant
**GET** `/tenant-info`

Requer autenticação.

**Response (com tenant):**
```json
{
  "has_tenant": true,
  "tenant": {
    "id": 1,
    "name": "Nome da Organização",
    "schema_name": "tenant_schema",
    "created_on": "2024-01-01",
    "redirect_url": "http://tenant.localhost:8000/"
  }
}
```

**Response (sem tenant):**
```json
{
  "has_tenant": false,
  "message": "Usuário não possui tenant associado"
}
```

## Exemplo de Uso com JavaScript/Fetch

```javascript
// Obter token CSRF
async function getCSRFToken() {
  const response = await fetch('/api/auth/csrf');
  const data = await response.json();
  return data.csrf_token;
}

// Login
async function login(username, password) {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (data.success && data.redirect_url) {
    window.location.href = data.redirect_url;
  }
  
  return data;
}

// Registro
async function register(userData) {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  
  if (data.success && data.redirect_url) {
    window.location.href = data.redirect_url;
  }
  
  return data;
}

// Verificar autenticação
async function checkAuth() {
  const response = await fetch('/api/auth/check-auth', {
    credentials: 'include'
  });
  
  return await response.json();
}
```

## Considerações Importantes

1. **CSRF Token**: Todas as requisições POST devem incluir o token CSRF no header `X-CSRFToken`.

2. **Cookies**: Use `credentials: 'include'` nas requisições fetch para incluir cookies de sessão.

3. **Tenants**: O sistema automaticamente cria um tenant e domínio para cada novo usuário registrado.

4. **Redirecionamento**: Após login/registro bem-sucedido, a API retorna a URL de redirecionamento para o subdomínio do tenant.

5. **Autenticação**: Os endpoints de perfil e informações do tenant requerem que o usuário esteja autenticado.
