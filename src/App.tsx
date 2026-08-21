import { useEffect, useState } from 'react'
import { IconBell, IconCloud, IconDashboard, IconDroplet, IconDumbbell, IconMoon, IconRuler, IconSun, IconUser } from './components/icons'
import { BackupPage } from './features/backup/BackupPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { MedidasPage } from './features/medidas/MedidasPage'
import { NutricaoPage } from './features/nutricao/NutricaoPage'
import { PerfilPage } from './features/perfil/PerfilPage'
import { TreinoPage } from './features/treino/TreinoPage'
import { verificarLembretes } from './lib/lembretes'
import { pedirPermissaoNotificacao, permissaoNotificacao, suportaNotificacao } from './lib/notifications'
import { aplicarTema, lerTemaSalvo, type Tema } from './lib/theme'

const INTERVALO_LEMBRETES_MS = 15 * 60 * 1000

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
  const [tema, setTema] = useState<Tema>('dark')
  const [mostrarBannerLembretes, setMostrarBannerLembretes] = useState(false)

  useEffect(() => {
    const salvo = lerTemaSalvo()
    setTema(salvo)
    aplicarTema(salvo)
  }, [])

  useEffect(() => {
    setMostrarBannerLembretes(suportaNotificacao() && permissaoNotificacao() === 'default')

    if (permissaoNotificacao() !== 'granted') return

    void verificarLembretes()
    const intervalo = setInterval(() => void verificarLembretes(), INTERVALO_LEMBRETES_MS)
    return () => clearInterval(intervalo)
  }, [])

  async function ativarLembretes() {
    const concedida = await pedirPermissaoNotificacao()
    setMostrarBannerLembretes(!concedida)
    if (concedida) void verificarLembretes()
  }

  function alternarTema() {
    const novo: Tema = tema === 'dark' ? 'light' : 'dark'
    setTema(novo)
    aplicarTema(novo)
  }

  return (
    <div className="app">
      <header className="app-header">
        <img src="./icon.svg" alt="" className="app-logo" />
        <span className="app-title">Skopos</span>
        <button
          type="button"
          className="tema-botao"
          onClick={alternarTema}
          aria-label={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {tema === 'dark' ? <IconSun size={19} /> : <IconMoon size={19} />}
        </button>
      </header>

      {mostrarBannerLembretes && (
        <div className="banner-lembretes">
          <IconBell size={18} />
          <span>Ative lembretes de água, refeição e treino no seu ritmo do dia.</span>
          <button type="button" onClick={ativarLembretes}>
            Ativar
          </button>
          <button type="button" className="link" onClick={() => setMostrarBannerLembretes(false)}>
            Agora não
          </button>
        </div>
      )}

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
            <span className="nav-icon-wrap">
              <Icone size={20} className="nav-icon" />
            </span>
            <span>{rotulo}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
