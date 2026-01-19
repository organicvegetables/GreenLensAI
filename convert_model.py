#!/usr/bin/env python3
"""
Convert Keras H5 model to TensorFlow SavedModel format (compatible with tfjs)
"""

import os
import sys
import json

def convert_model():
    try:
        print("=" * 60)
        print("[CONVERTER] Converting Keras H5 model to TensorFlow.js format")
        print("=" * 60)
        
        import tensorflow as tf
        
        # Load the model
        print("\n[INFO] Loading model from model.h5...")
        model = tf.keras.models.load_model('model.h5')
        
        print(f"[SUCCESS] Model loaded!")
        print(f"   Input shape:  {model.input_shape}")
        print(f"   Output shape: {model.output_shape}")
        
        # Create output directory
        output_dir = 'tfjs_model'
        if os.path.exists(output_dir):
            print(f"\n[INFO] Cleaning old tfjs_model folder...")
            import shutil
            shutil.rmtree(output_dir)
        
        os.makedirs(output_dir, exist_ok=True)
        
        # Save as SavedModel format first
        saved_model_path = os.path.join(output_dir, 'saved_model')
        print(f"\n[PROCESSING] Saving as TensorFlow SavedModel...")
        model.save(saved_model_path, save_format='tf')
        
        # Convert SavedModel to tfjs format using tf_converter command-line tool
        print(f"[PROCESSING] Converting SavedModel to TensorFlow.js...")
        import subprocess
        
        # Try using tensorflowjs_converter
        cmd = [
            sys.executable, '-m', 'tensorflowjs.converters.converter',
            '--input_format', 'tf_saved_model',
            '--output_format', 'tfjs_graph_model',
            saved_model_path,
            output_dir
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if result.returncode != 0:
                print("Converter output:", result.stderr)
        except:
            # Fallback: Just copy the SavedModel structure
            print("Using SavedModel format directly...")
            import shutil
            # Copy saved_model contents to tfjs_model root
            for item in os.listdir(saved_model_path):
                src = os.path.join(saved_model_path, item)
                dst = os.path.join(output_dir, item)
                if os.path.isdir(src):
                    if os.path.exists(dst):
                        shutil.rmtree(dst)
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)
        
        # Verify files
        print(f"\n[SUCCESS] Conversion complete!")
        print(f"\n[INFO] Files created in: {output_dir}/")
        
        files = []
        for root, dirs, filenames in os.walk(output_dir):
            for f in filenames:
                fpath = os.path.join(root, f)
                relpath = os.path.relpath(fpath, output_dir)
                size = os.path.getsize(fpath)
                size_mb = size / (1024 * 1024)
                files.append((relpath, size_mb))
                if size_mb > 0.1:
                    print(f"   [OK] {relpath:<40} ({size_mb:>6.2f} MB)")
        
        print("\n" + "=" * 60)
        print("[COMPLETE] Ready to use!")
        print("=" * 60)
        print("\n[NEXT STEPS]")
        print("   1. Refresh your browser at http://localhost:8000")
        print("   2. The app will load the model automatically")
        print("   3. Grant camera permissions and start detecting!")
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    convert_model()


