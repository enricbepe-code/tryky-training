import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { CaretRightIcon } from '@phosphor-icons/react'
import { Cabecera, Cargando, Metrica, Vacio } from '../components/ui'
import { db } from '../db/esquema'
import { fechaLarga, numero } from '../lib/formato'

export function Peso() {
  const registros = useLiveQuery(() => db.peso.orderBy('fecha').reverse().toArray(), [])
  const actual = registros?.[0]
  const anterior = registros?.[1]
  const diferencia = actual && anterior ? actual.kg - anterior.kg : null

  return (
    <>
      <Cabecera titulo="Peso" detalle={actual ? fechaLarga(actual.fecha) : undefined} />
      {actual && (
        <div className="grid grid-cols-2 gap-2 pb-5">
          <Metrica valor={`${numero(actual.kg)} kg`} etiqueta="Actual" />
          <Metrica
            valor={diferencia === null ? 'Sin datos' : `${diferencia > 0 ? '+' : ''}${numero(diferencia)} kg`}
            etiqueta="Respecto al anterior"
          />
        </div>
      )}
      {!registros ? (
        <Cargando />
      ) : registros.length === 0 ? (
        <Vacio titulo="Aún no hay registros" texto="Pulsa + y elige Peso." />
      ) : (
        <div className="flex flex-col gap-2">
          {registros.map((r) => (
            <Link
              key={r.fecha}
              to={`/registrar/peso/${r.fecha}`}
              className="flex min-h-16 items-center gap-3 rounded-xl bg-superficie px-4 py-3 active:scale-[0.99]"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium">{fechaLarga(r.fecha)}</span>
                {r.notas && <span className="block truncate text-sm text-suave">{r.notas}</span>}
              </span>
              <span className="text-xl font-bold tabular-nums">{numero(r.kg)} kg</span>
              <CaretRightIcon size={18} className="text-suave" aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
