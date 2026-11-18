import Dexie, { type Table } from 'dexie'

export type TipoEntreno = 'natacion' | 'gimnasio' | 'otro'
export type OrigenEntreno = 'watch' | 'manual'

export interface Entreno {
  id?: number
  /** Fecha local en formato AAAA-MM-DD. */
  fecha: string
  tipo: TipoEntreno
  duracionMin: number | null
  kcal: number | null
  pulsoMedio: number | null
  origen: OrigenEntreno
  idExterno: string | null
  notas: string
}

export interface SerieNatacion {
  metros: number
  estilo: string
  tiempoS: number
  descansoS: number
}

export interface Natacion {
  entrenoId: number
  metros: number
  ritmo50s: number | null
  swolf: number | null
  brazadas50: number | null
  series: SerieNatacion[]
}

export interface Ejercicio {
  id?: number
  nombre: string
  grupo: string
}

export interface SerieGym {
  entrenoId: number
  ejercicioId: number
  /** Posición de la serie dentro del entreno completo. */
  orden: number
  reps: number
  kg: number
}

export interface RegistroPeso {
  /** Un registro por día, en formato AAAA-MM-DD. */
  fecha: string
  kg: number
  notas: string
}

export const GRUPOS_MUSCULARES = [
  'Pecho',
  'Espalda',
  'Piernas',
  'Hombros',
  'Brazos',
  'Core',
  'Otro',
] as const

export const ESTILOS_NATACION = [
  { valor: 'crol', nombre: 'Crol' },
  { valor: 'espalda', nombre: 'Espalda' },
  { valor: 'braza', nombre: 'Braza' },
  { valor: 'mariposa', nombre: 'Mariposa' },
  { valor: 'estilos', nombre: 'Estilos' },
  { valor: 'otro', nombre: 'Otro' },
] as const

const EJERCICIOS_INICIALES: Ejercicio[] = [
  { nombre: 'Press de banca', grupo: 'Pecho' },
  { nombre: 'Press inclinado con mancuernas', grupo: 'Pecho' },
  { nombre: 'Aperturas en polea', grupo: 'Pecho' },
  { nombre: 'Dominadas', grupo: 'Espalda' },
  { nombre: 'Jalón al pecho', grupo: 'Espalda' },
  { nombre: 'Remo con barra', grupo: 'Espalda' },
  { nombre: 'Remo en polea baja', grupo: 'Espalda' },
  { nombre: 'Sentadilla', grupo: 'Piernas' },
  { nombre: 'Prensa de piernas', grupo: 'Piernas' },
  { nombre: 'Peso muerto', grupo: 'Piernas' },
  { nombre: 'Peso muerto rumano', grupo: 'Piernas' },
  { nombre: 'Curl femoral', grupo: 'Piernas' },
  { nombre: 'Extensión de cuádriceps', grupo: 'Piernas' },
  { nombre: 'Press militar', grupo: 'Hombros' },
  { nombre: 'Elevaciones laterales', grupo: 'Hombros' },
  { nombre: 'Curl de bíceps', grupo: 'Brazos' },
  { nombre: 'Extensión de tríceps en polea', grupo: 'Brazos' },
  { nombre: 'Plancha', grupo: 'Core' },
]

class BaseDatos extends Dexie {
  entrenos!: Table<Entreno, number>
  natacion!: Table<Natacion, number>
  ejercicios!: Table<Ejercicio, number>
  seriesGym!: Table<SerieGym, [number, number]>
  peso!: Table<RegistroPeso, string>

  constructor() {
    super('tryky-training')
    this.version(1).stores({
      entrenos: '++id, fecha, tipo, origen, idExterno',
      natacion: 'entrenoId',
      ejercicios: '++id, &nombre, grupo',
      seriesGym: '[entrenoId+orden], entrenoId, ejercicioId',
      peso: 'fecha',
    })
    this.on('populate', (tx) => {
      void tx.table('ejercicios').bulkAdd(EJERCICIOS_INICIALES)
    })
  }
}

export const db = new BaseDatos()
