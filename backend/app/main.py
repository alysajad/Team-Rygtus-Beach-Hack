from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, repos, pipeline, oauth
from app.config import settings

app = FastAPI(title="Hackathon Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(oauth.router, prefix="/oauth", tags=["OAuth"])
app.include_router(repos.router, prefix="/repos", tags=["Repos"])
app.include_router(pipeline.router, prefix="/pipeline", tags=["Pipeline"])
from app.routers import deployment
app.include_router(deployment.router, tags=["Deployment"])

@app.get("/")
def root():
    return {"message": "Hackathon Backend Running"}
