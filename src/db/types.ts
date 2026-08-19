export type Sexo = 'M' | 'F'
export type Objetivo = 'perda_peso' | 'ganho_massa' | 'manutencao'
export type NivelAtividade = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso'

export interface Perfil {
  id: 1
  nome: string | null
  data_nascimento: string | null
  sexo: Sexo | null
  tipo_sanguineo: string | null
  altura_cm: number | null
  objetivo: Objetivo | null
  nivel_atividade: NivelAtividade | null
}

export interface MedidaAntropometrica {
  id: number
  data: string
  peso_kg: number | null
  percentual_gordura: number | null
  cintura_cm: number | null
  quadril_cm: number | null
  peito_cm: number | null
  braco_cm: number | null
  coxa_cm: number | null
  pescoco_cm: number | null
}

export interface RegistroHidratacao {
  id: number
  data: string
  ml_consumido: number
}

export interface RegistroSono {
  id: number
  data: string
  horas: number
  qualidade: number | null
}

export interface RegistroNutricao {
  id: number
  data: string
  calorias: number | null
  proteina_g: number | null
  carboidrato_g: number | null
  gordura_g: number | null
}

export interface PlanoTreino {
  id: number
  nome: string
  ativo: number
}

export interface ExercicioPlano {
  id: number
  plano_id: number
  nome: string
  ordem: number
  series: number | null
  repeticoes: number | null
  carga_kg: number | null
  descanso_seg: number | null
}

export interface RegistroTreino {
  id: number
  plano_id: number | null
  data: string
}

export interface ExecucaoExercicio {
  id: number
  registro_treino_id: number
  exercicio_plano_id: number | null
  nome: string
  series_feitas: number | null
  repeticoes_feitas: number | null
  carga_kg: number | null
  descanso_seg: number | null
  concluido: number
}
