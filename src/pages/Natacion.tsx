import { useLiveQuery } from 'dexie-react-hooks'
import { TarjetaEntreno } from '../components/TarjetaEntreno'
import { Cabecera, Cargando, Metrica, Vacio } from '../components/ui'
import { entrenosPorTipo } from '../db/consultas'
import { hoyISO, numero } from '../lib/formato'

export function Natacion() {
  const entrenos = useLiveQuery(() => entrenosPorTipo('natacion'), [])
  const mes = hoyISO().slice(0, 7)
  const delMes = entrenos?.filter((e) => e.entreno.fecha.startsWith(mes)) ?? []
  const metros = delMes.reduce((t, e) => t + (e.natacion?.metros ?? 0), 0)

  return (
    <>
      <Cabecera titulo="Natación" detalle="Este mes" />
      <div className="grid grid-cols-2 gap-2 pb-5">
        <Metrica valor={`${numero(metros, 0)} m`} etiqueta="Nadados" />
        <Metrica valor={String(delMes.length)} etiqueta="Sesiones" />
      </div>
      {!entrenos ? (
        <Cargando />
      ) : entrenos.length === 0 ? (
        <Vacio titulo="Aún no hay sesiones" texto="Pulsa + y elige Natación." />
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
