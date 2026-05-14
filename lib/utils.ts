export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-DE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
