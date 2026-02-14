from ninja import NinjaAPI

from apps.core.api import router as auth_router
from apps.tasks.api import router as tasks_router


api = NinjaAPI(
    title="Django Tenancy API",
    version="1.0.0"
)

api.add_router("/auth/", auth_router)
api.add_router("/", tasks_router)
