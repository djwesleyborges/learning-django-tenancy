from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    path('', views.project_list, name='project_list'),
    path('create/', views.project_create, name='project_create'),
]
