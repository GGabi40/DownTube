const fs = require('fs');
const path = require('path');
const https = require('https');

const BIN_DIR = path.join(__dirname, '..', 'bin');
const BIN_PATH = path.join(BIN_DIR, 'yt-dlp');
// Binario standalone para Linux x64 (no depende de tener Python instalado en el runtime de Vercel).
const URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';

function download(url, dest, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                res.resume();
                if (redirectsLeft <= 0) return reject(new Error('Demasiadas redirecciones al descargar yt-dlp'));
                return resolve(download(res.headers.location, dest, redirectsLeft - 1));
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Fallo al descargar yt-dlp: HTTP ${res.statusCode}`));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', reject);
        }).on('error', reject);
    });
}

(async () => {
    fs.mkdirSync(BIN_DIR, { recursive: true });
    console.log('Descargando yt-dlp (binario Linux) para el build de Vercel...');
    await download(URL, BIN_PATH);
    fs.chmodSync(BIN_PATH, 0o755);
    console.log('yt-dlp listo en', BIN_PATH);
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
