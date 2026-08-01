# GeoNexus GIS Dashboard

A full-stack GIS (Geographic Information System) web application for visualizing and managing bikes, geo-fence areas, and routes on an interactive map.

## Features

- **Secure login** – protected dashboard; demo users `admin` / `admin123` and `user` / `user123`
- **Interactive map** – built with MapLibre GL, OpenStreetMap tiles
- **Bike tracking** – bikes shown as red dots; double-click a bike for a detailed popup (vehicle no., name, chassis, registered area, battery, date/time, position)
- **Filter panel** – search bikes by number, name, chassis number, date range, and area
- **Geo-fence areas** – pre-defined areas (London, Paris, Tokyo, Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata) drawn in black with name labels; areas can be created and persisted
- **Route planning** – pick a start and end point to preview a route, then save it; saved routes are drawn in red with name labels; clicking a saved route fits the map to it
- **Persistence** – areas, routes, and tracks are stored in an H2 file database

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | React 19, Vite 8, MapLibre GL 6, React Router     |
| Backend  | Spring Boot 3.3, Spring Data JPA, Maven, Java 22  |
| Database | H2 (file-based)                                   |

## Project Structure

```
Test_Application/
├── frontend/   # React + Vite + MapLibre GL dashboard
├── backend/    # Spring Boot REST API (port 8080)
└── README.md
```

## Getting Started

### Prerequisites

- Java 22
- Maven 3.9+
- Node.js 18+ and npm

### 1. Run the backend

The frontend calls the API at `http://localhost:8080`, so keep the backend running on port 8080.

```bash
cd backend
mvn spring-boot:run
```

The REST API starts at `http://localhost:8080`.

### 2. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser and sign in with:

| Username | Password   |
| -------- | ---------- |
| admin    | admin123   |
| user     | user123    |

### Production build (frontend)

```bash
cd frontend
npm run build
npm run preview
```

## REST API Endpoints

| Method   | Endpoint        | Description                    |
| -------- | --------------- | ------------------------------ |
| GET/POST | `/api/areas`    | List / create geo-fence areas  |
| GET/PUT/DELETE | `/api/areas/{id}` | Update / delete an area    |
| GET/POST | `/api/routes`   | List / save routes             |
| DELETE   | `/api/routes/{id}` | Delete a route               |
| GET/POST | `/api/tracks`   | List / save tracks             |
| DELETE   | `/api/tracks/{id}` | Delete a track               |

## Notes

- The H2 database file is created under `backend/data/areadb` on first run.
- The map uses public OpenStreetMap tiles; an internet connection is required to load them.
