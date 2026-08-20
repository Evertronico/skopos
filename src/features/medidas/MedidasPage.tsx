import { useEffect, useState } from 'react'
import { FloatingInput } from '../../components/FloatingInput'
import { WeightChart } from '../../components/WeightChart'
import { IconCalendar, IconCheck, IconRuler } from '../../components/icons'
import { addMedida, deleteMedida, listMedidas, updateMedida } from '../../db/repoMedidas'
import type { MedidaAntropometrica } from '../../db/types'
import { formatDataBR, todayISO } from '../../lib/date'

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
  const [form, setForm] = useState<NovaMedida>(MEDIDA_VAZIA)
  const [editandoId, setEditandoId] = useState<number | null>(null)

  async function recarregar() {
    setMedidas(await listMedidas())
  }

  useEffect(() => {
    recarregar()
  }, [])

  function iniciarEdicao(m: MedidaAntropometrica) {
    const { id, ...resto } = m
    setEditandoId(id)
    setForm(resto)
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setForm({ ...MEDIDA_VAZIA, data: todayISO() })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editandoId !== null) {
      await updateMedida(editandoId, form)
    } else {
      await addMedida(form)
    }
    cancelarEdicao()
    await recarregar()
  }

  async function handleDelete(id: number) {
    await deleteMedida(id)
    if (editandoId === id) cancelarEdicao()
    await recarregar()
  }

  return (
    <div className="page">
      <h2>Medidas antropométricas</h2>

      <div className="card">
        <h3 className="card-title">
          <IconRuler size={18} /> Evolução do peso
        </h3>
        <WeightChart pontos={medidas} />
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <h3 className="card-title">
          <IconCheck size={18} /> {editandoId !== null ? 'Editar medida' : 'Nova medida'}
        </h3>
        {editandoId !== null && <p className="hint">Editando medida de {formatDataBR(form.data)}.</p>}

        <label>
          <span className="card-title">
            <IconCalendar size={16} /> Data
          </span>
          <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </label>

        <div className="campos-grid">
          {CAMPOS.map(({ chave, rotulo }) => (
            <FloatingInput
              key={chave}
              label={rotulo}
              type="number"
              inputMode="decimal"
              step="0.1"
              value={(form[chave] as number | null) ?? ''}
              onChange={(e) => setForm({ ...form, [chave]: e.target.value ? Number(e.target.value) : null })}
            />
          ))}
        </div>

        <div className="botoes-linha">
          <button type="submit" className="btn-primary">
            {editandoId !== null ? 'Salvar alterações' : 'Registrar medida'}
          </button>
          {editandoId !== null && (
            <button type="button" onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h3>Histórico</h3>
        <ul className="list">
          {medidas.map((m) => (
            <li key={m.id} className={m.id === editandoId ? 'list-item-ativo' : undefined}>
              <button className="list-item-conteudo" onClick={() => iniciarEdicao(m)}>
                {formatDataBR(m.data)} — {m.peso_kg ?? '—'} kg
              </button>
              <button
                className="link-danger"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(m.id)
                }}
              >
                excluir
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
