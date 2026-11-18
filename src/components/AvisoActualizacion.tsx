import { useRegisterSW } from 'virtual:pwa-register/react'
import { Boton } from './ui'

/** La actualización espera a que el usuario la acepte para no interrumpir un registro. */
export function AvisoActualizacion() {
  const {
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW()

  if (!hayVersionNueva) return null

  return (
    <div role="status" className="pt-segura fixed inset-x-0 top-0 z-40 bg-elevada px-4 pb-3 shadow-lg shadow-black/40">
      <p className="pb-2 text-base font-semibold">Hay una versión nueva</p>
      <div className="grid grid-cols-2 gap-3">
        <Boton variante="secundario" onClick={() => setHayVersionNueva(false)}>
          Más tarde
        </Boton>
        <Boton onClick={() => void updateServiceWorker(true)}>Actualizar</Boton>
      </div>
    </div>
  )
}
