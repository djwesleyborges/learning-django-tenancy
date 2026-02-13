from .models import Client, Domain, User

def create_tenant_with_domain(organization_name, user):
    """
    Cria um tenant e domínio automaticamente para um usuário
    """
    # Criar o tenant (Client)
    tenant = Client.objects.create(
        name=organization_name,
        schema_name=organization_name.lower()
    )
    
    # Criar o domínio para o tenant
    domain = Domain.objects.create(
        domain=f"{organization_name.lower()}.localhost",
        tenant=tenant,
        is_primary=True
    )
    
    # Associar usuário ao tenant
    user.tenant = tenant
    user.save()
    
    return tenant, domain

def get_tenant_redirect_url(user):
    """
    Retorna a URL de redirecionamento para o tenant do usuário
    """
    if user.tenant:
        try:
            if user.is_authenticated:
                domain = Domain.objects.get(tenant=user.tenant, is_primary=True)
                return f"http://{domain.domain}:8000/"
            else:
                domain = Domain.objects.get(tenant=user.tenant, is_primary=True)
                return f"http://{domain.domain}:8000/auth/login/"
        except Domain.DoesNotExist:
            return '/auth/login/'
    return '/auth/login/'
