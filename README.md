# GeoNexus GIS Dashboard

A full-stack GIS dashboard for tracking a bike fleet on a map. It supports drawing/saving/measuring polygons (areas), placing tracks and routes, geofencing, and filtering bikes by vehicle number, area, and time. Data persists to PostgreSQL and can also be exported/imported as local JSON files.

## Architecture

```
backend/   Spring Boot REST API + PostgreSQL
frontend/  React + Vite + MapLibre GL dashboard
e2e/       Playwright end-to-end test suite
```

## Stack versions

### Backend (`backend/`)

| Component       | Version          |
|-----------------|------------------|
| Java            | 17               |
| Maven           | 3.9.6            |
| Spring Boot     | 2.7.18           |
| Spring Framework| 5.3.18           |
| Spring Data JPA | 2.7.18           |
| Hibernate       | 5.6.15.Final     |
| Tomcat (embedded) | 9.0.83         |
| PostgreSQL      | 16.0             |
| PostgreSQL JDBC | 42.7.4           |

### Frontend (`frontend/`)

| Component            | Version    |
|----------------------|------------|
| React / React DOM    | 19.1.0     |
| react-router-dom     | 7.18.2     |
| maplibre-gl          | 6.1.0      |
| Vite                 | 8.x        |
| oxlint               | 1.x        |

### E2E (`e2e/`)

| Component | Version  |
|-----------|----------|
| Playwright | 1.62.1  |

## Setup

### 1. Database

Option A — local PostgreSQL 16 on `localhost:5432`:

```bash
cd backend
sudo -u postgres psql -f init-db.sql
```

Option B — PostgreSQL 16 in a container (exposes port 5434):

```bash
cd backend
docker compose up -d        # or: podman-compose up -d
```

### 2. Backend

```bash
cd backend
mvn package
java -jar target/geonexus-backend-1.0.0.jar
```

Defaults: `jdbc:postgresql://localhost:5432/geonexus`, user/password `geonexus/geonexus`.
Override via `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGINS` env vars
(e.g. for the container DB on port 5434: `DB_URL=jdbc:postgresql://localhost:5434/geonexus`).

API runs on `http://localhost:8080`. CORS is enabled for `http://localhost:5173`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run lint     # oxlint
```

Login: `admin` / `admin123`.

### 4. E2E tests

```bash
cd e2e
npm install
node run-tests.js   # requires backend, DB, and frontend dev server on :5175
```

## API

| Method | Path               | Notes                                  |
|--------|--------------------|----------------------------------------|
| POST   | `/api/areas`       | Create area (polygon JSON + value/unit) |
| GET    | `/api/areas`       | List areas                             |
| DELETE | `/api/areas/{id}`  | Delete area                            |
| POST   | `/api/tracks`      | Create track (lat/lon, speed, course)  |
| GET    | `/api/tracks`      | List tracks                            |
| DELETE | `/api/tracks/{id}` | Delete track                           |
| POST   | `/api/routes`      | Create route (start/end coords, validity) |
| GET    | `/api/routes`      | List routes                            |
| DELETE | `/api/routes/{id}` | Delete route                           |
