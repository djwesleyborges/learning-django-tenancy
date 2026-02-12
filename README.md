# Django Tenancy - Sistema Multi-Tenant

Este é um projeto Django implementando arquitetura multi-tenant utilizando o pacote `django-tenants`. A aplicação demonstra como criar um sistema onde múltiplos clientes (tenants) compartilham a mesma instância da aplicação, mas com dados completamente isolados através de schemas separados no PostgreSQL.

## 🏗️ Arquitetura

### Estrutura Multi-Tenant
- **Schemas Isolados**: Cada tenant possui seu próprio schema no banco de dados
- **Domínios Separados**: Cada tenant pode ter seu próprio domínio/subdomínio
- **Apps Compartilhados vs Específicos**: Separação entre apps globais e apps específicos dos tenants

### Apps Implementados

#### `apps.core` (Compartilhado)
- **Client**: Modelo principal que representa o tenant
- **Domain**: Gerencia domínios para cada tenant
- **User**: Modelo de usuário customizado com vínculo ao tenant

#### `apps.tasks` (Específico do Tenant)
- **Project**: Gerenciamento de projetos por tenant
- **Task**: Tarefas vinculadas a projetos

## 🚀 Tecnologias Utilizadas

- **Django 5.2.11**: Framework web principal
- **django-tenants**: Implementação de multi-tenancy
- **PostgreSQL**: Banco de dados com suporte a schemas
- **Docker Compose**: Orquestração de containers
- **django-environ**: Gestão de variáveis de ambiente
- **django-extensions**: Extensões de desenvolvimento

## 📋 Pré-requisitos

- Python 3.12+
- Docker e Docker Compose
- PostgreSQL (caso não use Docker)

## 🔧 Configuração

### 1. Variáveis de Ambiente
Copie o arquivo `.env` e ajuste as configurações:

```bash
# Banco de dados
DB_HOST=localhost
DB_USER=django_tenancy
DB_PASSWORD=password
DB_NAME=django_tenancy
DB_PORT=5432

# Django
SECRET_KEY=sua-chave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,.localhost
```

### 2. Banco de dados com Docker
```bash
docker-compose up -d db
```

### 3. Instalação de Dependências
```bash
pip install -r requirements.txt
# ou com poetry (se configurado)
poetry install
```

### 4. Migrações Iniciais
```bash
# Migrações do schema público
python manage.py migrate_schemas --shared

# Criar superusuário
python manage.py createsuperuser

# Migrações dos tenants
python manage.py migrate_schemas
```

## 🏃‍♂️ Executando a Aplicação

```bash
python manage.py runserver
```

A aplicação estará disponível em `http://localhost:8000`

## 📚 Funcionalidades

### Gestão de Tenants
- Criação automática de schemas para novos tenants
- Gerenciamento de domínios por tenant
- Isolamento completo de dados

### Sistema de Usuários
- Usuários vinculados a tenants específicos
- Autenticação isolada por tenant
- Permissões específicas do schema

### Gestão de Projetos e Tarefas
- Cada tenant gerencia seus próprios projetos
- Tarefas vinculadas a projetos
- Dados completamente isolados entre tenants

## 🗂️ Estrutura do Projeto

```
learning-django-tenancy/
├── apps/
│   ├── core/                 # App compartilhado (usuários, tenants)
│   │   ├── models.py         # Client, Domain, User
│   │   ├── views.py          # Views principais
│   │   └── templates/        # Templates compartilhados
│   └── tasks/                # App específico do tenant
│       ├── models.py         # Project, Task
│       ├── views.py          # Views de projetos/tarefas
│       └── templates/        # Templates específicos
├── project/                  # Configurações do Django
│   ├── settings.py           # Configurações com suporte a tenants
│   ├── urls.py              # URLs principais
│   └── tenants.py           # Configurações de tenants (se existir)
├── docker-compose.yml        # Configuração do PostgreSQL
├── .env                     # Variáveis de ambiente
├── manage.py                # Script de gerenciamento Django
└── pyproject.toml           # Dependências do projeto
```

## 🔄 Comandos Úteis

### Gerenciamento de Tenants
```bash
# Criar novo tenant
python manage.py create_tenant

# Listar tenants
python manage.py list_tenants

# Migrações específicas
python manage.py migrate_schemas --shared    # Apps compartilhados
python manage.py migrate_schemas             # Apps dos tenants
```

### Desenvolvimento
```bash
# Shell com tenant específico
python manage.py shell_tenant

# Servidor de desenvolvimento
python manage.py runserver

# Coletar static files
python manage.py collectstatic
```

## 🎯 Conceitos Importantes

### Apps Compartilhados vs Apps de Tenants
- **SHARED_APPS**: Apps disponíveis globalmente (admin, auth, core)
- **TENANT_APPS**: Apps específicos para cada tenant (tasks)

### Middleware de Tenant
O `TenantMainMiddleware` identifica automaticamente o tenant baseado no domínio/subdomínio da requisição.

### Isolamento de Dados
Cada tenant possui seu próprio schema PostgreSQL, garantindo isolamento completo dos dados.

## 🔍 Exemplo de Uso

1. **Criar Tenant**:
   - Acesse o admin Django
   - Crie um novo `Client`
   - Adicione um `Domain` para o client

2. **Acessar Tenant**:
   - Configure o domínio local (ex: tenant1.localhost)
   - Acesse a aplicação através do domínio do tenant
   - Os dados serão automaticamente isolados

## 🤝 Contribuição

Este é um projeto de aprendizado demonstrando implementação de multi-tenancy em Django. Sinta-se à vontade para contribuir ou adaptar conforme suas necessidades.

## 📝 Licença

Este projeto é para fins educacionais.
