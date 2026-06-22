import { useState } from 'react'
import JugadoresPage from './pages/JugadoresPage'
import PartidasPage from './pages/PartidasPage'
import TablaGeneralPage from './pages/TablaGeneralPage'
import { ToastProvider } from './Toast'

type Tab = 'tabla' | 'jugadores' | 'partidas'

export default function App() {
  const [tab, setTab] = useState<Tab>('tabla')

  return (
    <ToastProvider>
      <div className="app">
        <header className="header">
          <h1>🃏 Rummys</h1>
          <nav className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'tabla'} className={tab === 'tabla' ? 'tab active' : 'tab'} onClick={() => setTab('tabla')}>Tabla General</button>
            <button role="tab" aria-selected={tab === 'jugadores'} className={tab === 'jugadores' ? 'tab active' : 'tab'} onClick={() => setTab('jugadores')}>Jugadores</button>
            <button role="tab" aria-selected={tab === 'partidas'} className={tab === 'partidas' ? 'tab active' : 'tab'} onClick={() => setTab('partidas')}>Partidas</button>
          </nav>
        </header>

        <main className="main">
          {tab === 'tabla'     && <TablaGeneralPage />}
          {tab === 'jugadores' && <JugadoresPage />}
          {tab === 'partidas'  && <PartidasPage />}
        </main>

        <nav className="bottom-nav" aria-label="Navegación principal">
          <button className={`bottom-nav-item${tab === 'tabla' ? ' active' : ''}`} onClick={() => setTab('tabla')}>
            <span className="bottom-nav-icon" aria-hidden>🏆</span>
            <span className="bottom-nav-label">Tabla</span>
          </button>
          <button className={`bottom-nav-item${tab === 'jugadores' ? ' active' : ''}`} onClick={() => setTab('jugadores')}>
            <span className="bottom-nav-icon" aria-hidden>👤</span>
            <span className="bottom-nav-label">Jugadores</span>
          </button>
          <button className={`bottom-nav-item${tab === 'partidas' ? ' active' : ''}`} onClick={() => setTab('partidas')}>
            <span className="bottom-nav-icon" aria-hidden>🃏</span>
            <span className="bottom-nav-label">Partidas</span>
          </button>
        </nav>
      </div>
    </ToastProvider>
  )
}
