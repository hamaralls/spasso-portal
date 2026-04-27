export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  })
}

export function formatDateTimeAdmin(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'America/Sao_Paulo' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }),
  }
}

export function readingTime(htmlContent: string): number {
  const text = htmlContent.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'ontem'
  return formatDateShort(dateStr)
}
