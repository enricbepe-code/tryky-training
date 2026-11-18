import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AvisoActualizacion } from './components/AvisoActualizacion'
import { Layout } from './components/Layout'
import { Ajustes } from './pages/Ajustes'
import { FormGimnasio } from './pages/FormGimnasio'
import { FormNatacion } from './pages/FormNatacion'
import { FormPeso } from './pages/FormPeso'
import { Gimnasio } from './pages/Gimnasio'
import { Natacion } from './pages/Natacion'
import { Peso } from './pages/Peso'
import { Semana } from './pages/Semana'

function VolverArriba() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// HashRouter evita errores 404 al abrir rutas internas en GitHub Pages.
export function App() {
  return (
    <HashRouter>
      <VolverArriba />
      <AvisoActualizacion />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Semana />} />
          <Route path="natacion" element={<Natacion />} />
          <Route path="gimnasio" element={<Gimnasio />} />
          <Route path="peso" element={<Peso />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
        <Route path="registrar/natacion/:id?" element={<FormNatacion />} />
        <Route path="registrar/gimnasio/:id?" element={<FormGimnasio />} />
        <Route path="registrar/peso/:fecha?" element={<FormPeso />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
