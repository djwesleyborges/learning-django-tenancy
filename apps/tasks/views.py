from django.shortcuts import render
from .models import Project

def project_list(request):
    projects = Project.objects.all().prefetch_related('tasks')
    context = {'projects': projects}
    return render(request, 'project_list.html', context)