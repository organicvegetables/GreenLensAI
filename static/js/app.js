// ===== CONFIGURATION =====

// Automatically set API_URL based on environment
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:10000' // Local Flask port
    : 'https://greenlens-byhj.onrender.com'; // Your deployed Render URL

console.log('[INFO] API URL:', API_URL);

// TensorFlow.js backend
console.log('Initializing TensorFlow.js...');
tf.setBackend('webgl').catch(() => {
    console.log('WebGL not available, using CPU');
    return tf.setBackend('cpu');
});

// Model state
let modelConnected = false;
let stream = null;
let selectedDeviceId = null;

// Vegetables mapping
const vegetables = { 0: { name: 'Cabbage' }, 1: { name: 'Lettuce' } };

// Dark mode
let isDarkMode = localStorage.getItem('darkMode') !== 'false';

// ===== UTILITY FUNCTIONS =====

// Show/hide loading spinner
function showLoadingSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

// Apply theme
function applyTheme() {
    const body = document.body;
    const logoImg = document.querySelector('.logo-img');
    if (isDarkMode) {
        body.classList.remove('light-mode');
        if (logoImg) logoImg.src = '../assets/logo_dark.png';
        document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        body.classList.add('light-mode');
        if (logoImg) logoImg.src = '../assets/logo.png';
        document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Toggle dark mode
function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
}

// Generate analysis comment
function generateComment(vegetableName, isOrganic, organicScore, inorganicScore) {
    const primaryScore = Math.max(organicScore, inorganicScore);
    if (isOrganic) {
        if (primaryScore >= 90) return `[EXCELLENT] Excellent ${vegetableName}! Very strong organic indicators.`;
        if (primaryScore >= 75) return `[GOOD] Good ${vegetableName}! Strong organic characteristics detected.`;
        if (primaryScore >= 60) return `[ORGANIC] Likely Organic ${vegetableName}. Moderate organic indicators present.`;
        return `[CAUTION] Borderline ${vegetableName}. Weak organic signals detected.`;
    } else {
        if (primaryScore >= 90) return `[CONVENTIONAL] Conventional ${vegetableName}. Strong indicators of conventional farming.`;
        if (primaryScore >= 75) return `[CONVENTIONAL] Likely Conventional ${vegetableName}. Significant markers detected.`;
        if (primaryScore >= 60) return `[CAUTION] Possibly Conventional ${vegetableName}. Moderate indicators.`;
        return `[UNCERTAIN] Uncertain Classification. Mixed signals detected.`;
    }
}

// Display results in UI
function displayResults(imageData, vegetable, isOrganic, confidence, organicScore, inorganicScore) {
    const resultsContainer = document.getElementById('resultsContainer');
    window.lastResultData = { imageData, vegetable, isOrganic, confidence, organicScore, inorganicScore };
    const comment = generateComment(vegetable.name, isOrganic, organicScore, inorganicScore);

    const cardBg = isOrganic 
        ? 'linear-gradient(135deg, rgba(27, 94, 32, 0.9), rgba(0, 77, 64, 0.8))'
        : 'linear-gradient(135deg, rgba(120, 29, 29, 0.9), rgba(66, 14, 14, 0.8))';
    const borderColor = isOrganic ? 'rgba(76, 175, 80, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    const classificationColor = isOrganic ? '#81c784' : '#ef5350';
    const classificationBg = isOrganic
        ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(56, 142, 60, 0.15))'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(198, 40, 40, 0.15))';

    const html = `
        <div class="result-card" style="background:${cardBg}; border-color:${borderColor};">
            <div class="result-image"><img src="${imageData}" alt="Vegetable"></div>
            <div class="result-details">
                <h3>${vegetable.name}</h3>
                <div class="classification" style="background:${classificationBg};">
                    <div class="class-item">
                        <span class="class-label">Classification:</span>
                        <span class="class-value" style="color:${classificationColor};">
                            <i class="${isOrganic ? 'fas fa-leaf' : 'fas fa-tractor'}"></i> ${isOrganic ? 'ORGANIC' : 'INORGANIC'}
                        </span>
                    </div>
                    <div class="class-item">
                        <span class="class-label">Confidence:</span>
                        <span class="class-value">${confidence.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="comment-box" style="border-left-color:${isOrganic ? '#00bcd4' : '#ff7043'};">
                    <strong><i class="fas fa-comments"></i> Analysis:</strong><br>${comment}
                </div>
            </div>
        </div>
    `;
    resultsContainer.innerHTML = html;
    document.getElementById('downloadSection').style.display = 'block';
}

// ===== SERVER INTERACTIONS =====

// Check server health
async function checkServer() {
    try {
        const resp = await fetch(`${API_URL}/health`);
        const data = await resp.json();
        modelConnected = data.model_loaded || false;

        const statusEl = document.getElementById('modelStatus');
        if (modelConnected) {
            statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#00ff41;"></i> Model loaded successfully';
        } else {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ff9800;"></i> Running in demo mode';
        }
    } catch (e) {
        console.error('Server not reachable:', e);
        document.getElementById('modelStatus').innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ff9800;"></i> Server not running';
        modelConnected = false;
    }
}

// Send image to server for prediction
async function sendToServer(imageData) {
    if (!modelConnected) return demoPrediction(imageData);

    try {
        const resp = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });
        const result = await resp.json();
        if (!result.success) throw new Error(result.error || 'Prediction failed');

        const isOrganic = result.organic_score > result.inorganic_score;
        const confidence = Math.max(result.organic_score, result.inorganic_score);
        const vegetableIndex = Math.random() > 0.5 ? 0 : 1;
        const vegetable = vegetables[vegetableIndex];

        displayResults(imageData, vegetable, isOrganic, confidence, result.organic_score, result.inorganic_score);
    } catch (err) {
        console.error('Server error:', err);
        alert('[ERROR] Server error or model not loaded. Using demo mode.');
        demoPrediction(imageData);
    }
}

// Demo prediction (random scores)
function demoPrediction(imageData) {
    const organicScore = Math.round(Math.random() * 50 + 50);
    const inorganicScore = 100 - organicScore;
    const isOrganic = organicScore > inorganicScore;
    const confidence = Math.max(organicScore, inorganicScore);
    const vegetableIndex = Math.random() > 0.5 ? 0 : 1;
    const vegetable = vegetables[vegetableIndex];
    displayResults(imageData, vegetable, isOrganic, confidence, organicScore, inorganicScore);
}

// ===== CAMERA HANDLING =====

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        const cameraSelect = document.getElementById('cameraSelect');
        cameraSelect.innerHTML = '';
        videoDevices.forEach((d, i) => {
            const option = document.createElement('option');
            option.value = d.deviceId;
            option.textContent = d.label || `Camera ${i+1}`;
            cameraSelect.appendChild(option);
            if (i === 0) selectedDeviceId = d.deviceId;
        });
        cameraSelect.addEventListener('change', e => {
            selectedDeviceId = e.target.value;
            if (stream) stopCamera();
            setTimeout(startCamera, 500);
        });
    } catch (err) {
        console.error('Camera error:', err);
    }
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined } });
        const videoEl = document.getElementById('videoElement');
        videoEl.srcObject = stream;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('captureBtn').disabled = false;
        document.getElementById('cameraSelect').disabled = true;
    } catch (err) { console.error(err); alert('Camera error'); }
}

function stopCamera() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    const videoEl = document.getElementById('videoElement');
    videoEl.srcObject = null;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('captureBtn').disabled = true;
    document.getElementById('cameraSelect').disabled = false;
}

// Capture frame from camera and predict
function captureAndDetect() {
    if (!stream) return alert('Camera not active.');
    const canvas = document.getElementById('captureCanvas');
    const videoEl = document.getElementById('videoElement');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');
    sendToServer(imageData);
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => sendToServer(e.target.result);
    reader.readAsDataURL(file);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    applyTheme();
    await checkServer();
    await getCameras();

    // Event listeners
    document.getElementById('startBtn').addEventListener('click', startCamera);
    document.getElementById('stopBtn').addEventListener('click', stopCamera);
    document.getElementById('captureBtn').addEventListener('click', captureAndDetect);
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
});
