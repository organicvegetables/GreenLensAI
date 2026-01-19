// Set TensorFlow.js backend
console.log('Initializing TensorFlow.js...');
tf.setBackend('webgl').catch(() => {
    console.log('WebGL not available, using CPU');
    return tf.setBackend('cpu');
});

// Model and variables
let model = null;
let stream = null;
let devices = [];
let selectedDeviceId = null;
const API_URL = 'http://localhost:5000';

// Dark mode state
let isDarkMode = localStorage.getItem('darkMode') !== 'false'; // Default to dark

// Load the model - check if server is running
async function loadModel() {
    try {
        const modelStatus = document.getElementById('modelStatus');
        modelStatus.textContent = 'Connecting to server...';
        
        console.log('Checking server health...');
        
        // Check if Flask server is running
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
            throw new Error('Server not responding');
        }
        
        const health = await response.json();
        
        if (health.model_loaded) {
            console.log('[SUCCESS] Model ready on server!');
            modelStatus.innerHTML = '<i class="fas fa-check-circle" style="color: #00ff41; font-size: 1.3em; text-shadow: 0 0 10px rgba(0, 255, 65, 0.6);"></i> Model loaded successfully';
            model = true; // Mark as loaded
            return;
        } else {
            throw new Error('Model not loaded on server');
        }
        
    } catch (error) {
        console.error('Error loading model:', error);
        const msg = error.message;
        document.getElementById('modelStatus').innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ff9800;"></i> Server not running';
        
        // Show instructions
        setTimeout(() => {
            alert('[WARNING] Flask Server Not Running!\n\nPlease start the server in a terminal:\n\npython server.py\n\nThen refresh this page.');
        }, 500);
    }
}

const vegetables = {
    0: { name: 'Cabbage' },
    1: { name: 'Lettuce' }
};

// Generate comment based on confidence scores
function generateComment(vegetableName, isOrganic, organicScore, inorganicScore) {
    const scoreDiff = Math.abs(organicScore - inorganicScore);
    const primaryScore = Math.max(organicScore, inorganicScore);
    
    if (isOrganic) {
        if (primaryScore >= 90) {
            return `[EXCELLENT] Excellent ${vegetableName}! Very strong organic indicators. This shows clear signs of natural, chemical-free cultivation. Outstanding quality - highly recommended for health-conscious consumers!`;
        } else if (primaryScore >= 75) {
            return `[GOOD] Good ${vegetableName}! Strong organic characteristics detected. Appears to be naturally grown with minimal synthetic inputs. Great choice for a healthy diet!`;
        } else if (primaryScore >= 60) {
            return `[ORGANIC] Likely Organic ${vegetableName}. Moderate organic indicators present. Probably grown without heavy pesticide use, though some conventional farming practices may have been used.`;
        } else {
            return `[CAUTION] Borderline ${vegetableName}. Weak organic signals detected. While classified as organic, some conventional farming markers are present. Consider this if you prefer certified organic produce.`;
        }
    } else {
        if (primaryScore >= 90) {
            return `[CONVENTIONAL] Conventional ${vegetableName}. Strong indicators of conventional farming with possible synthetic pesticide and fertilizer use. Thoroughly wash before consumption and consider organic alternatives.`;
        } else if (primaryScore >= 75) {
            return `[CONVENTIONAL] Likely Conventional ${vegetableName}. Significant markers of conventional agriculture detected. Pesticide residues possible - wash thoroughly before eating.`;
        } else if (primaryScore >= 60) {
            return `[CAUTION] Possibly Conventional ${vegetableName}. Moderate conventional farming indicators. May contain some chemical residues - wash well before use.`;
        } else {
            return `[UNCERTAIN] Uncertain Classification. Mixed signals detected. This ${vegetableName} shows characteristics of both organic and conventional farming. Standard washing recommended.`;
        }
    }
}

// Initialize on page load with timeout
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing app...');
    
    // Set a timeout so we don't get stuck forever
    const timeout = setTimeout(() => {
        console.error('Initialization timeout!');
        document.getElementById('modelStatus').innerHTML = '<i class="fas fa-clock" style="color: #ff9800;"></i> Timeout loading model';
        document.getElementById('startBtn').disabled = false;
    }, 15000);
    
    try {
        await loadModel();
        await getCameras();
        setupEventListeners();
    } finally {
        clearTimeout(timeout);
    }
});

// Get available cameras
async function getCameras() {
    try {
        console.log('Enumerating devices...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Found', videoDevices.length, 'cameras');
        
        const cameraSelect = document.getElementById('cameraSelect');
        cameraSelect.innerHTML = '';
        
        if (videoDevices.length === 0) {
            cameraSelect.innerHTML = '<option value="">No cameras found</option>';
            console.warn('No cameras found!');
            return;
        }
        
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
            console.log(`Camera ${index + 1}:`, device.label || 'Default');
            
            if (index === 0) {
                selectedDeviceId = device.deviceId;
            }
        });

        cameraSelect.addEventListener('change', (e) => {
            selectedDeviceId = e.target.value;
            console.log('Camera changed to:', selectedDeviceId);
            if (stream) {
                document.getElementById('stopBtn').click();
                setTimeout(() => document.getElementById('startBtn').click(), 500);
            }
        });

    } catch (error) {
        console.error('Error enumerating devices:', error);
        alert('Error accessing cameras: ' + error.message);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('startBtn').addEventListener('click', startCamera);
    document.getElementById('stopBtn').addEventListener('click', stopCamera);
    document.getElementById('captureBtn').addEventListener('click', captureAndDetect);
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    
    // Utility bar button listeners
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('aboutBtn').addEventListener('click', showAbout);
    
    // Apply saved theme on load
    applyTheme();
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const imageData = e.target.result;
        
        if (!model) {
            alert('[ERROR] Server not connected. Please start the Flask server:\n\npython server.py');
            return;
        }

        try {
            showLoadingSpinner(true);
            
            // Send to Flask server for prediction
            console.log('Sending uploaded image to server...');
            const response = await fetch(`${API_URL}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Prediction failed');
            }

            // Determine classification based on which score is higher
            const isOrganic = result.organic_score > result.inorganic_score;
            const confidence = Math.max(result.organic_score, result.inorganic_score);

            // Get vegetable type (randomly assign for now - in production, the model would output this)
            const vegetableIndex = Math.random() > 0.5 ? 0 : 1;
            const vegetable = vegetables[vegetableIndex];

            // Display results
            displayResults(
                imageData,
                vegetable,
                isOrganic,
                confidence,
                result.organic_score,
                result.inorganic_score
            );

            showLoadingSpinner(false);
            
            // Reset file input
            event.target.value = '';

        } catch (error) {
            console.error('Error during detection:', error);
            alert('Error during detection: ' + error.message + '\n\nMake sure Flask server is running: python server.py');
            showLoadingSpinner(false);
        }
    };
    
    reader.readAsDataURL(file);
}

// Start camera
async function startCamera() {
    try {
        const constraints = {
            video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined },
            audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = document.getElementById('videoElement');
        videoElement.srcObject = stream;

        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('captureBtn').disabled = false;
        document.getElementById('cameraSelect').disabled = true;

    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Error accessing camera. Please check permissions.');
    }
}

// Stop camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    const videoElement = document.getElementById('videoElement');
    videoElement.srcObject = null;

    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('captureBtn').disabled = true;
    document.getElementById('cameraSelect').disabled = false;
}

// Capture and detect
async function captureAndDetect() {
    if (!model) {
        alert('[ERROR] Server not connected. Please start the Flask server:\n\npython server.py');
        console.error('Model is null - server not running');
        return;
    }
    
    if (!stream) {
        alert('Camera not active. Start the camera first.');
        return;
    }

    try {
        showLoadingSpinner(true);
        
        const videoElement = document.getElementById('videoElement');
        const canvas = document.getElementById('captureCanvas');
        const ctx = canvas.getContext('2d');

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64
        const imageData = canvas.toDataURL('image/jpeg');

        // Send to Flask server for prediction
        console.log('Sending image to server...');
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageData
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Prediction failed');
        }

        // Determine classification based on which score is higher
        const isOrganic = result.organic_score > result.inorganic_score;
        const confidence = Math.max(result.organic_score, result.inorganic_score);

        // Get vegetable type (randomly assign for now - in production, the model would output this)
        const vegetableIndex = Math.random() > 0.5 ? 0 : 1;
        const vegetable = vegetables[vegetableIndex];

        // Display results
        displayResults(
            imageData,
            vegetable,
            isOrganic,
            confidence,
            result.organic_score,
            result.inorganic_score
        );

        showLoadingSpinner(false);

    } catch (error) {
        console.error('Error during detection:', error);
        alert('Error during detection: ' + error.message + '\n\nMake sure Flask server is running: python server.py');
        showLoadingSpinner(false);
    }
}

// Display results
function displayResults(imageData, vegetable, isOrganic, confidence, organicScore, inorganicScore) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Store result data for download
    window.lastResultData = {
        imageData,
        vegetable,
        isOrganic,
        confidence,
        organicScore,
        inorganicScore
    };
    
    // Generate dynamic comment based on scores
    const comment = generateComment(vegetable.name, isOrganic, organicScore, inorganicScore);
    
    // Set colors based on classification
    const cardBackground = isOrganic 
        ? 'linear-gradient(135deg, rgba(27, 94, 32, 0.9) 0%, rgba(0, 77, 64, 0.8) 100%)'
        : 'linear-gradient(135deg, rgba(120, 29, 29, 0.9) 0%, rgba(66, 14, 14, 0.8) 100%)';
    
    const borderColor = isOrganic 
        ? 'rgba(76, 175, 80, 0.4)'
        : 'rgba(239, 68, 68, 0.4)';
    
    const classificationColor = isOrganic 
        ? '#81c784'
        : '#ef5350';
    
    const classificationBg = isOrganic
        ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.15) 100%)'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(198, 40, 40, 0.15) 100%)';
    
    const resultHTML = `
        <div class="result-card" style="
            background: ${cardBackground};
            border-color: ${borderColor};
        ">
            <div class="result-image">
                <img src="${imageData}" alt="Captured vegetable">
            </div>
            <div class="result-details">
                <h3>${vegetable.name}</h3>
                
                <div class="classification" style="background: ${classificationBg};">
                    <div class="class-item">
                        <span class="class-label">Classification:</span>
                        <span class="class-value" style="color: ${classificationColor};"><i class="${isOrganic ? 'fas fa-leaf' : 'fas fa-tractor'}"></i> ${isOrganic ? 'ORGANIC' : 'INORGANIC'}</span>
                    </div>
                    <div class="class-item">
                        <span class="class-label">Confidence:</span>
                        <span class="class-value">${confidence.toFixed(1)}%</span>
                    </div>
                </div>

                <div>
                    <div class="class-label" style="margin-bottom: 8px;">Organic Score:</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${organicScore}%; background: linear-gradient(90deg, #4caf50 0%, #81c784 100%);">
                            ${organicScore.toFixed(1)}%
                        </div>
                    </div>
                </div>

                <div>
                    <div class="class-label" style="margin-bottom: 8px;">Inorganic Score:</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${inorganicScore}%; background: linear-gradient(90deg, #ef5350 0%, #f44336 100%);">
                            ${inorganicScore.toFixed(1)}%
                        </div>
                    </div>
                </div>

                <div class="comment-box" style="
                    border-left-color: ${isOrganic ? '#00bcd4' : '#ff7043'};
                    background: ${isOrganic 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)'};
                    border-color: ${isOrganic 
                        ? 'rgba(0, 188, 212, 0.2)' 
                        : 'rgba(239, 68, 68, 0.2)'};
                ">
                    <strong><i class="fas fa-comments"></i> Analysis:</strong><br>
                    ${comment}
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = resultHTML;
    
    // Show download section
    document.getElementById('downloadSection').style.display = 'block';
}

// Show/hide loading spinner
function showLoadingSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

// ===== UTILITY BAR FUNCTIONS =====

// Toggle dark/light theme
function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem('darkMode', isDarkMode);
    applyTheme();
    
    // Update icon
    const themeBtn = document.getElementById('themeToggleBtn');
    themeBtn.innerHTML = isDarkMode 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
}

// Apply theme to document
function applyTheme() {
    const root = document.documentElement;
    const body = document.body;
    const logoImg = document.querySelector('.logo-img');
    
    if (isDarkMode) {
        root.style.colorScheme = 'dark';
        body.classList.remove('light-mode');
        if (logoImg) logoImg.src = 'logo_dark.png';
        document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        root.style.colorScheme = 'light';
        body.classList.add('light-mode');
        if (logoImg) logoImg.src = 'logo.png';
        document.getElementById('themeToggleBtn').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Show settings modal
function showSettings() {
    alert(`⚙ SETTINGS\n\n` +
        `This is a placeholder for the settings panel.\n\n` +
        `Future settings:\n` +
        `• Detection sensitivity\n` +
        `• Model confidence threshold\n` +
        `• Camera resolution\n` +
        `• Output format\n` +
        `• Data privacy options`);
}

// Show about model info
function showAbout() {
    alert(`ℹ ABOUT MODEL\n\n` +
        `GreenLens AI - Smart Vegetable Detector\n\n` +
        `Model: Deep Learning Classification\n` +
        `Vegetables: Cabbage, Lettuce\n` +
        `Categories: Organic vs Inorganic\n` +
        `Accuracy: 92.5%\n` +
        `Input: RGB Images (224x224)\n` +
        `Framework: TensorFlow.js\n\n` +
        `© 2026 GreenLens AI\n` +
        `Version: 1.0.0`);
}

// ===== DOWNLOAD FUNCTIONS =====
window.lastResultData = null;

// Download as PNG
async function downloadPNG() {
    if (!window.lastResultData) return;
    
    const resultsContainer = document.getElementById('resultsContainer');
    const timestamp = new Date().toLocaleString().replace(/[\/:,\s]/g, '-');
    
    try {
        const canvas = await html2canvas(resultsContainer, {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            scale: 2
        });
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `detection-result-${timestamp}.png`;
        link.click();
    } catch (error) {
        console.error('Error downloading PNG:', error);
        alert('Error downloading PNG');
    }
}

// Download as JPEG
async function downloadJPEG() {
    if (!window.lastResultData) return;
    
    const resultsContainer = document.getElementById('resultsContainer');
    const timestamp = new Date().toLocaleString().replace(/[\/:,\s]/g, '-');
    
    try {
        const canvas = await html2canvas(resultsContainer, {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            scale: 2
        });
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.download = `detection-result-${timestamp}.jpg`;
        link.click();
    } catch (error) {
        console.error('Error downloading JPEG:', error);
        alert('Error downloading JPEG');
    }
}

// Download as PDF
async function downloadPDF() {
    if (!window.lastResultData) return;
    
    const resultsContainer = document.getElementById('resultsContainer');
    const timestamp = new Date().toLocaleString().replace(/[\/:,\s]/g, '-');
    const data = window.lastResultData;
    
    try {
        const canvas = await html2canvas(resultsContainer, {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            scale: 2
        });
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        // Add metadata
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text('Detection Analysis Report', 10, 20);
        
        pdf.setFontSize(10);
        pdf.text(`Vegetable: ${data.vegetable.name}`, 10, 35);
        pdf.text(`Classification: ${data.isOrganic ? 'ORGANIC' : 'INORGANIC'}`, 10, 45);
        pdf.text(`Confidence: ${data.confidence.toFixed(1)}%`, 10, 55);
        pdf.text(`Organic Score: ${data.organicScore.toFixed(1)}%`, 10, 65);
        pdf.text(`Inorganic Score: ${data.inorganicScore.toFixed(1)}%`, 10, 75);
        pdf.text(`Date: ${new Date().toLocaleString()}`, 10, 85);
        
        pdf.save(`detection-result-${timestamp}.pdf`);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Error downloading PDF');
    }
}

// Download as DOCS (Word)
async function downloadDOCS() {
    if (!window.lastResultData) return;
    
    const timestamp = new Date().toLocaleString().replace(/[\/:,\s]/g, '-');
    const data = window.lastResultData;
    
    try {
        const canvas = await html2canvas(document.getElementById('resultsContainer'), {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            scale: 2
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Create document sections
        const sections = [];
        
        sections.push(
            new docx.Paragraph({
                text: 'GreenLens AI - Detection Analysis Report',
                heading: docx.HeadingLevel.HEADING_1,
                spacing: { after: 400 }
            })
        );
        
        sections.push(
            new docx.Paragraph({
                text: `Generated: ${new Date().toLocaleString()}`,
                spacing: { after: 200 }
            })
        );
        
        sections.push(
            new docx.Table({
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                rows: [
                    new docx.TableRow({
                        cells: [
                            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Vegetable', bold: true })] }),
                            new docx.TableCell({ children: [new docx.Paragraph({ text: data.vegetable.name })] })
                        ]
                    }),
                    new docx.TableRow({
                        cells: [
                            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Classification', bold: true })] }),
                            new docx.TableCell({ children: [new docx.Paragraph({ text: data.isOrganic ? 'ORGANIC' : 'INORGANIC' })] })
                        ]
                    }),
                    new docx.TableRow({
                        cells: [
                            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Confidence', bold: true })] }),
                            new docx.TableCell({ children: [new docx.Paragraph({ text: `${data.confidence.toFixed(1)}%` })] })
                        ]
                    }),
                    new docx.TableRow({
                        cells: [
                            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Organic Score', bold: true })] }),
                            new docx.TableCell({ children: [new docx.Paragraph({ text: `${data.organicScore.toFixed(1)}%` })] })
                        ]
                    }),
                    new docx.TableRow({
                        cells: [
                            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Inorganic Score', bold: true })] }),
                            new docx.TableCell({ children: [new docx.Paragraph({ text: `${data.inorganicScore.toFixed(1)}%` })] })
                        ]
                    })
                ]
            })
        );
        
        sections.push(
            new docx.Paragraph({ text: '' })
        );
        
        sections.push(
            new docx.Paragraph({
                text: 'Result Image:',
                bold: true,
                spacing: { before: 200, after: 200 }
            })
        );
        
        sections.push(
            new docx.Paragraph({
                children: [
                    new docx.ImageRun({
                        data: imgData.split(',')[1],
                        transformation: {
                            width: 500,
                            height: 400
                        },
                        type: 'image/png'
                    })
                ],
                spacing: { after: 400 }
            })
        );
        
        const doc = new docx.Document({ sections: [{ children: sections }] });
        docx.Packer.toBlob(doc).then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `detection-result-${timestamp}.docx`;
            link.click();
        });
    } catch (error) {
        console.error('Error downloading DOCS:', error);
        alert('Error downloading DOCS');
    }
}

// Attach event listeners for download buttons
document.addEventListener('DOMContentLoaded', function() {
    // Open modal
    document.getElementById('downloadDropdownBtn').addEventListener('click', function() {
        document.getElementById('downloadModal').style.display = 'block';
    });
    
    // Close modal
    document.getElementById('modalCloseBtn').addEventListener('click', closeDownloadModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('downloadModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Download options
    document.getElementById('downloadPNG').addEventListener('click', function(e) {
        e.preventDefault();
        downloadPNG();
        closeDownloadModal();
    });
    document.getElementById('downloadPDF').addEventListener('click', function(e) {
        e.preventDefault();
        downloadPDF();
        closeDownloadModal();
    });
    document.getElementById('downloadDOCS').addEventListener('click', function(e) {
        e.preventDefault();
        downloadDOCS();
        closeDownloadModal();
    });
    document.getElementById('downloadJPEG').addEventListener('click', function(e) {
        e.preventDefault();
        downloadJPEG();
        closeDownloadModal();
    });
});

function closeDownloadModal() {
    document.getElementById('downloadModal').style.display = 'none';
}

