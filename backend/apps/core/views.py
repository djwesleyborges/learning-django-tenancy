from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django_tenants.utils import get_tenant
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from .models import User
from .utils import create_tenant_with_domain, get_tenant_redirect_url

def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                
                # Se o usuário tem um tenant, redirecionar para o subdomínio dele
                if user.tenant:
                    redirect_url = get_tenant_redirect_url(user)
                    return redirect(redirect_url)
                else:
                    return redirect('tasks:project_list')
    else:
        form = CustomAuthenticationForm()
    
    return render(request, 'core/login.html', {'form': form})

def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            organization_name = form.cleaned_data.get('organization')
            
            # Criar tenant e domínio automaticamente
            tenant, domain = create_tenant_with_domain(organization_name, user)
            
            # Redirecionar para a página de login do novo tenant
            redirect_url = get_tenant_redirect_url(user)
            return redirect(redirect_url)
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'core/register.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('core:login')

@login_required
def profile_view(request):
    return render(request, 'core/profile.html', {'user': request.user})

def tenant_redirect_view(request):
    """
    View para redirecionar usuários logados para o tenant correto
    """
    if request.user.is_authenticated and request.user.tenant:
        redirect_url = get_tenant_redirect_url(request.user)
        return redirect(redirect_url)
    else:
        return redirect('core:login')