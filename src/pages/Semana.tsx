import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { TarjetaEntreno } from '../components/TarjetaEntreno'
import { Cabecera, Cargando, Metrica, Vacio } from '../components/ui'
import { entrenosEntre } from '../db/consultas'
import { desdeISO, duracion, fechaCorta, hoyISO, inicioSemana, numero, sumarDias } from '../lib/formato'

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const claseFlecha =
  'flex size-12 items-center justify-center rounded-full bg-superficie text-texto active:bg-elevada disabled:opacity-40'

export function Semana() {
  const hoy = hoyISO()
  const semanaActual = inicioSemana(hoy)
  const [inicio, setInicio] = useState(semanaActual)
  const fin = sumarDias(inicio, 6)
  const entrenos = useLiveQuery(() => entrenosEntre(inicio, fin), [inicio, fin])

  const minutos = entrenos?.reduce((t, e) => t + (e.entreno.duracionMin ?? 0), 0) ?? 0
  const metros = entrenos?.reduce((t, e) => t + (e.natacion?.metros ?? 0), 0) ?? 0
  const kcal = entrenos?.reduce((t, e) => t + (e.entreno.kcal ?? 0), 0) ?? 0
  const fechasConEntreno = new Set(entrenos?.map((e) => e.entreno.fecha))

  return (
    <>
      <Cabecera titulo="Semana" detalle={`${fechaCorta(inicio)} al ${fechaCorta(fin)}`}>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Semana anterior"
            className={claseFlecha}
            onClick={() => setInicio(sumarDias(inicio, -7))}
          >
            <CaretLeftIcon size={24} />
          </button>
          <button
            type="button"
            aria-label="Semana siguiente"
            className={claseFlecha}
            disabled={inicio >= semanaActual}
            onClick={() => setInicio(sumarDias(inicio, 7))}
          >
            <CaretRightIcon size={24} />
          </button>
        </div>
      </Cabecera>

      <ol className="grid grid-cols-7 gap-1.5 pb-4">
        {DIAS.map((dia, i) => {
          const fecha = sumarDias(inicio, i)
          const entrenado = fechasConEntreno.has(fecha)
          return (
            <li
              key={dia}
              aria-label={`${fecha}${entrenado ? ', con entreno' : ''}`}
              className={`flex h-16 flex-col items-center justify-center rounded-xl ${
                entrenado ? 'bg-acento text-sobre-acento' : 'bg-superficie text-suave'
              } ${fecha === hoy && !entrenado ? 'border border-acento' : ''}`}
            >
              <span className="text-xs font-medium">{dia}</span>
              <span className="text-lg font-bold tabular-nums">{desdeISO(fecha).getDate()}</span>
            </li>
          )
        })}
      </ol>

      <div className="grid grid-cols-2 gap-2 pb-5">
        <Metrica valor={String(entrenos?.length ?? 0)} etiqueta="Entrenos" />
        <Metrica valor={minutos ? duracion(minutos) : '0 min'} etiqueta="Tiempo" />
        <Metrica valor={`${numero(metros, 0)} m`} etiqueta="Nadados" />
        <Metrica valor={numero(kcal, 0)} etiqueta="Kcal" />
      </div>

      {!entrenos ? (
        <Cargando />
      ) : entrenos.length === 0 ? (
        <Vacio titulo="Sin entrenos esta semana" texto="Pulsa + para registrar el primero." />
      ) : (
        <div className="flex flex-col gap-2">
          {entrenos.map((detalle) => (
            <TarjetaEntreno key={detalle.entreno.id} detalle={detalle} />
          ))}
        </div>
      )}
    </>
  )
}
