import { useEffect, useRef, useState } from 'react'
import { partidas, jugadores, type PartidaResumen, type PartidaDetalle, type Jugador, type JugadorInput } from '../api'
import { useToast } from '../Toast'
import { relDate } from '../utils'

function SkeletonCard() {
  return (
    <div className="card">
      <div className="skel skel-title" style={{ width: '70%' }} />
      <div className="skel skel-sub" style={{ width: '45%' }} />
      <div className="skel skel-sub" style={{ width: '30%', marginTop: 8 }} />
    </div>
  )
}

const posEmoji = (i: number, total: number) => {
  if (i === 0) return '🥇'
  if (i === 1 && total > 2) return '🥈'
  if (i === total - 1) return '💀'
  return `${i + 1}°`
}

// ── Numpad ────────────────────────────────────────────────────
interface NumpadProps {
  playerName: string
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
}

function Numpad({ playerName, value, onChange, onConfirm }: NumpadProps) {
  const press = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else {
      const next = value + key
      if (next.length > 4) return
      onChange(next)
    }
  }

  return (
    <div className="numpad-overlay" onClick={onConfirm}>
      <div className="numpad" onClick={e => e.stopPropagation()}>
        <div className="numpad-display">
          <div className="numpad-player">{playerName}</div>
          <div className={`numpad-value${!value ? ' numpad-value-empty' : ''}`}>
            {value || '0'}
          </div>
        </div>
        <div className="numpad-grid">
          {['7','8','9','4','5','6','1','2','3','⌫','0'].map(k => (
            <button key={k} type="button" className="numpad-key" onClick={() => press(k)}>{k}</button>
          ))}
          <button type="button" className="numpad-key numpad-confirm" onClick={onConfirm}>✓</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
export default function PartidasPage() {
  const toast = useToast()

  const [list, setList] = useState<PartidaResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState<PartidaDetalle | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formNotas, setFormNotas] = useState('')
  const [formFecha, setFormFecha] = useState('')
  const [formJugadores, setFormJugadores] = useState<JugadorInput[]>([])
  const [allJugadores, setAllJugadores] = useState<Jugador[]>([])
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // numpad
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null)
  const [numpadValue, setNumpadValue] = useState('')

  const firstFieldRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true); setError('')
    try { setList(await partidas.list()) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!showForm && !detalle) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (activePlayerId !== null) { confirmNumpad(); return }
      if (detalle) setDetalle(null)
      else closeForm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showForm, detalle, activePlayerId])

  const loadJugadores = async () => {
    try { setAllJugadores(await jugadores.list()) }
    catch { /* silently fail */ }
  }

  const openNew = async () => {
    await loadJugadores()
    setFormNotas(''); setFormFecha(''); setFormJugadores([])
    setEditId(null); setFormError(''); setShowForm(true)
    setTimeout(() => firstFieldRef.current?.focus(), 50)
  }

  const openEdit = async (p: PartidaResumen) => {
    await loadJugadores()
    const d = await partidas.get(p.id)
    setFormNotas(d.notas ?? '')
    setFormFecha(d.fecha ? d.fecha.slice(0, 16) : '')
    setFormJugadores(d.jugadores.map(j => ({ jugador_id: j.jugador_id, puntos: j.puntos })))
    setEditId(p.id); setFormError(''); setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setFormError('') }

  const toggleJugador = (id: number) => {
    const isSelected = formJugadores.some(fj => fj.jugador_id === id)
    if (isSelected) {
      if (formJugadores.length <= 2) return
      setFormJugadores(prev => prev.filter(fj => fj.jugador_id !== id))
    } else {
      setFormJugadores(prev => [...prev, { jugador_id: id, puntos: 0 }])
    }
  }

  const openNumpad = (id: number) => {
    const current = formJugadores.find(fj => fj.jugador_id === id)?.puntos ?? 0
    setNumpadValue(current === 0 ? '' : String(current))
    setActivePlayerId(id)
  }

  const confirmNumpad = () => {
    if (activePlayerId === null) return
    const val = parseInt(numpadValue || '0', 10)
    setFormJugadores(prev =>
      prev.map(fj => fj.jugador_id === activePlayerId ? { ...fj, puntos: isNaN(val) ? 0 : val } : fj)
    )
    setActivePlayerId(null)
    setNumpadValue('')
  }

  const rankingPreview = [...formJugadores]
    .filter(fj => fj.jugador_id)
    .sort((a, b) => b.puntos - a.puntos)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (formJugadores.length < 2) { setFormError('Seleccioná al menos 2 jugadores'); return }
    setSubmitting(true)
    try {
      const body = {
        notas: formNotas || undefined,
        fecha: formFecha ? new Date(formFecha).toISOString() : undefined,
        jugadores: formJugadores,
      }
      if (editId !== null) {
        await partidas.update(editId, body)
        toast('Partida actualizada')
      } else {
        await partidas.create(body)
        toast('Partida registrada 🎉')
      }
      closeForm(); load()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta partida?')) return
    try { await partidas.delete(id); toast('Partida eliminada'); load() }
    catch (e: unknown) { toast(e instanceof Error ? e.message : 'Error al eliminar', 'error') }
  }

  const openDetalle = async (id: number) => {
    try { setDetalle(await partidas.get(id)) }
    catch (e: unknown) { toast(e instanceof Error ? e.message : 'Error', 'error') }
  }

  const activeJugador = allJugadores.find(j => j.id === activePlayerId)

  return (
    <div>
      <div className="page-header">
        <h2>Partidas</h2>
        <button className="btn-primary" onClick={openNew}>+ Nueva partida</button>
      </div>

      {error && (
        <div className="error">
          {error}
          <button className="btn-small" style={{ marginLeft: 12 }} onClick={load}>Reintentar</button>
        </div>
      )}

      {loading && (
        <div className="card-grid">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
      )}

      {!loading && list.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🃏</div>
          <p className="empty-title">Sin partidas todavía</p>
          <p className="empty-sub">Registrá la primera para empezar a llevar la cuenta.</p>
          <button className="btn-primary" onClick={openNew}>+ Nueva partida</button>
        </div>
      )}

      {!loading && list.length > 0 && (
        <div className="card-grid">
          {list.map(p => (
            <div key={p.id} className="card">
              <div className="card-title" title={new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}>
                {relDate(p.fecha)}
              </div>
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
      )}

      {/* Detalle modal */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)} role="dialog" aria-modal="true">
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h3>
              {relDate(detalle.fecha)}
              <span className="tabla-apodo" style={{ fontWeight: 400, marginLeft: 8 }}>
                {new Date(detalle.fecha).toLocaleDateString('es-AR')}
              </span>
            </h3>
            {detalle.notas && <p className="muted" style={{ marginBottom: 12 }}>{detalle.notas}</p>}
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Pos.</th><th>Jugador</th><th>Puntos</th></tr></thead>
                <tbody>
                  {[...detalle.jugadores].sort((a, b) => a.posicion - b.posicion).map(j => (
                    <tr key={j.id} className={j.posicion === 1 ? 'winner-row' : ''}>
                      <td>{j.posicion === 1 ? '🏆' : j.posicion}</td>
                      <td>{j.nombre}{j.apodo ? ` (${j.apodo})` : ''}</td>
                      <td>{j.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm} role="dialog" aria-modal="true">
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <h3>{editId !== null ? 'Editar partida' : 'Nueva partida'}</h3>
            {formError && <p className="error">{formError}</p>}
            <form onSubmit={handleSubmit} className="form">

              <label>
                Fecha y hora <span style={{ fontWeight: 400, opacity: .6 }}>(opcional)</span>
                <input ref={firstFieldRef} type="datetime-local" value={formFecha} onChange={e => setFormFecha(e.target.value)} />
              </label>
              <label>
                Notas <span style={{ fontWeight: 400, opacity: .6 }}>(opcional)</span>
                <textarea value={formNotas} onChange={e => setFormNotas(e.target.value)} rows={2} placeholder="¿Dónde jugaron?" />
              </label>

              {/* ── Selección de jugadores ── */}
              <div className="jugadores-section">
                <div className="jugadores-header">
                  <strong>¿Quiénes juegan?</strong>
                  <span className="muted" style={{ fontSize: '0.78rem' }}>
                    {formJugadores.length < 2 ? 'Mínimo 2' : `${formJugadores.length} jugadores`}
                  </span>
                </div>
                <div className="player-picker">
                  {allJugadores.map(j => {
                    const selected = formJugadores.some(fj => fj.jugador_id === j.id)
                    return (
                      <button key={j.id} type="button"
                        className={`player-chip${selected ? ' selected' : ''}`}
                        onClick={() => toggleJugador(j.id)}
                        aria-pressed={selected}
                      >
                        {selected && <span className="chip-check" aria-hidden>✓</span>}
                        {j.nombre}
                        {j.apodo && <span className="chip-apodo">@{j.apodo}</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Puntos: score cards táctiles ── */}
              {formJugadores.length > 0 && (
                <div className="jugadores-section">
                  <div className="jugadores-header">
                    <strong>Puntos</strong>
                    <span className="muted" style={{ fontSize: '0.78rem' }}>tocá un jugador para ingresar</span>
                  </div>
                  <div className="score-cards">
                    {formJugadores.map(fj => {
                      const jug = allJugadores.find(j => j.id === fj.jugador_id)
                      return (
                        <div key={fj.jugador_id}
                          className="score-card"
                          onClick={() => openNumpad(fj.jugador_id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && openNumpad(fj.jugador_id)}
                          aria-label={`${jug?.nombre}: ${fj.puntos} puntos. Tocá para editar.`}
                        >
                          <span className="score-card-name">{jug?.nombre ?? '?'}</span>
                          <span className={`score-card-pts${fj.puntos === 0 ? ' score-card-pts-empty' : ''}`}>
                            {fj.puntos}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Preview ranking ── */}
              {rankingPreview.length >= 2 && (
                <div className="ranking-preview">
                  <div className="ranking-preview-title">Vista previa</div>
                  {rankingPreview.map((fj, i) => {
                    const jug = allJugadores.find(j => j.id === fj.jugador_id)
                    const total = rankingPreview.length
                    const isFirst = i === 0
                    const isLast = i === total - 1
                    const pts = isFirst ? '+4' : i === 1 && total > 2 ? '+2' : isLast ? '−1' : '0'
                    const ptsClass = isFirst ? 'pts-pos' : isLast ? 'pts-neg' : ''
                    return (
                      <div key={fj.jugador_id} className="ranking-item">
                        <span className="ranking-pos">{posEmoji(i, total)}</span>
                        <span className="ranking-name">{jug?.nombre}</span>
                        <span className="ranking-pts-game">{fj.puntos} pts</span>
                        <span className={`ranking-pts-gen ${ptsClass}`}>{pts}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeForm}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting || formJugadores.length < 2}>
                  {submitting ? 'Guardando…' : editId !== null ? 'Guardar' : 'Crear partida'}
                </button>
              </div>
            </form>
          </div>

          {/* Numpad — encima del modal */}
          {activePlayerId !== null && activeJugador && (
            <Numpad
              playerName={activeJugador.nombre}
              value={numpadValue}
              onChange={setNumpadValue}
              onConfirm={confirmNumpad}
            />
          )}
        </div>
      )}
    </div>
  )
}
