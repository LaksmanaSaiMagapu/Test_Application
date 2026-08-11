import { http, HttpResponse } from 'msw'

// In-memory mirrors of the GeoNexus REST API (backend on :8080)
const API = 'http://localhost:8080/api'

let seq = { areas: 1, tracks: 1, routes: 1 }
const db = { areas: [], tracks: [], routes: [] }

const crud = (kind) => [
  http.get(`${API}/${kind}`, () => HttpResponse.json(db[kind])),
  http.post(`${API}/${kind}`, async ({ request }) => {
    const body = await request.json()
    const saved = { id: seq[kind]++, ...body }
    db[kind].push(saved)
    return HttpResponse.json(saved, { status: 201 })
  }),
  http.delete(`${API}/${kind}/:id`, ({ params }) => {
    const id = Number(params.id)
    const i = db[kind].findIndex((r) => r.id === id)
    if (i === -1) return new HttpResponse(null, { status: 404 })
    db[kind].splice(i, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]

export const handlers = [...crud('areas'), ...crud('tracks'), ...crud('routes')]

export const resetDb = () => {
  db.areas = []
  db.tracks = []
  db.routes = []
  seq = { areas: 1, tracks: 1, routes: 1 }
}
