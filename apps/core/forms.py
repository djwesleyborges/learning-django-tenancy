from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    organization = forms.CharField(
        max_length=100, 
        required=True,
        help_text="Nome da organização (será usado como subdomínio)"
    )
    
    class Meta:
        model = User
        fields = ("username", "email", "organization", "password1", "password2")
    
    def clean_organization(self):
        organization = self.cleaned_data.get('organization')
        # Converter para lowercase e remover caracteres especiais
        import re
        organization = re.sub(r'[^a-zA-Z0-9]', '', organization.lower())
        return organization
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user

class CustomAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Usuário'})
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Senha'})
    )
