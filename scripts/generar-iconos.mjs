// Genera los iconos PNG de la app sin dependencias externas.
import { mkdirSync, writeFileSync } from 'node:fs'
import { crc32, deflateSync } from 'node:zlib'

const FONDO = [14, 16, 17]
const ACENTO = [198, 242, 78]
const SALIDA = new URL('../public/icons/', import.meta.url)

function rectRedondeado(x, y, cx, cy, ancho, alto, radio) {
  const dx = Math.abs(x - cx) - ancho / 2 + radio
  const dy = Math.abs(y - cy) - alto / 2 + radio
  const fuera = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  return fuera + Math.min(Math.max(dx, dy), 0) - radio <= 0
}

// La marca es una T centrada dentro de la zona segura de los iconos enmascarables.
function dentroDeMarca(x, y) {
  return (
    rectRedondeado(x, y, 0.5, 0.36, 0.52, 0.13, 0.065) ||
    rectRedondeado(x, y, 0.5, 0.54, 0.13, 0.46, 0.065)
  )
}

function fragmento(tipo, datos) {
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'latin1'), datos])
  const longitud = Buffer.alloc(4)
  longitud.writeUInt32BE(datos.length)
  const control = Buffer.alloc(4)
  control.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([longitud, cuerpo, control])
}

function crearPng(lado) {
  const MUESTRAS = 4
  const filas = Buffer.alloc((lado * 3 + 1) * lado)
  let p = 0
  for (let y = 0; y < lado; y++) {
    filas[p++] = 0
    for (let x = 0; x < lado; x++) {
      let dentro = 0
      for (let sy = 0; sy < MUESTRAS; sy++) {
        for (let sx = 0; sx < MUESTRAS; sx++) {
          const u = (x + (sx + 0.5) / MUESTRAS) / lado
          const v = (y + (sy + 0.5) / MUESTRAS) / lado
          if (dentroDeMarca(u, v)) dentro++
        }
      }
      const mezcla = dentro / (MUESTRAS * MUESTRAS)
      for (let c = 0; c < 3; c++) {
        filas[p++] = Math.round(FONDO[c] + (ACENTO[c] - FONDO[c]) * mezcla)
      }
    }
  }
  const cabecera = Buffer.alloc(13)
  cabecera.writeUInt32BE(lado, 0)
  cabecera.writeUInt32BE(lado, 4)
  cabecera[8] = 8
  cabecera[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    fragmento('IHDR', cabecera),
    fragmento('IDAT', deflateSync(filas, { level: 9 })),
    fragmento('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(SALIDA, { recursive: true })
for (const [nombre, lado] of [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  writeFileSync(new URL(nombre, SALIDA), crearPng(lado))
}
