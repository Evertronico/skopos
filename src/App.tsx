import { useState } from 'react'
import { IconCloud, IconDashboard, IconDroplet, IconDumbbell, IconRuler, IconUser } from './components/icons'
import { BackupPage } from './features/backup/BackupPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { MedidasPage } from './features/medidas/MedidasPage'
import { NutricaoPage } from './features/nutricao/NutricaoPage'
import { PerfilPage } from './features/perfil/PerfilPage'
import { TreinoPage } from './features/treino/TreinoPage'

type Aba = 'dashboard' | 'medidas' | 'treino' | 'nutricao' | 'perfil' | 'backup'

const ABAS: { chave: Aba; rotulo: string; Icone: typeof IconDashboard }[] = [
  { chave: 'dashboard', rotulo: 'Dashboard', Icone: IconDashboard },
  { chave: 'medidas', rotulo: 'Medidas', Icone: IconRuler },
  { chave: 'treino', rotulo: 'Treino', Icone: IconDumbbell },
  { chave: 'nutricao', rotulo: 'Nutrição', Icone: IconDroplet },
  { chave: 'perfil', rotulo: 'Perfil', Icone: IconUser },
  { chave: 'backup', rotulo: 'Backup', Icone: IconCloud },
]

export default function App() {
  const [aba, setAba] = useState<Aba>('dashboard')

  return (
    <div className="app">
      <header className="app-header">
        <img src="./icon.svg" alt="" className="app-logo" />
        <span className="app-title">Skopos</span>
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
        {ABAS.map(({ chave, rotulo, Icone }) => (
          <button
            key={chave}
            className={chave === aba ? 'nav-item active' : 'nav-item'}
            onClick={() => setAba(chave)}
          >
            <Icone size={20} className="nav-icon" />
            <span>{rotulo}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
