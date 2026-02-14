from ninja import Router, Schema
from ninja.security import HttpBearer
from django.db.models import Prefetch
from .models import Project, Task
from apps.core.jwt_utils import JWTAuth

router = Router(tags=["Projects", "Tasks"])

# Schemas
class TaskSchema(Schema):
    id: int
    name: str
    description: str
    created_at: str
    updated_at: str

class ProjectSchema(Schema):
    id: int
    name: str
    description: str
    is_completed: bool
    created_at: str
    updated_at: str
    tasks: list[TaskSchema] = []

class ProjectCreateSchema(Schema):
    name: str
    description: str
    is_completed: bool = False

class ProjectUpdateSchema(Schema):
    name: str = None
    description: str = None
    is_completed: bool = None

# Autenticação JWT
jwt_auth = JWTAuth()

@router.get("/projects", response=list[ProjectSchema], auth=jwt_auth)
def list_projects(request):
    """Listar todos os projetos do usuário logado"""
    print(f"🔍 DEBUG: list_projects called (with auth)")
    print(f"🔍 DEBUG: authenticated user: {request.auth}")
    print(f"🔍 DEBUG: current schema: {request.tenant.schema_name if hasattr(request, 'tenant') else 'No tenant'}")
    print(f"🔍 DEBUG: connection schema: {request.tenant.schema_name if hasattr(request, 'tenant') else 'No tenant'}")
    
    # Em um sistema multi-tenant, cada schema tem seus próprios projetos
    # Não precisa filtrar por usuário, pois o schema já segrega os dados corretos
    projects = Project.objects.all().prefetch_related(
        Prefetch('tasks', queryset=Task.objects.all())
    )
    
    print(f"🔍 DEBUG: found {projects.count()} projects in schema")
    
    return [
        ProjectSchema(
            id=project.id,
            name=project.name,
            description=project.description,
            is_completed=project.is_completed,
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat(),
            tasks=[
                TaskSchema(
                    id=task.id,
                    name=task.name,
                    description=task.description,
                    created_at=task.created_at.isoformat(),
                    updated_at=task.updated_at.isoformat()
                )
                for task in project.tasks.all()
            ]
        )
        for project in projects
    ]

@router.get("/projects/{project_id}", response=ProjectSchema, auth=jwt_auth)
def get_project(request, project_id: int):
    """Obter um projeto específico"""
    try:
        project = Project.objects.get(id=project_id)
        return ProjectSchema(
            id=project.id,
            name=project.name,
            description=project.description,
            is_completed=project.is_completed,
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat(),
            tasks=[
                TaskSchema(
                    id=task.id,
                    name=task.name,
                    description=task.description,
                    created_at=task.created_at.isoformat(),
                    updated_at=task.updated_at.isoformat()
                )
                for task in project.tasks.all()
            ]
        )
    except Project.DoesNotExist:
        return {"error": "Project not found"}, 404

@router.post("/projects", response=ProjectSchema, auth=jwt_auth)
def create_project(request, payload: ProjectCreateSchema):
    """Criar um novo projeto"""
    print(f"🔍 DEBUG: create_project called")
    print(f"🔍 DEBUG: authenticated user: {request.auth}")
    print(f"🔍 DEBUG: current schema: {request.tenant.schema_name if hasattr(request, 'tenant') else 'No tenant'}")
    print(f"🔍 DEBUG: connection schema: {request.tenant.schema_name if hasattr(request, 'tenant') else 'No tenant'}")
    print(f"🔍 DEBUG: payload: {payload}")

    project = Project.objects.create(
        name=payload.name,
        description=payload.description,
        is_completed=payload.is_completed
    )
    
    print(f"🔍 DEBUG: project created with id: {project.id}")
    
    return ProjectSchema(
        id=project.id,
        name=project.name,
        description=project.description,
        is_completed=project.is_completed,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat(),
        tasks=[]
    )

@router.put("/projects/{project_id}", response=ProjectSchema, auth=jwt_auth)
def update_project(request, project_id: int, payload: ProjectUpdateSchema):
    """Atualizar um projeto"""
    try:
        project = Project.objects.get(id=project_id)
        
        if payload.name is not None:
            project.name = payload.name
        if payload.description is not None:
            project.description = payload.description
        if payload.is_completed is not None:
            project.is_completed = payload.is_completed
            
        project.save()
        
        return ProjectSchema(
            id=project.id,
            name=project.name,
            description=project.description,
            is_completed=project.is_completed,
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat(),
            tasks=[
                TaskSchema(
                    id=task.id,
                    name=task.name,
                    description=task.description,
                    created_at=task.created_at.isoformat(),
                    updated_at=task.updated_at.isoformat()
                )
                for task in project.tasks.all()
            ]
        )
    except Project.DoesNotExist:
        return {"error": "Project not found"}, 404

@router.delete("/projects/{project_id}", auth=jwt_auth)
def delete_project(request, project_id: int):
    """Excluir um projeto"""
    try:
        project = Project.objects.get(id=project_id)
        project.delete()
        return {"success": True, "message": "Project deleted successfully"}
    except Project.DoesNotExist:
        return {"error": "Project not found"}, 404

# Tasks endpoints
@router.get("/projects/{project_id}/tasks", response=list[TaskSchema], auth=jwt_auth)
def list_project_tasks(request, project_id: int):
    """Listar tarefas de um projeto"""
    try:
        project = Project.objects.get(id=project_id)
        tasks = project.tasks.all()
        
        return [
            TaskSchema(
                id=task.id,
                name=task.name,
                description=task.description,
                created_at=task.created_at.isoformat(),
                updated_at=task.updated_at.isoformat()
            )
            for task in tasks
        ]
    except Project.DoesNotExist:
        return {"error": "Project not found"}, 404
