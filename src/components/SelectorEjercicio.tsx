import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { PlusIcon } from '@phosphor-icons/react'
import { crearEjercicio } from '../db/consultas'
import { db, GRUPOS_MUSCULARES, type Ejercicio } from '../db/esquema'
import { Boton, Campo, claseEntrada, Hoja } from './ui'

interface Props {
  excluidos: number[]
  alElegir: (ejercicio: Ejercicio) => void
  alCerrar: () => void
}

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').trim()

export function SelectorEjercicio({ excluidos, alElegir, alCerrar }: Props) {
  const ejercicios = useLiveQuery(() => db.ejercicios.orderBy('nombre').toArray(), [])
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState<string>(GRUPOS_MUSCULARES[0])
  const consulta = normalizar(busqueda)

  const grupos = useMemo(() => {
    const visibles = (ejercicios ?? []).filter(
      (e) => !excluidos.includes(e.id!) && normalizar(e.nombre).includes(consulta),
    )
    return [...new Set(visibles.map((e) => e.grupo))]
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((nombre) => ({ nombre, lista: visibles.filter((e) => e.grupo === nombre) }))
  }, [ejercicios, excluidos, consulta])

  const existe = ejercicios?.some((e) => normalizar(e.nombre) === consulta)

  return (
    <Hoja titulo="Añadir ejercicio" alCerrar={alCerrar} alta>
      <Campo etiqueta="Buscar o crear" className="pb-3">
        <input
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          className={claseEntrada}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Campo>
      <div className="min-h-40 flex-1 overflow-y-auto overscroll-contain pb-2">
        {consulta && !existe && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl bg-elevada p-3">
            <Campo etiqueta="Grupo muscular">
              <select className={`${claseEntrada} bg-superficie`} value={grupo} onChange={(e) => setGrupo(e.target.value)}>
                {GRUPOS_MUSCULARES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Campo>
            <Boton onClick={() => void crearEjercicio(busqueda, grupo).then(alElegir)}>
              <PlusIcon size={22} weight="bold" />
              <span className="truncate">Crear «{busqueda.trim()}»</span>
            </Boton>
          </div>
        )}
        {grupos.map(({ nombre, lista }) => (
          <section key={nombre} className="pb-3">
            <h3 className="pb-1 text-sm font-semibold text-suave">{nombre}</h3>
            <div className="flex flex-col gap-1.5">
              {lista.map((ejercicio) => (
                <button
                  key={ejercicio.id}
                  type="button"
                  className="min-h-14 rounded-xl bg-elevada px-4 py-2 text-left text-lg font-medium active:scale-[0.99]"
                  onClick={() => alElegir(ejercicio)}
                >
                  {ejercicio.nombre}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Hoja>
  )
}
