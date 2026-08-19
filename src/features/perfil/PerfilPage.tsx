import { useEffect, useState } from 'react'
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
    <form className="form-page" onSubmit={handleSubmit}>
      <h2>Perfil</h2>

      <label>
        Nome
        <input
          type="text"
          value={perfil.nome ?? ''}
          onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
        />
      </label>

      <label>
        Data de nascimento
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
        Tipo sanguíneo
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

      <label>
        Altura (cm)
        <input
          type="number"
          value={perfil.altura_cm ?? ''}
          onChange={(e) => setPerfil({ ...perfil, altura_cm: e.target.value ? Number(e.target.value) : null })}
        />
      </label>

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
        Nível de atividade
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

      <button type="submit">Salvar</button>
      {salvo && <p className="hint">Perfil salvo.</p>}
    </form>
  )
}
