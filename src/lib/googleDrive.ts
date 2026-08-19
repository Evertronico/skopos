const GIS_SRC = 'https://accounts.google.com/gsi/client'
const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files'
const BACKUP_FILENAME = 'skopos-backup.sqlite'
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }): { requestAccessToken: () => void }
        }
      }
    }
  }
}

let gisLoadPromise: Promise<void> | null = null

function loadGisScript(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'))
    document.head.appendChild(script)
  })

  return gisLoadPromise
}

export async function requestAccessToken(clientId: string): Promise<string> {
  await loadGisScript()

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts) {
      reject(new Error('Google Identity Services indisponível'))
      return
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.access_token) resolve(response.access_token)
        else reject(new Error(response.error ?? 'Autorização negada'))
      },
    })

    client.requestAccessToken()
  })
}

async function findBackupFileId(accessToken: string): Promise<string | null> {
  const params = new URLSearchParams({
    q: `name = '${BACKUP_FILENAME}'`,
    spaces: 'appDataFolder',
    fields: 'files(id, modifiedTime, size)',
  })

  const res = await fetch(`${DRIVE_API}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Falha ao consultar backups: ${res.status}`)

  const data = (await res.json()) as { files: { id: string }[] }
  return data.files[0]?.id ?? null
}

export interface BackupInfo {
  modifiedTime: string
  size: number
}

export async function getBackupInfo(accessToken: string): Promise<BackupInfo | null> {
  const params = new URLSearchParams({
    q: `name = '${BACKUP_FILENAME}'`,
    spaces: 'appDataFolder',
    fields: 'files(modifiedTime, size)',
  })

  const res = await fetch(`${DRIVE_API}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Falha ao consultar backups: ${res.status}`)

  const data = (await res.json()) as { files: { modifiedTime: string; size: string }[] }
  const file = data.files[0]
  return file ? { modifiedTime: file.modifiedTime, size: Number(file.size) } : null
}

export async function uploadBackup(accessToken: string, bytes: Uint8Array): Promise<void> {
  const existingId = await findBackupFileId(accessToken)
  const body = new Blob([bytes as BlobPart], { type: 'application/octet-stream' })

  if (existingId) {
    const res = await fetch(`${DRIVE_UPLOAD_API}/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body,
    })
    if (!res.ok) throw new Error(`Falha ao atualizar backup: ${res.status}`)
    return
  }

  const metadata = { name: BACKUP_FILENAME, parents: ['appDataFolder'] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', body)

  const res = await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (!res.ok) throw new Error(`Falha ao criar backup: ${res.status}`)
}

export async function downloadBackup(accessToken: string): Promise<Uint8Array | null> {
  const fileId = await findBackupFileId(accessToken)
  if (!fileId) return null

  const res = await fetch(`${DRIVE_API}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Falha ao baixar backup: ${res.status}`)

  const buffer = await res.arrayBuffer()
  return new Uint8Array(buffer)
}
