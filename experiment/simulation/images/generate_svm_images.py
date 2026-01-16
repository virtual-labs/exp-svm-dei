# Script to generate all SVM experiment images
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from mlxtend.plotting import plot_decision_regions
from sklearn.datasets import load_wine, make_moons
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import confusion_matrix

# Set style
plt.style.use('default')

# ============ LOAD AND PREPARE DATA ============

# Wine dataset
wine = load_wine()
wine_df = pd.DataFrame(wine.data, columns=wine.feature_names)
wine_df["target"] = wine.target

# Select 2 features for visualization
wine_df = pd.concat(
    [wine_df[["flavanoids", "color_intensity"]], wine_df["target"]],
    axis=1
)

wine_target_names = {
    0: "Barolo",
    1: "Grignolino",
    2: "Barbera"
}
wine_df["class_name"] = wine_df["target"].map(wine_target_names)

# Two Moons dataset
X_moons, y_moons = make_moons(n_samples=700, noise=0.15, random_state=42)
moons_df = pd.DataFrame(X_moons, columns=["Feature_1", "Feature_2"])
moons_df["target"] = y_moons

# ============ DATA PREPROCESSING ============

X_wine = wine_df[["flavanoids", "color_intensity"]]
y_wine = wine_df["target"]

Xw_train, Xw_test, yw_train, yw_test = train_test_split(
    X_wine, y_wine, test_size=0.2, random_state=42, stratify=y_wine
)

Xm_train, Xm_test, ym_train, ym_test = train_test_split(
    X_moons, y_moons, test_size=0.2, random_state=42, stratify=y_moons
)

# Feature Scaling
scaler = StandardScaler()
Xw_train_scaled = scaler.fit_transform(Xw_train)
Xw_test_scaled = scaler.transform(Xw_test)

scaler2 = StandardScaler()
Xm_train_scaled = scaler2.fit_transform(Xm_train)
Xm_test_scaled = scaler2.transform(Xm_test)

# ============ MODEL TRAINING ============

svm_linear_wine = SVC(kernel="linear")
svm_linear_wine.fit(Xw_train_scaled, yw_train)

svm_linear_moon = SVC(kernel="linear")
svm_rbf_moon = SVC(kernel="rbf")
svm_linear_moon.fit(Xm_train_scaled, ym_train)
svm_rbf_moon.fit(Xm_train_scaled, ym_train)

# ============ PREDICTIONS ============

wine_preds = svm_linear_wine.predict(Xw_test_scaled)
moon_linear_preds = svm_linear_moon.predict(Xm_test_scaled)
moon_rbf_preds = svm_rbf_moon.predict(Xm_test_scaled)

# ============ GENERATE IMAGES ============

print("Generating images...")

# 1. Wine Dataset Scatter Plot
plt.figure(figsize=(7, 5))
sns.scatterplot(
    data=wine_df,
    x="flavanoids",
    y="color_intensity",
    hue="class_name",
    palette="Set2",
    s=40,
    edgecolor="black"
)
plt.title("Wine Dataset: Linearly Separable Features", fontsize=14, fontweight="bold")
plt.xlabel("Flavanoids", fontsize=12)
plt.ylabel("Color Intensity", fontsize=12)
plt.legend(title="Wine Class")
plt.grid(alpha=0.6)
plt.tight_layout()
plt.savefig("Wine_Dataset_Scatter_Plot.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Wine_Dataset_Scatter_Plot.png")

# 2. Distribution of Flavanoids
plt.figure(figsize=(10, 5))
sns.histplot(
    data=wine_df,
    x="flavanoids",
    hue="class_name",
    kde=True,
    palette="Set2",
    element="step",
    stat="density",
    common_norm=False
)
plt.title("Distribution of Flavanoids by Wine Class", fontsize=14, fontweight="bold")
plt.xlabel("Flavanoids")
plt.ylabel("Density")
plt.grid(alpha=0.4)
plt.tight_layout()
plt.savefig("Distribution_Flavanoids.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Distribution_Flavanoids.png")

# 3. Distribution of Color Intensity
plt.figure(figsize=(10, 5))
sns.histplot(
    data=wine_df,
    x="color_intensity",
    hue="class_name",
    kde=True,
    palette="Set2",
    element="step",
    stat="density",
    common_norm=False
)
plt.title("Distribution of Color Intensity by Wine Class", fontsize=14, fontweight="bold")
plt.xlabel("Color Intensity")
plt.ylabel("Density")
plt.grid(alpha=0.4)
plt.tight_layout()
plt.savefig("Distribution_Color_Intensity.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Distribution_Color_Intensity.png")

# 4. Two Moons Dataset
plt.figure(figsize=(8, 6))
sns.scatterplot(
    x=moons_df["Feature_1"],
    y=moons_df["Feature_2"],
    hue=moons_df["target"].map({0: "Blue Moon", 1: "Orange Moon"}),
    palette=["#1f77b4", "#ff7f0e"]
)
plt.title("Two Moons Dataset – Non-Linear Separability", fontsize=14, fontweight='bold')
plt.xlabel("Feature 1")
plt.ylabel("Feature 2")
plt.tight_layout()
plt.savefig("Two_Moons_Dataset.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Two_Moons_Dataset.png")

# 5. Wine Confusion Matrix (Linear Kernel)
labels = list(wine_target_names.keys())
class_names = list(wine_target_names.values())

plt.figure(figsize=(6, 5))
sns.heatmap(
    confusion_matrix(yw_test, wine_preds, labels=labels),
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=class_names,
    yticklabels=class_names
)
plt.title("Wine Dataset (Linear Kernel)", fontweight='bold')
plt.xlabel("Predicted Label", fontweight='bold')
plt.ylabel("True Label", fontweight='bold')
plt.tight_layout()
plt.savefig("Wine_Confusion_Matrix_Linear.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Wine_Confusion_Matrix_Linear.png")

# 6. Two Moons Confusion Matrix (Linear Kernel)
moon_class_names = ['Blue Moon', 'Orange Moon']

plt.figure(figsize=(5, 4))
sns.heatmap(
    confusion_matrix(ym_test, moon_linear_preds),
    annot=True,
    fmt="d",
    cmap="Greens",
    xticklabels=moon_class_names,
    yticklabels=moon_class_names
)
plt.title("Two Moons Dataset (Linear Kernel)", fontweight='bold')
plt.xlabel("Predicted Label", fontweight='bold')
plt.ylabel("True Label", fontweight='bold')
plt.tight_layout()
plt.savefig("Moons_Confusion_Matrix_Linear.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Moons_Confusion_Matrix_Linear.png")

# 7. Two Moons Confusion Matrix (RBF Kernel)
plt.figure(figsize=(5, 4))
sns.heatmap(
    confusion_matrix(ym_test, moon_rbf_preds),
    annot=True,
    fmt="d",
    cmap="Greens",
    xticklabels=moon_class_names,
    yticklabels=moon_class_names
)
plt.title("Two Moons Dataset (RBF Kernel)", fontweight='bold')
plt.xlabel("Predicted Label", fontweight='bold')
plt.ylabel("True Label", fontweight='bold')
plt.tight_layout()
plt.savefig("Moons_Confusion_Matrix_RBF.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Moons_Confusion_Matrix_RBF.png")

# 8. Decision Boundary - Wine (Linear)
plt.figure(figsize=(8, 6))
plot_decision_regions(
    Xw_train_scaled,
    yw_train.values,
    clf=svm_linear_wine,
    legend=2
)
plt.title("Decision Boundary – Linear SVM (Wine Dataset)")
plt.xlabel("Flavanoids (scaled)")
plt.ylabel("Color Intensity (scaled)")
plt.tight_layout()
plt.savefig("Decision_Boundary_Wine_Linear.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Decision_Boundary_Wine_Linear.png")

# 9. Decision Boundaries - Two Moons Comparison
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plot_decision_regions(Xm_train_scaled, ym_train, clf=svm_linear_moon)
plt.title("Linear Kernel – Blue vs Orange Moon")

plt.subplot(1, 2, 2)
plot_decision_regions(Xm_train_scaled, ym_train, clf=svm_rbf_moon)
plt.title("RBF Kernel – Blue vs Orange Moon")

plt.tight_layout()
plt.savefig("Decision_Boundary_Moons_Comparison.png", dpi=150, bbox_inches='tight')
plt.close()
print("✓ Decision_Boundary_Moons_Comparison.png")

print("\n✅ All 9 images generated successfully!")
