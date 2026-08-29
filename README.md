# 🎬 DownTube

Descargador de videos de YouTube simple y rápido: pegás el link, elegís formato y calidad, y te lo bajás en MP4, MP3 o WAV.

Pensado para correr **en tu máquina** (no como servicio público en la nube — ver la nota al final sobre por qué).

## ✨ Qué hace

- Pegás la URL de un video de YouTube y trae el título, la miniatura, la duración y las calidades disponibles.
- Elegís el formato: **MP4** (video), **MP3** o **WAV** (solo audio).
- Para MP4 podés elegir la calidad máxima disponible o una resolución específica.
- Armás una cola con varios videos antes de descargarlos.

## 🧱 Stack

- **Backend:** Node.js + Express, usando [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) para extraer y descargar el video, y [`ffmpeg`](https://www.ffmpeg.org/) (vía `ffmpeg-static`) para mezclar audio/video y convertir a MP3/WAV.
- **Frontend:** HTML/CSS/JS plano, sin frameworks.

## 💻 Instalación y uso (local, Windows)

1. Clonar el repo e instalar dependencias:

   ```bash
   git clone https://github.com/GGabi40/DownTube.git
   cd DownTube
   npm install
   ```

2. Descargar [`yt-dlp.exe`](https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe) y guardarlo en la raíz del proyecto (no se sube al repo por su tamaño — está en `.gitignore`).

3. Arrancar:

   ```bash
   npm start
   ```

   Esto levanta el servidor en `http://localhost:3000` y abre el navegador automáticamente. También podés usar `Arrancar.vbs` para lo mismo sin ventana de consola.

Al arrancar, el servidor avisa por consola si falta `yt-dlp.exe` o el binario de `ffmpeg`, con instrucciones de cómo resolverlo.

### 🩹 Troubleshooting

- **"Error al procesar el video" / "No se encontró yt-dlp.exe"** → falta el binario, seguí el paso 2 de arriba.
- **"Fallo al procesar la descarga. Asegúrate de tener FFmpeg instalado..."** → el paquete `ffmpeg-static` no pudo descargar su binario durante `npm install` (pasa si tu npm tiene bloqueados los scripts de instalación por seguridad). Arreglalo corriendo:

  ```bash
  node node_modules/ffmpeg-static/install.js
  ```

## 📂 Estructura

```
api/index.js      → app de Express con las rutas /api/info y /api/download
server.js         → entrypoint local: levanta la app, sirve /public, chequea dependencias y abre el navegador
public/           → frontend (HTML/CSS/JS)
```

Este proyecto es para uso personal/educativo. Descargar contenido de YouTube puede no cumplir con sus Términos de Servicio — usalo bajo tu propio criterio.

## ☁️ Nota: por qué no está deployado en la nube

Se probó deployar esto en Vercel como función serverless (quedan restos de esa config en `vercel.json` y `scripts/` por si se retoma), pero YouTube bloquea las IPs de datacenter (Vercel, AWS, GCP, etc.) con un chequeo anti-bot cada vez más agresivo: sin cookies te frena directo con *"Sign in to confirm you're not a bot"*, y con cookies pasa ese filtro pero exige un **PO Token** que no se puede resolver sin montar un servicio aparte (ej. [bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider)). Corriéndolo en tu máquina no hay ningún bloqueo, porque tu IP no está marcada como datacenter — por eso el proyecto quedó pensado para uso local.
