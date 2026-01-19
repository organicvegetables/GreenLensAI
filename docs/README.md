# Organic & Inorganic Vegetables Detector

A web application that uses machine learning to detect and classify vegetables (cabbage and lettuce) as organic or inorganic using a webcam.

## Features

- **Webcam Integration**: Capture real-time video from your device's camera
- **Multiple Camera Support**: Switch between different cameras available on your system
- **ML-powered Detection**: Uses TensorFlow.js with a pre-trained H5 model
- **Confidence Scores**: Display organic and inorganic classification percentages
- **Smart Comments**: Get helpful comments about the vegetable's quality and recommended handling
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
Organic and Inorganic Vegetables App/
├── index.html          # Main HTML page
├── style.css           # Styling and layout
├── app.js              # JavaScript logic and ML inference
├── model.h5            # Your trained TensorFlow model (add this)
└── README.md           # This file
```

## Setup Instructions

### 1. **Prepare Your H5 Model**
   - Convert your H5 model to TensorFlow.js format using the conversion tool:
     ```bash
     tensorflowjs_converter --input_format keras path/to/model.h5 path/to/tfjs_model/
     ```
   - This will generate `model.json` and `.bin` files

### 2. **Update Model Path in app.js**
   - Replace the model loading path in `app.js`:
     ```javascript
     model = await tf.loadLayersModel('file://path/to/your/model/model.json');
     ```

### 3. **Run a Local Server**
   - Python 3:
     ```bash
     python -m http.server 8000
     ```
   - Python 2:
     ```bash
     python -m SimpleHTTPServer 8000
     ```
   - Or use any other local server (Node.js, Live Server, etc.)

### 4. **Open in Browser**
   - Navigate to `http://localhost:8000` in your web browser

## How to Use

1. **Start the Application**: Open `index.html` in your browser
2. **Select Camera**: Choose your desired camera from the dropdown menu
3. **Start Camera**: Click the "Start Camera" button to begin streaming
4. **Capture Image**: Click "Capture & Detect" to analyze the current frame
5. **View Results**: The application will display:
   - The captured image
   - Vegetable type (Cabbage/Lettuce)
   - Organic/Inorganic classification
   - Confidence percentage
   - Organic and Inorganic score breakdown
   - Helpful comment about the vegetable

## Model Requirements

Your H5 model should:
- Accept input images of size **224x224 pixels** (adjust in `app.js` if different)
- Output predictions with **2 classes**: [Organic Score, Inorganic Score]
- Be trained on cabbage and lettuce samples

### Adjusting Model Input Size

If your model uses a different input size, update line in `captureAndDetect()`:
```javascript
imageTensor = tf.image.resizeBilinear(imageTensor, [YOUR_SIZE, YOUR_SIZE]);
```

## Dependencies

- **TensorFlow.js**: For running the ML model in the browser
- **Modern Browser**: Chrome, Firefox, Edge, or Safari with WebRTC support

## Troubleshooting

### Model not loading
- Ensure the model path is correct and accessible
- Check browser console for specific error messages
- Verify model files are in the correct directory

### Camera not working
- Check browser permissions for camera access
- Ensure camera is not in use by another application
- Try a different browser

### Slow predictions
- The model runs on the CPU by default
- For faster inference, consider using WebGL backend in TensorFlow.js

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Full support |
| Firefox | ✅ Full support |
| Safari  | ✅ Full support |
| Edge    | ✅ Full support |

## Security Notes

- ⚠️ Webcam access requires user permission
- 🔒 Images are processed locally - nothing is sent to external servers
- 📝 Always inform users about data handling

## Future Enhancements

- [ ] Add more vegetable types
- [ ] Improve model accuracy with data augmentation
- [ ] Add batch processing capability
- [ ] Include real-time detection mode
- [ ] Add download/export results feature
- [ ] Implement custom model upload

## License

This project is provided as-is for educational and commercial use.

## Support

For issues or questions, please check:
1. Browser console for error messages
2. Model file paths are correct
3. All dependencies are loaded properly
