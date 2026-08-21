export const SCHEMA_VERSION = 5

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS perfil (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nome TEXT,
  data_nascimento TEXT,
  sexo TEXT CHECK (sexo IN ('M', 'F')),
  tipo_sanguineo TEXT,
  altura_cm REAL,
  objetivo TEXT CHECK (objetivo IN ('perda_peso', 'ganho_massa', 'manutencao')),
  nivel_atividade TEXT CHECK (nivel_atividade IN ('sedentario', 'leve', 'moderado', 'intenso', 'muito_intenso'))
);

CREATE TABLE IF NOT EXISTS medidas_antropometricas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  hora TEXT,
  peso_kg REAL,
  percentual_gordura REAL,
  cintura_cm REAL,
  quadril_cm REAL,
  peito_cm REAL,
  braco_cm REAL,
  coxa_cm REAL,
  pescoco_cm REAL
);

CREATE TABLE IF NOT EXISTS registros_hidratacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  hora TEXT,
  ml_consumido INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS registros_sono (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  hora TEXT,
  horas REAL NOT NULL,
  qualidade INTEGER
);

CREATE TABLE IF NOT EXISTS registros_nutricao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  hora TEXT,
  descricao TEXT,
  calorias INTEGER,
  proteina_g REAL,
  carboidrato_g REAL,
  gordura_g REAL
);

-- Medida pretendida por tipo de medida antropométrica (peso alvo, cintura alvo, etc), pra comparar com o registro mais recente.
CREATE TABLE IF NOT EXISTS metas_medidas (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  peso_kg REAL,
  percentual_gordura REAL,
  cintura_cm REAL,
  quadril_cm REAL,
  peito_cm REAL,
  braco_cm REAL,
  coxa_cm REAL,
  pescoco_cm REAL
);

-- Plano nutricional estabelecido (editável); quando ausente, o app usa metas calculadas do perfil.
CREATE TABLE IF NOT EXISTS planos_nutricionais (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  calorias INTEGER,
  proteina_g REAL,
  carboidrato_g REAL,
  gordura_g REAL,
  agua_ml INTEGER,
  sono_horas REAL,
  criado_em TEXT
);

CREATE TABLE IF NOT EXISTS planos_treino (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  ativo INTEGER DEFAULT 1,
  criado_em TEXT NOT NULL
);

-- Um dia da semana dentro da ficha (cabeçalho). dia_semana: 0=domingo ... 6=sábado.
CREATE TABLE IF NOT EXISTS dias_plano (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plano_id INTEGER NOT NULL REFERENCES planos_treino(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL,
  nome TEXT
);

CREATE TABLE IF NOT EXISTS exercicios_plano (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dia_plano_id INTEGER NOT NULL REFERENCES dias_plano(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  series INTEGER,
  repeticoes INTEGER,
  carga_kg REAL,
  descanso_seg INTEGER
);

-- Uma instância de execução: o dia da ficha, realizado numa data específica.
CREATE TABLE IF NOT EXISTS registros_treino (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dia_plano_id INTEGER NOT NULL REFERENCES dias_plano(id),
  data TEXT NOT NULL,
  hora TEXT
);

CREATE TABLE IF NOT EXISTS execucoes_exercicio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registro_treino_id INTEGER NOT NULL REFERENCES registros_treino(id) ON DELETE CASCADE,
  exercicio_plano_id INTEGER REFERENCES exercicios_plano(id),
  nome TEXT NOT NULL,
  series_feitas INTEGER,
  repeticoes_feitas INTEGER,
  carga_kg REAL,
  descanso_seg INTEGER,
  concluido INTEGER DEFAULT 0
);

-- Trilha de eventos do treino (início/fim de sessão, cronômetro, conclusão de exercício) — usada para métricas futuras.
CREATE TABLE IF NOT EXISTS logs_treino (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registro_treino_id INTEGER REFERENCES registros_treino(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  detalhe TEXT,
  criado_em TEXT NOT NULL
);
`
