import { useEffect, useState } from 'react'
import { WeightChart } from '../../components/WeightChart'
import { addMedida, deleteMedida, listMedidas } from '../../db/repoMedidas'
import type { MedidaAntropometrica } from '../../db/types'
import { todayISO } from '../../lib/date'

const CAMPOS: { chave: Exclude<keyof MedidaAntropometrica, 'id' | 'data'>; rotulo: string }[] = [
  { chave: 'peso_kg', rotulo: 'Peso (kg)' },
  { chave: 'percentual_gordura', rotulo: '% Gordura' },
  { chave: 'cintura_cm', rotulo: 'Cintura (cm)' },
  { chave: 'quadril_cm', rotulo: 'Quadril (cm)' },
  { chave: 'peito_cm', rotulo: 'Peito (cm)' },
  { chave: 'braco_cm', rotulo: 'Braço (cm)' },
  { chave: 'coxa_cm', rotulo: 'Coxa (cm)' },
  { chave: 'pescoco_cm', rotulo: 'Pescoço (cm)' },
]

type NovaMedida = Omit<MedidaAntropometrica, 'id'>

const MEDIDA_VAZIA: NovaMedida = {
  data: todayISO(),
  peso_kg: null,
  percentual_gordura: null,
  cintura_cm: null,
  quadril_cm: null,
  peito_cm: null,
  braco_cm: null,
  coxa_cm: null,
  pescoco_cm: null,
}

export function MedidasPage() {
  const [medidas, setMedidas] = useState<MedidaAntropometrica[]>([])
  const [nova, setNova] = useState<NovaMedida>(MEDIDA_VAZIA)

  async function recarregar() {
    setMedidas(await listMedidas())
  }

  useEffect(() => {
    recarregar()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await addMedida(nova)
    setNova({ ...MEDIDA_VAZIA, data: todayISO() })
    await recarregar()
  }

  async function handleDelete(id: number) {
    await deleteMedida(id)
    await recarregar()
  }

  return (
    <div className="page">
      <h2>Medidas antropométricas</h2>

      <WeightChart pontos={medidas} />

      <form className="form-page" onSubmit={handleSubmit}>
        <label>
          Data
          <input type="date" value={nova.data} onChange={(e) => setNova({ ...nova, data: e.target.value })} />
        </label>

        {CAMPOS.map(({ chave, rotulo }) => (
          <label key={chave}>
            {rotulo}
            <input
              type="number"
              step="0.1"
              value={(nova[chave] as number | null) ?? ''}
              onChange={(e) =>
                setNova({ ...nova, [chave]: e.target.value ? Number(e.target.value) : null })
              }
            />
          </label>
        ))}

        <button type="submit">Registrar medida</button>
      </form>

      <ul className="list">
        {medidas.map((m) => (
          <li key={m.id}>
            <span>
              {m.data} — {m.peso_kg ?? '—'} kg
            </span>
            <button className="link-danger" onClick={() => handleDelete(m.id)}>
              excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
