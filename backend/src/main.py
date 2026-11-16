from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError
from src.api.routes import auth, codes
from src.core.config import settings
from src.core.database import close_mongodb, connect_to_mongodb


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None]:
    settings.validate()
    try:
        client, users, codes = connect_to_mongodb()
    except PyMongoError as error:
        raise RuntimeError("Could not initialize MongoDB collections.") from error

    application.state.mongo_client = client
    application.state.users_collection = users
    application.state.codes_collection = codes
    try:
        yield
    finally:
        close_mongodb(client)


app = FastAPI(
    title="Memcode API",
    description="An authenticated library for reusable code snippets.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(codes.router)


@app.get("/health", tags=["Health"])
def health_check(request: Request) -> dict[str, str]:
    try:
        request.app.state.mongo_client.admin.command("ping")
    except PyMongoError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is unavailable.",
        ) from error
    return {"status": "ok"}
