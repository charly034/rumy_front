import { useState } from 'react'
import JugadoresPage from './pages/JugadoresPage'
import PartidasPage from './pages/PartidasPage'
import TablaGeneralPage from './pages/TablaGeneralPage'

type Tab = 'tabla' | 'jugadores' | 'partidas'

export default function App() {
  const [tab, setTab] = useState<Tab>('tabla')

  return (
    <div className="app">
      <header className="header">
        <h1>🃏 Rummy</h1>
        <nav className="tabs">
          <button className={tab === 'tabla' ? 'tab active' : 'tab'} onClick={() => setTab('tabla')}>
            Tabla General
          </button>
          <button className={tab === 'jugadores' ? 'tab active' : 'tab'} onClick={() => setTab('jugadores')}>
            Jugadores
          </button>
          <button className={tab === 'partidas' ? 'tab active' : 'tab'} onClick={() => setTab('partidas')}>
            Partidas
          </button>
        </nav>
      </header>

      <main className="main">
        {tab === 'tabla' && <TablaGeneralPage />}
        {tab === 'jugadores' && <JugadoresPage />}
        {tab === 'partidas' && <PartidasPage />}
      </main>
    </div>
  )
}
