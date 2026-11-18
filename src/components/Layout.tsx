import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  BarbellIcon,
  CalendarBlankIcon,
  GearSixIcon,
  PlusIcon,
  ScalesIcon,
  SwimmingPoolIcon,
} from '@phosphor-icons/react'
import { Hoja } from './ui'

const SECCIONES = [
  { ruta: '/', nombre: 'Semana', Icono: CalendarBlankIcon },
  { ruta: '/natacion', nombre: 'Natación', Icono: SwimmingPoolIcon },
  { ruta: '/gimnasio', nombre: 'Gimnasio', Icono: BarbellIcon },
  { ruta: '/peso', nombre: 'Peso', Icono: ScalesIcon },
  { ruta: '/ajustes', nombre: 'Ajustes', Icono: GearSixIcon },
]

const REGISTROS = [
  { ruta: '/registrar/natacion', nombre: 'Natación', Icono: SwimmingPoolIcon },
  { ruta: '/registrar/gimnasio', nombre: 'Gimnasio', Icono: BarbellIcon },
  { ruta: '/registrar/peso', nombre: 'Peso', Icono: ScalesIcon },
]

export function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <>
      <main className="pb-con-nav mx-auto max-w-xl px-4">
        <Outlet />
      </main>

      <button
        type="button"
        aria-label="Registrar"
        onClick={() => setMenuAbierto(true)}
        className="bottom-fab fixed right-4 z-20 flex size-16 items-center justify-center rounded-full bg-acento text-sobre-acento shadow-lg shadow-black/50 transition-transform active:scale-95"
      >
        <PlusIcon size={32} weight="bold" />
      </button>

      <nav aria-label="Principal" className="pb-segura fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-fondo pt-1">
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {SECCIONES.map(({ ruta, nombre, Icono }) => (
            <li key={ruta}>
              <NavLink
                to={ruta}
                end={ruta === '/'}
                className={({ isActive }) =>
                  `flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium ${isActive ? 'text-acento' : 'text-suave'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icono size={28} weight={isActive ? 'fill' : 'regular'} />
                    {nombre}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {menuAbierto && (
        <Hoja titulo="Registrar" alCerrar={() => setMenuAbierto(false)}>
          <div className="flex flex-col gap-3 pb-2">
            {REGISTROS.map(({ ruta, nombre, Icono }) => (
              <Link
                key={ruta}
                to={ruta}
                className="flex h-18 items-center gap-4 rounded-xl bg-elevada px-4 text-xl font-semibold active:scale-[0.99]"
              >
                <Icono size={30} className="text-acento" />
                {nombre}
              </Link>
            ))}
          </div>
        </Hoja>
      )}
    </>
  )
}
