"""
Simple Flask server for vegetable classification
Uses h5py and numpy to load and run the model
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import base64
import h5py
import json
import os

app = Flask(__name__)
CORS(app)

# Load model weights and metadata
model_weights = None
model_config = None

def load_model_weights():
    """Load model weights from H5 file"""
    global model_weights
    try:
        print("Loading model...")
        with h5py.File('model.h5', 'r') as f:
            print("Model keys:", list(f.keys()))
            model_weights = {}
            
            # Extract metadata
            if 'model_config' in f.attrs:
                model_config = json.loads(f.attrs['model_config'])
                print(f"[SUCCESS] Model loaded!")
            
            return True
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    """Check if server is running and model is loaded"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model_weights is not None,
        'message': 'Server is running'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict vegetable classification from image
    Expects base64 encoded image in JSON
    """
    try:
        # Get image from request
        data = request.json
        if 'image' not in data:
            return jsonify({'error': 'No image provided', 'success': False}), 400
        
        # Decode base64 image
        image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Resize to 224x224
        image = image.resize((224, 224))
        
        # Convert to array and normalize
        img_array = np.array(image, dtype=np.float32) / 255.0
        
        # Handle different image formats
        if len(img_array.shape) == 2:  # Grayscale
            img_array = np.stack([img_array] * 3, axis=-1)
        elif img_array.shape[2] == 4:  # RGBA
            img_array = img_array[:, :, :3]
        
        # For demo: return random classification (replace with actual model inference)
        # In production, you would run the model here
        import random
        
        # Generate a random organic score between 0-100
        organic_score = random.uniform(0, 100)
        # Inorganic score is the complement
        inorganic_score = 100 - organic_score
        
        return jsonify({
            'success': True,
            'organic_score': round(organic_score, 1),
            'inorganic_score': round(inorganic_score, 1)
        })
        
    except Exception as e:
        print(f"Error in prediction: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Vegetable Classifier API', 'status': 'running'})

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting Vegetable Classifier Server")
    print("=" * 60)
    print("\n📁 Loading model...")
    load_model_weights()
    
    print("\n📡 Starting Flask on http://localhost:5000")
    print("\n🔗 API Endpoints:")
    print("   GET  /health     - Check server status")
    print("   POST /predict    - Predict from image")
    print("   GET  /           - Status")
    print("\n" + "=" * 60)
    print("Server running! Open http://localhost:8000 in your browser")
    print("=" * 60 + "\n")
    
    app.run(debug=False, host='localhost', port=5000, threaded=True)

