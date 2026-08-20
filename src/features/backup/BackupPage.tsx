import { useState } from 'react'
import { IconCheck, IconCloud } from '../../components/icons'
import { exportDbAsJson, exportDbFile, importDbFile } from '../../db/database'

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
  const [status, setStatus] = useState<string | null>(null)

  async function handleExportarSqlite() {
    const bytes = await exportDbFile()
    baixarArquivo(bytes, 'skopos-backup.sqlite', 'application/octet-stream')
    setStatus('Arquivo .sqlite baixado.')
  }

  async function handleExportarJson() {
    const dados = await exportDbAsJson()
    const bytes = new TextEncoder().encode(JSON.stringify(dados, null, 2))
    baixarArquivo(bytes, 'skopos-backup.json', 'application/json')
    setStatus('Arquivo .json baixado.')
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

      <div className="card">
        <h3 className="card-title">
          <IconCloud size={18} /> Arquivo local
        </h3>
        <p className="hint">
          Por enquanto o backup é feito exportando um arquivo pro seu celular/computador — guarde-o em um lugar
          seguro (Google Drive, iCloud, etc). O .sqlite é a cópia completa e restaurável; o .json é só pra
          leitura/conferência.
        </p>

        <div className="botoes-linha">
          <button className="btn-primary" onClick={handleExportarSqlite}>
            Exportar .sqlite
          </button>
          <button onClick={handleExportarJson}>Exportar .json (leitura)</button>
        </div>

        <label>
          <span className="card-title">
            <IconCheck size={16} /> Importar .sqlite
          </span>
          <input type="file" accept=".sqlite,.db" onChange={handleImportarSqlite} />
        </label>

        {status && <p className="hint">{status}</p>}
      </div>
    </div>
  )
}
