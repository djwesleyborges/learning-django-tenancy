from ninja import NinjaAPI

from apps.core.api import router as auth_router


api = NinjaAPI(
    title="Django Tenancy API",
    version="1.0.0"
)

api.add_router("/auth/", auth_router)
