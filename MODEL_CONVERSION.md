# Model Conversion Guide

## Quick Start (Choose ONE method)

### Method 1: Using Python Script (Recommended)

1. **Install dependencies:**
   ```bash
   pip install tensorflow tensorflowjs
   ```

2. **Run the conversion script:**
   ```bash
   python convert_model.py
   ```

3. **Start the web server:**
   ```bash
   python -m http.server 8000
   ```

4. **Open in browser:**
   ```
   http://localhost:8000
   ```

---

### Method 2: Manual Conversion (Windows PowerShell)

1. **Install Python packages:**
   ```bash
   pip install tensorflow tensorflowjs
   ```

2. **Convert the model using Python directly:**
   ```bash
   python -c "
   import os
   import tensorflow as tf
   import tensorflowjs as tfjs
   
   print('Loading model...')
   model = tf.keras.models.load_model('model.h5')
   
   print('Converting to TensorFlow.js...')
   os.makedirs('tfjs_model', exist_ok=True)
   tfjs.converters.save_keras_model(model, 'tfjs_model')
   
   print('✅ Conversion complete! Files in tfjs_model/')
   "
   ```

3. **Start the server:**
   ```bash
   python -m http.server 8000
   ```

---

### Method 3: Using Google Colab (If Python Installation Issues)

1. Upload `model.h5` to [Google Colab](https://colab.research.google.com/)

2. Run this code in a cell:
   ```python
   from google.colab import files
   import tensorflow as tf
   import tensorflowjs as tfjs
   import os
   
   # Load model
   model = tf.keras.models.load_model('model.h5')
   
   # Convert
   os.makedirs('tfjs_model', exist_ok=True)
   tfjs.converters.save_keras_model(model, 'tfjs_model')
   
   # Download
   files.download('tfjs_model/model.json')
   files.download('tfjs_model/model.weights.bin')
   ```

3. Place downloaded files in your project folder

---

## Verify Conversion Success

After conversion, you should see these files in `tfjs_model/`:
- ✅ `model.json` - Model architecture
- ✅ `model.weights.bin` - Model weights

---

## Troubleshooting

### "No module named tensorflow"
```bash
pip install tensorflow --upgrade
```

### "No module named tensorflowjs"
```bash
pip install tensorflowjs
```

### Model still not loading
1. Check browser console (F12) for specific errors
2. Verify `tfjs_model/model.json` exists in the project folder
3. Ensure both `model.json` AND `.bin` file are present
4. Try clearing browser cache (Ctrl+Shift+Delete)

---

## Next Steps

Once conversion is complete:
1. ✅ Model files are in `tfjs_model/` folder
2. ✅ Refresh your browser
3. ✅ App should load the model automatically
4. ✅ Start using the vegetable detector!
