import os
import json
import numpy as np
from sklearn.datasets import make_moons
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

import base64
import struct

BASE = "data"
os.makedirs(BASE, exist_ok=True)

def encode_bitmap(flat_list):
    """
    Pack a list of 0s and 1s into a byte array and encode as Base64.
    Returns: Base64 string
    """
    # Pack 8 bits per byte
    byte_arr = bytearray((len(flat_list) + 7) // 8)
    for i, val in enumerate(flat_list):
        if val:
            byte_arr[i // 8] |= (1 << (i % 8))
    return base64.b64encode(byte_arr).decode('utf-8')

def encode_floats(flat_list):
    """
    Quantize floats Key:
    - Min/Max mapped to 0-255
    - Returns { "b64": "...", "min": val, "max": val }
    """
    if not flat_list:
        return None
    
    min_val = min(flat_list)
    max_val = max(flat_list)
    if max_val == min_val:
        return { "b64": "", "min": round(min_val, 3), "max": round(max_val, 3), "const": True }

    rng = max_val - min_val
    byte_arr = bytearray(len(flat_list))
    
    for i, val in enumerate(flat_list):
        # Quantize to 0-255
        byte_arr[i] = int(255 * (val - min_val) / rng)
        
    return {
        "b64": base64.b64encode(byte_arr).decode('utf-8'),
        "min": round(min_val, 3),
        "max": round(max_val, 3)
    }

def round_val(v, decimals=2):
    """Round a value to specified decimal places (reduced for file size)"""
    return round(float(v), decimals)

def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # No indent for smaller file size
    with open(path, "w") as f:
        json.dump(obj, f, separators=(',', ':'))

# ---------------- TWO MOONS ONLY ---------------- #
print("Generating Two Moons dataset (OPTIMIZED)...")

# Updated sample sizes and noise levels as per user request
sample_sizes = [300, 750, 1000]
noise_levels = [0.1, 0.3, 0.5]
# Only 3 gamma choices
gammas_moons = [0.5, 2, 10]

# Grid resolution: 200x200 for smooth boundaries, optimized with fewer stages
GRID_SIZE = 200

meta_moons = {
    "dataset": "two_moons",
    "description": "Two interleaving half circles (moons) used to demonstrate non-linear classification. This dataset is a classic example where linear classifiers fail and RBF kernels excel.",
    "sample_sizes": sample_sizes,
    "noise_levels": noise_levels,
    "gammas": gammas_moons,
    "grid_size": GRID_SIZE  # Store grid size in metadata for JS to use
}
save_json(f"{BASE}/moons/metadata.json", meta_moons)

for n_samples in sample_sizes:
    for noise in noise_levels:
        X, y = make_moons(n_samples=n_samples, noise=noise, random_state=42)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        for kernel in ["linear", "rbf"]:
            gamma_list = gammas_moons if kernel == "rbf" else [None]
            
            for gamma_val in gamma_list:
                # Set up path
                if kernel == "linear":
                    path = f"{BASE}/moons/linear/samples_{n_samples}_noise_{noise}"
                else:
                    path = f"{BASE}/moons/rbf/gamma_{gamma_val}/samples_{n_samples}_noise_{noise}"
                
                # Create mesh for decision boundary
                x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
                y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
                xx, yy = np.meshgrid(
                    np.linspace(x_min, x_max, GRID_SIZE),
                    np.linspace(y_min, y_max, GRID_SIZE)
                )
                grid = np.c_[xx.ravel(), yy.ravel()]
                
                # PROGRESSIVE BOUNDARIES: Reduced to 4 stages to keep file size under 10MB with 200x200 grid
                progress_stages = [0.25, 0.5, 0.75, 1.0]  # 4 stages
                progressive_boundaries = []
                progressive_decision_values = []
                
                for stage in progress_stages:
                    n_points = max(6, int(len(X_train) * stage))
                    X_partial = X_train[:n_points]
                    y_partial = y_train[:n_points]
                    
                    # Skip if not enough points from both classes
                    if len(np.unique(y_partial)) < 2:
                        # Use empty placeholder
                        progressive_boundaries.append(None)
                        progressive_decision_values.append(None)
                        continue
                    
                    # Train model at this stage
                    if kernel == "linear":
                        model_partial = SVC(kernel="linear")
                    else:
                        model_partial = SVC(kernel="rbf", gamma=gamma_val)
                    
                    model_partial.fit(X_partial, y_partial)
                    
                    # Compute boundary and decision values
                    Z_partial = model_partial.predict(grid).reshape(xx.shape)
                    # Encode boundary as bitmap
                    progressive_boundaries.append(encode_bitmap(Z_partial.ravel().astype(int).tolist()))
                    
                    # Encode decision values as quantized floats
                    d_values = model_partial.decision_function(grid).tolist()
                    progressive_decision_values.append(encode_floats(d_values))
                
                # Train final model for metrics and support vectors
                if kernel == "linear":
                    model = SVC(kernel="linear")
                else:
                    model = SVC(kernel="rbf", gamma=gamma_val)
                
                model.fit(X_train, y_train)
                
                # Predictions
                y_train_pred = model.predict(X_train)
                y_test_pred = model.predict(X_test)
                
                train_acc = accuracy_score(y_train, y_train_pred)
                test_acc = accuracy_score(y_test, y_test_pred)
                
                # Support vectors
                support_vectors = []
                if hasattr(model, 'support_'):
                    for sv_idx in model.support_:
                        support_vectors.append([
                            round_val(X_train[sv_idx, 0]),
                            round_val(X_train[sv_idx, 1]),
                            int(y_train[sv_idx])
                        ])
                
                # Training and test points
                train_points = [
                    [round_val(X_train[k, 0]), round_val(X_train[k, 1]), int(y_train[k])]
                    for k in range(len(y_train))
                ]
                
                test_points = [
                    [round_val(X_test[k, 0]), round_val(X_test[k, 1]), int(y_test[k]), int(y_test_pred[k])]
                    for k in range(len(y_test))
                ]
                
                data = {
                    "kernel": kernel,
                    "gamma": gamma_val if kernel == "rbf" else None,
                    "n_samples": n_samples,
                    "noise": noise,
                    "grid_size": GRID_SIZE,
                    "encoded": True,  # Flag for JS decoder
                    "train_points": train_points,
                    "test_points": test_points,
                    "support_vectors": support_vectors,
                    # Progressive data for animation
                    "progress_stages": progress_stages,
                    "progressive_boundaries": progressive_boundaries,
                    "progressive_decision_values": progressive_decision_values,
                    # REMOVED redundant static keys (JS will use progressive_boundaries[-1])
                    "grid_bounds": {
                        "x_min": round_val(x_min),
                        "x_max": round_val(x_max),
                        "y_min": round_val(y_min),
                        "y_max": round_val(y_max)
                    },
                    "metrics": {
                        "train_accuracy": round_val(train_acc, 4),
                        "test_accuracy": round_val(test_acc, 4),
                        "n_support_vectors": len(model.support_) if hasattr(model, 'support_') else 0
                    }
                }
                
                os.makedirs(path, exist_ok=True)
                save_json(f"{path}/data.json", data)

print("✓ Two Moons dataset generated successfully (OPTIMIZED & COMPRESSED)!")