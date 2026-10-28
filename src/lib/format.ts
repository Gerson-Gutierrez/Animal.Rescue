/** "2026-10-20" -> "20/10/2026" (sin pasar por Date para no desplazar el día por zona horaria). */
export function formatFecha(fecha: string): string {
  const [a, m, d] = fecha.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

export function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Hora si es de hoy, "Ayer" o fecha corta. */
export function formatHoraChat(iso: string): string {
  const fecha = new Date(iso)
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(hoy.getDate() - 1)
  if (fecha.toDateString() === hoy.toDateString()) return fecha.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  if (fecha.toDateString() === ayer.toDateString()) return 'Ayer'
  return fecha.toLocaleDateString('es', { day: '2-digit', month: '2-digit' })
}

export function formatMoneda(valor: number): string {
  return valor.toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export function hoyISO(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
