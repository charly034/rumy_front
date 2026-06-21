import { useEffect, useState } from 'react'
import { jugadores, type Jugador, type Historial } from '../api'

type FormData = { nombre: string; apodo: string; email: string }
const empty: FormData = { nombre: '', apodo: '', email: '' }

export default function JugadoresPage() {
  const [list, setList] = useState<Jugador[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [historial, setHistorial] = useState<Historial | null>(null)
  const [historialName, setHistorialName] = useState('')

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  const openNew = () => {
    setForm(empty)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (j: Jugador) => {
    setForm({ nombre: j.nombre, apodo: j.apodo ?? '', email: j.email ?? '' })
    setEditId(j.id)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const body = {
        nombre: form.nombre,
        apodo: form.apodo || undefined,
        email: form.email || undefined,
      }
      if (editId !== null) {
        await jugadores.update(editId, body)
      } else {
        await jugadores.create(body)
      }
      closeForm()
      load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return
    try {
      await jugadores.delete(id)
      load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  const openHistorial = async (j: Jugador) => {
    try {
      const h = await jugadores.historial(j.id)
      setHistorial(h)
      setHistorialName(j.nombre)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Jugadores</h2>
        <button className="btn-primary" onClick={openNew}>+ Nuevo jugador</button>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Buscar por nombre o apodo…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary">Buscar</button>
      </form>

      {error && !showForm && <p className="error">{error}</p>}
      {loading && <p className="muted">Cargando…</p>}

      {!loading && list.length === 0 && (
        <p className="muted">No hay jugadores.</p>
      )}

      <div className="card-grid">
        {list.map(j => (
          <div key={j.id} className="card">
            <div className="card-title">{j.nombre}</div>
            {j.apodo && <div className="card-sub">@{j.apodo}</div>}
            {j.email && <div className="card-sub">{j.email}</div>}
            <div className="card-actions">
              <button className="btn-small" onClick={() => openHistorial(j)}>Historial</button>
              <button className="btn-small" onClick={() => openEdit(j)}>Editar</button>
              <button className="btn-small btn-danger" onClick={() => handleDelete(j.id, j.nombre)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editId !== null ? 'Editar jugador' : 'Nuevo jugador'}</h3>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="form">
              <label>
                Nombre *
                <input
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
                <button type="submit" className="btn-primary">
                  {editId !== null ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial modal */}
      {historial && (
        <div className="modal-overlay" onClick={() => setHistorial(null)}>
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
              <div className="table-wrap"><table className="table">
                <thead>
                  <tr><th>Fecha</th><th>Pos.</th><th>Pts. partida</th><th>Pts. generales</th><th>Jugadores</th></tr>
                </thead>
                <tbody>
                  {historial.partidas.map(p => {
                    const pg = p.puntos_generales
                    return (
                      <tr key={p.id}>
                        <td>{new Date(p.fecha).toLocaleDateString('es-AR')}</td>
                        <td>{p.posicion === 1 ? '🥇' : p.posicion === 2 && p.posicion < p.max_posicion ? '🥈' : p.posicion === p.max_posicion ? '💀' : p.posicion}</td>
                        <td>{p.puntos}</td>
                        <td className={pg > 0 ? 'pts-pos' : pg < 0 ? 'pts-neg' : ''}>{pg > 0 ? `+${pg}` : pg}</td>
                        <td>{p.cant_jugadores}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table></div>
            ) : (
              <p className="muted">Sin partidas registradas.</p>
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
