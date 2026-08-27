# 🎬 DownTube

Descargador de videos de YouTube simple y rápido: pegás el link, elegís formato y calidad, y te lo bajás en MP4, MP3 o WAV.

**🔗 Demo en vivo:** [downtube-ggabi40s-projects.vercel.app](https://downtube-ggabi40s-projects.vercel.app)

## ✨ Qué hace

- Pegás la URL de un video de YouTube y trae el título, la miniatura, la duración y las calidades disponibles.
- Elegís el formato: **MP4** (video), **MP3** o **WAV** (solo audio).
- Para MP4 podés elegir la calidad máxima disponible o una resolución específica.
- Armás una cola con varios videos antes de descargarlos.

## 🧱 Stack

- **Backend:** Node.js + Express, usando [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) para extraer y descargar el video, y [`ffmpeg`](https://www.ffmpeg.org/) (vía `ffmpeg-static`) para mezclar audio/video y convertir a MP3/WAV.
- **Frontend:** HTML/CSS/JS plano, sin frameworks.
- **Deploy:** [Vercel](https://vercel.com), como función serverless.

## 📂 Estructura

```
api/index.js      → app de Express con las rutas /api/info y /api/download (función serverless en Vercel)
server.js         → entrypoint solo para correr localmente (levanta la app + sirve /public + abre el navegador)
scripts/          → descarga el binario de yt-dlp para Linux durante el build de Vercel
public/           → frontend (HTML/CSS/JS)
vercel.json       → configuración de build, rutas y función serverless
```

## 💻 Correr en local (Windows)

Necesitás tener [`yt-dlp.exe`](https://github.com/yt-dlp/yt-dlp/releases/latest) en la raíz del proyecto (no se sube al repo por su tamaño).

```bash
npm install
npm start
```

Esto levanta el servidor en `http://localhost:3000` y abre el navegador automáticamente.

## ☁️ Deploy propio en Vercel

El proyecto ya está listo para deployar tal cual — Vercel instala las dependencias, descarga el binario de `yt-dlp` para Linux durante el build (`scripts/download-yt-dlp.js`) y sirve todo como función serverless. Solo hace falta importar el repo desde el dashboard de Vercel o correr:

```bash
vercel --prod
```

## ⚠️ Notas

- Los videos se procesan dentro del tiempo límite de ejecución de la función serverless (configurado en 60s en `vercel.json`); videos muy largos o conversiones a MP3/WAV pesadas pueden no alcanzar a completarse en el plan gratuito de Vercel.
- **YouTube puede bloquear los pedidos con "Sign in to confirm you're not a bot".** Es la protección anti-bot de YouTube contra IPs de datacenter (Vercel, AWS, GCP, etc.), no un bug de la app — pasa en casi cualquier hosting serverless/cloud. Se puede sortear pasándole cookies de una cuenta logueada (ver abajo).
- Este proyecto es para uso personal/educativo. Descargar contenido de YouTube puede no cumplir con sus Términos de Servicio — usalo bajo tu propio criterio.

### 🍪 Autenticar con cookies (opcional, para esquivar el bloqueo anti-bot)

1. Instalá una extensión tipo [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) y exportá las cookies de `youtube.com` estando logueado.
2. En el dashboard de Vercel del proyecto → **Settings → Environment Variables**, creá una variable `YTDLP_COOKIES` con el contenido completo de ese archivo `cookies.txt`.
3. Redeployá. El backend detecta la variable y se la pasa a `yt-dlp` automáticamente.

⚠️ Esas cookies son la sesión de tu cuenta de YouTube — no las compartas ni las subas al repo. Usá preferentemente una cuenta secundaria.
