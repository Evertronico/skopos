import { useEffect, useState } from 'react'
import { DateNavigator } from '../../components/DateNavigator'
import { FloatingInput } from '../../components/FloatingInput'
import { WeightChart } from '../../components/WeightChart'
import { IconCheck, IconRuler, IconTarget, IconTrash } from '../../components/icons'
import { addMedida, deleteMedida, getMedidaPorData, listMedidas, updateMedida } from '../../db/repoMedidas'
import { getMetasMedidas, salvarMetasMedidas } from '../../db/repoMetasMedidas'
import type { MedidaAntropometrica } from '../../db/types'
import { formatDataHoraBR, nowHHMM, todayISO } from '../../lib/date'

const CAMPOS: { chave: Exclude<keyof MedidaAntropometrica, 'id' | 'data' | 'hora'>; rotulo: string }[] = [
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
type MetaMedidas = Omit<MedidaAntropometrica, 'id' | 'data' | 'hora'>

function medidaVazia(data: string): NovaMedida {
  return {
    data,
    hora: nowHHMM(),
    peso_kg: null,
    percentual_gordura: null,
    cintura_cm: null,
    quadril_cm: null,
    peito_cm: null,
    braco_cm: null,
    coxa_cm: null,
    pescoco_cm: null,
  }
}

const META_VAZIA: MetaMedidas = {
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
  const [diaAtual, setDiaAtual] = useState(todayISO())
  const [form, setForm] = useState<NovaMedida>(medidaVazia(todayISO()))
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const [meta, setMeta] = useState<MetaMedidas>(META_VAZIA)
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [temMeta, setTemMeta] = useState(false)

  async function recarregar() {
    const [lista, metaSalva] = await Promise.all([listMedidas(), getMetasMedidas()])
    setMedidas(lista)
    if (metaSalva) {
      const { id: _id, ...resto } = metaSalva
      setMeta(resto)
      setTemMeta(true)
    } else {
      setTemMeta(false)
    }
  }

  useEffect(() => {
    recarregar()
  }, [])

  useEffect(() => {
    getMedidaPorData(diaAtual).then((m) => {
      if (m) {
        const { id, ...resto } = m
        setEditandoId(id)
        setForm(resto)
      } else {
        setEditandoId(null)
        setForm(medidaVazia(diaAtual))
      }
    })
  }, [diaAtual])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editandoId !== null) {
      await updateMedida(editandoId, form)
    } else {
      await addMedida(form)
    }
    await recarregar()
  }

  async function handleDelete(id: number) {
    await deleteMedida(id)
    if (editandoId === id) {
      setEditandoId(null)
      setForm(medidaVazia(diaAtual))
    }
    await recarregar()
  }

  async function handleSalvarMeta(e: React.FormEvent) {
    e.preventDefault()
    await salvarMetasMedidas(meta)
    setEditandoMeta(false)
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

      <div className="card">
        <div className="section-header">
          <h3 className="card-title">
            <IconTarget size={18} /> Meta de medidas
          </h3>
          {!editandoMeta && (
            <button className="link" onClick={() => setEditandoMeta(true)}>
              {temMeta ? 'editar' : 'definir'}
            </button>
          )}
        </div>

        {!editandoMeta && !temMeta && (
          <p className="hint">Defina os valores que você pretende alcançar pra comparar com suas medidas no dashboard.</p>
        )}

        {!editandoMeta && temMeta && (
          <ul className="list-compact">
            {CAMPOS.filter(({ chave }) => meta[chave] !== null).map(({ chave, rotulo }) => (
              <li key={chave}>
                {rotulo}: {meta[chave]}
              </li>
            ))}
          </ul>
        )}

        {editandoMeta && (
          <form className="form-page" onSubmit={handleSalvarMeta}>
            <div className="campos-grid">
              {CAMPOS.map(({ chave, rotulo }) => (
                <FloatingInput
                  key={chave}
                  label={rotulo}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={meta[chave] ?? ''}
                  onChange={(e) => setMeta({ ...meta, [chave]: e.target.value ? Number(e.target.value) : null })}
                />
              ))}
            </div>
            <div className="botoes-linha">
              <button type="submit" className="btn-primary">
                Salvar meta
              </button>
              <button type="button" onClick={() => setEditandoMeta(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <h3 className="card-title">
          <IconCheck size={18} /> {editandoId !== null ? 'Editar medida' : 'Nova medida'}
        </h3>

        <DateNavigator data={diaAtual} onChange={setDiaAtual} />

        <FloatingInput
          label="Hora"
          type="time"
          className="horario-campo"
          value={form.hora ?? ''}
          onChange={(e) => setForm({ ...form, hora: e.target.value || null })}
        />

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

        <button type="submit" className="btn-primary">
          {editandoId !== null ? 'Salvar alterações' : 'Registrar medida'}
        </button>
      </form>

      <div className="card">
        <h3>Histórico</h3>
        <ul className="list">
          {medidas.map((m) => (
            <li key={m.id} className={m.id === editandoId ? 'list-item-ativo' : undefined}>
              <button className="list-item-conteudo" onClick={() => setDiaAtual(m.data)}>
                {formatDataHoraBR(m.data, m.hora)} — {m.peso_kg ?? '—'} kg
              </button>
              <button
                className="icon-danger"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(m.id)
                }}
                aria-label="Excluir"
              >
                <IconTrash size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
