import { useEffect, useState } from 'react'
import { tablaGeneral, type TablaEntry } from '../api'

const medal = (pos: number) => {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return `${pos}°`
}

function SkeletonRow() {
  return (
    <div className="tabla-row" style={{ gap: 12 }}>
      <div className="skel" style={{ width: 36, height: 36, borderRadius: 8 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skel skel-title" />
        <div className="skel" style={{ height: 4, width: '100%', borderRadius: 2 }} />
        <div className="skel skel-sub" />
      </div>
      <div className="skel" style={{ width: 80, height: 28, borderRadius: 20 }} />
      <div className="skel" style={{ width: 40, height: 28, borderRadius: 6 }} />
    </div>
  )
}

export default function TablaGeneralPage() {
  const [tabla, setTabla] = useState<TablaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setTabla(await tablaGeneral.get())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar la tabla')
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
        <button className="btn-secondary" onClick={load} aria-label="Actualizar tabla">↻ Actualizar</button>
      </div>

      <div className="puntos-legend">
        <span className="badge badge-gold">1° +4 pts</span>
        <span className="badge badge-silver">2° +2 pts</span>
        <span className="badge badge-last">Último −1 pt</span>
      </div>

      {error && (
        <div className="error">
          {error}
          <button className="btn-small" style={{ marginLeft: 12 }} onClick={load}>Reintentar</button>
        </div>
      )}

      {loading && (
        <div className="tabla-general">
          {[1, 2, 3, 4].map(i => <SkeletonRow key={i} />)}
        </div>
      )}

      {!loading && !error && tabla.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <p className="empty-title">Todavía no hay datos</p>
          <p className="empty-sub">Registrá partidas para ver quién está ganando la temporada.</p>
        </div>
      )}

      {!loading && tabla.length > 0 && (
        <div className="tabla-general">
          {tabla.map((entry, i) => (
            <div key={entry.id} className={`tabla-row ${i === 0 ? 'tabla-row-leader' : ''}`}>
              <div className="tabla-rank">{medal(i + 1)}</div>

              <div className="tabla-info">
                <div className="tabla-nombre">
                  {entry.nombre}
                  {entry.apodo && <span className="tabla-apodo"> @{entry.apodo}</span>}
                </div>
                <div className="tabla-bar-wrap" title={`${entry.puntos_generales} pts generales`}>
                  <div
                    className="tabla-bar"
                    style={{ width: `${maxPts > 0 ? Math.max((entry.puntos_generales / maxPts) * 100, entry.puntos_generales > 0 ? 2 : 0) : 0}%` }}
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
