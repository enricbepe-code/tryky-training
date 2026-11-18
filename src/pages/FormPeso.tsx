import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { TrashIcon } from '@phosphor-icons/react'
import { Boton, Campo, claseEntrada, Confirmar, EntradaNumero, irAlPrimerError, PantallaFormulario } from '../components/ui'
import { guardarPeso } from '../db/consultas'
import { db } from '../db/esquema'
import { decimalATexto, hoyISO, leerDecimal, numero } from '../lib/formato'

export function FormPeso() {
  const { fecha: fechaOriginal } = useParams()
  const navegar = useNavigate()
  const [fecha, setFecha] = useState(fechaOriginal ?? hoyISO())
  const [kg, setKg] = useState('')
  const [notas, setNotas] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const volver = () => navegar('/peso', { replace: true })

  useEffect(() => {
    if (!fechaOriginal) return
    void db.peso.get(fechaOriginal).then((registro) => {
      if (!registro) {
        navegar('/peso', { replace: true })
        return
      }
      setKg(decimalATexto(registro.kg))
      setNotas(registro.notas)
    })
  }, [fechaOriginal, navegar])

  const coincidente = useLiveQuery(
    () => (fecha && fecha !== fechaOriginal ? db.peso.get(fecha) : undefined),
    [fecha, fechaOriginal],
  )

  async function guardar() {
    const valor = leerDecimal(kg)
    const nuevos: Record<string, string> = {}
    if (!fecha) nuevos.fecha = 'Elige una fecha.'
    if (valor === null || Number.isNaN(valor) || valor <= 0) nuevos.kg = 'Escribe tu peso en kg.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      irAlPrimerError()
      return
    }
    setGuardando(true)
    await guardarPeso({ fecha, kg: valor!, notas: notas.trim() }, fechaOriginal)
    volver()
  }

  async function eliminar() {
    await db.peso.delete(fechaOriginal!)
    volver()
  }

  return (
    <PantallaFormulario
      titulo={fechaOriginal ? 'Editar peso' : 'Registrar peso'}
      alCancelar={volver}
      alGuardar={() => void guardar()}
      guardando={guardando}
    >
      <Campo
        etiqueta="Peso (kg)"
        error={errores.kg}
      >
        <EntradaNumero decimal valor={kg} alCambiar={setKg} invalido={Boolean(errores.kg)} placeholder="72,5" />
      </Campo>
      <Campo
        etiqueta="Fecha"
        error={errores.fecha}
        ayuda={coincidente ? `Sustituirá el registro de ese día (${numero(coincidente.kg)} kg).` : undefined}
      >
        <input type="date" className={claseEntrada} value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
      </Campo>
      <Campo etiqueta="Notas">
        <textarea
          rows={3}
          className={`${claseEntrada} h-auto py-3`}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </Campo>
      {fechaOriginal && (
        <Boton variante="peligro" onClick={() => setConfirmarBorrado(true)}>
          <TrashIcon size={22} />
          Eliminar registro
        </Boton>
      )}
      {confirmarBorrado && (
        <Confirmar
          titulo="Eliminar registro"
          texto="Este registro de peso se borrará del dispositivo."
          accion="Eliminar"
          alConfirmar={() => void eliminar()}
          alCerrar={() => setConfirmarBorrado(false)}
        />
      )}
    </PantallaFormulario>
  )
}
