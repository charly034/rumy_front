import { useEffect, useState } from 'react'
import { partidas, jugadores, type PartidaResumen, type PartidaDetalle, type Jugador, type JugadorInput } from '../api'

export default function PartidasPage() {
  const [list, setList] = useState<PartidaResumen[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState<PartidaDetalle | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formNotas, setFormNotas] = useState('')
  const [formFecha, setFormFecha] = useState('')
  const [formJugadores, setFormJugadores] = useState<JugadorInput[]>([{ jugador_id: 0, puntos: 0 }, { jugador_id: 0, puntos: 0 }])
  const [allJugadores, setAllJugadores] = useState<Jugador[]>([])
  const [formError, setFormError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setList(await partidas.list())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const loadJugadores = async () => {
    try {
      setAllJugadores(await jugadores.list())
    } catch { /* silently fail */ }
  }

  const openNew = async () => {
    await loadJugadores()
    setFormNotas('')
    setFormFecha('')
    setFormJugadores([{ jugador_id: 0, puntos: 0 }, { jugador_id: 0, puntos: 0 }])
    setEditId(null)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = async (p: PartidaResumen) => {
    await loadJugadores()
    const d = await partidas.get(p.id)
    setFormNotas(d.notas ?? '')
    setFormFecha(d.fecha ? d.fecha.slice(0, 16) : '')
    setFormJugadores(d.jugadores.map(j => ({ jugador_id: j.jugador_id, puntos: j.puntos })))
    setEditId(p.id)
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setFormError('') }

  const addJugadorRow = () => setFormJugadores(fs => [...fs, { jugador_id: 0, puntos: 0 }])
  const removeJugadorRow = (i: number) => setFormJugadores(fs => fs.filter((_, idx) => idx !== i))
  const setJugadorField = (i: number, field: keyof JugadorInput, value: number) =>
    setFormJugadores(fs => fs.map((f, idx) => idx === i ? { ...f, [field]: value } : f))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const invalid = formJugadores.some(j => !j.jugador_id)
    if (invalid) { setFormError('Selecciona un jugador en cada fila'); return }
    const ids = formJugadores.map(j => j.jugador_id)
    if (new Set(ids).size !== ids.length) { setFormError('Hay jugadores repetidos'); return }
    try {
      const body = {
        notas: formNotas || undefined,
        fecha: formFecha ? new Date(formFecha).toISOString() : undefined,
        jugadores: formJugadores,
      }
      if (editId !== null) {
        await partidas.update(editId, body)
      } else {
        await partidas.create(body)
      }
      closeForm()
      load()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta partida?')) return
    try {
      await partidas.delete(id)
      load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  const openDetalle = async (id: number) => {
    try {
      setDetalle(await partidas.get(id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2>Partidas</h2>
        <button className="btn-primary" onClick={openNew}>+ Nueva partida</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && list.length === 0 && <p className="muted">No hay partidas registradas.</p>}

      <div className="card-grid">
        {list.map(p => (
          <div key={p.id} className="card">
            <div className="card-title">{new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            {p.ganador && <div className="card-sub">🏆 {p.ganador}</div>}
            <div className="card-sub">{p.cant_jugadores} jugadores</div>
            {p.notas && <div className="card-sub card-notas">{p.notas}</div>}
            <div className="card-actions">
              <button className="btn-small" onClick={() => openDetalle(p.id)}>Ver</button>
              <button className="btn-small" onClick={() => openEdit(p)}>Editar</button>
              <button className="btn-small btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Detalle modal */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h3>Partida #{detalle.id} — {new Date(detalle.fecha).toLocaleDateString('es-AR')}</h3>
            {detalle.notas && <p className="muted">{detalle.notas}</p>}
            <div className="table-wrap"><table className="table">
              <thead>
                <tr><th>Pos.</th><th>Jugador</th><th>Puntos</th></tr>
              </thead>
              <tbody>
                {[...detalle.jugadores].sort((a, b) => a.posicion - b.posicion).map(j => (
                  <tr key={j.id} className={j.posicion === 1 ? 'winner-row' : ''}>
                    <td>{j.posicion === 1 ? '🏆' : j.posicion}</td>
                    <td>{j.nombre}{j.apodo ? ` (${j.apodo})` : ''}</td>
                    <td>{j.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h3>{editId !== null ? 'Editar partida' : 'Nueva partida'}</h3>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit} className="form">
              <label>
                Fecha y hora
                <input
                  type="datetime-local"
                  value={formFecha}
                  onChange={e => setFormFecha(e.target.value)}
                />
              </label>
              <label>
                Notas
                <textarea
                  value={formNotas}
                  onChange={e => setFormNotas(e.target.value)}
                  rows={2}
                />
              </label>

              <div className="jugadores-section">
                <div className="jugadores-header">
                  <strong>Jugadores</strong>
                  <button type="button" className="btn-small" onClick={addJugadorRow}>+ Agregar</button>
                </div>
                {formJugadores.map((fj, i) => (
                  <div key={i} className="jugador-row">
                    <select
                      required
                      value={fj.jugador_id || ''}
                      onChange={e => setJugadorField(i, 'jugador_id', Number(e.target.value))}
                    >
                      <option value="">— Jugador —</option>
                      {allJugadores.map(j => (
                        <option key={j.id} value={j.id}>{j.nombre}{j.apodo ? ` (${j.apodo})` : ''}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      placeholder="Puntos"
                      value={fj.puntos}
                      onChange={e => setJugadorField(i, 'puntos', Number(e.target.value))}
                    />
                    {formJugadores.length > 2 && (
                      <button type="button" className="btn-small btn-danger" onClick={() => removeJugadorRow(i)}>✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeForm}>Cancelar</button>
                <button type="submit" className="btn-primary">{editId !== null ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
