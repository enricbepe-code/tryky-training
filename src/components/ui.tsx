import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { XIcon } from '@phosphor-icons/react'
import { digitosATiempo } from '../lib/formato'

const VARIANTES = {
  primario: 'bg-acento text-sobre-acento',
  secundario: 'border border-borde bg-elevada text-texto',
  peligro: 'border border-peligro/50 bg-transparent text-peligro',
}

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: keyof typeof VARIANTES
}

export function Boton({ variante = 'primario', className = '', ...props }: PropsBoton) {
  return (
    <button
      type="button"
      className={`flex h-14 items-center justify-center gap-2 rounded-xl px-4 text-lg font-semibold transition-transform active:scale-[0.98] disabled:opacity-50 ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  )
}

export const claseEntrada =
  'h-14 w-full min-w-0 rounded-xl border border-borde bg-elevada px-3.5 text-texto tabular-nums placeholder:text-suave/70 focus:border-acento focus:outline-none aria-invalid:border-peligro'

interface PropsCampo {
  etiqueta: string
  error?: string
  ayuda?: string
  children: ReactNode
  className?: string
}

export function Campo({ etiqueta, error, ayuda, children, className = '' }: PropsCampo) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`} data-error={Boolean(error)}>
      <span className="text-sm font-medium text-suave">{etiqueta}</span>
      {children}
      {ayuda && !error && <span className="text-sm text-suave">{ayuda}</span>}
      {error && (
        <span role="alert" className="text-sm text-peligro">
          {error}
        </span>
      )}
    </label>
  )
}

interface PropsNumero extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  valor: string
  alCambiar: (valor: string) => void
  decimal?: boolean
  invalido?: boolean
}

export function EntradaNumero({ valor, alCambiar, decimal, invalido, ...props }: PropsNumero) {
  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      enterKeyHint="next"
      className={claseEntrada}
      value={valor}
      aria-invalid={invalido || undefined}
      onChange={(e) =>
        alCambiar(e.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, ''))
      }
      {...props}
    />
  )
}

interface PropsTiempo extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  digitos: string
  alCambiar: (digitos: string) => void
  invalido?: boolean
}

/** Campo de tiempo m:ss: escribiendo 145 se muestra 1:45. */
export function EntradaTiempo({ digitos, alCambiar, invalido, ...props }: PropsTiempo) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      enterKeyHint="next"
      placeholder="m:ss"
      className={claseEntrada}
      value={digitosATiempo(digitos)}
      aria-invalid={invalido || undefined}
      onChange={(e) => alCambiar(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 5))}
      {...props}
    />
  )
}

export function Cabecera({ titulo, detalle, children }: { titulo: string; detalle?: string; children?: ReactNode }) {
  return (
    <header className="pt-segura flex items-end justify-between gap-3 pb-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
        {detalle && <p className="mt-0.5 text-base text-suave">{detalle}</p>}
      </div>
      {children}
    </header>
  )
}

export function Metrica({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-superficie px-3.5 py-3">
      <p className="truncate text-2xl font-bold tabular-nums">{valor}</p>
      <p className="text-sm text-suave">{etiqueta}</p>
    </div>
  )
}

export function Vacio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-xl border border-dashed border-borde px-5 py-10 text-center">
      <p className="text-lg font-semibold">{titulo}</p>
      <p className="mt-1 text-base text-suave">{texto}</p>
    </div>
  )
}

export function Cargando() {
  return (
    <div className="flex flex-col gap-3" aria-label="Cargando" role="status">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-superficie motion-reduce:animate-none" />
      ))}
    </div>
  )
}

interface PropsHoja {
  titulo: string
  alCerrar: () => void
  children: ReactNode
  /** Altura fija, para que el teclado del iPhone no tape un buscador al filtrar. */
  alta?: boolean
}

export function Hoja({ titulo, alCerrar, children, alta }: PropsHoja) {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar()
    const desbordeAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alPulsar)
    return () => {
      document.body.style.overflow = desbordeAnterior
      document.removeEventListener('keydown', alPulsar)
    }
  }, [alCerrar])

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={titulo}>
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        className="velo-entrada absolute inset-0 bg-black/65"
        onClick={alCerrar}
      />
      <div className={`hoja-entrada pb-segura relative flex max-h-[88dvh] flex-col rounded-t-2xl bg-superficie px-4 pt-3 ${alta ? 'h-[88dvh]' : ''}`}>
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={alCerrar}
            className="-mr-2 flex size-12 items-center justify-center rounded-full text-suave active:bg-elevada"
          >
            <XIcon size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface PropsConfirmar {
  titulo: string
  texto: string
  accion: string
  alConfirmar: () => void
  alCerrar: () => void
}

export function Confirmar({ titulo, texto, accion, alConfirmar, alCerrar }: PropsConfirmar) {
  return (
    <Hoja titulo={titulo} alCerrar={alCerrar}>
      <p className="pb-5 text-base text-suave">{texto}</p>
      <div className="flex flex-col gap-3 pb-2">
        <Boton variante="peligro" onClick={alConfirmar}>
          {accion}
        </Boton>
        <Boton variante="secundario" onClick={alCerrar}>
          Cancelar
        </Boton>
      </div>
    </Hoja>
  )
}

interface PropsPantallaFormulario {
  titulo: string
  alCancelar: () => void
  alGuardar: () => void
  guardando: boolean
  children: ReactNode
}

/** Las acciones quedan abajo para alcanzarlas con el pulgar. */
export function PantallaFormulario({ titulo, alCancelar, alGuardar, guardando, children }: PropsPantallaFormulario) {
  return (
    <form
      noValidate
      className="pb-con-barra mx-auto min-h-dvh max-w-xl px-4"
      onKeyDown={(e) => {
        // La tecla de retorno del iPhone no debe guardar el formulario a medias.
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) e.preventDefault()
      }}
      onSubmit={(e) => {
        e.preventDefault()
        alGuardar()
      }}
    >
      <header className="pt-segura pb-4">
        <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
      </header>
      <div className="flex flex-col gap-5">{children}</div>
      <div className="pb-segura fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-fondo px-4 pt-3">
        <div className="mx-auto grid max-w-xl grid-cols-[1fr_2fr] gap-3">
          <Boton variante="secundario" onClick={alCancelar}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={guardando}>
            Guardar
          </Boton>
        </div>
      </div>
    </form>
  )
}

export function irAlPrimerError() {
  requestAnimationFrame(() => {
    document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}
