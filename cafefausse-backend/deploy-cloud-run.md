# Deploy cafefausse-backend to Cloud Run

Run these commands yourself from `cafefausse-backend`. They deploy the Flask API to Cloud Run in the `imaginode` project. The React site is not part of this service.

The container listens on the `PORT` Cloud Run provides and uses Gunicorn. `DATABASE_URL` and `DATABASE_SCHEMA` come from the service environment, not from the image. The Neon database is in Singapore, so the service region is `asia-southeast1`.

## One-time setup

```bash
gcloud config set project imaginode
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Create `env.yaml` in this directory. It is gitignored. Use the same values as `.env.local`.

```yaml
DATABASE_URL: "postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
DATABASE_SCHEMA: "cafefausse"
```

Add `CORS_ORIGINS` to that file only when a browser on another origin will call the API. Local Vite (`http://127.0.0.1:5173` and `http://localhost:5173`) is already allowed.

## Deploy

```bash
cd cafefausse-backend

gcloud run deploy cafefausse-backend \
  --source . \
  --project imaginode \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --concurrency 8 \
  --memory 512Mi \
  --cpu 1 \
  --env-vars-file env.yaml
```

`--allow-unauthenticated` matches the public reservation and newsletter forms. The command prints a service URL. Check it with:

```bash
curl "$SERVICE_URL/api/health"
```

The response is `{"ok": true}`.

## Local site

`./start.sh` still runs the API on `http://127.0.0.1:5000` for local development. The Vite app proxies `/api` there. Point the frontend at the Cloud Run URL only when you want the site to use the deployed API.
