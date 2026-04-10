import os
import json
import numpy as np
from sklearn.datasets import make_moons
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from concurrent.futures import ProcessPoolExecutor, as_completed

import base64

BASE = "data"
os.makedirs(BASE, exist_ok=True)

def encode_bitmap(flat_list):
    """Pack a list of 0s and 1s into a byte array and encode as Base64."""
    byte_arr = bytearray((len(flat_list) + 7) // 8)
    for i, val in enumerate(flat_list):
        if val:
            byte_arr[i // 8] |= (1 << (i % 8))
    return base64.b64encode(byte_arr).decode('utf-8')

def encode_floats(flat_list):
    """Quantize floats to 0-255 and encode as Base64."""
    if not flat_list:
        return None
    min_val = min(flat_list)
    max_val = max(flat_list)
    if max_val == min_val:
        return { "b64": "", "min": round(min_val, 3), "max": round(max_val, 3), "const": True }
    rng = max_val - min_val
    byte_arr = bytearray(len(flat_list))
    for i, val in enumerate(flat_list):
        byte_arr[i] = int(255 * (val - min_val) / rng)
    return {
        "b64": base64.b64encode(byte_arr).decode('utf-8'),
        "min": round(min_val, 3),
        "max": round(max_val, 3)
    }

def round_val(v, decimals=2):
    return round(float(v), decimals)

def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(obj, f, separators=(',', ':'))

# ---- XOR Dataset Generator ---- #
def make_xor(n_samples=500, noise=0.1, random_state=42):
    """Generate XOR-like dataset with 4 clusters."""
    rng = np.random.RandomState(random_state)
    n_per_cluster = n_samples // 4
    remainder = n_samples - 4 * n_per_cluster

    centers = np.array([[1, 1], [-1, -1], [-1, 1], [1, -1]])
    labels = np.array([0, 0, 1, 1])

    X_list, y_list = [], []
    for i, (cx, cy) in enumerate(centers):
        n_pts = n_per_cluster + (1 if i < remainder else 0)
        X_cluster = rng.randn(n_pts, 2) * noise + np.array([cx, cy])
        X_list.append(X_cluster)
        y_list.append(np.full(n_pts, labels[i]))

    X = np.vstack(X_list)
    y = np.concatenate(y_list)
    # Shuffle
    idx = rng.permutation(len(y))
    return X[idx], y[idx]

# ---- Configuration ---- #
sample_sizes = [100, 300, 500, 750, 1000]
noise_levels = [0.1, 0.2, 0.3, 0.4, 0.5]
gammas_list = [0.1, 0.5, 2, 5, 10]
c_values = [0.1, 1, 10, 100, 1000]

GRID_SIZE = 150  # Reduced from 200 for faster generation, still smooth

# Progress stages for formation animation
PROGRESS_STAGES = [0.25, 0.5, 0.75, 1.0]

def generate_single(dataset_name, n_samples, noise, kernel, gamma_val, c_val, grid_size, progress_stages):
    """Generate data for a single configuration. Used with multiprocessing."""
    # Generate dataset
    if dataset_name == "moons":
        X, y = make_moons(n_samples=n_samples, noise=noise, random_state=42)
    else:  # xor
        X, y = make_xor(n_samples=n_samples, noise=noise, random_state=42)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Build path
    if kernel == "linear":
        path = f"{BASE}/{dataset_name}/linear/C_{c_val}/samples_{n_samples}_noise_{noise}"
    else:
        path = f"{BASE}/{dataset_name}/rbf/C_{c_val}/gamma_{gamma_val}/samples_{n_samples}_noise_{noise}"

    # Create mesh
    x_min, x_max = X[:, 0].min() - 0.5, X[:, 0].max() + 0.5
    y_min, y_max = X[:, 1].min() - 0.5, X[:, 1].max() + 0.5
    xx, yy = np.meshgrid(
        np.linspace(x_min, x_max, grid_size),
        np.linspace(y_min, y_max, grid_size)
    )
    grid = np.c_[xx.ravel(), yy.ravel()]

    # Progressive boundaries
    progressive_boundaries = []
    progressive_decision_values = []

    for stage in progress_stages:
        n_points = max(6, int(len(X_train) * stage))
        X_partial = X_train[:n_points]
        y_partial = y_train[:n_points]

        if len(np.unique(y_partial)) < 2:
            progressive_boundaries.append(None)
            progressive_decision_values.append(None)
            continue

        if kernel == "linear":
            model_partial = SVC(kernel="linear", C=c_val)
        else:
            model_partial = SVC(kernel="rbf", gamma=gamma_val, C=c_val)

        model_partial.fit(X_partial, y_partial)
        Z_partial = model_partial.predict(grid).reshape(xx.shape)
        progressive_boundaries.append(encode_bitmap(Z_partial.ravel().astype(int).tolist()))

        d_values = model_partial.decision_function(grid).tolist()
        progressive_decision_values.append(encode_floats(d_values))

    # Final model
    if kernel == "linear":
        model = SVC(kernel="linear", C=c_val)
    else:
        model = SVC(kernel="rbf", gamma=gamma_val, C=c_val)

    model.fit(X_train, y_train)

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
        "c_value": c_val,
        "n_samples": n_samples,
        "noise": noise,
        "grid_size": grid_size,
        "encoded": True,
        "train_points": train_points,
        "test_points": test_points,
        "support_vectors": support_vectors,
        "progress_stages": progress_stages,
        "progressive_boundaries": progressive_boundaries,
        "progressive_decision_values": progressive_decision_values,
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
    return path


if __name__ == "__main__":
    import time
    start = time.time()

    for ds_name in ["moons", "xor"]:
        ds_desc = {
            "moons": "Two interleaving half circles (moons) used to demonstrate non-linear classification. This dataset is a classic example where linear classifiers fail and RBF kernels excel.",
            "xor": "XOR (exclusive-or) pattern with 4 clusters arranged diagonally. Class 0 occupies top-right and bottom-left, Class 1 occupies top-left and bottom-right. Linear classifiers cannot solve this; RBF kernels can capture the non-linear boundary."
        }
        meta = {
            "dataset": ds_name,
            "description": ds_desc[ds_name],
            "sample_sizes": sample_sizes,
            "noise_levels": noise_levels,
            "gammas": gammas_list,
            "c_values": c_values,
            "grid_size": GRID_SIZE
        }
        save_json(f"{BASE}/{ds_name}/metadata.json", meta)

    # Collect all jobs
    jobs = []
    for ds_name in ["moons", "xor"]:
        for n_samples in sample_sizes:
            for noise in noise_levels:
                for c_val in c_values:
                    # Linear kernel (no gamma)
                    jobs.append((ds_name, n_samples, noise, "linear", None, c_val, GRID_SIZE, PROGRESS_STAGES))
                    # RBF kernel (with gamma)
                    for gamma_val in gammas_list:
                        jobs.append((ds_name, n_samples, noise, "rbf", gamma_val, c_val, GRID_SIZE, PROGRESS_STAGES))

    total = len(jobs)
    print(f"Generating {total} configurations using multiprocessing...")

    completed = 0
    with ProcessPoolExecutor() as executor:
        futures = {executor.submit(generate_single, *job): job for job in jobs}
        for future in as_completed(futures):
            completed += 1
            try:
                path = future.result()
                if completed % 50 == 0 or completed == total:
                    elapsed = time.time() - start
                    print(f"  [{completed}/{total}] ({elapsed:.1f}s elapsed) Last: {path}")
            except Exception as e:
                job = futures[future]
                print(f"  ERROR for {job}: {e}")

    elapsed = time.time() - start
    print(f"\n✓ All {total} configurations generated in {elapsed:.1f}s")