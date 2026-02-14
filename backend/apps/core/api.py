from ninja import Router, Schema
from ninja.security import HttpBearer
from typing import Optional, Dict, Any
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.conf import settings
from django_tenants.utils import schema_context
from .models import User, Client
from .utils import create_tenant_with_domain, get_tenant_redirect_url
from .jwt_utils import generate_jwt_token, JWTAuth

router = Router(tags=["Authentication"])


class LoginSchema(Schema):
    username: str
    password: str


class RegisterSchema(Schema):
    username: str
    email: str
    password: str
    password_confirm: str
    organization: str
    first_name: str = ""
    last_name: str = ""


class UserResponseSchema(Schema):
    id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    tenant: Optional[Dict[str, Any]] = None
    
    @staticmethod
    def resolve_tenant(obj):
        # Se o tenant já for um dicionário, retorne-o diretamente
        if isinstance(obj.tenant, dict):
            return obj.tenant
            
        # Se for um objeto tenant, serialize-o
        if hasattr(obj, 'tenant') and obj.tenant and not isinstance(obj.tenant, dict):
            return {
                "id": obj.tenant.id,
                "name": obj.tenant.name,
                "schema_name": obj.tenant.schema_name
            }
        
        # Se chegou aqui com tenant=None, mantenha None (não sobrescreva)
        return obj.tenant if hasattr(obj, 'tenant') else None


class AuthResponseSchema(Schema):
    success: bool
    message: str
    user: Optional[UserResponseSchema] = None
    redirect_url: Optional[str] = None
    csrf_token: Optional[str] = None
    access_token: Optional[str] = None  # Novo campo para JWT


class JWTAuthResponseSchema(Schema):
    """Schema específico para respostas JWT"""
    success: bool
    message: str
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # Tempo em segundos
    user: UserResponseSchema
    redirect_url: Optional[str] = None


class TokenAuth(HttpBearer):
    def authenticate(self, request, token):
        # Implementação simples de autenticação via token
        # Você pode personalizar isso conforme necessário
        try:
            user = User.objects.get(auth_token=token)
            return user
        except User.DoesNotExist:
            return None


@router.get("/csrf", response=dict)
def get_csrf_token(request):
    """Endpoint para obter token CSRF"""
    return {
        "csrf_token": get_token(request)
    }


@router.post("/login", response=AuthResponseSchema)
def login_endpoint(request, payload: LoginSchema):
    """Endpoint de login (session-based)"""
    try:
        user = authenticate(
            username=payload.username,
            password=payload.password
        )

        if user is not None:
            login(request, user)

            # Recarregar usuário com o tenant para garantir que o relacionamento seja carregado
            user = User.objects.select_related('tenant').get(id=user.id)

            # Determinar URL de redirecionamento para o frontend
            redirect_url = None
            if user.tenant:
                redirect_url = get_tenant_redirect_url(user, for_api=True)
            return AuthResponseSchema(
                success=True,
                message="Login realizado com sucesso",
                user=UserResponseSchema.from_orm(user),
                redirect_url=redirect_url,
                csrf_token=get_token(request)
            )
        else:
            return AuthResponseSchema(
                success=False,
                message="Credenciais inválidas"
            )

    except Exception as e:
        return AuthResponseSchema(
            success=False,
            message=f"Erro ao realizar login: {str(e)}"
        )


@router.post("/login-jwt", response=JWTAuthResponseSchema)
def login_jwt_endpoint(request, payload: LoginSchema):
    """Endpoint de login JWT (recomendado para APIs)"""
    try:
        user = authenticate(
            username=payload.username,
            password=payload.password
        )
        
        if user is not None:
            # Recarregar usuário com o tenant para garantir que o relacionamento seja carregado
            user = User.objects.select_related('tenant').get(id=user.id)
            
            # Gerar token JWT
            access_token = generate_jwt_token(user)
            
            # Determinar URL de redirecionamento para o frontend
            redirect_url = None
            if user.tenant:
                redirect_url = get_tenant_redirect_url(user, for_api=True)
            
            return JWTAuthResponseSchema(
                success=True,
                message="Login realizado com sucesso",
                access_token=access_token,
                expires_in=86400,  # 24 horas em segundos
                user=UserResponseSchema.from_orm(user),
                redirect_url=redirect_url
            )
        else:
            return JWTAuthResponseSchema(
                success=False,
                message="Credenciais inválidas",
                access_token="",
                expires_in=0,
                user=None
            )
            
    except Exception as e:
        return JWTAuthResponseSchema(
            success=False,
            message=f"Erro ao realizar login: {str(e)}",
            access_token="",
            expires_in=0,
            user=None
        )


@router.post("/register", response=AuthResponseSchema)
def register_endpoint(request, payload: RegisterSchema):
    """Endpoint de registro"""
    try:
        # Validar senhas
        if payload.password != payload.password_confirm:
            return AuthResponseSchema(
                success=False,
                message="As senhas não coincidem"
            )
        
        # Verificar se usuário já existe
        if User.objects.filter(username=payload.username).exists():
            return AuthResponseSchema(
                success=False,
                message="Nome de usuário já existe"
            )
        
        if User.objects.filter(email=payload.email).exists():
            return AuthResponseSchema(
                success=False,
                message="E-mail já está em uso"
            )
        
        # Criar tenant e domínio no schema public
        with schema_context('public'):
            # Criar usuário
            user = User.objects.create_user(
                username=payload.username,
                email=payload.email,
                password=payload.password,
                first_name=payload.first_name,
                last_name=payload.last_name
            )
            
            # Criar tenant e domínio
            tenant, domain = create_tenant_with_domain(
                payload.organization,
                user
            )
        
        # Autenticar usuário após registro
        login(request, user)
        
        # Recarregar usuário com o tenant para garantir que o relacionamento seja carregado
        user = User.objects.select_related('tenant').get(id=user.id)
        
        # Determinar URL de redirecionamento para o frontend
        redirect_url = get_tenant_redirect_url(user, for_api=True)
        
        return AuthResponseSchema(
            success=True,
            message="Usuário registrado com sucesso",
            user=UserResponseSchema.from_orm(user),
            redirect_url=redirect_url,
            csrf_token=get_token(request)
        )
        
    except Exception as e:
        return AuthResponseSchema(
            success=False,
            message=f"Erro ao registrar usuário: {str(e)}"
        )


@router.post("/register-jwt", response=JWTAuthResponseSchema)
def register_jwt_endpoint(request, payload: RegisterSchema):
    """Endpoint de registro JWT (recomendado para APIs)"""
    try:
        # Validar senhas
        if payload.password != payload.password_confirm:
            return JWTAuthResponseSchema(
                success=False,
                message="As senhas não coincidem",
                access_token="",
                expires_in=0
            )
        
        # Verificar se usuário já existe
        if User.objects.filter(username=payload.username).exists():
            return JWTAuthResponseSchema(
                success=False,
                message="Nome de usuário já existe",
                access_token="",
                expires_in=0
            )
        
        if User.objects.filter(email=payload.email).exists():
            return JWTAuthResponseSchema(
                success=False,
                message="E-mail já está em uso",
                access_token="",
                expires_in=0
            )
        
        # Criar tenant e domínio no schema public
        with schema_context('public'):
            # Criar usuário
            user = User.objects.create_user(
                username=payload.username,
                email=payload.email,
                password=payload.password,
                first_name=payload.first_name,
                last_name=payload.last_name
            )
            
            # Criar tenant e domínio
            tenant, domain = create_tenant_with_domain(
                payload.organization,
                user
            )
        
        # Recarregar usuário com o tenant para garantir que o relacionamento seja carregado
        user = User.objects.select_related('tenant').get(id=user.id)
        
        return JWTAuthResponseSchema(
            success=True,
            message="Usuário criado com sucesso! Faça login para continuar.",
            access_token="",  # Não gerar token no registro
            expires_in=0,
            user=UserResponseSchema.from_orm(user),
            redirect_url="/login"  # Redirecionar para login
        )
        
    except Exception as e:
        return JWTAuthResponseSchema(
            success=False,
            message=f"Erro ao registrar usuário: {str(e)}",
            access_token="",
            expires_in=0
        )


@router.post("/logout", response=dict)
def logout_endpoint(request):
    """Endpoint de logout"""
    try:
        logout(request)
        return {
            "success": True,
            "message": "Logout realizado com sucesso"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro ao realizar logout: {str(e)}"
        }


# Criar instância do autenticador JWT
jwt_auth = JWTAuth()


@router.get("/profile-jwt", response=UserResponseSchema, auth=jwt_auth)
def get_profile_jwt(request):
    """Endpoint para obter perfil do usuário logado via JWT"""
    return UserResponseSchema.from_orm(request.auth)


@router.get("/check-auth-jwt", response=dict, auth=jwt_auth)
def check_authentication_jwt(request):
    """Endpoint para verificar se usuário está autenticado via JWT"""
    user = request.auth
    
    response_data = {
        "is_authenticated": True,
        "user": UserResponseSchema.from_orm(user).dict()
    }
    
    # Adicionar informações do tenant
    if user.tenant:
        response_data["tenant_info"] = {
            "id": user.tenant.id,
            "name": user.tenant.name,
            "schema_name": user.tenant.schema_name,
            "redirect_url": get_tenant_redirect_url(user, for_api=True)
        }
    
    return response_data


@router.get("/tenant-info-jwt", response=dict, auth=jwt_auth)
def get_tenant_info_jwt(request):
    """Endpoint para obter informações do tenant atual via JWT"""
    user = request.auth
    
    if not user.tenant:
        return {
            "has_tenant": False,
            "message": "Usuário não possui tenant associado"
        }
    
    return {
        "has_tenant": True,
        "tenant": {
            "id": user.tenant.id,
            "name": user.tenant.name,
            "schema_name": user.tenant.schema_name,
            "created_on": user.tenant.created_on,
            "redirect_url": get_tenant_redirect_url(user, for_api=True)
        }
    }


@router.post("/logout-jwt", response=dict)
def logout_jwt_endpoint(request):
    """Endpoint de logout JWT (stateless - apenas informativo)"""
    return {
        "success": True,
        "message": "Logout realizado com sucesso"
    }
