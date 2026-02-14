#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from apps.core.models import Client, Domain, User
from django_tenants.utils import schema_context
from apps.tasks.models import Project

print('=== VERIFICANDO CRIAÇÃO DE SCHEMAS ===')

# Verificar tenants existentes
tenants = Client.objects.all()
print(f'\nTenants existentes: {tenants.count()}')
for tenant in tenants:
    print(f'  - {tenant.name} (schema: {tenant.schema_name})')
    
# Verificar se schemas foram criados no PostgreSQL
print('\n=== VERIFICANDO SE TABELAS EXISTEM NOS SCHEMAS ===')
with schema_context('public'):
    try:
        count = Project.objects.count()
        print(f'Projects em public: {count}')
    except Exception as e:
        print(f'Erro ao acessar projects em public: {e}')

with schema_context('eliza'):
    try:
        count = Project.objects.count()
        print(f'Projects em eliza: {count}')
    except Exception as e:
        print(f'Erro ao acessar projects em eliza: {e}')

print('\n=== VERIFICANDO SE TABELAS FORAM CRIADAS CORRETAMENTE ===')
from django.db import connection

# Verificar tabelas no schema eliza
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'eliza' AND table_name LIKE '%project%'")
        tables = cursor.fetchall()
        print(f'Tabelas com "project" no schema eliza: {tables}')
        
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'eliza'")
        all_tables = cursor.fetchall()
        print(f'Todas as tabelas no schema eliza: {len(all_tables)}')
        for table in all_tables:
            print(f'  - {table[0]}')
except Exception as e:
    print(f'Erro ao verificar tabelas: {e}')

print('\n=== TESTANDO CRIAÇÃO DE PROJETO ===')
with schema_context('eliza'):
    try:
        project = Project.objects.create(
            name='Test Project',
            description='Test Description',
            is_completed=False
        )
        print(f'Projeto criado com sucesso: {project.id} - {project.name}')
        project.delete()
        print('Projeto deletado com sucesso')
    except Exception as e:
        print(f'Erro ao criar projeto: {e}')
