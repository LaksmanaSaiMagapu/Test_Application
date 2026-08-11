# GeoNexus Backend

Spring Boot + PostgreSQL backend for the GeoNexus GIS Dashboard frontend (`../frontend`).

## Stack

- Java 17, Spring Boot 2.7 (Web, Data JPA, Validation) on Spring Framework 5.3.18
- PostgreSQL 16
- Maven

## API

Base URL: `http://localhost:8080`

| Method | Path              | Body / Notes |
|--------|-------------------|--------------|
| POST   | `/api/areas`      | `{ name, coordinates (JSON string of [lon,lat] pairs), coordinateLabels, areaValue, areaUnit }` → `201` saved area |
| GET    | `/api/areas`      | → `200` array of areas |
| DELETE | `/api/areas/{id}` | → `204`, `404` if missing |
| POST   | `/api/tracks`     | `{ name, number, latitude, longitude, speed, course }` → `201` saved track |
| GET    | `/api/tracks`     | → `200` array of tracks |
| DELETE | `/api/tracks/{id}`| → `204`, `404` if missing |
| POST   | `/api/routes`     | `{ name, startLatitude, startLongitude, endLatitude, endLongitude, validity }` → `201` saved route |
| GET    | `/api/routes`     | → `200` array of routes |
| DELETE | `/api/routes/{id}`| → `204`, `404` if missing |

CORS is enabled for `http://localhost:5173` (the Vite dev server).

## Database setup

Option A — use your local PostgreSQL (expected on `localhost:5432`):

```bash
sudo -u postgres psql -f init-db.sql
```

Option B — run PostgreSQL 16 in a container (works with docker or podman, exposes port 5434):

```bash
docker compose up -d        # or: podman-compose up -d
```

Tables (`areas`, `tracks`, `routes`) are created automatically by JPA on first run.

## Run

```bash
mvn package

# Defaults: jdbc:postgresql://localhost:5432/geonexus, user/password geonexus/geonexus
java -jar target/geonexus-backend-1.0.0.jar

# Override via environment variables when needed (e.g. container DB on port 5434):
DB_URL=jdbc:postgresql://localhost:5434/geonexus \
DB_USERNAME=geonexus DB_PASSWORD=geonexus \
java -jar target/geonexus-backend-1.0.0.jar
```

Config lives in `src/main/resources/application.yml`; overridable env vars: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGINS`.
