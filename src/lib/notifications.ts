/**
 * Notificações locais (Notification API) + vibração. Não são "push" de verdade: o app é estático,
 * sem servidor, então nada chega com o app fechado — isso exigiria um backend de push (Web Push +
 * VAPID) disparando de fora do dispositivo. O que dá pra fazer sem servidor é notificar enquanto a
 * aba/app está aberto (em primeiro ou segundo plano), que é o que essas funções fazem.
 */

export function suportaNotificacao(): boolean {
  return 'Notification' in window
}

export function permissaoNotificacao(): NotificationPermission | 'indisponivel' {
  return suportaNotificacao() ? Notification.permission : 'indisponivel'
}

export async function pedirPermissaoNotificacao(): Promise<boolean> {
  if (!suportaNotificacao()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const resultado = await Notification.requestPermission()
  return resultado === 'granted'
}

export function vibrar(padrao: number | number[] = [200, 100, 200]): void {
  if ('vibrate' in navigator) navigator.vibrate(padrao)
}

export async function notificar(titulo: string, opcoes?: NotificationOptions): Promise<void> {
  if (!suportaNotificacao() || Notification.permission !== 'granted') return
  try {
    const registro = await navigator.serviceWorker?.getRegistration()
    if (registro) {
      await registro.showNotification(titulo, opcoes)
    } else {
      new Notification(titulo, opcoes)
    }
  } catch {
    // notificação é um extra — nunca deve quebrar o resto do app
  }
}
