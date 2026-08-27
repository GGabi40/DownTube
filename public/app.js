document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const formatSelect = document.getElementById('format-select');
    const qualitySelect = document.getElementById('quality-select');
    const qualityWrapper = document.getElementById('quality-wrapper');
    const addBtn = document.getElementById('add-btn');
    const btnText = addBtn.querySelector('.btn-text');
    const loader = addBtn.querySelector('.loader');
    const errorMessage = document.getElementById('error-message');
    
    const queueSection = document.getElementById('queue-section');
    const queueList = document.getElementById('queue-list');
    const template = document.getElementById('queue-item-template');

    let queue = [];

    // Ocultar selector de calidad si es audio
    formatSelect.addEventListener('change', (e) => {
        if (e.target.value === 'mp3' || e.target.value === 'wav') {
            qualityWrapper.classList.add('hidden');
        } else {
            qualityWrapper.classList.remove('hidden');
        }
    });

    const showError = (msg) => {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    };

    const hideError = () => {
        errorMessage.classList.add('hidden');
    };

    const loadBtn = document.getElementById('load-btn');
    const optionsGroup = document.getElementById('options-group');
    const videoTitle = document.getElementById('video-title');
    const loadBtnText = loadBtn.querySelector('.btn-text');
    const loadBtnLoader = loadBtn.querySelector('.loader');

    let currentVideoData = null;

    const toggleLoading = (isLoading) => {
        if (isLoading) {
            loadBtnText.classList.add('hidden');
            loadBtnLoader.classList.remove('hidden');
            loadBtn.disabled = true;
        } else {
            loadBtnText.classList.remove('hidden');
            loadBtnLoader.classList.add('hidden');
            loadBtn.disabled = false;
        }
    };

    loadBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            showError("Por favor ingresa una URL válida de YouTube.");
            return;
        }

        hideError();
        toggleLoading(true);
        optionsGroup.classList.add('hidden');

        try {
            const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al obtener información.');

            currentVideoData = { ...data, url };
            
            // Llenar datos en UI
            videoTitle.textContent = data.title;

            // Llenar select de calidades
            qualitySelect.innerHTML = '<option value="max">Máxima (La que tenga el video)</option>';
            if (data.qualities && data.qualities.length > 0) {
                data.qualities.forEach(q => {
                    if (q >= 360) { // Ignorar calidades muy bajas para no saturar si se quiere, o dejarlas todas
                        const option = document.createElement('option');
                        option.value = q;
                        option.textContent = `${q}p`;
                        qualitySelect.appendChild(option);
                    }
                });
            }

            optionsGroup.classList.remove('hidden');
        } catch (err) {
            showError(err.message);
        } finally {
            toggleLoading(false);
        }
    });

    addBtn.addEventListener('click', () => {
        if (!currentVideoData) return;

        const format = formatSelect.value;
        const quality = format === 'mp4' ? qualitySelect.value : null;
        let qualityLabel = '';
        if (format === 'mp4') {
             qualityLabel = qualitySelect.options[qualitySelect.selectedIndex].text;
        }

        const item = {
            id: Date.now().toString(),
            url: currentVideoData.url,
            format,
            quality,
            title: currentVideoData.title || 'Video de YouTube',
            thumbnail: currentVideoData.thumbnail || 'https://via.placeholder.com/120x68?text=No+Thumb',
            meta: `${format.toUpperCase()} ${qualityLabel ? '| ' + qualityLabel : ''}`
        };

        queue.push(item);
        renderQueue();
        
        urlInput.value = '';
        optionsGroup.classList.add('hidden');
        currentVideoData = null;
    });

    const renderQueue = () => {
        if (queue.length === 0) {
            queueSection.classList.add('hidden');
            queueList.innerHTML = '';
            return;
        }

        queueSection.classList.remove('hidden');
        queueList.innerHTML = '';

        queue.forEach(item => {
            const clone = template.content.cloneNode(true);
            const domItem = clone.querySelector('.queue-item');
            
            clone.querySelector('.item-thumb').src = item.thumbnail;
            clone.querySelector('.item-title').textContent = item.title;
            clone.querySelector('.item-meta').textContent = item.meta;

            const downloadBtn = clone.querySelector('.download-item-btn');
            downloadBtn.addEventListener('click', (e) => {
                downloadVideo(item, downloadBtn);
            });

            const removeBtn = clone.querySelector('.remove-item-btn');
            removeBtn.addEventListener('click', () => {
                queue = queue.filter(q => q.id !== item.id);
                renderQueue();
            });

            queueList.appendChild(domItem);
        });
    };

    const downloadVideo = (item, btnDom) => {
        btnDom.disabled = true;
        btnDom.textContent = '⏳';
        
        const params = new URLSearchParams({
            url: item.url,
            format: item.format
        });
        if (item.quality) params.append('quality', item.quality);

        const downloadUrl = `/api/download?${params.toString()}`;

        // Disparar la descarga en el navegador
        window.location.href = downloadUrl;

        // Restaurar botón después de unos segundos asumiendo que ya saltó el prompt de descarga
        setTimeout(() => {
            btnDom.disabled = false;
            btnDom.textContent = '⬇️';
        }, 5000);
    };
});
