import { useState } from 'react'
import { exportDbAsJson, exportDbFile, importDbFile } from '../../db/database'
import { downloadBackup, getBackupInfo, requestAccessToken, uploadBackup, type BackupInfo } from '../../lib/googleDrive'

const CLIENT_ID_KEY = 'skopos-google-client-id'

function baixarArquivo(bytes: Uint8Array, nomeArquivo: string, tipo: string) {
  const blob = new Blob([bytes as BlobPart], { type: tipo })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)
}

export function BackupPage() {
  const [clientId, setClientId] = useState(localStorage.getItem(CLIENT_ID_KEY) ?? '')
  const [status, setStatus] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<BackupInfo | null>(null)
  const [carregando, setCarregando] = useState(false)

  function salvarClientId(valor: string) {
    setClientId(valor)
    localStorage.setItem(CLIENT_ID_KEY, valor)
  }

  async function comToken<T>(acao: (token: string) => Promise<T>): Promise<T | null> {
    if (!clientId.trim()) {
      setErro('Informe o Client ID do Google antes de continuar.')
      return null
    }
    setErro(null)
    setCarregando(true)
    try {
      const token = await requestAccessToken(clientId.trim())
      return await acao(token)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
      return null
    } finally {
      setCarregando(false)
    }
  }

  async function handleEnviarBackup() {
    const bytes = await exportDbFile()
    await comToken(async (token) => {
      await uploadBackup(token, bytes)
      setStatus('Backup enviado ao Google Drive.')
      setInfo(await getBackupInfo(token))
    })
  }

  async function handleVerificarBackup() {
    await comToken(async (token) => {
      const dados = await getBackupInfo(token)
      setInfo(dados)
      setStatus(dados ? null : 'Nenhum backup encontrado no Drive ainda.')
    })
  }

  async function handleRestaurarBackup() {
    if (!confirm('Isso substitui todos os dados locais pelo backup do Drive. Continuar?')) return
    await comToken(async (token) => {
      const bytes = await downloadBackup(token)
      if (!bytes) {
        setStatus('Nenhum backup encontrado no Drive.')
        return
      }
      await importDbFile(bytes)
      setStatus('Dados restaurados do Drive. Recarregando...')
      setTimeout(() => window.location.reload(), 1000)
    })
  }

  async function handleExportarSqlite() {
    const bytes = await exportDbFile()
    baixarArquivo(bytes, 'skopos-backup.sqlite', 'application/octet-stream')
  }

  async function handleExportarJson() {
    const dados = await exportDbAsJson()
    const bytes = new TextEncoder().encode(JSON.stringify(dados, null, 2))
    baixarArquivo(bytes, 'skopos-backup.json', 'application/json')
  }

  async function handleImportarSqlite(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    if (!confirm('Isso substitui todos os dados locais pelo arquivo importado. Continuar?')) return
    const bytes = new Uint8Array(await arquivo.arrayBuffer())
    await importDbFile(bytes)
    setStatus('Dados importados. Recarregando...')
    setTimeout(() => window.location.reload(), 1000)
  }

  return (
    <div className="page">
      <h2>Backup</h2>

      <section>
        <h3>Google Drive</h3>
        <p className="hint">
          Os dados vão para uma pasta privada do app no seu Drive (não visível no seu Drive normal). É
          necessário um Client ID OAuth do Google Cloud Console com a API do Drive habilitada.
        </p>
        <label>
          Client ID do Google
          <input
            type="text"
            value={clientId}
            onChange={(e) => salvarClientId(e.target.value)}
            placeholder="xxxxx.apps.googleusercontent.com"
          />
        </label>

        <div className="botoes-linha">
          <button className="btn-primary" onClick={handleEnviarBackup} disabled={carregando}>
            Enviar backup
          </button>
          <button onClick={handleVerificarBackup} disabled={carregando}>
            Verificar último backup
          </button>
          <button onClick={handleRestaurarBackup} disabled={carregando}>
            Restaurar do Drive
          </button>
        </div>

        {info && (
          <p className="hint">
            Último backup: {new Date(info.modifiedTime).toLocaleString('pt-BR')} (
            {(info.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {status && <p className="hint">{status}</p>}
        {erro && <p className="erro">{erro}</p>}
      </section>

      <section>
        <h3>Arquivo local</h3>
        <div className="botoes-linha">
          <button onClick={handleExportarSqlite}>Exportar .sqlite</button>
          <button onClick={handleExportarJson}>Exportar .json (leitura)</button>
        </div>
        <label>
          Importar .sqlite
          <input type="file" accept=".sqlite,.db" onChange={handleImportarSqlite} />
        </label>
      </section>
    </div>
  )
}
