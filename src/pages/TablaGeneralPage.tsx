import { useEffect, useState } from 'react'
import { tablaGeneral, type TablaEntry } from '../api'

const medal = (pos: number) => {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return `${pos}°`
}

export default function TablaGeneralPage() {
  const [tabla, setTabla] = useState<TablaEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setTabla(await tablaGeneral.get())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const maxPts = tabla.length > 0 ? Math.max(...tabla.map(e => e.puntos_generales), 1) : 1

  return (
    <div>
      <div className="page-header">
        <h2>Tabla General</h2>
        <button className="btn-secondary" onClick={load}>↻ Actualizar</button>
      </div>

      <div className="puntos-legend">
        <span className="badge badge-gold">1° +4 pts</span>
        <span className="badge badge-silver">2° +2 pts</span>
        <span className="badge badge-last">Último −1 pt</span>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Cargando…</p>}
      {!loading && tabla.length === 0 && <p className="muted">Sin datos todavía. ¡Registrá partidas para ver la tabla!</p>}

      {tabla.length > 0 && (
        <div className="tabla-general">
          {tabla.map((entry, i) => (
            <div key={entry.id} className={`tabla-row ${i === 0 ? 'tabla-row-leader' : ''}`}>
              <div className="tabla-rank">{medal(i + 1)}</div>

              <div className="tabla-info">
                <div className="tabla-nombre">
                  {entry.nombre}
                  {entry.apodo && <span className="tabla-apodo"> @{entry.apodo}</span>}
                </div>
                <div className="tabla-bar-wrap">
                  <div
                    className="tabla-bar"
                    style={{ width: `${Math.max((entry.puntos_generales / maxPts) * 100, 2)}%` }}
                  />
                </div>
                <div className="tabla-puntos-partida">
                  <span title="Total de puntos de partida">🎯 {entry.total_puntos.toLocaleString('es-AR')} pts totales</span>
                  <span className="tabla-sep">·</span>
                  <span title="Promedio de puntos por partida">⌀ {entry.promedio_puntos.toLocaleString('es-AR')} por partida</span>
                </div>
              </div>

              <div className="tabla-badges">
                <span className="badge badge-gold" title="1° lugar">🥇 {entry.primeros}</span>
                <span className="badge badge-silver" title="2° lugar">🥈 {entry.segundos}</span>
                <span className="badge badge-last" title="Último">💀 {entry.ultimos}</span>
                <span className="muted tabla-pj" title="Partidas jugadas">{entry.partidas_jugadas} PJ</span>
              </div>

              <div className={`tabla-pts ${entry.puntos_generales < 0 ? 'pts-neg' : ''}`}>
                {entry.puntos_generales > 0 ? '+' : ''}{entry.puntos_generales}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
