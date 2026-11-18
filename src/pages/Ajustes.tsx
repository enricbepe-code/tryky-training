import { useRef, useState, type ChangeEvent } from 'react'
import { DownloadSimpleIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { Boton, Cabecera, Confirmar } from '../components/ui'
import {
  crearRespaldo,
  exportarArchivo,
  leerArchivoRespaldo,
  restaurarRespaldo,
  type Respaldo,
} from '../db/respaldo'
import { hoyISO } from '../lib/formato'

type Mensaje = { tipo: 'ok' | 'error'; texto: string }

const instalada =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export function Ajustes() {
  const entradaArchivo = useRef<HTMLInputElement>(null)
  const [mensaje, setMensaje] = useState<Mensaje | null>(null)
  const [pendiente, setPendiente] = useState<Respaldo | null>(null)

  async function exportar() {
    setMensaje(null)
    try {
      const hecho = await exportarArchivo(await crearRespaldo(), `tryky-training-${hoyISO()}.json`)
      if (hecho) setMensaje({ tipo: 'ok', texto: 'Copia exportada.' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se ha podido exportar la copia.' })
    }
  }

  async function elegirArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    setMensaje(null)
    try {
      setPendiente(await leerArchivoRespaldo(archivo))
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error instanceof Error ? error.message : 'No se ha podido leer el archivo.' })
    }
  }

  async function importar() {
    if (!pendiente) return
    const respaldo = pendiente
    setPendiente(null)
    try {
      await restaurarRespaldo(respaldo)
      setMensaje({ tipo: 'ok', texto: 'Copia importada.' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'No se ha podido importar. Tus datos siguen como estaban.' })
    }
  }

  return (
    <>
      <Cabecera titulo="Ajustes" />

      <section className="flex flex-col gap-3 pb-8">
        <h2 className="text-xl font-bold">Copia de seguridad</h2>
        <p className="text-base text-suave">
          Tus datos solo se guardan en este dispositivo. Exporta una copia de vez en cuando y guárdala en Archivos o
          iCloud.
        </p>
        <Boton onClick={() => void exportar()}>
          <DownloadSimpleIcon size={24} weight="bold" />
          Exportar JSON
        </Boton>
        <Boton variante="secundario" onClick={() => entradaArchivo.current?.click()}>
          <UploadSimpleIcon size={24} weight="bold" />
          Importar JSON
        </Boton>
        <input
          ref={entradaArchivo}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Archivo de copia de seguridad"
          onChange={(e) => void elegirArchivo(e)}
        />
        {mensaje && (
          <p role="status" className={`text-base font-medium ${mensaje.tipo === 'ok' ? 'text-acento' : 'text-peligro'}`}>
            {mensaje.texto}
          </p>
        )}
      </section>

      {!instalada && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Instalar en el iPhone</h2>
          <p className="text-base text-suave">
            En Safari, pulsa Compartir y elige «Añadir a pantalla de inicio». Registra tus datos siempre desde la app
            instalada, porque Safari guarda los suyos por separado.
          </p>
        </section>
      )}

      {pendiente && (
        <Confirmar
          titulo="Sustituir todos los datos"
          texto={`Se borrarán los datos actuales y se cargará esta copia. Entrenos: ${pendiente.datos.entrenos.length}. Ejercicios: ${pendiente.datos.ejercicios.length}. Registros de peso: ${pendiente.datos.peso.length}.`}
          accion="Sustituir datos"
          alConfirmar={() => void importar()}
          alCerrar={() => setPendiente(null)}
        />
      )}
    </>
  )
}
