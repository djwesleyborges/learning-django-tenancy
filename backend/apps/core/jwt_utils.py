import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

def generate_jwt_token(user):
    """Gera um token JWT para o usuário"""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(hours=24),  # Expira em 24 horas
        'iat': datetime.utcnow(),
        'tenant_id': user.tenant.id if user.tenant else None,
        'tenant_name': user.tenant.name if user.tenant else None,
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

def decode_jwt_token(token):
    """Decodifica um token JWT e retorna o payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_jwt_token(token):
    """Retorna o usuário a partir do token JWT"""
    payload = decode_jwt_token(token)
    if not payload:
        return None
    
    try:
        user = User.objects.select_related('tenant').get(id=payload['user_id'])
        return user
    except User.DoesNotExist:
        return None

class JWTAuth:
    """Classe para autenticação JWT com Django Ninja"""
    
    def __init__(self, header='Authorization', prefix='Bearer'):
        self.header = header
        self.prefix = prefix
    
    def authenticate(self, request, token):
        """Autentica a requisição usando o token JWT"""
        if not token:
            return None
        
        # Remover prefixo "Bearer " se existir
        if self.prefix and token.startswith(f'{self.prefix} '):
            token = token[len(f'{self.prefix} '):]
        
        user = get_user_from_jwt_token(token)
        return user
