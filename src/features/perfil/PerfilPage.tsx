import { useEffect, useState } from 'react'
import { FloatingInput } from '../../components/FloatingInput'
import { IconCalendar, IconDumbbell, IconHeart, IconTarget, IconUser } from '../../components/icons'
import { getPerfil, savePerfil } from '../../db/repoPerfil'
import type { NivelAtividade, Objetivo, Perfil, Sexo } from '../../db/types'

const PERFIL_VAZIO: Omit<Perfil, 'id'> = {
  nome: '',
  data_nascimento: '',
  sexo: null,
  tipo_sanguineo: '',
  altura_cm: null,
  objetivo: null,
  nivel_atividade: null,
}

export function PerfilPage() {
  const [perfil, setPerfil] = useState<Omit<Perfil, 'id'>>(PERFIL_VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    getPerfil().then((p) => {
      if (p) setPerfil(p)
      setCarregando(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await savePerfil(perfil)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  if (carregando) return <p>Carregando...</p>

  return (
    <form className="page" onSubmit={handleSubmit}>
      <h2>Perfil</h2>

      <div className="card">
        <h3 className="card-title">
          <IconUser size={18} /> Dados pessoais
        </h3>

        <FloatingInput
          label="Nome"
          type="text"
          value={perfil.nome ?? ''}
          onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
        />

        <label>
          <span className="card-title">
            <IconCalendar size={16} /> Data de nascimento
          </span>
          <input
            type="date"
            value={perfil.data_nascimento ?? ''}
            onChange={(e) => setPerfil({ ...perfil, data_nascimento: e.target.value })}
          />
        </label>

        <label>
          Sexo
          <select
            value={perfil.sexo ?? ''}
            onChange={(e) => setPerfil({ ...perfil, sexo: (e.target.value || null) as Sexo | null })}
          >
            <option value="">Selecione</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </label>

        <label>
          <span className="card-title">
            <IconHeart size={16} /> Tipo sanguíneo
          </span>
          <select
            value={perfil.tipo_sanguineo ?? ''}
            onChange={(e) => setPerfil({ ...perfil, tipo_sanguineo: e.target.value || null })}
          >
            <option value="">Selecione</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card">
        <h3 className="card-title">
          <IconTarget size={18} /> Corpo e objetivo
        </h3>

        <FloatingInput
          label="Altura (cm)"
          type="number"
          inputMode="numeric"
          value={perfil.altura_cm ?? ''}
          onChange={(e) => setPerfil({ ...perfil, altura_cm: e.target.value ? Number(e.target.value) : null })}
        />

        <label>
          Objetivo
          <select
            value={perfil.objetivo ?? ''}
            onChange={(e) => setPerfil({ ...perfil, objetivo: (e.target.value || null) as Objetivo | null })}
          >
            <option value="">Selecione</option>
            <option value="perda_peso">Perda de peso</option>
            <option value="ganho_massa">Ganho de massa</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </label>

        <label>
          <span className="card-title">
            <IconDumbbell size={16} /> Nível de atividade
          </span>
          <select
            value={perfil.nivel_atividade ?? ''}
            onChange={(e) =>
              setPerfil({ ...perfil, nivel_atividade: (e.target.value || null) as NivelAtividade | null })
            }
          >
            <option value="">Selecione</option>
            <option value="sedentario">Sedentário</option>
            <option value="leve">Leve (1-3x/semana)</option>
            <option value="moderado">Moderado (3-5x/semana)</option>
            <option value="intenso">Intenso (6-7x/semana)</option>
            <option value="muito_intenso">Muito intenso (2x/dia)</option>
          </select>
        </label>
      </div>

      <div className="botoes-linha">
        <button type="submit" className="btn-primary">
          Salvar
        </button>
        {salvo && <p className="hint">Perfil salvo.</p>}
      </div>
    </form>
  )
}
