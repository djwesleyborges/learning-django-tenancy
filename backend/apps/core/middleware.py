from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django_tenants.utils import get_tenant
from django_tenants.models import TenantMixin
import logging

logger = logging.getLogger(__name__)

class TenantSubdomainMiddleware(MiddlewareMixin):
    """
    Middleware para garantir que o tenant seja identificado corretamente pelo subdomínio
    e validar o acesso do usuário ao tenant
    """
    
    def process_request(self, request):
        # Adicionar informações do tenant ao request para debugging
        host = request.get_host().split(':')[0]  # Remover porta se existir
        
        # Log para debugging
        logger.info(f"🌐 TenantMiddleware: Processing request for host: {host}")
        
        # Permitir login em qualquer contexto (cross-tenant)
        if request.path.startswith('/api/auth/login'):
            logger.info(f"🔓 TenantMiddleware: Login endpoint - allowing cross-tenant access")
            return None
        
        # Verificar se tem tenant no request
        if hasattr(request, 'tenant') and request.tenant:
            logger.info(f"✅ TenantMiddleware: Tenant found: {request.tenant.schema_name}")
        else:
            logger.warning(f"⚠️ TenantMiddleware: No tenant found for host: {host}")
            
        # Adicionar informações do host ao request para uso posterior
        request.tenant_host = host
        
        return None
    
    def process_response(self, request, response):
        # Adicionar headers de debugging
        if hasattr(request, 'tenant') and request.tenant:
            response['X-Tenant-Schema'] = request.tenant.schema_name
            response['X-Tenant-Host'] = getattr(request, 'tenant_host', 'unknown')
        
        return response
