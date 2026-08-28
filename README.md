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

## ⚠️ Limitación conocida: bloqueo anti-bot de YouTube en Vercel

**A la fecha, el deploy en Vercel no logra bajar videos de forma confiable.** No es un bug de la app — es la protección anti-bot de YouTube contra IPs de datacenter (Vercel, AWS, GCP, etc.), que se fue endureciendo durante 2025-2026:

- **Sin cookies** (cliente `web` o `android` de yt-dlp): YouTube devuelve directamente *"Sign in to confirm you're not a bot"* — probado con ambos clientes, bloqueado igual.
- **Con cookies** (variable de entorno `YTDLP_COOKIES` con un `cookies.txt` de una cuenta logueada): se esquiva el chequeo anti-bot, pero YouTube exige un **PO Token** para listar formatos reproducibles, y sin un proveedor de PO Token configurado devuelve *"No video formats found!"*.

Esto no se resuelve con un flag más — el código ya usa el workaround estándar de yt-dlp (`--cookies` + `--extractor-args youtube:formats=missing_pot`), documentado en su wiki, pero tampoco alcanza en la práctica ahora mismo.

**Opciones reales si necesitás que funcione andando en la nube:**
1. Montar un proveedor de PO Token propio (ej. [bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider)) — es un servicio aparte, no un cambio de config.
2. Deployar en un host con IP residencial/no-datacenter en vez de Vercel.
3. **Usar la app en local** (ver abajo) — ahí funciona sin ningún workaround, porque la IP no está marcada como datacenter.

Además: los videos se procesan dentro del tiempo límite de ejecución de la función serverless (60s en `vercel.json`); videos largos o conversiones pesadas pueden no alcanzar a completarse igual aunque el bloqueo anti-bot se resuelva.

Este proyecto es para uso personal/educativo. Descargar contenido de YouTube puede no cumplir con sus Términos de Servicio — usalo bajo tu propio criterio.

### 🍪 Cookies (dejan la app lo más cerca posible de andar en Vercel, pero no lo garantizan)

1. Instalá una extensión tipo [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) (formato Netscape, no JSON) y exportá **solo** las cookies de `youtube.com` de una cuenta logueada — preferentemente secundaria, no la principal.
2. Filtrá el archivo para quedarte solo con las cookies de sesión (`SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `__Secure-1PSID`, `__Secure-3PSID`, `__Secure-1PAPISID`, `__Secure-3PAPISID`, `__Secure-1PSIDCC`, `__Secure-3PSIDCC`, `__Secure-1PSIDTS`, `__Secure-3PSIDTS`, `LOGIN_INFO`, `SIDCC`, `PREF`) — el archivo completo trae cientos de cookies de tracking que superan el límite de 64KB de Vercel.
3. En el dashboard de Vercel → **Settings → Environment Variables**, creá `YTDLP_COOKIES` con ese contenido filtrado y redeployá.

⚠️ Esas cookies son la sesión de tu cuenta de Google/YouTube — nunca las pegues en un chat ni las subas al repo.
