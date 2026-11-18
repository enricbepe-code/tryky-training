import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { PlusIcon, TrashIcon, XIcon } from '@phosphor-icons/react'
import { SelectorEjercicio } from '../components/SelectorEjercicio'
import {
  Boton,
  Campo,
  claseEntrada,
  Confirmar,
  EntradaNumero,
  irAlPrimerError,
  PantallaFormulario,
} from '../components/ui'
import { eliminarEntreno, guardarGimnasio, ultimaVez, type UltimaVez } from '../db/consultas'
import { db, type Ejercicio } from '../db/esquema'
import { decimalATexto, fechaCorta, hoyISO, leerDecimal, leerEntero, nuevaClave, numero } from '../lib/formato'
import { useBorrador } from '../lib/useBorrador'

interface FilaSerie {
  clave: string
  reps: string
  kg: string
}

interface BloqueEjercicio {
  clave: string
  ejercicioId: number
  nombre: string
  series: FilaSerie[]
}

interface Estado {
  fecha: string
  duracion: string
  kcal: string
  pulso: string
  notas: string
  ejercicios: BloqueEjercicio[]
}

const vacio = (): Estado => ({ fecha: hoyISO(), duracion: '', kcal: '', pulso: '', notas: '', ejercicios: [] })

const filaDesde = (serie?: { reps: number; kg: number }): FilaSerie => ({
  clave: nuevaClave(),
  reps: serie ? String(serie.reps) : '',
  kg: serie ? decimalATexto(serie.kg) : '',
})

interface PropsBloque {
  bloque: BloqueEjercicio
  entrenoId?: number
  errores: Record<string, string>
  alCambiar: (bloque: BloqueEjercicio) => void
  alQuitar: () => void
}

function BloqueSeries({ bloque, entrenoId, errores, alCambiar, alQuitar }: PropsBloque) {
  const anterior = useLiveQuery<UltimaVez | null | undefined>(
    () => ultimaVez(bloque.ejercicioId, entrenoId),
    [bloque.ejercicioId, entrenoId],
  )

  const cambiarSerie = (clave: string, cambios: Partial<FilaSerie>) =>
    alCambiar({ ...bloque, series: bloque.series.map((s) => (s.clave === clave ? { ...s, ...cambios } : s)) })

  function anadirSerie() {
    const previa = anterior?.series[bloque.series.length]
    const ultima = bloque.series.at(-1)
    const nueva = previa ? filaDesde(previa) : { clave: nuevaClave(), reps: ultima?.reps ?? '', kg: ultima?.kg ?? '' }
    alCambiar({ ...bloque, series: [...bloque.series, nueva] })
  }

  return (
    <article className="rounded-xl bg-superficie p-3" data-error={Boolean(errores[bloque.clave])}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold">{bloque.nombre}</h3>
          <p className="text-sm text-suave tabular-nums">
            {anterior
              ? `Última vez (${fechaCorta(anterior.fecha)}): ${anterior.series.map((s) => `${s.reps} × ${numero(s.kg, 2)} kg`).join(', ')}`
              : anterior === null
                ? 'Primera vez que lo registras'
                : ' '}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Quitar ${bloque.nombre}`}
          className="-mr-1 -mt-1 flex size-12 shrink-0 items-center justify-center rounded-xl text-suave active:bg-elevada"
          onClick={alQuitar}
        >
          <XIcon size={24} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[1.75rem_1fr_1fr_3rem] items-center gap-2">
        <span className="text-sm font-medium text-suave">N.º</span>
        <span className="text-sm font-medium text-suave">Kg</span>
        <span className="text-sm font-medium text-suave">Reps</span>
        <span />
        {bloque.series.map((serie, i) => (
          <div key={serie.clave} className="contents">
            <span className="text-center text-lg font-semibold tabular-nums">{i + 1}</span>
            <EntradaNumero
              decimal
              aria-label={`Kg de la serie ${i + 1} de ${bloque.nombre}`}
              valor={serie.kg}
              alCambiar={(kg) => cambiarSerie(serie.clave, { kg })}
              invalido={Boolean(errores[serie.clave])}
            />
            <EntradaNumero
              aria-label={`Repeticiones de la serie ${i + 1} de ${bloque.nombre}`}
              valor={serie.reps}
              alCambiar={(reps) => cambiarSerie(serie.clave, { reps })}
              invalido={Boolean(errores[serie.clave])}
            />
            <button
              type="button"
              aria-label={`Quitar serie ${i + 1} de ${bloque.nombre}`}
              className="flex size-12 items-center justify-center rounded-xl text-suave active:bg-elevada"
              onClick={() => alCambiar({ ...bloque, series: bloque.series.filter((s) => s.clave !== serie.clave) })}
            >
              <TrashIcon size={22} />
            </button>
          </div>
        ))}
      </div>

      {errores[bloque.clave] && (
        <p role="alert" className="pt-2 text-sm text-peligro">
          {errores[bloque.clave]}
        </p>
      )}
      <Boton variante="secundario" className="mt-3 w-full" onClick={anadirSerie}>
        <PlusIcon size={22} weight="bold" />
        Añadir serie
      </Boton>
    </article>
  )
}

export function FormGimnasio() {
  const { id } = useParams()
  const entrenoId = id ? Number(id) : undefined
  const navegar = useNavigate()
  const [estado, setEstado, limpiarBorrador] = useBorrador('borrador-gimnasio', vacio, !id)
  const base = useRef(JSON.stringify(vacio()))
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [selector, setSelector] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [dialogo, setDialogo] = useState<'salir' | 'eliminar' | null>(null)

  const salir = () => {
    limpiarBorrador()
    navegar('/gimnasio', { replace: true })
  }

  useEffect(() => {
    if (entrenoId === undefined) return
    void (async () => {
      const entreno = await db.entrenos.get(entrenoId)
      if (!entreno) {
        navegar('/gimnasio', { replace: true })
        return
      }
      const series = await db.seriesGym.where('entrenoId').equals(entrenoId).sortBy('orden')
      const nombres = await db.ejercicios.bulkGet([...new Set(series.map((s) => s.ejercicioId))])
      const bloques = new Map<number, BloqueEjercicio>()
      for (const serie of series) {
        const bloque = bloques.get(serie.ejercicioId) ?? {
          clave: nuevaClave(),
          ejercicioId: serie.ejercicioId,
          nombre: nombres.find((e) => e?.id === serie.ejercicioId)?.nombre ?? 'Ejercicio',
          series: [],
        }
        bloque.series.push(filaDesde(serie))
        bloques.set(serie.ejercicioId, bloque)
      }
      const cargado: Estado = {
        fecha: entreno.fecha,
        duracion: entreno.duracionMin?.toString() ?? '',
        kcal: entreno.kcal?.toString() ?? '',
        pulso: entreno.pulsoMedio?.toString() ?? '',
        notas: entreno.notas,
        ejercicios: [...bloques.values()],
      }
      base.current = JSON.stringify(cargado)
      setEstado(cargado)
    })()
  }, [entrenoId, navegar, setEstado])

  const cambiar = <K extends keyof Estado>(campo: K, valor: Estado[K]) =>
    setEstado((actual) => ({ ...actual, [campo]: valor }))

  async function anadirEjercicio(ejercicio: Ejercicio) {
    setSelector(false)
    const anterior = await ultimaVez(ejercicio.id!, entrenoId)
    setEstado((actual) => ({
      ...actual,
      ejercicios: [
        ...actual.ejercicios,
        {
          clave: nuevaClave(),
          ejercicioId: ejercicio.id!,
          nombre: ejercicio.nombre,
          series: [filaDesde(anterior?.series[0])],
        },
      ],
    }))
  }

  async function guardar() {
    const nuevos: Record<string, string> = {}
    if (!estado.fecha) nuevos.fecha = 'Elige una fecha.'
    if (estado.ejercicios.length === 0) nuevos.ejercicios = 'Añade al menos un ejercicio.'
    for (const [campo, clave] of [['duracion', 'duracion'], ['kcal', 'kcal'], ['pulso', 'pulso']] as const) {
      if (Number.isNaN(leerEntero(estado[campo]))) nuevos[clave] = 'Escribe un número entero.'
    }
    const series = estado.ejercicios.flatMap((bloque) => {
      if (bloque.series.length === 0) nuevos[bloque.clave] = 'Añade al menos una serie.'
      return bloque.series.map((serie) => {
        const reps = leerEntero(serie.reps)
        const kg = leerDecimal(serie.kg)
        if (!reps || kg === null || Number.isNaN(kg)) {
          nuevos[serie.clave] = 'Revisa'
          nuevos[bloque.clave] = 'Completa los kg y las repeticiones. Usa 0 kg si es con tu peso corporal.'
        }
        return { ejercicioId: bloque.ejercicioId, reps: reps ?? 0, kg: kg ?? 0 }
      })
    })
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      irAlPrimerError()
      return
    }
    setGuardando(true)
    await guardarGimnasio(
      {
        fecha: estado.fecha,
        duracionMin: leerEntero(estado.duracion),
        kcal: leerEntero(estado.kcal),
        pulsoMedio: leerEntero(estado.pulso),
        notas: estado.notas.trim(),
      },
      series,
      entrenoId,
    )
    salir()
  }

  async function eliminar() {
    await eliminarEntreno(entrenoId!)
    salir()
  }

  return (
    <PantallaFormulario
      titulo={id ? 'Editar gimnasio' : 'Registrar gimnasio'}
      alCancelar={() => (JSON.stringify(estado) === base.current ? salir() : setDialogo('salir'))}
      alGuardar={() => void guardar()}
      guardando={guardando}
    >
      <Campo etiqueta="Fecha" error={errores.fecha}>
        <input type="date" className={claseEntrada} value={estado.fecha} max={hoyISO()} onChange={(e) => cambiar('fecha', e.target.value)} />
      </Campo>

      <section className="flex flex-col gap-3" data-error={Boolean(errores.ejercicios)}>
        <h2 className="text-xl font-bold">Ejercicios</h2>
        {estado.ejercicios.map((bloque) => (
          <BloqueSeries
            key={bloque.clave}
            bloque={bloque}
            entrenoId={entrenoId}
            errores={errores}
            alCambiar={(nuevo) =>
              setEstado((actual) => ({
                ...actual,
                ejercicios: actual.ejercicios.map((b) => (b.clave === nuevo.clave ? nuevo : b)),
              }))
            }
            alQuitar={() => cambiar('ejercicios', estado.ejercicios.filter((b) => b.clave !== bloque.clave))}
          />
        ))}
        {errores.ejercicios && (
          <p role="alert" className="text-sm text-peligro">
            {errores.ejercicios}
          </p>
        )}
        <Boton variante="secundario" onClick={() => setSelector(true)}>
          <PlusIcon size={22} weight="bold" />
          Añadir ejercicio
        </Boton>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Duración (min)" error={errores.duracion}>
          <EntradaNumero valor={estado.duracion} alCambiar={(v) => cambiar('duracion', v)} />
        </Campo>
        <Campo etiqueta="Kcal" error={errores.kcal}>
          <EntradaNumero valor={estado.kcal} alCambiar={(v) => cambiar('kcal', v)} />
        </Campo>
        <Campo etiqueta="Pulso medio" error={errores.pulso}>
          <EntradaNumero valor={estado.pulso} alCambiar={(v) => cambiar('pulso', v)} />
        </Campo>
      </section>

      <Campo etiqueta="Notas">
        <textarea rows={3} className={`${claseEntrada} h-auto py-3`} value={estado.notas} onChange={(e) => cambiar('notas', e.target.value)} />
      </Campo>

      {id && (
        <Boton variante="peligro" onClick={() => setDialogo('eliminar')}>
          <TrashIcon size={22} />
          Eliminar entreno
        </Boton>
      )}

      {selector && (
        <SelectorEjercicio
          excluidos={estado.ejercicios.map((b) => b.ejercicioId)}
          alElegir={(ejercicio) => void anadirEjercicio(ejercicio)}
          alCerrar={() => setSelector(false)}
        />
      )}
      {dialogo === 'salir' && (
        <Confirmar
          titulo="Descartar cambios"
          texto="Perderás lo que has escrito en este formulario."
          accion="Descartar"
          alConfirmar={salir}
          alCerrar={() => setDialogo(null)}
        />
      )}
      {dialogo === 'eliminar' && (
        <Confirmar
          titulo="Eliminar entreno"
          texto="Este entreno y sus series se borrarán del dispositivo."
          accion="Eliminar"
          alConfirmar={() => void eliminar()}
          alCerrar={() => setDialogo(null)}
        />
      )}
    </PantallaFormulario>
  )
}
