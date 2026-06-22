import { useEffect, useRef, useState } from 'react'
import { jugadores, type Jugador, type Historial } from '../api'
import { useToast } from '../Toast'
import { relDate } from '../utils'

type FormData = { nombre: string; apodo: string; email: string }
const empty: FormData = { nombre: '', apodo: '', email: '' }

function SkeletonCard() {
  return (
    <div className="card">
      <div className="skel skel-title" style={{ width: '55%' }} />
      <div className="skel skel-sub" style={{ width: '40%' }} />
      <div className="skel skel-sub" style={{ width: '65%', marginTop: 8 }} />
    </div>
  )
}

export default function JugadoresPage() {
  const toast = useToast()

  const [list, setList] = useState<Jugador[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [historial, setHistorial] = useState<Historial | null>(null)
  const [historialName, setHistorialName] = useState('')

  const firstInputRef = useRef<HTMLInputElement>(null)
  const isFirstRender = useRef(true)

  const load = async (s = search) => {
    setLoading(true)
    setError('')
    try {
      setList(await jugadores.list(s || undefined))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // debounced search
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    const t = setTimeout(() => load(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Escape closes modals
  useEffect(() => {
    if (!showForm && !historial) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (historial) setHistorial(null)
      else closeForm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showForm, historial])

  const openNew = () => {
    setForm(empty)
    setEditId(null)
    setShowForm(true)
    setTimeout(() => firstInputRef.current?.focus(), 50)
  }

  const openEdit = (j: Jugador) => {
    setForm({ nombre: j.nombre, apodo: j.apodo ?? '', email: j.email ?? '' })
    setEditId(j.id)
    setShowForm(true)
    setTimeout(() => firstInputRef.current?.focus(), 50)
  }

  const closeForm = () => { setShowForm(false); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const body = {
        nombre: form.nombre,
        apodo: form.apodo || undefined,
        email: form.email || undefined,
      }
      if (editId !== null) {
        await jugadores.update(editId, body)
        toast('Jugador actualizado')
      } else {
        await jugadores.create(body)
        toast('Jugador creado')
      }
      closeForm()
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return
    try {
      await jugadores.delete(id)
      toast(`${nombre} eliminado`)
      load()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error al eliminar', 'error')
    }
  }

  const openHistorial = async (j: Jugador) => {
    try {
      const h = await jugadores.historial(j.id)
      setHistorial(h)
      setHistorialName(j.nombre)
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', 'error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Jugadores</h2>
        <button className="btn-primary" onClick={openNew}>+ Nuevo jugador</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre o apodo…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Buscar jugadores"
        />
        {search && (
          <button type="button" className="btn-secondary" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">✕</button>
        )}
      </div>

      {error && !showForm && (
        <div className="error">
          {error}
          <button className="btn-small" style={{ marginLeft: 12 }} onClick={() => load()}>Reintentar</button>
        </div>
      )}

      {loading && (
        <div className="card-grid">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <p className="empty-title">{search ? 'Sin resultados' : 'Sin jugadores todavía'}</p>
          <p className="empty-sub">
            {search
              ? `No hay jugadores que coincidan con "${search}".`
              : 'Agregá el primero para empezar a registrar partidas.'}
          </p>
          {!search && <button className="btn-primary" onClick={openNew}>+ Nuevo jugador</button>}
        </div>
      )}

      {!loading && list.length > 0 && (
        <div className="card-grid">
          {list.map(j => (
            <div key={j.id} className="card">
              <div className="card-title">{j.nombre}</div>
              {j.apodo && <div className="card-sub">@{j.apodo}</div>}
              {j.email && <div className="card-sub">{j.email}</div>}
              <div className="card-sub" style={{ marginTop: 2 }}>Desde {relDate(j.created_at)}</div>
              <div className="card-actions">
                <button className="btn-small" onClick={() => openHistorial(j)}>Historial</button>
                <button className="btn-small" onClick={() => openEdit(j)}>Editar</button>
                <button className="btn-small btn-danger" onClick={() => handleDelete(j.id, j.nombre)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm} role="dialog" aria-modal="true" aria-label={editId !== null ? 'Editar jugador' : 'Nuevo jugador'}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId !== null ? 'Editar jugador' : 'Nuevo jugador'}</h3>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="form">
              <label>
                Nombre *
                <input
                  ref={firstInputRef}
                  required
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                />
              </label>
              <label>
                Apodo
                <input
                  value={form.apodo}
                  onChange={e => setForm(f => ({ ...f, apodo: e.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </label>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeForm}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando…' : editId !== null ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial modal */}
      {historial && (
        <div className="modal-overlay" onClick={() => setHistorial(null)} role="dialog" aria-modal="true" aria-label={`Historial de ${historialName}`}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h3>Historial — {historialName}</h3>
            <div className="stats-grid stats-grid-6">
              <div className="stat"><span>{historial.estadisticas.partidas_jugadas}</span>Partidas</div>
              <div className="stat stat-gold"><span>🥇 {historial.estadisticas.victorias}</span>1° lugar</div>
              <div className="stat stat-silver"><span>🥈 {historial.estadisticas.segundos}</span>2° lugar</div>
              <div className="stat stat-last"><span>💀 {historial.estadisticas.ultimos}</span>Último</div>
              <div className="stat"><span>{historial.estadisticas.porcentaje_victorias}%</span>Win rate</div>
              <div className="stat stat-pts">
                <span className={historial.estadisticas.total_puntos_generales < 0 ? 'pts-neg' : ''}>
                  {historial.estadisticas.total_puntos_generales > 0 ? '+' : ''}{historial.estadisticas.total_puntos_generales}
                </span>
                Pts. generales
              </div>
            </div>
            {historial.partidas.length > 0 ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Pos.</th>
                      <th>Pts. partida</th>
                      <th>Pts. generales</th>
                      <th>Jugadores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.partidas.map(p => {
                      const pg = p.puntos_generales
                      return (
                        <tr key={p.id}>
                          <td title={new Date(p.fecha).toLocaleDateString('es-AR')}>{relDate(p.fecha)}</td>
                          <td>{p.posicion === 1 ? '🥇' : p.posicion === 2 && p.posicion < p.max_posicion ? '🥈' : p.posicion === p.max_posicion ? '💀' : p.posicion}</td>
                          <td>{p.puntos}</td>
                          <td className={pg > 0 ? 'pts-pos' : pg < 0 ? 'pts-neg' : ''}>{pg > 0 ? `+${pg}` : pg}</td>
                          <td>{p.cant_jugadores}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p className="empty-sub">Sin partidas registradas todavía.</p>
              </div>
            )}
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setHistorial(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
