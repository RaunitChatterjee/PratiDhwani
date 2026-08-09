# Deployment Guide

All four options below deploy the same unmodified backend and frontend.
None of them touch the Wav2Vec2 pipeline, preprocessing, or the
`/predict` contract — they differ only in *where* the containers run.

---

## Option 1 — Docker Compose (simplest, single machine)

Prerequisites: Docker + Docker Compose installed, a trained checkpoint at
`ml/checkpoints/best_model.pt`.

```bash
cp .env.example .env
# edit .env: set ENVIRONMENT=production, CORS_ORIGINS to your real domain

docker compose up --build -d
```

- Frontend: `http://<host>:5173`
- Backend: `http://<host>:8000`

Checkpoints are mounted read-only from `./ml/checkpoints` (see
`docker-compose.yml`) rather than baked into the image, so updating a
checkpoint doesn't require rebuilding.

To stop: `docker compose down`. Logs: `docker compose logs -f backend`.

---

## Option 2 — Render

Render can build directly from the two Dockerfiles.

1. Push this repo to GitHub/GitLab.
2. In Render: **New → Web Service**, connect the repo.
3. **Backend service:**
   - Environment: Docker
   - Dockerfile path: `backend/Dockerfile`
   - Docker build context: repository root (`.`)
   - Add environment variables from `.env.example` (at minimum
     `ENVIRONMENT=production`, `CORS_ORIGINS=<your frontend's Render URL>`).
   - Add a **Disk** (persistent storage) mounted at `/app/ml/checkpoints`
     and upload your checkpoint there, or bake it into a private image —
     Render's free tier has no persistent disk, so plan accordingly.
   - Health check path: `/health`.
4. **Frontend service:** New → Static Site (Render can serve the Vite
   `dist/` build directly, no need for the nginx Dockerfile in this mode),
   or New → Web Service with `frontend/Dockerfile` if you prefer the
   container path.
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
5. Once both are live, update `CORS_ORIGINS` on the backend to the
   frontend's actual `*.onrender.com` URL and redeploy the backend.

A `render.yaml` blueprint is provided below for one-shot setup via
**New → Blueprint**:

```yaml
services:
  - type: web
    name: pratidhwani-backend
    env: docker
    dockerfilePath: backend/Dockerfile
    dockerContext: .
    healthCheckPath: /health
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: CORS_ORIGINS
        sync: false   # set manually once the frontend URL is known

  - type: web
    name: pratidhwani-frontend
    env: static
    buildCommand: npm ci && npm run build
    staticPublishPath: dist
    rootDir: frontend
```

---

## Option 3 — Railway

1. `railway login && railway init` in the repo root.
2. Add two services from the same repo:
   - **backend**: set the Dockerfile path to `backend/Dockerfile`, root
     directory to `.` (so `ml/` and `config/` are included in the build
     context).
   - **frontend**: root directory `frontend/`, Railway auto-detects the
     Dockerfile there.
3. In the backend service's **Variables** tab, add the same variables as
   `.env.example`. Railway injects `PORT` automatically — the app already
   reads `settings.port`, but Railway's injected `PORT` env var takes
   precedence at the platform level regardless.
4. Attach a Railway **Volume** to the backend service mounted at
   `/app/ml/checkpoints` for the trained model weights.
5. Under the frontend service's variables, nothing is required — it calls
   the backend at the hardcoded URL in `src/services/api.js`. If your
   Railway backend domain differs from `127.0.0.1:8000`, that file is the
   one place to update it (out of scope for this backend-focused refactor —
   flagged here rather than changed silently).

A minimal `railway.toml` per service:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

---

## Option 4 — AWS EC2 (manual, full control)

1. **Launch an instance** — Ubuntu 22.04 LTS, at least 2 vCPU / 4GB RAM
   for CPU inference (more if you expect concurrent requests). Open
   inbound ports 80 (frontend), 8000 (backend, or proxy it — see step 5),
   and 22 (SSH) in the security group.

2. **Install Docker:**
   ```bash
   sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
   sudo usermod -aG docker $USER
   # log out/in for the group change to take effect
   ```

3. **Get the code and checkpoint onto the instance:**
   ```bash
   git clone <your-repo-url> pratidhwani && cd pratidhwani
   scp -r local/path/to/ml/checkpoints ec2-user@<instance-ip>:~/pratidhwani/ml/checkpoints
   cp .env.example .env
   # edit .env: ENVIRONMENT=production, CORS_ORIGINS=http://<instance-ip> (or your domain)
   ```

4. **Run it:**
   ```bash
   docker compose up --build -d
   ```

5. **(Recommended) Put nginx or an ALB in front for TLS.** The bundled
   frontend nginx container already serves on port 80; for HTTPS, either:
   - Put an AWS Application Load Balancer in front with an ACM
     certificate, forwarding 443 → 80 (frontend) and a separate path/port
     to the backend, or
   - Install `certbot` on the instance and run a host-level nginx reverse
     proxy in front of both containers.

6. **Verify:**
   ```bash
   curl http://localhost:8000/health
   ```

7. **Auto-restart on reboot:** `docker compose` services are already set
   to `restart: unless-stopped` in `docker-compose.yml`; enable the Docker
   daemon itself on boot with `sudo systemctl enable docker`.

---

## Common to all options

- **Never commit a real `.env`** — only `.env.example` is checked in.
- **Checkpoints are never baked into images** — mount/upload them
  separately, since they're large binary files unrelated to code changes.
- **`ENABLE_DOCS=false`** in production is recommended to avoid publicly
  exposing the OpenAPI schema, unless you specifically want `/docs` public.
- **CORS**: whatever origin the frontend is actually served from must be
  in `CORS_ORIGINS`, or the browser will block requests even though the
  backend itself is reachable.
