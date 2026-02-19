# API de Autenticação Django Ninja

## Implementação Completa

### 📁 Arquivos Criados/Modificados

1. **`apps/core/api.py`** - Endpoints da API de autenticação
2. **`project/apis.py`** - Configuração do Django Ninja e registro dos routers
3. **`project/settings.py`** - Adicionado Django Ninja às SHARED_APPS
4. **`apps/core/test_api.py`** - Testes completos para todos os endpoints
5. **`apps/core/api_examples.md`** - Documentação de uso da API

### 🔧 Endpoints Disponíveis

#### Base URL: `/api/auth/`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/csrf` | Obtém token CSRF |
| POST | `/login` | Autentica usuário |
| POST | `/register` | Registra novo usuário e tenant |
| POST | `/logout` | Faz logout do usuário |
| GET | `/profile` | Obtém perfil do usuário logado |
| GET | `/check-auth` | Verifica status de autenticação |
| GET | `/tenant-info` | Obtém informações do tenant atual |

### 🏗️ Estrutura dos Dados

#### Login Request
```json
{
  "username": "string",
  "password": "string"
}
```

#### Register Request
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "password_confirm": "string",
  "organization": "string",
  "first_name": "string",
  "last_name": "string"
}
```

#### Auth Response
```json
{
  "success": boolean,
  "message": "string",
  "user": {
    "id": number,
    "username": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "tenant": {
      "id": number,
      "name": "string",
      "schema_name": "string"
    }
  },
  "redirect_url": "string",
  "csrf_token": "string"
}
```

### 🏢 Integração com Tenants

- **Registro Automático**: Ao registrar um usuário, um tenant e domínio são criados automaticamente
- **Redirecionamento**: Login e registro retornam URL de redirecionamento para o subdomínio do tenant
- **Isolamento**: Cada tenant opera em seu próprio schema PostgreSQL
- **Domínio**: Formato automatico: `{organization_lowercase}.localhost`

### ✅ Testes

Todos os endpoints possuem testes automatizados cobrindo:

- ✅ Token CSRF
- ✅ Registro de usuário
- ✅ Validação de senhas
- ✅ Duplicidade de username/email
- ✅ Login com credenciais válidas
- ✅ Login com credenciais inválidas
- ✅ Verificação de autenticação
- ✅ Informações do tenant
- ✅ Logout

### 🚀 Como Usar

1. **Iniciar o servidor**:
   ```bash
   python manage.py runserver
   ```

2. **Acessar a documentação**:
   - OpenAPI JSON: `http://localhost:8000/api/openapi.json`
   - Documentação interativa: `http://localhost:8000/api/docs`

3. **Exemplo de uso com JavaScript**:
   ```javascript
   // Obter token CSRF
   const csrfResponse = await fetch('/api/auth/csrf');
   const { csrf_token } = await csrfResponse.json();
   
   // Registrar usuário
   const registerResponse = await fetch('/api/auth/register', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-CSRFToken': csrf_token
     },
     credentials: 'include',
     body: JSON.stringify({
       username: 'usuario',
       email: 'usuario@email.com',
       password: 'senha123',
       password_confirm: 'senha123',
       organization: 'Minha Empresa'
     })
   });
   ```

### 🔒 Segurança

- **CSRF Protection**: Todos os endpoints POST requerem token CSRF
- **Session Authentication**: Usa sessões do Django para manter autenticação
- **Password Validation**: Validação de força de senha do Django
- **Tenant Isolation**: Isolamento completo de dados entre tenants

### 📝 Próximos Passos

1. Implementar autenticação via JWT/Bearer Token
2. Adicionar endpoints de recuperação de senha
3. Implementar verificação de e-mail
4. Adicionar rate limiting
5. Implementar logging de auditoria

### 🧪 Executar Testes

```bash
# Executar todos os testes da API
python manage.py test apps.core.test_api

# Executar teste específico
python manage.py test apps.core.test_api.AuthenticationAPITestCase.test_register_user
```
