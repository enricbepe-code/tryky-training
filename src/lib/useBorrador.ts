import { useCallback, useEffect, useRef, useState } from 'react'

function leer<T>(clave: string): T | null {
  try {
    const guardado = localStorage.getItem(clave)
    return guardado ? (JSON.parse(guardado) as T) : null
  } catch {
    return null
  }
}

/** Conserva el formulario si iOS cierra la app en segundo plano durante el entreno. */
export function useBorrador<T>(clave: string, inicial: () => T, activo: boolean) {
  const [valor, setValor] = useState<T>(() => (activo ? (leer<T>(clave) ?? inicial()) : inicial()))
  const guardar = useRef(activo)

  useEffect(() => {
    if (!guardar.current) return
    try {
      localStorage.setItem(clave, JSON.stringify(valor))
    } catch {
      // Sin almacenamiento disponible, el formulario sigue funcionando sin borrador.
    }
  }, [clave, valor])

  const limpiar = useCallback(() => {
    guardar.current = false
    try {
      localStorage.removeItem(clave)
    } catch {
      // No hay nada que limpiar.
    }
  }, [clave])

  return [valor, setValor, limpiar] as const
}
