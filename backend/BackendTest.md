# Hackathon Backend Service

A FastAPI backend for a developer platform that authenticates with GitHub, analyzes repositories, and generates CI/CD pipelines.

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Server**
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.
   API Documentation (Swagger UI): `http://localhost:8000/docs`

## API Usage Flow

### 1. Authenticate
Provide your client id and secret in an env file.
Test by visiting: http://localhost:8000/oauth/login

Response:
```json
{"login": "username", "id": 12345, "avatar_url": "...", "name": "..."}
```

### 2. List Repositories
Use the token in the Authorization header for all subsequent requests.
```bash
curl http://localhost:8000/repos/ \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN"
```

### 3. Select Repository
Tell the backend which repo you want to work on.
```bash
curl -X POST http://localhost:8000/repos/select \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"owner": "username", "repo": "my-repo"}'
```

### 4. Get Pipeline Suggestions
The backend analyzes the repo and suggests steps.
```bash
curl http://localhost:8000/pipeline/suggest \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN"
```
Response:
```json
{
  "stack": {"language": "python", "framework": "python-generic", "has_dockerfile": false},
  "suggested_steps": ["checkout", "install_deps", "run_tests"]
}
```

### 5. Generate & Commit Pipeline
Send the desired steps to generate `.github/workflows/ci.yml`.
```bash
curl -X POST http://localhost:8000/pipeline/generate-and-commit \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"steps": ["checkout", "install_deps", "run_tests"]}'
```

## Directory Structure
```
backend/
├── app/
│   ├── main.py              # Entry point
│   ├── config.py            # Settings
│   ├── dependencies.py      # Dependency injection
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── routers/
│   │   ├── auth.py          # /auth
│   │   ├── repos.py         # /repos
│   │   └── pipeline.py      # /pipeline
│   └── services/
│       ├── github.py        # GitHub API Client
│       ├── analyzer.py      # Stack inference
│       └── generator.py     # YAML generation
├── requirements.txt
└── README.md
```
