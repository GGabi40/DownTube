const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const express = require('express');
const app = require('./api/index.js');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Chequeo de dependencias al arrancar: sin esto, la primera búsqueda o
// descarga falla con un error genérico que no dice qué falta instalar.
const ytDlpPath = path.join(__dirname, 'yt-dlp.exe');
if (!fs.existsSync(ytDlpPath)) {
    console.warn('\n! ATENCION: No se encontró "yt-dlp.exe" en la raíz del proyecto.');
    console.warn('  Descargalo de https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe');
    console.warn('  y guardalo en:', ytDlpPath, '\n');
}
try {
    const ffmpegPath = require('ffmpeg-static');
    if (!fs.existsSync(ffmpegPath)) {
        console.warn('\n! ATENCION: falta el binario de ffmpeg-static (necesario para MP3/WAV y MP4 en máxima calidad).');
        console.warn('  Esto pasa si "npm install" no pudo correr sus scripts de instalación.');
        console.warn('  Arreglalo con: node node_modules/ffmpeg-static/install.js\n');
    }
} catch (e) {
    console.warn('\n! ATENCION: no se pudo cargar ffmpeg-static. Corré "npm install" de nuevo.\n');
}

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);

    const platform = os.platform();
    const openCmd = platform === 'win32'
        ? `start http://localhost:${PORT}`
        : platform === 'darwin'
            ? `open http://localhost:${PORT}`
            : `xdg-open http://localhost:${PORT}`;
    exec(openCmd);
});
