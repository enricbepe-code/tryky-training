import {
  db,
  type Ejercicio,
  type Entreno,
  type Natacion,
  type RegistroPeso,
  type SerieGym,
  type TipoEntreno,
} from './esquema'

export interface EntrenoDetalle {
  entreno: Entreno
  natacion?: Natacion
  ejercicios: number
  series: number
  volumenKg: number
}

function masReciente(a: Entreno, b: Entreno) {
  return b.fecha.localeCompare(a.fecha) || (b.id ?? 0) - (a.id ?? 0)
}

async function anadirDetalle(entrenos: Entreno[]): Promise<EntrenoDetalle[]> {
  const ids = entrenos.map((e) => e.id!)
  const [natacion, series] = await Promise.all([
    db.natacion.where('entrenoId').anyOf(ids).toArray(),
    db.seriesGym.where('entrenoId').anyOf(ids).toArray(),
  ])
  const natacionPorId = new Map(natacion.map((n) => [n.entrenoId, n]))
  return entrenos.map((entreno) => {
    const propias = series.filter((s) => s.entrenoId === entreno.id)
    return {
      entreno,
      natacion: natacionPorId.get(entreno.id!),
      ejercicios: new Set(propias.map((s) => s.ejercicioId)).size,
      series: propias.length,
      volumenKg: propias.reduce((total, s) => total + s.reps * s.kg, 0),
    }
  })
}

export async function entrenosEntre(desde: string, hasta: string) {
  const entrenos = await db.entrenos.where('fecha').between(desde, hasta, true, true).toArray()
  return anadirDetalle(entrenos.sort(masReciente))
}

export async function entrenosPorTipo(tipo: TipoEntreno) {
  const entrenos = await db.entrenos.where('tipo').equals(tipo).toArray()
  return anadirDetalle(entrenos.sort(masReciente))
}

export type DatosEntreno = Omit<Entreno, 'id' | 'tipo' | 'origen' | 'idExterno'>

export async function guardarNatacion(
  datos: DatosEntreno,
  detalle: Omit<Natacion, 'entrenoId'>,
  id?: number,
) {
  return db.transaction('rw', db.entrenos, db.natacion, async () => {
    const previo = id === undefined ? undefined : await db.entrenos.get(id)
    const entrenoId = await db.entrenos.put({
      origen: 'manual',
      idExterno: null,
      ...previo,
      ...datos,
      tipo: 'natacion',
    })
    await db.natacion.put({ ...detalle, entrenoId })
    return entrenoId
  })
}

export async function guardarGimnasio(
  datos: DatosEntreno,
  series: Omit<SerieGym, 'entrenoId' | 'orden'>[],
  id?: number,
) {
  return db.transaction('rw', db.entrenos, db.seriesGym, async () => {
    const previo = id === undefined ? undefined : await db.entrenos.get(id)
    const entrenoId = await db.entrenos.put({
      origen: 'manual',
      idExterno: null,
      ...previo,
      ...datos,
      tipo: 'gimnasio',
    })
    await db.seriesGym.where('entrenoId').equals(entrenoId).delete()
    await db.seriesGym.bulkAdd(series.map((s, orden) => ({ ...s, entrenoId, orden })))
    return entrenoId
  })
}

export async function eliminarEntreno(id: number) {
  await db.transaction('rw', db.entrenos, db.natacion, db.seriesGym, async () => {
    await db.natacion.delete(id)
    await db.seriesGym.where('entrenoId').equals(id).delete()
    await db.entrenos.delete(id)
  })
}

export interface UltimaVez {
  fecha: string
  series: SerieGym[]
}

/** Devuelve la sesión más reciente de un ejercicio, sin contar el entreno que se está editando. */
export async function ultimaVez(
  ejercicioId: number,
  excluirEntrenoId?: number,
): Promise<UltimaVez | null> {
  const series = await db.seriesGym.where('ejercicioId').equals(ejercicioId).toArray()
  const ids = [...new Set(series.map((s) => s.entrenoId))].filter((id) => id !== excluirEntrenoId)
  if (ids.length === 0) return null
  const entrenos = (await db.entrenos.bulkGet(ids)).filter((e): e is Entreno => Boolean(e))
  const ultimo = entrenos.sort(masReciente)[0]
  if (!ultimo) return null
  return {
    fecha: ultimo.fecha,
    series: series.filter((s) => s.entrenoId === ultimo.id).sort((a, b) => a.orden - b.orden),
  }
}

export async function crearEjercicio(nombre: string, grupo: string): Promise<Ejercicio> {
  const limpio = nombre.trim().replace(/\s+/g, ' ')
  const existente = (await db.ejercicios.toArray()).find(
    (e) => e.nombre.toLocaleLowerCase('es') === limpio.toLocaleLowerCase('es'),
  )
  if (existente) return existente
  const id = await db.ejercicios.add({ nombre: limpio, grupo })
  return { id, nombre: limpio, grupo }
}

export async function guardarPeso(registro: RegistroPeso, fechaOriginal?: string) {
  await db.transaction('rw', db.peso, async () => {
    if (fechaOriginal && fechaOriginal !== registro.fecha) await db.peso.delete(fechaOriginal)
    await db.peso.put(registro)
  })
}
