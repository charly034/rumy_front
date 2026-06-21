const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/v1'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Error en la solicitud')
  return json.data ?? json
}

// ── Jugadores ──────────────────────────────────────────────
export type Jugador = {
  id: number
  nombre: string
  apodo?: string
  email?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export type Estadisticas = {
  partidas_jugadas: number
  victorias: number
  segundos: number
  ultimos: number
  porcentaje_victorias: number
  total_puntos: number
  promedio_puntos: number
  total_puntos_generales: number
}

export type PartidaHistorial = {
  id: number
  fecha: string
  notas?: string
  puntos: number
  posicion: number
  cant_jugadores: number
  max_posicion: number
  puntos_generales: number
}

export type Historial = {
  jugador_id: number
  estadisticas: Estadisticas
  partidas: PartidaHistorial[]
}

export const jugadores = {
  list: (search?: string, activo?: boolean) => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (activo !== undefined) p.set('activo', String(activo))
    return req<Jugador[]>(`/jugadores?${p}`)
  },
  get: (id: number) => req<Jugador>(`/jugadores/${id}`),
  create: (body: { nombre: string; apodo?: string; email?: string }) =>
    req<Jugador>('/jugadores', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: Partial<{ nombre: string; apodo: string; email: string }>) =>
    req<Jugador>(`/jugadores/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: number) => req(`/jugadores/${id}`, { method: 'DELETE' }),
  historial: (id: number) => req<Historial>(`/jugadores/${id}/historial`),
}

// ── Partidas ───────────────────────────────────────────────
export type PartidaResumen = {
  id: number
  fecha: string
  notas?: string
  created_at: string
  cant_jugadores: number
  ganador?: string
}

export type PartidaDetalle = {
  id: number
  fecha: string
  notas?: string
  created_at: string
  updated_at: string
  jugadores: {
    id: number
    jugador_id: number
    nombre: string
    apodo?: string
    puntos: number
    posicion: number
  }[]
}

export type JugadorInput = { jugador_id: number; puntos: number }

export const partidas = {
  list: (params?: { jugador_id?: number; desde?: string; hasta?: string }) => {
    const p = new URLSearchParams()
    if (params?.jugador_id) p.set('jugador_id', String(params.jugador_id))
    if (params?.desde) p.set('desde', params.desde)
    if (params?.hasta) p.set('hasta', params.hasta)
    return req<PartidaResumen[]>(`/partidas?${p}`)
  },
  get: (id: number) => req<PartidaDetalle>(`/partidas/${id}`),
  create: (body: { fecha?: string; notas?: string; jugadores: JugadorInput[] }) =>
    req<PartidaDetalle>('/partidas', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: number, body: { fecha?: string; notas?: string; jugadores?: JugadorInput[] }) =>
    req<PartidaDetalle>(`/partidas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: number) => req(`/partidas/${id}`, { method: 'DELETE' }),
}

// ── Tabla General ──────────────────────────────────────────
export type TablaEntry = {
  id: number
  nombre: string
  apodo?: string
  partidas_jugadas: number
  primeros: number
  segundos: number
  ultimos: number
  total_puntos: number
  promedio_puntos: number
  puntos_generales: number
}

export const tablaGeneral = {
  get: () => req<TablaEntry[]>('/tabla-general'),
}
