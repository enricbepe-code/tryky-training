import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlusIcon, TrashIcon } from '@phosphor-icons/react'
import {
  Boton,
  Campo,
  claseEntrada,
  Confirmar,
  EntradaNumero,
  EntradaTiempo,
  irAlPrimerError,
  PantallaFormulario,
} from '../components/ui'
import { eliminarEntreno, guardarNatacion } from '../db/consultas'
import { db, ESTILOS_NATACION } from '../db/esquema'
import {
  digitosASegundos,
  hoyISO,
  leerEntero,
  nuevaClave,
  numero,
  segundosADigitos,
} from '../lib/formato'
import { useBorrador } from '../lib/useBorrador'

interface FilaSerie {
  clave: string
  metros: string
  estilo: string
  tiempo: string
  descanso: string
}

interface Estado {
  fecha: string
  duracion: string
  kcal: string
  pulso: string
  metros: string
  ritmo: string
  swolf: string
  brazadas: string
  notas: string
  series: FilaSerie[]
}

const vacio = (): Estado => ({
  fecha: hoyISO(),
  duracion: '',
  kcal: '',
  pulso: '',
  metros: '',
  ritmo: '',
  swolf: '',
  brazadas: '',
  notas: '',
  series: [],
})

const CAMPOS_ENTEROS = [
  ['duracion', 'duracion'],
  ['kcal', 'kcal'],
  ['pulso', 'pulso'],
  ['metros', 'metros'],
  ['swolf', 'swolf'],
  ['brazadas', 'brazadas'],
] as const

export function FormNatacion() {
  const { id } = useParams()
  const entrenoId = id ? Number(id) : undefined
  const navegar = useNavigate()
  const [estado, setEstado, limpiarBorrador] = useBorrador('borrador-natacion', vacio, !id)
  const base = useRef(JSON.stringify(vacio()))
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [dialogo, setDialogo] = useState<'salir' | 'eliminar' | null>(null)

  const salir = () => {
    limpiarBorrador()
    navegar('/natacion', { replace: true })
  }

  useEffect(() => {
    if (entrenoId === undefined) return
    void Promise.all([db.entrenos.get(entrenoId), db.natacion.get(entrenoId)]).then(([entreno, natacion]) => {
      if (!entreno || !natacion) {
        navegar('/natacion', { replace: true })
        return
      }
      const cargado: Estado = {
        fecha: entreno.fecha,
        duracion: entreno.duracionMin?.toString() ?? '',
        kcal: entreno.kcal?.toString() ?? '',
        pulso: entreno.pulsoMedio?.toString() ?? '',
        metros: String(natacion.metros),
        ritmo: segundosADigitos(natacion.ritmo50s),
        swolf: natacion.swolf?.toString() ?? '',
        brazadas: natacion.brazadas50?.toString() ?? '',
        notas: entreno.notas,
        series: natacion.series.map((s) => ({
          clave: nuevaClave(),
          metros: String(s.metros),
          estilo: s.estilo,
          tiempo: segundosADigitos(s.tiempoS),
          descanso: s.descansoS ? segundosADigitos(s.descansoS) : '',
        })),
      }
      base.current = JSON.stringify(cargado)
      setEstado(cargado)
    })
  }, [entrenoId, navegar, setEstado])

  const cambiar = <K extends keyof Estado>(campo: K, valor: Estado[K]) =>
    setEstado((actual) => ({ ...actual, [campo]: valor }))

  const cambiarSerie = (clave: string, cambios: Partial<FilaSerie>) =>
    cambiar('series', estado.series.map((s) => (s.clave === clave ? { ...s, ...cambios } : s)))

  function anadirSerie() {
    const ultima = estado.series.at(-1)
    cambiar('series', [
      ...estado.series,
      { clave: nuevaClave(), metros: ultima?.metros ?? '', estilo: ultima?.estilo ?? 'crol', tiempo: ultima?.tiempo ?? '', descanso: ultima?.descanso ?? '' },
    ])
  }

  const metrosSeries = estado.series.reduce((t, s) => t + (leerEntero(s.metros) || 0), 0)

  async function guardar() {
    const nuevos: Record<string, string> = {}
    if (!estado.fecha) nuevos.fecha = 'Elige una fecha.'
    for (const [campo, clave] of CAMPOS_ENTEROS) {
      if (Number.isNaN(leerEntero(estado[campo]))) nuevos[clave] = 'Escribe un número entero.'
    }
    const series = estado.series.map((s) => {
      const metros = leerEntero(s.metros)
      const tiempoS = digitosASegundos(s.tiempo)
      if (!metros || !tiempoS) nuevos[s.clave] = 'Indica los metros y el tiempo de la serie.'
      return { metros: metros ?? 0, estilo: s.estilo, tiempoS: tiempoS ?? 0, descansoS: digitosASegundos(s.descanso) ?? 0 }
    })
    const metros = leerEntero(estado.metros) ?? metrosSeries
    if (!nuevos.metros && !metros) nuevos.metros = 'Indica los metros o añade una serie.'

    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      irAlPrimerError()
      return
    }

    const tiempoSeries = series.reduce((t, s) => t + s.tiempoS, 0)
    const totalSeries = tiempoSeries + series.reduce((t, s) => t + s.descansoS, 0)
    setGuardando(true)
    await guardarNatacion(
      {
        fecha: estado.fecha,
        duracionMin: leerEntero(estado.duracion) ?? (totalSeries ? Math.round(totalSeries / 60) : null),
        kcal: leerEntero(estado.kcal),
        pulsoMedio: leerEntero(estado.pulso),
        notas: estado.notas.trim(),
      },
      {
        metros,
        ritmo50s:
          digitosASegundos(estado.ritmo) ?? (metrosSeries ? Math.round((tiempoSeries / metrosSeries) * 50) : null),
        swolf: leerEntero(estado.swolf),
        brazadas50: leerEntero(estado.brazadas),
        series,
      },
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
      titulo={id ? 'Editar natación' : 'Registrar natación'}
      alCancelar={() => (JSON.stringify(estado) === base.current ? salir() : setDialogo('salir'))}
      alGuardar={() => void guardar()}
      guardando={guardando}
    >
      <Campo etiqueta="Fecha" error={errores.fecha}>
        <input type="date" className={claseEntrada} value={estado.fecha} max={hoyISO()} onChange={(e) => cambiar('fecha', e.target.value)} />
      </Campo>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Series</h2>
        {estado.series.map((serie, i) => (
          <div key={serie.clave} className="flex flex-col gap-3 rounded-xl bg-superficie p-3" data-error={Boolean(errores[serie.clave])}>
            <div className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-base font-semibold">Serie {i + 1}</span>
              <select
                aria-label={`Estilo de la serie ${i + 1}`}
                className={claseEntrada}
                value={serie.estilo}
                onChange={(e) => cambiarSerie(serie.clave, { estilo: e.target.value })}
              >
                {ESTILOS_NATACION.map((estilo) => (
                  <option key={estilo.valor} value={estilo.valor}>
                    {estilo.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={`Quitar serie ${i + 1}`}
                className="flex size-12 shrink-0 items-center justify-center rounded-xl text-suave active:bg-elevada"
                onClick={() => cambiar('series', estado.series.filter((s) => s.clave !== serie.clave))}
              >
                <TrashIcon size={24} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Campo etiqueta="Metros">
                <EntradaNumero valor={serie.metros} alCambiar={(metros) => cambiarSerie(serie.clave, { metros })} />
              </Campo>
              <Campo etiqueta="Tiempo">
                <EntradaTiempo digitos={serie.tiempo} alCambiar={(tiempo) => cambiarSerie(serie.clave, { tiempo })} />
              </Campo>
              <Campo etiqueta="Descanso">
                <EntradaTiempo digitos={serie.descanso} alCambiar={(descanso) => cambiarSerie(serie.clave, { descanso })} />
              </Campo>
            </div>
            {errores[serie.clave] && (
              <p role="alert" className="text-sm text-peligro">
                {errores[serie.clave]}
              </p>
            )}
          </div>
        ))}
        <Boton variante="secundario" onClick={anadirSerie}>
          <PlusIcon size={22} weight="bold" />
          Añadir serie
        </Boton>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Resumen</h2>
        {estado.series.length > 0 && (
          <p className="text-base text-suave">
            Si dejas vacíos metros, ritmo o duración, se calculan con las series ({numero(metrosSeries, 0)} m).
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Metros" error={errores.metros}>
            <EntradaNumero valor={estado.metros} alCambiar={(v) => cambiar('metros', v)} invalido={Boolean(errores.metros)} />
          </Campo>
          <Campo etiqueta="Ritmo /50 m">
            <EntradaTiempo digitos={estado.ritmo} alCambiar={(v) => cambiar('ritmo', v)} />
          </Campo>
          <Campo etiqueta="Duración (min)" error={errores.duracion}>
            <EntradaNumero valor={estado.duracion} alCambiar={(v) => cambiar('duracion', v)} />
          </Campo>
          <Campo etiqueta="Kcal" error={errores.kcal}>
            <EntradaNumero valor={estado.kcal} alCambiar={(v) => cambiar('kcal', v)} />
          </Campo>
          <Campo etiqueta="Pulso medio" error={errores.pulso}>
            <EntradaNumero valor={estado.pulso} alCambiar={(v) => cambiar('pulso', v)} />
          </Campo>
          <Campo etiqueta="SWOLF" error={errores.swolf}>
            <EntradaNumero valor={estado.swolf} alCambiar={(v) => cambiar('swolf', v)} />
          </Campo>
          <Campo etiqueta="Brazadas /50 m" error={errores.brazadas}>
            <EntradaNumero valor={estado.brazadas} alCambiar={(v) => cambiar('brazadas', v)} />
          </Campo>
        </div>
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
