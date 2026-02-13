from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .models import Project
from .forms import ProjectForm

@login_required
def project_list(request):
    projects = Project.objects.all().prefetch_related('tasks')
    context = {'projects': projects}
    return render(request, 'project_list.html', context)

@login_required
def project_create(request):
    if request.method == 'POST':
        form = ProjectForm(request.POST or None)
        if form.is_valid():
            form.save()
            return redirect('tasks:project_list')
    else:
        form = ProjectForm()
    return render(request, 'project_create.html', {'form': form})
