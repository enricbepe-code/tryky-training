import {
  db,
  type Ejercicio,
  type Entreno,
  type Natacion,
  type RegistroPeso,
  type SerieGym,
} from './esquema'

const APP = 'tryky-training'
const VERSION = 1

export interface DatosRespaldo {
  entrenos: Entreno[]
  natacion: Natacion[]
  ejercicios: Ejercicio[]
  seriesGym: SerieGym[]
  peso: RegistroPeso[]
}

export interface Respaldo {
  app: typeof APP
  version: number
  exportadoEn: string
  datos: DatosRespaldo
}

export async function crearRespaldo(): Promise<Respaldo> {
  const [entrenos, natacion, ejercicios, seriesGym, peso] = await Promise.all([
    db.entrenos.toArray(),
    db.natacion.toArray(),
    db.ejercicios.toArray(),
    db.seriesGym.toArray(),
    db.peso.toArray(),
  ])
  return {
    app: APP,
    version: VERSION,
    exportadoEn: new Date().toISOString(),
    datos: { entrenos, natacion, ejercicios, seriesGym, peso },
  }
}

type Registro = Record<string, unknown>

const esObjeto = (v: unknown): v is Registro =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const esNumeroONulo = (v: unknown) => v === null || esNumero(v)
const esTextoONulo = (v: unknown) => v === null || typeof v === 'string'

function esFecha(v: unknown) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [a, m, d] = v.split('-').map(Number)
  const fecha = new Date(a, m - 1, d)
  return fecha.getFullYear() === a && fecha.getMonth() === m - 1 && fecha.getDate() === d
}

function comprobar(lista: unknown, nombre: string, valido: (r: Registro) => boolean): Registro[] {
  if (!Array.isArray(lista)) throw new Error(`Falta la lista «${nombre}».`)
  lista.forEach((registro, i) => {
    if (!esObjeto(registro) || !valido(registro)) {
      throw new Error(`El registro ${i + 1} de «${nombre}» no es válido.`)
    }
  })
  return lista as Registro[]
}

function sinRepetidos(valores: unknown[], nombre: string) {
  if (new Set(valores).size !== valores.length) {
    throw new Error(`Hay registros repetidos en «${nombre}».`)
  }
}

/** Valida el archivo completo antes de tocar los datos del dispositivo. */
export function validarRespaldo(contenido: unknown): Respaldo {
  if (!esObjeto(contenido) || contenido.app !== APP) {
    throw new Error('Este archivo no es una copia de Tryky Training.')
  }
  if (contenido.version !== VERSION) {
    throw new Error('La versión de esta copia no es compatible.')
  }
  const datos = contenido.datos
  if (!esObjeto(datos)) throw new Error('La copia no contiene datos.')

  const entrenos = comprobar(
    datos.entrenos,
    'entrenos',
    (r) =>
      esNumero(r.id) &&
      esFecha(r.fecha) &&
      ['natacion', 'gimnasio', 'otro'].includes(r.tipo as string) &&
      esNumeroONulo(r.duracionMin) &&
      esNumeroONulo(r.kcal) &&
      esNumeroONulo(r.pulsoMedio) &&
      ['watch', 'manual'].includes(r.origen as string) &&
      esTextoONulo(r.idExterno) &&
      typeof r.notas === 'string',
  )
  const natacion = comprobar(
    datos.natacion,
    'natacion',
    (r) =>
      esNumero(r.entrenoId) &&
      esNumero(r.metros) &&
      esNumeroONulo(r.ritmo50s) &&
      esNumeroONulo(r.swolf) &&
      esNumeroONulo(r.brazadas50) &&
      Array.isArray(r.series) &&
      r.series.every(
        (s) =>
          esObjeto(s) &&
          esNumero(s.metros) &&
          typeof s.estilo === 'string' &&
          esNumero(s.tiempoS) &&
          esNumero(s.descansoS),
      ),
  )
  const ejercicios = comprobar(
    datos.ejercicios,
    'ejercicios',
    (r) => esNumero(r.id) && typeof r.nombre === 'string' && typeof r.grupo === 'string',
  )
  const seriesGym = comprobar(
    datos.seriesGym,
    'seriesGym',
    (r) =>
      esNumero(r.entrenoId) &&
      esNumero(r.ejercicioId) &&
      esNumero(r.orden) &&
      esNumero(r.reps) &&
      esNumero(r.kg),
  )
  const peso = comprobar(
    datos.peso,
    'peso',
    (r) => esFecha(r.fecha) && esNumero(r.kg) && typeof r.notas === 'string',
  )

  sinRepetidos(entrenos.map((r) => r.id), 'entrenos')
  sinRepetidos(natacion.map((r) => r.entrenoId), 'natacion')
  sinRepetidos(ejercicios.map((r) => r.id), 'ejercicios')
  sinRepetidos(ejercicios.map((r) => r.nombre), 'ejercicios')
  sinRepetidos(seriesGym.map((r) => `${r.entrenoId}-${r.orden}`), 'seriesGym')
  sinRepetidos(peso.map((r) => r.fecha), 'peso')

  const idsEntrenos = new Set(entrenos.map((r) => r.id))
  const idsEjercicios = new Set(ejercicios.map((r) => r.id))
  if (natacion.some((r) => !idsEntrenos.has(r.entrenoId))) {
    throw new Error('Hay datos de natación sin su entreno.')
  }
  if (seriesGym.some((r) => !idsEntrenos.has(r.entrenoId) || !idsEjercicios.has(r.ejercicioId))) {
    throw new Error('Hay series de gimnasio sin su entreno o ejercicio.')
  }

  return contenido as unknown as Respaldo
}

export async function leerArchivoRespaldo(archivo: File) {
  let contenido: unknown
  try {
    contenido = JSON.parse(await archivo.text())
  } catch {
    throw new Error('El archivo no contiene un JSON válido.')
  }
  return validarRespaldo(contenido)
}

/** Sustituye todos los datos. Si algo falla, la transacción deja los datos como estaban. */
export async function restaurarRespaldo({ datos }: Respaldo) {
  await db.transaction(
    'rw',
    [db.entrenos, db.natacion, db.ejercicios, db.seriesGym, db.peso],
    async () => {
      await Promise.all([
        db.entrenos.clear(),
        db.natacion.clear(),
        db.ejercicios.clear(),
        db.seriesGym.clear(),
        db.peso.clear(),
      ])
      await db.entrenos.bulkAdd(datos.entrenos)
      await db.natacion.bulkAdd(datos.natacion)
      await db.ejercicios.bulkAdd(datos.ejercicios)
      await db.seriesGym.bulkAdd(datos.seriesGym)
      await db.peso.bulkAdd(datos.peso)
    },
  )
}

/** En el iPhone abre la hoja de compartir, y así se puede guardar en Archivos o iCloud. */
export async function exportarArchivo(respaldo: Respaldo, nombre: string) {
  const archivo = new File([JSON.stringify(respaldo, null, 2)], nombre, {
    type: 'application/json',
  })
  if (navigator.maxTouchPoints > 0 && navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo] })
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false
    }
  }
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return true
}
