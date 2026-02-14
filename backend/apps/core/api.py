from ninja import Router, Schema
from ninja.security import HttpBearer
from typing import Optional, Dict, Any
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from django.middleware.csrf import get_token
from .models import User, Client
from .utils import create_tenant_with_domain, get_tenant_redirect_url

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
        if hasattr(obj, 'tenant') and obj.tenant:
            return {
                "id": obj.tenant.id,
                "name": obj.tenant.name,
                "schema_name": obj.tenant.schema_name
            }
        return None


class AuthResponseSchema(Schema):
    success: bool
    message: str
    user: Optional[UserResponseSchema] = None
    redirect_url: Optional[str] = None
    csrf_token: Optional[str] = None


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
    """Endpoint de login"""
    try:
        user = authenticate(
            username=payload.username,
            password=payload.password
        )
        
        if user is not None:
            login(request, user)
            
            # Determinar URL de redirecionamento
            redirect_url = None
            if user.tenant:
                redirect_url = get_tenant_redirect_url(user)
            
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
        
        # Determinar URL de redirecionamento
        redirect_url = get_tenant_redirect_url(user)
        
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


@router.get("/profile", response=UserResponseSchema)
def get_profile(request):
    """Endpoint para obter perfil do usuário logado"""
    if isinstance(request.user, AnonymousUser):
        return JsonResponse(
            {"error": "Usuário não autenticado"},
            status=401
        )
    
    return UserResponseSchema.from_orm(request.user)


@router.get("/check-auth", response=dict)
def check_authentication(request):
    """Endpoint para verificar se usuário está autenticado"""
    is_authenticated = not isinstance(request.user, AnonymousUser)
    
    response_data = {
        "is_authenticated": is_authenticated,
        "csrf_token": get_token(request) if is_authenticated else None
    }
    
    if is_authenticated:
        response_data["user"] = UserResponseSchema.from_orm(request.user).dict()
        
        # Adicionar informações do tenant
        if request.user.tenant:
            response_data["tenant_info"] = {
                "id": request.user.tenant.id,
                "name": request.user.tenant.name,
                "schema_name": request.user.tenant.schema_name,
                "redirect_url": get_tenant_redirect_url(request.user)
            }
    
    return response_data


@router.get("/tenant-info", response=dict)
def get_tenant_info(request):
    """Endpoint para obter informações do tenant atual"""
    if isinstance(request.user, AnonymousUser):
        return JsonResponse(
            {"error": "Usuário não autenticado"},
            status=401
        )
    
    if not request.user.tenant:
        return {
            "has_tenant": False,
            "message": "Usuário não possui tenant associado"
        }
    
    return {
        "has_tenant": True,
        "tenant": {
            "id": request.user.tenant.id,
            "name": request.user.tenant.name,
            "schema_name": request.user.tenant.schema_name,
            "created_on": request.user.tenant.created_on,
            "redirect_url": get_tenant_redirect_url(request.user)
        }
    }
