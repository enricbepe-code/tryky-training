import { Link } from 'react-router-dom'
import { BarbellIcon, CaretRightIcon, PersonSimpleRunIcon, SwimmingPoolIcon } from '@phosphor-icons/react'
import type { EntrenoDetalle } from '../db/consultas'
import { duracion, fechaLarga, numero, tiempo } from '../lib/formato'

const TIPOS = {
  natacion: { nombre: 'Natación', Icono: SwimmingPoolIcon },
  gimnasio: { nombre: 'Gimnasio', Icono: BarbellIcon },
  otro: { nombre: 'Otro entreno', Icono: PersonSimpleRunIcon },
}

function resumen({ entreno, natacion, ejercicios, series, volumenKg }: EntrenoDetalle) {
  const partes: string[] = []
  if (natacion) {
    partes.push(`${numero(natacion.metros, 0)} m`)
    if (natacion.ritmo50s) partes.push(`${tiempo(natacion.ritmo50s)} /50 m`)
  }
  if (entreno.tipo === 'gimnasio') {
    partes.push(`${ejercicios} ${ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`)
    partes.push(`${series} ${series === 1 ? 'serie' : 'series'}`)
    if (volumenKg > 0) partes.push(`${numero(volumenKg, 0)} kg`)
  }
  if (entreno.duracionMin) partes.push(duracion(entreno.duracionMin))
  return partes.join(', ')
}

export function TarjetaEntreno({ detalle }: { detalle: EntrenoDetalle }) {
  const { entreno } = detalle
  const { nombre, Icono } = TIPOS[entreno.tipo]
  const contenido = (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-elevada text-acento">
        <Icono size={26} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-lg font-semibold">{nombre}</span>
          <span className="shrink-0 text-sm text-suave">{fechaLarga(entreno.fecha)}</span>
        </span>
        <span className="block truncate text-base text-suave tabular-nums">{resumen(detalle) || 'Sin datos'}</span>
      </span>
    </>
  )
  const clase = 'flex min-h-20 items-center gap-3 rounded-xl bg-superficie p-3'

  if (entreno.tipo === 'otro') return <div className={clase}>{contenido}</div>
  return (
    <Link to={`/registrar/${entreno.tipo}/${entreno.id}`} className={`${clase} transition-transform active:scale-[0.99]`}>
      {contenido}
      <CaretRightIcon size={18} className="shrink-0 text-suave" aria-hidden />
    </Link>
  )
}
