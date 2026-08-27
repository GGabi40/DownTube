const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const express = require('express');
const app = require('./api/index.js');

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

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
