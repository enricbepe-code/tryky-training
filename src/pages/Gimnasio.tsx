import { useLiveQuery } from 'dexie-react-hooks'
import { TarjetaEntreno } from '../components/TarjetaEntreno'
import { Cabecera, Cargando, Metrica, Vacio } from '../components/ui'
import { entrenosPorTipo } from '../db/consultas'
import { hoyISO } from '../lib/formato'

export function Gimnasio() {
  const entrenos = useLiveQuery(() => entrenosPorTipo('gimnasio'), [])
  const mes = hoyISO().slice(0, 7)
  const delMes = entrenos?.filter((e) => e.entreno.fecha.startsWith(mes)) ?? []
  const series = delMes.reduce((t, e) => t + e.series, 0)

  return (
    <>
      <Cabecera titulo="Gimnasio" detalle="Este mes" />
      <div className="grid grid-cols-2 gap-2 pb-5">
        <Metrica valor={String(delMes.length)} etiqueta="Sesiones" />
        <Metrica valor={String(series)} etiqueta="Series" />
      </div>
      {!entrenos ? (
        <Cargando />
      ) : entrenos.length === 0 ? (
        <Vacio titulo="Aún no hay sesiones" texto="Pulsa + y elige Gimnasio." />
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
