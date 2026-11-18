const dos = (n: number) => String(n).padStart(2, '0')

export function aISO(fecha: Date) {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
}

export function desdeISO(iso: string) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export const hoyISO = () => aISO(new Date())

export function sumarDias(iso: string, dias: number) {
  const fecha = desdeISO(iso)
  fecha.setDate(fecha.getDate() + dias)
  return aISO(fecha)
}

/** Lunes de la semana a la que pertenece la fecha. */
export function inicioSemana(iso: string) {
  const dia = (desdeISO(iso).getDay() + 6) % 7
  return sumarDias(iso, -dia)
}

const formatoCorto = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
const formatoLargo = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export const fechaCorta = (iso: string) => formatoCorto.format(desdeISO(iso)).replace('.', '')

export function fechaLarga(iso: string) {
  if (iso === hoyISO()) return 'Hoy'
  if (iso === sumarDias(hoyISO(), -1)) return 'Ayer'
  const texto = formatoLargo.format(desdeISO(iso)).replaceAll('.', '')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export const numero = (valor: number, decimales = 1) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: decimales }).format(valor)

export function duracion(minutos: number) {
  if (minutos < 60) return `${numero(minutos, 0)} min`
  const horas = Math.floor(minutos / 60)
  const resto = Math.round(minutos - horas * 60)
  return resto ? `${horas} h ${resto} min` : `${horas} h`
}

export function tiempo(segundos: number) {
  const total = Math.round(segundos)
  return `${Math.floor(total / 60)}:${dos(total % 60)}`
}

/** Acepta coma o punto, porque el teclado del iPhone en español escribe coma. */
export function leerDecimal(texto: string) {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') return null
  return /^\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : Number.NaN
}

export function leerEntero(texto: string) {
  const valor = leerDecimal(texto)
  return valor !== null && !Number.isInteger(valor) ? Number.NaN : valor
}

export const decimalATexto = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '' : String(valor).replace('.', ',')

/** El teclado numérico del iPhone no tiene «:», así que el tiempo se escribe solo con dígitos. */
export function digitosATiempo(digitos: string) {
  if (digitos.length <= 2) return digitos
  return `${digitos.slice(0, -2)}:${digitos.slice(-2)}`
}

export function digitosASegundos(digitos: string) {
  if (digitos === '') return null
  const segundos = Number(digitos.slice(-2))
  const minutos = Number(digitos.slice(0, -2) || 0)
  return minutos * 60 + segundos
}

export function segundosADigitos(segundos: number | null | undefined) {
  if (segundos === null || segundos === undefined) return ''
  const total = Math.round(segundos)
  const minutos = Math.floor(total / 60)
  return minutos > 0 ? `${minutos}${dos(total % 60)}` : String(total)
}

let contador = 0
/** Identificador temporal para las filas de los formularios. */
export const nuevaClave = () => `f${Date.now()}-${contador++}`
