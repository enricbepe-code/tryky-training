# Tryky Training

PWA personal para registrar natación, gimnasio y peso. Todos los datos se guardan en el dispositivo (IndexedDB), sin backend.

## Desarrollo en el ordenador

```powershell
npm install
npm run dev
```

Abre `http://localhost:5173`. Para comprobar la versión final con el modo sin conexión:

```powershell
npm run build
npm run preview
```

## Probarla en el iPhone

Hay dos formas, según lo que quieras comprobar.

### Vista rápida en la red local

Sirve para ver el diseño y los formularios. **No sirve para instalarla ni para probar el modo sin conexión**, porque iOS exige HTTPS para el service worker.

1. Conecta el iPhone y el ordenador a la misma wifi.
2. Ejecuta `npm run dev`.
3. Abre en Safari la dirección `Network` que aparece en la terminal, por ejemplo `http://192.168.1.20:5173`.
4. Si no carga, permite Node.js en el Firewall de Windows para redes privadas.

### Prueba completa, instalada

1. Publica la app en GitHub Pages siguiendo la sección siguiente.
2. Abre la dirección `https://TU-USUARIO.github.io/tryky-training/` en **Safari**.
3. Pulsa **Compartir** y después **Añadir a pantalla de inicio**.
4. Abre la app desde su icono y espera unos segundos con conexión.
5. Activa el modo avión, cierra la app y vuelve a abrirla. Debe funcionar igual.

## Publicar en GitHub Pages

El repositorio ya incluye el flujo `.github/workflows/deploy.yml`, que compila y publica la app en cada envío a `main`.

1. Crea un repositorio vacío en GitHub llamado `tryky-training`.
2. Sube el proyecto, cambiando `TU-USUARIO` por tu usuario:

```powershell
git init -b main
git add .
git commit -m "Primera versión de Tryky Training"
git remote add origin https://github.com/TU-USUARIO/tryky-training.git
git push -u origin main
```

3. En GitHub, entra en **Settings > Pages** y, en **Source**, elige **GitHub Actions**.
4. En la pestaña **Actions**, vuelve a lanzar el flujo si el primer intento falló por no tener Pages activado.
5. Cuando termine, la app estará en `https://TU-USUARIO.github.io/tryky-training/`.

En GitHub Free, Pages necesita que el repositorio sea público. El código queda visible, pero tus entrenos no, porque nunca salen del iPhone.

Para publicar cambios, basta con hacer `git push`. La app mostrará el aviso **Hay una versión nueva** al abrirla con conexión.

## Cuida tus datos

- **Safari y la app instalada guardan datos por separado.** Registra siempre desde el icono de la pantalla de inicio.
- **Borrar la app del iPhone borra sus datos.** Exporta antes una copia desde Ajustes.
- **Cambiar la dirección web empieza con la app vacía.** Exporta en la dirección antigua e importa en la nueva.
- **Importar sustituye todos los datos** por los del archivo, tras pedir confirmación.
