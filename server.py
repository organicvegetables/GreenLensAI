"""
Flask server for vegetable classification
Render & Gunicorn ready
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
from PIL import Image
import io
import base64
import h5py
import json
import os
import random

app = Flask(__name__)
CORS(app)

# Global model variables
model_loaded = False
model_config = None

# --------------------------------------------------
# Load model at startup (Gunicorn compatible)
# --------------------------------------------------
def load_model():
    global model_loaded, model_config
    try:
        print("🔄 Loading model.h5 ...")

        if not os.path.exists("model.h5"):
            print("⚠️ model.h5 not found — running in demo mode")
            return

        with h5py.File("model.h5", "r") as f:
            if "model_config" in f.attrs:
                model_config = json.loads(f.attrs["model_config"])

        model_loaded = True
        print("✅ Model loaded successfully")

    except Exception as e:
        print("❌ Model load failed:", e)


# Load model once when server starts
load_model()

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    # Serve index.html
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model_loaded
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data or "image" not in data:
            return jsonify({
                "success": False,
                "error": "No image provided"
            }), 400

        # Decode base64 image
        img_data = data["image"]
        if "," in img_data:
            img_data = img_data.split(",")[1]

        image_bytes = base64.b64decode(img_data)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224))

        img_array = np.array(image, dtype=np.float32) / 255.0

        # --------------------------------------------------
        # DEMO MODE (Replace with real model inference later)
        # --------------------------------------------------
        organic_score = round(random.uniform(50, 95), 1)
        inorganic_score = round(100 - organic_score, 1)

        return jsonify({
            "success": True,
            "organic_score": organic_score,
            "inorganic_score": inorganic_score
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# --------------------------------------------------
# Local development only (ignored by Render)
# --------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
