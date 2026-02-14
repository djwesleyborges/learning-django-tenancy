"""
Testes para os endpoints da API de autenticação
"""
from django.test import TestCase, Client as TestClient, override_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from apps.core.models import Client, Domain

User = get_user_model()


@override_settings(
    ALLOWED_HOSTS=['testserver', 'localhost', '127.0.0.1'],
    MIDDLEWARE=[
        'corsheaders.middleware.CorsMiddleware',
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]
)
class AuthenticationAPITestCase(TestCase):
    def setUp(self):
        self.test_client = TestClient()
        self.api_base_url = '/api/auth'
        
        # Dados de teste
        self.test_user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'organization': 'Test Organization',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        self.login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }

    def test_get_csrf_token(self):
        """Testa obtenção do token CSRF"""
        response = self.test_client.get(f'{self.api_base_url}/csrf')
        self.assertEqual(response.status_code, 200)
        self.assertIn('csrf_token', response.json())

    def test_register_user(self):
        """Testa registro de novo usuário"""
        response = self.test_client.post(
            f'{self.api_base_url}/register',
            self.test_user_data,
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'Usuário registrado com sucesso')
        self.assertIsNotNone(data['user'])
        self.assertIsNotNone(data['redirect_url'])
        
        # Verificar se usuário foi criado
        user = User.objects.get(username='testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertIsNotNone(user.tenant)
        
        # Verificar se tenant foi criado
        tenant = Client.objects.get(name='Test Organization')
        self.assertEqual(tenant.schema_name, 'test organization')
        
        # Verificar se domínio foi criado
        domain = Domain.objects.get(tenant=tenant)
        self.assertEqual(domain.domain, 'test organization.localhost')

    def test_register_password_mismatch(self):
        """Testa registro com senhas diferentes"""
        invalid_data = self.test_user_data.copy()
        invalid_data['password_confirm'] = 'differentpass'
        
        response = self.test_client.post(
            f'{self.api_base_url}/register',
            invalid_data,
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'As senhas não coincidem')

    def test_register_duplicate_username(self):
        """Testa registro com username duplicado"""
        # Criar usuário primeiro
        User.objects.create_user(
            username='testuser',
            email='existing@example.com',
            password='existingpass'
        )
        
        response = self.test_client.post(
            f'{self.api_base_url}/register',
            self.test_user_data,
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Nome de usuário já existe')

    def test_login_success(self):
        """Testa login bem-sucedido"""
        # Criar usuário primeiro
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Criar tenant para o usuário
        tenant = Client.objects.create(
            name='Test Org',
            schema_name='test_org'
        )
        Domain.objects.create(
            domain='testorg.localhost',
            tenant=tenant,
            is_primary=True
        )
        user.tenant = tenant
        user.save()
        
        response = self.test_client.post(
            f'{self.api_base_url}/login',
            self.login_data,
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'Login realizado com sucesso')
        self.assertIsNotNone(data['user'])
        self.assertIsNotNone(data['redirect_url'])

    def test_login_invalid_credentials(self):
        """Testa login com credenciais inválidas"""
        invalid_data = {
            'username': 'testuser',
            'password': 'wrongpass'
        }
        
        response = self.test_client.post(
            f'{self.api_base_url}/login',
            invalid_data,
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['success'])
        self.assertEqual(data['message'], 'Credenciais inválidas')

    def test_check_auth_unauthenticated(self):
        """Testa verificação de autenticação sem estar logado"""
        response = self.test_client.get(f'{self.api_base_url}/check-auth')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data['is_authenticated'])
        self.assertIsNone(data['csrf_token'])

    def test_check_auth_authenticated(self):
        """Testa verificação de autenticação estando logado"""
        # Criar e logar usuário
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        tenant = Client.objects.create(
            name='Test Org',
            schema_name='test_org'
        )
        Domain.objects.create(
            domain='testorg.localhost',
            tenant=tenant,
            is_primary=True
        )
        user.tenant = tenant
        user.save()
        
        self.test_client.login(username='testuser', password='testpass123')
        
        response = self.test_client.get(f'{self.api_base_url}/check-auth')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['is_authenticated'])
        self.assertIsNotNone(data['user'])

    def test_tenant_info_unauthenticated(self):
        """Testa endpoint de tenant info sem autenticação"""
        response = self.test_client.get(f'{self.api_base_url}/tenant-info')
        self.assertEqual(response.status_code, 401)

    def test_tenant_info_authenticated(self):
        """Testa endpoint de tenant info com autenticação"""
        # Criar e logar usuário com tenant
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        tenant = Client.objects.create(
            name='Test Org',
            schema_name='test_org'
        )
        Domain.objects.create(
            domain='testorg.localhost',
            tenant=tenant,
            is_primary=True
        )
        user.tenant = tenant
        user.save()
        
        self.test_client.login(username='testuser', password='testpass123')
        
        response = self.test_client.get(f'{self.api_base_url}/tenant-info')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['has_tenant'])

def test_logout(self):
    """Testa logout"""
    response = self.test_client.post(f'{self.api_base_url}logout')
    
    self.assertEqual(response.status_code, 200)
    data = response.json()
    self.assertTrue(data['success'])
    self.assertEqual(data['message'], 'Logout realizado com sucesso')
