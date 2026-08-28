const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const app = express();
app.use(cors());

const downloadsDir = path.join(os.tmpdir(), 'DownTubeTemp');
fs.mkdirSync(downloadsDir, { recursive: true });

// En Windows local usamos el .exe ya incluido en el repo; en Vercel (Linux) usamos
// el binario descargado por scripts/download-yt-dlp.js durante el build.
function resolveYtDlpPath() {
    const winBinary = path.join(__dirname, '..', 'yt-dlp.exe');
    const linuxBinary = path.join(__dirname, '..', 'bin', 'yt-dlp');
    if (os.platform() === 'win32' && fs.existsSync(winBinary)) return winBinary;
    return linuxBinary;
}
const ytDlpPath = resolveYtDlpPath();

// YouTube suele bloquear pedidos que vienen de IPs de datacenter (Vercel, AWS, etc.)
// con un chequeo anti-bot. Si se define YTDLP_COOKIES (contenido de un cookies.txt
// exportado desde el navegador logueado), lo usamos para autenticar los pedidos.
let cookiesFilePath = null;
if (process.env.YTDLP_COOKIES) {
    cookiesFilePath = path.join(os.tmpdir(), 'downtube-cookies.txt');
    try {
        fs.writeFileSync(cookiesFilePath, process.env.YTDLP_COOKIES);
    } catch (e) {
        console.error('No se pudo escribir el archivo de cookies:', e.message);
        cookiesFilePath = null;
    }
}
function cookieArgs() {
    if (!cookiesFilePath) return [];
    // Con cookies, YouTube exige un PO Token para el cliente "web" o no devuelve
    // formatos reproducibles ("No video formats found!"). Sin un proveedor de PO
    // Token configurado, este flag le pide a yt-dlp que igual liste esos formatos
    // (pueden fallar/cortarse en descargas largas, pero es el workaround estándar).
    return ['--cookies', cookiesFilePath, '--extractor-args', 'youtube:formats=missing_pot'];
}

function parseUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
        return parsed.toString();
    } catch {
        return null;
    }
}

// Obtiene la metadata del video
app.get('/api/info', async (req, res) => {
    try {
        const url = parseUrl(req.query.url);
        if (!url) return res.status(400).json({ error: 'Falta la URL o no es válida' });

        console.log(`Obteniendo info para: ${url}`);

        // execFile (no shell) + "--" antes de la URL: evita inyección de comandos
        // y que una URL que empiece con "-" se interprete como flag de yt-dlp.
        const { stdout } = await execFileAsync(ytDlpPath, [
            '--dump-json', '--no-warnings', '--no-check-certificate', '--no-playlist', ...cookieArgs(), '--', url
        ]);
        const info = JSON.parse(stdout);

        let qualities = new Set();
        if (info.formats) {
            info.formats.forEach(f => {
                if (f.height) qualities.add(f.height);
            });
        }
        qualities = Array.from(qualities).sort((a, b) => b - a);

        res.json({
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            qualities: qualities
        });
    } catch (error) {
        console.error("Error al obtener info:", error.message);
        res.status(500).json({ error: 'Error al procesar el video. Verifica el enlace.' });
    }
});

// Descarga el video en el servidor y lo envía al cliente
app.get('/api/download', async (req, res) => {
    try {
        const url = parseUrl(req.query.url);
        const { format } = req.query;
        const quality = req.query.quality === 'max' || /^\d+$/.test(req.query.quality) ? req.query.quality : 'max';
        if (!url) return res.status(400).json({ error: 'Falta la URL o no es válida' });

        const videoId = Date.now().toString(36) + Math.random().toString(36).slice(2);
        const ffmpegPath = require('ffmpeg-static');

        const args = [
            '--ffmpeg-location', ffmpegPath,
            '--no-warnings', '--no-check-certificate', '--no-playlist',
            '--concurrent-fragments', '5',
            ...cookieArgs(),
            '-P', downloadsDir,
            '-o', `${videoId}.%(ext)s`
        ];

        if (format === 'mp3') {
            args.push('-x', '--audio-format', 'mp3', '-f', 'bestaudio/best');
        } else if (format === 'wav') {
            args.push('-x', '--audio-format', 'wav', '-f', 'bestaudio/best');
        } else {
            const formatQuery = quality === 'max'
                ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
                : `bestvideo[height<=${quality}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best`;
            args.push('-f', formatQuery);
        }

        args.push('--', url);

        console.log("Comenzando descarga:", url);

        let videoInfo = { title: "video" };
        try {
            const { stdout } = await execFileAsync(ytDlpPath, ['--dump-json', '--no-warnings', ...cookieArgs(), '--', url]);
            videoInfo = JSON.parse(stdout);
        } catch (e) {
            console.error("No se pudo pre-cargar el titulo");
        }

        // Saneamos el título para que funcione en header Content-Disposition
        const safeTitle = (videoInfo.title || "video").replace(/[^a-zA-Z0-9_-]/g, "_");

        await execFileAsync(ytDlpPath, args);

        // Buscar el archivo descargado
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find(f => f.startsWith(videoId));

        if (downloadedFile) {
            const actualFilePath = path.join(downloadsDir, downloadedFile);
            const ext = path.extname(downloadedFile);

            res.download(actualFilePath, `${safeTitle}${ext}`, (err) => {
                if (err) {
                    console.error("Error enviando el archivo:", err);
                }
                fs.unlink(actualFilePath, (e) => {
                    if (e) console.error("No se pudo borrar el archivo temporal:", e);
                });
            });
        } else {
            res.status(500).json({ error: 'El archivo no se pudo descargar.' });
        }
    } catch (error) {
        console.error("Error al descargar:", error.message);
        res.status(500).json({ error: 'Fallo al procesar la descarga. Asegúrate de tener FFmpeg instalado para descargas MP3 y la máxima calidad de MP4.' });
    }
});

module.exports = app;
