from django.urls import path
from apps.core.views import tenant_home

app_name = 'tasks'

urlpatterns = [
    path('', tenant_home, name='tenant_home'),
]
