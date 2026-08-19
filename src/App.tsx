import { useState } from 'react'
import { BackupPage } from './features/backup/BackupPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { MedidasPage } from './features/medidas/MedidasPage'
import { NutricaoPage } from './features/nutricao/NutricaoPage'
import { PerfilPage } from './features/perfil/PerfilPage'
import { TreinoPage } from './features/treino/TreinoPage'

type Aba = 'dashboard' | 'medidas' | 'treino' | 'nutricao' | 'perfil' | 'backup'

const ABAS: { chave: Aba; rotulo: string; icone: string }[] = [
  { chave: 'dashboard', rotulo: 'Dashboard', icone: '📊' },
  { chave: 'medidas', rotulo: 'Medidas', icone: '📏' },
  { chave: 'treino', rotulo: 'Treino', icone: '🏋️' },
  { chave: 'nutricao', rotulo: 'Nutrição', icone: '🥤' },
  { chave: 'perfil', rotulo: 'Perfil', icone: '👤' },
  { chave: 'backup', rotulo: 'Backup', icone: '☁️' },
]

export default function App() {
  const [aba, setAba] = useState<Aba>('dashboard')

  return (
    <div className="app">
      <header className="app-header">
        <h1>Skopos</h1>
      </header>

      <main className="app-content">
        {aba === 'dashboard' && <DashboardPage />}
        {aba === 'medidas' && <MedidasPage />}
        {aba === 'treino' && <TreinoPage />}
        {aba === 'nutricao' && <NutricaoPage />}
        {aba === 'perfil' && <PerfilPage />}
        {aba === 'backup' && <BackupPage />}
      </main>

      <nav className="app-nav">
        {ABAS.map(({ chave, rotulo, icone }) => (
          <button
            key={chave}
            className={chave === aba ? 'nav-item active' : 'nav-item'}
            onClick={() => setAba(chave)}
          >
            <span className="nav-icon" aria-hidden="true">
              {icone}
            </span>
            <span>{rotulo}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
