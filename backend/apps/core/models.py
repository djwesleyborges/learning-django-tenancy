from django.contrib.auth.models import AbstractUser
from django.db import models
from django_tenants.models import TenantMixin, DomainMixin

class Client(TenantMixin):
    name = models.CharField(max_length=100)
    created_on = models.DateField(auto_now_add=True)

    # default true, schema will be automatically created and synced when it is saved
    auto_create_schema = True

class Domain(DomainMixin):
    pass


class User(AbstractUser):
    tenant = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.tenant.name if self.tenant else 'Sem Tenant'})"