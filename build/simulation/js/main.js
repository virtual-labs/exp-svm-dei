// ==========================================
// SVM EXPERIMENT STEPS
// ==========================================

const STEPS_SVM = [
    // ========== STEP 1: IMPORTING LIBRARIES (Cells 1-2) ==========
    {
        title: "Importing Libraries",
        blocks: [
            {
                // Cell 1
                comment: "Import numerical, data handling and visualization libraries",
                code: `# Importing Libraries

# Numerical and data handling libraries
import numpy as np
import pandas as pd

# Visualization libraries
import matplotlib.pyplot as plt
import seaborn as sns
from mlxtend.plotting import plot_decision_regions

print("Loaded libraries")`,
                output: `<div class="output-success">Loaded libraries</div>`
            },
            {
                // Cell 2
                comment: "Import sklearn utilities, models and metrics",
                code: `# Dataset utilities
from sklearn.datasets import load_wine, make_moons
# Preprocessing and model utilities
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
# Models
from sklearn.svm import SVC
# Evaluation metrics
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

print("Loaded Sklearn libraries")`,
                output: `<div class="output-success">Loaded Sklearn libraries</div>`
            }
        ]
    },
    // ========== STEP 2: LOADING DATASET (Cells 3-5) ==========
    {
        title: "Loading Dataset",
        blocks: [
            {
                // Cell 3
                comment: "Load Wine dataset and create DataFrame",
                code: `# Loading and Reading Data

wine = load_wine()
wine_df = pd.DataFrame(wine.data, columns=wine.feature_names)

wine_df["target"] = wine.target
wine_df`,
                output: `<div class="table-wrapper">
<div class="table-scroll-container">
<table border="1" class="dataframe data-table">
  <thead>
    <tr style="text-align: right;">
      <th></th><th>alcohol</th><th>malic_acid</th><th>ash</th><th>alcalinity_of_ash</th><th>magnesium</th><th>total_phenols</th><th>flavanoids</th><th>nonflavanoid_phenols</th><th>proanthocyanins</th><th>color_intensity</th><th>hue</th><th>od280/od315_of_diluted_wines</th><th>proline</th><th>target</th>
    </tr>
  </thead>
  <tbody>
    <tr><th>0</th><td>14.23</td><td>1.71</td><td>2.43</td><td>15.6</td><td>127.0</td><td>2.80</td><td>3.06</td><td>0.28</td><td>2.29</td><td>5.64</td><td>1.04</td><td>3.92</td><td>1065.0</td><td>0</td></tr>
    <tr><th>1</th><td>13.20</td><td>1.78</td><td>2.14</td><td>11.2</td><td>100.0</td><td>2.65</td><td>2.76</td><td>0.26</td><td>1.28</td><td>4.38</td><td>1.05</td><td>3.40</td><td>1050.0</td><td>0</td></tr>
    <tr><th>2</th><td>13.16</td><td>2.36</td><td>2.67</td><td>18.6</td><td>101.0</td><td>2.80</td><td>3.24</td><td>0.30</td><td>2.81</td><td>5.68</td><td>1.03</td><td>3.17</td><td>1185.0</td><td>0</td></tr>
    <tr><th>3</th><td>14.37</td><td>1.95</td><td>2.50</td><td>16.8</td><td>113.0</td><td>3.85</td><td>3.49</td><td>0.24</td><td>2.18</td><td>7.80</td><td>0.86</td><td>3.45</td><td>1480.0</td><td>0</td></tr>
    <tr><th>4</th><td>13.24</td><td>2.59</td><td>2.87</td><td>21.0</td><td>118.0</td><td>2.80</td><td>2.69</td><td>0.39</td><td>1.82</td><td>4.32</td><td>1.04</td><td>2.93</td><td>735.0</td><td>0</td></tr>
    <tr><th colspan="15" style="text-align:center; color:#666;">...</th></tr>
    <tr><th>173</th><td>13.71</td><td>5.65</td><td>2.45</td><td>20.5</td><td>95.0</td><td>1.68</td><td>0.61</td><td>0.52</td><td>1.06</td><td>7.70</td><td>0.64</td><td>1.74</td><td>740.0</td><td>2</td></tr>
    <tr><th>174</th><td>13.40</td><td>3.91</td><td>2.48</td><td>23.0</td><td>102.0</td><td>1.80</td><td>0.75</td><td>0.43</td><td>1.41</td><td>7.30</td><td>0.70</td><td>1.56</td><td>750.0</td><td>2</td></tr>
    <tr><th>175</th><td>13.27</td><td>4.28</td><td>2.26</td><td>20.0</td><td>120.0</td><td>1.59</td><td>0.69</td><td>0.43</td><td>1.35</td><td>10.20</td><td>0.59</td><td>1.56</td><td>835.0</td><td>2</td></tr>
    <tr><th>176</th><td>13.17</td><td>2.59</td><td>2.37</td><td>20.0</td><td>120.0</td><td>1.65</td><td>0.68</td><td>0.53</td><td>1.46</td><td>9.30</td><td>0.60</td><td>1.62</td><td>840.0</td><td>2</td></tr>
    <tr><th>177</th><td>14.13</td><td>4.10</td><td>2.74</td><td>24.5</td><td>96.0</td><td>2.05</td><td>0.76</td><td>0.56</td><td>1.35</td><td>9.20</td><td>0.61</td><td>1.60</td><td>560.0</td><td>2</td></tr>
  </tbody>
</table>
</div>
<p style="color:#666; font-size:12px;">178 rows × 14 columns</p>
</div>`
            },
            {
                // Cell 4
                comment: "Display Wine dataset info",
                code: `wine_df.info()`,
                output: `<div class="output-text">
&lt;class 'pandas.core.frame.DataFrame'&gt;<br>
RangeIndex: 178 entries, 0 to 177<br>
Data columns (total 14 columns):<br>
 #   Column                        Non-Null Count  Dtype  <br>
---  ------                        --------------  -----  <br>
 0   alcohol                       178 non-null    float64<br>
 1   malic_acid                    178 non-null    float64<br>
 2   ash                           178 non-null    float64<br>
 3   alcalinity_of_ash             178 non-null    float64<br>
 4   magnesium                     178 non-null    float64<br>
 5   total_phenols                 178 non-null    float64<br>
 6   flavanoids                    178 non-null    float64<br>
 7   nonflavanoid_phenols          178 non-null    float64<br>
 8   proanthocyanins               178 non-null    float64<br>
 9   color_intensity               178 non-null    float64<br>
 10  hue                           178 non-null    float64<br>
 11  od280/od315_of_diluted_wines  178 non-null    float64<br>
 12  proline                       178 non-null    float64<br>
 13  target                        178 non-null    int32  <br>
dtypes: float64(13), int32(1)<br>
memory usage: 19.0 KB
</div>`
            },
            {
                // Cell 5
                comment: "Generate Two Moons synthetic dataset",
                code: `# Generate two-moons dataset
X_moons, y_moons = make_moons(n_samples=700, noise=0.15, random_state=42)
moons_df = pd.DataFrame(X_moons, columns=["Feature_1", "Feature_2"])
moons_df["target"] = y_moons
moons_df`,
                output: `<div class="table-wrapper">
<div class="table-scroll-container">
<table border="1" class="dataframe data-table">
  <thead>
    <tr style="text-align: right;">
      <th></th><th>Feature_1</th><th>Feature_2</th><th>target</th>
    </tr>
  </thead>
  <tbody>
    <tr><th>0</th><td>-0.036777</td><td>1.017428</td><td>0</td></tr>
    <tr><th>1</th><td>0.991181</td><td>-0.542893</td><td>1</td></tr>
    <tr><th>2</th><td>0.135605</td><td>0.095587</td><td>1</td></tr>
    <tr><th>3</th><td>0.380490</td><td>0.882966</td><td>0</td></tr>
    <tr><th>4</th><td>-0.795374</td><td>0.193136</td><td>0</td></tr>
    <tr><th colspan="4" style="text-align:center; color:#666;">...</th></tr>
    <tr><th>695</th><td>1.147087</td><td>0.520498</td><td>0</td></tr>
    <tr><th>696</th><td>0.200663</td><td>0.598349</td><td>0</td></tr>
    <tr><th>697</th><td>-0.384952</td><td>0.547244</td><td>0</td></tr>
    <tr><th>698</th><td>0.452570</td><td>-0.174473</td><td>1</td></tr>
    <tr><th>699</th><td>0.534527</td><td>0.910810</td><td>0</td></tr>
  </tbody>
</table>
</div>
<p style="color:#666; font-size:12px;">700 rows × 3 columns</p>
</div>`
            }
        ]
    },
    // ========== STEP 3: DATA ANALYSIS (Cells 6-10) ==========
    {
        title: "Data Analysis",
        blocks: [
            {
                // Cell 6
                comment: "Select features and map class names for Wine dataset",
                code: `# Data Analysis

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
wine_df[['target', 'class_name']].value_counts()`,
                output: `<div class="output-text">
target  class_name<br>
1       Grignolino    71<br>
0       Barolo        59<br>
2       Barbera       48<br>
Name: count, dtype: int64
</div>`
            },
            {
                // Cell 7
                comment: "Visualize Wine Dataset - Linearly Separable Features",
                code: `# Visualizing Wine Dataset
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
plt.show()`,
                output: `<img src="images/Wine_Dataset_Scatter_Plot.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            },
            {
                // Cell 8
                comment: "Distribution of Flavanoids by Wine Class",
                code: `# Histogram of Flavanoids
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
plt.show()`,
                output: `<img src="images/Distribution_Flavanoids.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            },
            {
                // Cell 9
                comment: "Distribution of Color Intensity by Wine Class",
                code: `# Histogram of Color Intensity
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
plt.show()`,
                output: `<img src="images/Distribution_Color_Intensity.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            },
            {
                // Cell 10
                comment: "Visualize Two Moons Dataset - Non-Linear Separability",
                code: `# Visualizing Two Moons Dataset
plt.figure(figsize=(8,6))
sns.scatterplot(
    x=moons_df["Feature_1"],
    y=moons_df["Feature_2"],
    hue=moons_df["target"].map({0: "Blue Moon", 1: "Orange Moon"}),
    palette=["#1f77b4", "#ff7f0e"]
)
plt.title("Two Moons Dataset – Non-Linear Separability", fontsize=14, fontweight='bold')
plt.xlabel("Feature 1")
plt.ylabel("Feature 2")
plt.show()`,
                output: `<img src="images/Two_Moons_Dataset.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            }
        ]
    },
    // ========== STEP 4: DATA PREPROCESSING (Cells 11-19) ==========
    {
        title: "Data Preprocessing",
        blocks: [
            {
                // Cell 11
                comment: "Train/Test split for Wine dataset",
                code: `# Data Preprocessing

X_wine = wine_df[["flavanoids", "color_intensity"]]
y_wine = wine_df["target"]

Xw_train, Xw_test, yw_train, yw_test = train_test_split(
    X_wine, y_wine, test_size=0.2, random_state=42, stratify=y_wine
)
Xw_train.shape, Xw_test.shape, yw_train.shape, yw_test.shape`,
                output: `<div class="output-text">((142, 2), (36, 2), (142,), (36,))</div>`
            },
            {
                // Cell 12
                comment: "Train/Test split for Two Moons dataset",
                code: `Xm_train, Xm_test, ym_train, ym_test = train_test_split(
    X_moons, y_moons, test_size=0.2, random_state=42, stratify=y_moons
)
Xm_train.shape, Xm_test.shape, ym_train.shape, ym_test.shape`,
                output: `<div class="output-text">((560, 2), (140, 2), (560,), (140,))</div>`
            },
            {
                // Cell 13
                comment: "Initialize Standard Scaler",
                code: `# Feature Scaling
scaler = StandardScaler()
scaler`,
                output: `<div class="output-text">StandardScaler()</div>`
            },
            {
                // Cell 14
                comment: "Scale Wine training and test data",
                code: `# Scale Wine training and test data
Xw_train_scaled = scaler.fit_transform(Xw_train)
Xw_test_scaled = scaler.transform(Xw_test)

print("Wine data scaled successfully!")`,
                output: `<div class="output-success">Wine data scaled successfully!</div>`
            },
            {
                // Cell 15
                comment: "View original Wine training data (before scaling)",
                code: `Xw_train[:5]`,
                output: `<div class="table-wrapper">
<div class="table-scroll-container">
<table border="1" class="dataframe data-table">
  <thead>
    <tr style="text-align: right;">
      <th></th><th>flavanoids</th><th>color_intensity</th>
    </tr>
  </thead>
  <tbody>
    <tr><th>10</th><td>2.81</td><td>5.40</td></tr>
    <tr><th>149</th><td>3.17</td><td>5.75</td></tr>
    <tr><th>90</th><td>3.00</td><td>5.50</td></tr>
    <tr><th>59</th><td>2.91</td><td>5.60</td></tr>
    <tr><th>147</th><td>0.66</td><td>9.39</td></tr>
  </tbody>
</table>
</div>
</div>`
            },
            {
                // Cell 16
                comment: "View scaled Wine training data (after scaling)",
                code: `Xw_train_scaled[:5]`,
                output: `<div class="output-text">array([[ 0.73229212, -0.16746725],<br>
       [ 1.33318146,  0.30530313],<br>
       [ 1.006382  , -0.081509  ],<br>
       [ 0.81662747,  0.262324  ],<br>
       [-1.29175618,  1.47433535]])</div>`
            },
            {
                // Cell 17
                comment: "Scale Two Moons training and test data",
                code: `# Scale Two Moons training and test data
Xm_train_scaled = scaler.fit_transform(Xm_train)
Xm_test_scaled = scaler.transform(Xm_test)

print("Two Moons data scaled successfully!")`,
                output: `<div class="output-success">Two Moons data scaled successfully!</div>`
            },
            {
                // Cell 18
                comment: "View original Two Moons training data (before scaling)",
                code: `Xm_train[:5]`,
                output: `<div class="output-text">array([[ 1.3723603 , -0.55081882],<br>
       [ 0.63613117,  0.78345978],<br>
       [-0.43531115,  0.96004336],<br>
       [ 0.41718644,  1.17721089],<br>
       [-1.13531808,  0.17220389]])</div>`
            },
            {
                // Cell 19
                comment: "View scaled Two Moons training data (after scaling)",
                code: `Xm_train_scaled[:5]`,
                output: `<div class="output-text">array([[ 1.01466867, -1.57697415],<br>
       [ 0.17320777,  1.01862443],<br>
       [-1.05137949,  1.36213595],<br>
       [-0.07703149,  1.78459625],<br>
       [-1.85144083, -0.17046376]])</div>`
            }
        ]
    },
    // ========== STEP 5: MODEL TRAINING (Cells 20-21) ==========
    {
        title: "Model Training",
        blocks: [
            {
                // Cell 20
                comment: "Train Linear Kernel SVM on Wine dataset",
                code: `# Model Training

# Traing linear Kernel SVM in wine dataset with 2 features
svm_linear_wine = SVC(kernel="linear")
svm_linear_wine.fit(Xw_train_scaled, yw_train)
svm_linear_wine`,
                output: `<div class="output-text">SVC(kernel='linear')</div>`
            },
            {
                // Cell 21
                comment: "Train Linear and RBF Kernel SVMs on Two Moons dataset",
                code: `# Training SVMs with linear and RBF kernels on two-moons toy dataset
svm_linear_moon = SVC(kernel="linear")
svm_rbf_moon = SVC(kernel="rbf")

svm_linear_moon.fit(Xm_train_scaled, ym_train)
svm_rbf_moon.fit(Xm_train_scaled, ym_train)
print("Model trained")`,
                output: `<div class="output-success">Model trained</div>`
            }
        ]
    },
    // ========== STEP 6: MODEL EVALUATION (Cells 22-30) ==========
    {
        title: "Model Evaluation",
        blocks: [
            {
                // Cell 22
                comment: "Generate predictions on Wine test data",
                code: `# Model Evaluation

# Wine dataset case
wine_preds = svm_linear_wine.predict(Xw_test_scaled)
wine_preds`,
                output: `<div class="output-text">array([0, 2, 0, 0, 1, 0, 0, 0, 1, 2, 1, 2, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1,<br>
       0, 0, 0, 1, 0, 2, 1, 2, 0, 2, 1, 2, 2, 2])</div>`
            },
            {
                // Cell 23
                comment: "Wine dataset - Classification metrics",
                code: `print("Accuracy:", accuracy_score(yw_test, wine_preds))
print("Precision:", precision_score(yw_test, wine_preds, average="macro"))
print("Recall:", recall_score(yw_test, wine_preds, average="macro"))
print("F1 Score:", f1_score(yw_test, wine_preds, average="macro"))

print("\\nClassification Report:\\n")
print(classification_report(yw_test, wine_preds))`,
                output: `<div class="output-text" style="white-space: pre-wrap; font-family: monospace;">Accuracy: 0.8611111111111112
Precision: 0.8772893772893773
Recall: 0.8674603174603175
F1 Score: 0.8694456940070975

Classification Report:

              precision    recall  f1-score   support

           0       0.79      0.92      0.85        12
           1       0.85      0.79      0.81        14
           2       1.00      0.90      0.95        10

    accuracy                           0.86        36
   macro avg       0.88      0.87      0.87        36
weighted avg       0.87      0.86      0.86        36
</div>`
            },
            {
                // Cell 24
                comment: "Wine dataset - Confusion Matrix (Linear Kernel)",
                code: `# Confusion Matrix
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
plt.show()`,
                output: `<img src="images/Wine_Confusion_Matrix_Linear.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            },
            {
                // Cell 25
                comment: "Two Moons - Linear kernel predictions",
                code: `# Two moon dataset case
moon_linear_preds = svm_linear_moon.predict(Xm_test_scaled)
moon_linear_preds`,
                output: `<div class="output-text">array([0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,<br>
       0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1,<br>
       1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1,<br>
       0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0,<br>
       1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0,<br>
       1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0,<br>
       0, 0, 1, 0, 0, 1, 1, 1])</div>`
            },
            {
                // Cell 26
                comment: "Two Moons - Linear Kernel Confusion Matrix",
                code: `# Confusion Matrix
class_names = ['Blue Moon', 'Orange Moon']

plt.figure(figsize=(5, 4))
sns.heatmap(
    confusion_matrix(ym_test, moon_linear_preds),
    annot=True,
    fmt="d",
    cmap="Greens",
    xticklabels=class_names,
    yticklabels=class_names
)

plt.title("Two Moons Dataset (Linear Kernel)", fontweight='bold')
plt.xlabel("Predicted Label", fontweight='bold')
plt.ylabel("True Label", fontweight='bold')
plt.tight_layout()
plt.show()`,
                output: `<img src="images/Moons_Confusion_Matrix_Linear.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            },
            {
                // Cell 27
                comment: "Two Moons - Linear kernel classification metrics",
                code: `print("Accuracy:", accuracy_score(ym_test, moon_linear_preds))
print("Precision:", precision_score(ym_test, moon_linear_preds, average="macro"))
print("Recall:", recall_score(ym_test, moon_linear_preds, average="macro"))
print("F1 Score:", f1_score(ym_test, moon_linear_preds, average="macro"))

print("\\nClassification Report:\\n")
print(classification_report(ym_test, moon_linear_preds))`,
                output: `<div class="output-text" style="white-space: pre-wrap; font-family: monospace;">Accuracy: 0.9
Precision: 0.9003267973856208
Recall: 0.8999999999999999
F1 Score: 0.8999795876709533

Classification Report:

              precision    recall  f1-score   support

           0       0.91      0.89      0.90        70
           1       0.89      0.91      0.90        70

    accuracy                           0.90       140
   macro avg       0.90      0.90      0.90       140
weighted avg       0.90      0.90      0.90       140
</div>`
            },
            {
                // Cell 28
                comment: "Two Moons - RBF kernel predictions",
                code: `# Two moon dataset case
moon_rbf_preds = svm_rbf_moon.predict(Xm_test_scaled)
moon_rbf_preds`,
                output: `<div class="output-text">array([0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,<br>
       0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1,<br>
       1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1,<br>
       0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0,<br>
       1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0,<br>
       1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0,<br>
       1, 1, 1, 0, 1, 1, 0, 1])</div>`
            },
            {
                // Cell 29
                comment: "Two Moons - RBF Kernel Confusion Matrix",
                code: `class_names = ['Blue Moon', 'Orange Moon']

plt.figure(figsize=(5, 4))
sns.heatmap(
    confusion_matrix(ym_test, moon_rbf_preds),
    annot=True,
    fmt="d",
    cmap="Greens",
    xticklabels=class_names,
    yticklabels=class_names
)

plt.title("Two Moons Dataset (RBF Kernel)", fontweight='bold')
plt.xlabel("Predicted Label", fontweight='bold')
plt.ylabel("True Label", fontweight='bold')
plt.tight_layout()
plt.show()`,
                output: `<img src="images/Moons_Confusion_Matrix_RBF.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            },
            {
                // Cell 30
                comment: "Two Moons - RBF kernel classification metrics (Perfect accuracy!)",
                code: `print("Accuracy:", accuracy_score(ym_test, moon_rbf_preds))
print("Precision:", precision_score(ym_test, moon_rbf_preds, average="macro"))
print("Recall:", recall_score(ym_test, moon_rbf_preds, average="macro"))
print("F1 Score:", f1_score(ym_test, moon_rbf_preds, average="macro"))

print("\\nClassification Report:\\n")
print(classification_report(ym_test, moon_rbf_preds))`,
                output: `<div class="output-text" style="white-space: pre-wrap; font-family: monospace;">Accuracy: 1.0
Precision: 1.0
Recall: 1.0
F1 Score: 1.0

Classification Report:

              precision    recall  f1-score   support

           0       1.00      1.00      1.00        70
           1       1.00      1.00      1.00        70

    accuracy                           1.00       140
   macro avg       1.00      1.00      1.00       140
weighted avg       1.00      1.00      1.00       140
</div>`
            }
        ]
    },
    // ========== STEP 7: MODEL SIMULATION (Cells 31-32) ==========
    {
        title: "Model Simulation",
        blocks: [
            {
                // Cell 31
                comment: "Decision Boundary - Linear SVM on Wine Dataset",
                code: `# Model testing

# Decision Boundaries – Wine
plot_decision_regions(
    Xw_train_scaled,
    yw_train.values,
    clf=svm_linear_wine,
    legend=2
)
plt.title("Decision Boundary – Linear SVM (Wine Dataset)")
plt.xlabel("Flavanoids (scaled)")
plt.ylabel("Color Intensity (scaled)")
plt.show()`,
                output: `<img src="images/Decision_Boundary_Wine_Linear.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            },
            {
                // Cell 32
                comment: "Decision Boundaries - Linear vs RBF Kernel on Two Moons",
                code: `# Decision Boundaries – Two Moons
plt.figure(figsize=(12,5))

plt.subplot(1,2,1)
plot_decision_regions(Xm_train_scaled, ym_train, clf=svm_linear_moon)
plt.title("Linear Kernel – Blue vs Orange Moon")

plt.subplot(1,2,2)
plot_decision_regions(Xm_train_scaled, ym_train, clf=svm_rbf_moon)
plt.title("RBF Kernel – Blue vs Orange Moon")

plt.show()`,
                output: `<img src="images/Decision_Boundary_Moons_Comparison.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
            }
        ]
    }
];

let STEPS = [];
let EXPERIMENT_STATE = {
    stepIndex: 0,
    subStepIndex: 0,
    stepsStatus: []
};

let currentConfig = {
    kernel: 'linear'
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});

let stepsContainer, codeDisplay, outputDisplay, runBtn, bottomPane;

function init() {
    stepsContainer = document.getElementById('stepsContainer');
    codeDisplay = document.getElementById('codeDisplay');
    outputDisplay = document.getElementById('outputDisplay');
    bottomPane = document.querySelector('.bottom-pane');
    runBtn = document.getElementById('runBtn');

    // Load all 7 steps from STEPS_SVM (32 cells mapped across 7 categories)
    STEPS = STEPS_SVM.map(step => ({ ...step }));

    EXPERIMENT_STATE.stepIndex = 0;
    EXPERIMENT_STATE.subStepIndex = 0;
    EXPERIMENT_STATE.stepsStatus = STEPS.map((_, i) => ({ unlocked: i === 0, completed: false, partial: false }));

    renderSidebar();
    loadStep(0);
}

window.selectDataset = selectDataset;
window.runStep = runStep;
window.nextSubStep = nextSubStep;
window.restartExperiment = restartExperiment;
window.showDatasetSelector = showDatasetSelector;

function showDatasetSelector() {
    document.querySelector('.top-pane').style.display = 'none';
    document.querySelector('.bottom-pane').style.display = 'none';
    document.getElementById('datasetSelectorPane').style.display = 'flex';
}

function selectDataset(dataset) {
    currentConfig.dataset = dataset;
    document.getElementById('datasetSelectorPane').style.display = 'none';
    document.querySelector('.top-pane').style.display = '';
    document.querySelector('.bottom-pane').style.display = '';

    if (dataset === 'wine') {
        // Wine dataset - Linear Kernel SVM
        STEPS[4] = {
            title: `Model Training (Wine)`,
            blocks: [
                {
                    comment: "Train Linear Kernel SVM on Wine dataset",
                    code: `# Model Training

# Training Linear Kernel SVM on Wine dataset with 2 features
svm_linear_wine = SVC(kernel="linear")
svm_linear_wine.fit(Xw_train_scaled, yw_train)
svm_linear_wine`,
                    output: `<div class="output-text">SVC(kernel='linear')</div>`
                }
            ]
        };

        STEPS[5] = {
            title: `Model Evaluation (Wine)`,
            blocks: [
                {
                    comment: "Predict on Wine test data using Linear SVM",
                    code: `# Model Evaluation

# Wine dataset case
wine_preds = svm_linear_wine.predict(Xw_test_scaled)
wine_preds`,
                    output: `<div class="output-text">array([0, 0, 2, 0, 1, 0, 0, 2, 1, 1, 0, 2, 1, 0, 1, 1, 2, 2, 1, 0, 0, 1,<br>       2, 1, 2, 1, 0, 1, 2, 0, 0, 2, 1, 1, 1, 2])</div>`
                },
                {
                    comment: "Display classification metrics for Wine Linear SVM",
                    code: `print("Accuracy:", accuracy_score(yw_test, wine_preds))
print("Precision:", precision_score(yw_test, wine_preds, average="macro"))
print("Recall:", recall_score(yw_test, wine_preds, average="macro"))
print("F1 Score:", f1_score(yw_test, wine_preds, average="macro"))

print("\\nClassification Report:\\n")
print(classification_report(yw_test, wine_preds))`,
                    output: `<div class="output-text">Accuracy: 0.9722222222222222<br>Precision: 0.9696969696969697<br>Recall: 0.9761904761904763<br>F1 Score: 0.9722222222222223<br><br>Classification Report:<br><pre style="font-family: monospace; margin: 0;">
              precision    recall  f1-score   support

           0       1.00      1.00      1.00        12
           1       0.93      1.00      0.96        13
           2       1.00      0.91      0.95        11

    accuracy                           0.97        36
   macro avg       0.98      0.97      0.97        36
weighted avg       0.97      0.97      0.97        36
</pre></div>`
                },
                {
                    comment: "Confusion Matrix for Wine Linear SVM",
                    code: `# Confusion Matrix
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
plt.show()`,
                    output: `<img src="images/Wine_Confusion_Matrix_Linear.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
                }
            ]
        };

        STEPS[6] = {
            title: "Model Simulation",
            blocks: [
                {
                    comment: "Decision Boundary - Wine Linear SVM",
                    code: `# Model Simulation

# Decision Boundaries – Wine
plot_decision_regions(
    Xw_train_scaled,
    yw_train.values,
    clf=svm_linear_wine,
    legend=2
)
plt.title("Decision Boundary – Linear SVM (Wine Dataset)")
plt.xlabel("Flavanoids (scaled)")
plt.ylabel("Color Intensity (scaled)")
plt.show()`,
                    output: `<img src="images/Decision_Boundary_Wine_Linear.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
                }
            ]
        };
    } else {
        // Two Moons dataset - Compare Linear vs RBF
        STEPS[4] = {
            title: `Model Training (Two Moons)`,
            blocks: [
                {
                    comment: "Train Linear and RBF Kernel SVMs on Two Moons dataset",
                    code: `# Model Training

# Training SVMs with linear and RBF kernels on two-moons toy dataset
svm_linear_moon = SVC(kernel="linear")
svm_rbf_moon = SVC(kernel="rbf")

svm_linear_moon.fit(Xm_train_scaled, ym_train)
svm_rbf_moon.fit(Xm_train_scaled, ym_train)
print("Models trained")`,
                    output: `<div class="output-success">Models trained</div>`
                }
            ]
        };

        STEPS[5] = {
            title: `Model Evaluation (Two Moons)`,
            blocks: [
                {
                    comment: "Predict on Two Moons test data using Linear SVM",
                    code: `# Two moon dataset case - Linear Kernel
moon_linear_preds = svm_linear_moon.predict(Xm_test_scaled)
moon_linear_preds`,
                    output: `<div class="output-text">array([1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1,<br>       1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1,<br>       1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1,<br>       0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0,<br>       1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0,<br>       1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0,<br>       0, 1, 0, 1])</div>`
                },
                {
                    comment: "Confusion Matrix for Two Moons Linear SVM",
                    code: `# Confusion Matrix
class_names = ['Blue Moon', 'Orange Moon']

plt.figure(figsize=(5, 4))
sns.heatmap(
    confusion_matrix(ym_test, moon_linear_preds),
    annot=True,
    fmt="d",
    cmap="Greens",
    xticklabels=class_names,
    yticklabels=class_names
)

plt.title("Two Moons Dataset (Linear Kernel)", fontweight='bold')
plt.xlabel("Predicted Label", fontweight='bold')
plt.ylabel("True Label", fontweight='bold')
plt.tight_layout()
plt.show()`,
                    output: `<img src="images/Moons_Confusion_Matrix_Linear.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
                },
                {
                    comment: "Classification metrics for Two Moons Linear SVM",
                    code: `print("Accuracy:", accuracy_score(ym_test, moon_linear_preds))
print("Precision:", precision_score(ym_test, moon_linear_preds, average="macro"))
print("Recall:", recall_score(ym_test, moon_linear_preds, average="macro"))
print("F1 Score:", f1_score(ym_test, moon_linear_preds, average="macro"))

print("\\nClassification Report:\\n")
print(classification_report(ym_test, moon_linear_preds))`,
                    output: `<div class="output-text">Accuracy: 0.8857142857142857<br>Precision: 0.8857142857142857<br>Recall: 0.8857142857142858<br>F1 Score: 0.8857142857142858<br><br>Classification Report:<br><pre style="font-family: monospace; margin: 0;">
              precision    recall  f1-score   support

           0       0.88      0.89      0.88        70
           1       0.89      0.89      0.89        70

    accuracy                           0.89       140
   macro avg       0.89      0.89      0.89       140
weighted avg       0.89      0.89      0.89       140
</pre></div>`
                },
                {
                    comment: "Predict on Two Moons test data using RBF SVM",
                    code: `# Two moon dataset case - RBF Kernel
moon_rbf_preds = svm_rbf_moon.predict(Xm_test_scaled)
moon_rbf_preds`,
                    output: `<div class="output-text">array([1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1,<br>       1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1,<br>       1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1,<br>       0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0,<br>       1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0,<br>       1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0,<br>       0, 1, 0, 1])</div>`
                },
                {
                    comment: "Confusion Matrix for Two Moons RBF SVM",
                    code: `class_names = ['Blue Moon', 'Orange Moon']

plt.figure(figsize=(5, 4))
sns.heatmap(
    confusion_matrix(ym_test, moon_rbf_preds),
    annot=True,
    fmt="d",
    cmap="Greens",
    xticklabels=class_names,
    yticklabels=class_names
)

plt.title("Two Moons Dataset (RBF Kernel)", fontweight='bold')
plt.xlabel("Predicted Label", fontweight='bold')
plt.ylabel("True Label", fontweight='bold')
plt.tight_layout()
plt.show()`,
                    output: `<img src="images/Moons_Confusion_Matrix_RBF.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
                },
                {
                    comment: "Classification metrics for Two Moons RBF SVM",
                    code: `print("Accuracy:", accuracy_score(ym_test, moon_rbf_preds))
print("Precision:", precision_score(ym_test, moon_rbf_preds, average="macro"))
print("Recall:", recall_score(ym_test, moon_rbf_preds, average="macro"))
print("F1 Score:", f1_score(ym_test, moon_rbf_preds, average="macro"))

print("\\nClassification Report:\\n")
print(classification_report(ym_test, moon_rbf_preds))`,
                    output: `<div class="output-text">Accuracy: 1.0<br>Precision: 1.0<br>Recall: 1.0<br>F1 Score: 1.0<br><br>Classification Report:<br><pre style="font-family: monospace; margin: 0;">
              precision    recall  f1-score   support

           0       1.00      1.00      1.00        70
           1       1.00      1.00      1.00        70

    accuracy                           1.00       140
   macro avg       1.00      1.00      1.00       140
weighted avg       1.00      1.00      1.00       140
</pre></div>`
                }
            ]
        };

        STEPS[6] = {
            title: "Model Simulation",
            blocks: [
                {
                    comment: "Decision Boundaries - Two Moons Comparison",
                    code: `# Model Simulation

# Decision Boundaries – Two Moons
plt.figure(figsize=(12,5))

plt.subplot(1,2,1)
plot_decision_regions(Xm_train_scaled, ym_train, clf=svm_linear_moon)
plt.title("Linear Kernel – Blue vs Orange Moon")

plt.subplot(1,2,2)
plot_decision_regions(Xm_train_scaled, ym_train, clf=svm_rbf_moon)
plt.title("RBF Kernel – Blue vs Orange Moon")

plt.show()`,
                    output: `<img src="images/Decision_Boundary_Moons_Comparison.png" style="max-width:100%; height:auto; border: 1px solid #ddd; padding: 5px;">`
                }
            ]
        };
    }

    EXPERIMENT_STATE.stepsStatus[4].unlocked = true;
    loadStep(4);
}

// Check if all steps are completed
function checkAllStepsCompleted() {
    return EXPERIMENT_STATE.stepsStatus.every(status => status.completed);
}

function renderSidebar() {
    stepsContainer.innerHTML = '';

    STEPS.forEach((step, index) => {
        const status = EXPERIMENT_STATE.stepsStatus[index];
        const btn = document.createElement('button');
        btn.classList.add('step-btn');
        
        let label = `${index + 1}. ${step.title}`;
        if (status.completed) label = `✓ ${step.title}`;
        btn.innerText = label;

        if (status.unlocked) {
            if (status.completed) btn.classList.add('completed');
            else if (status.partial) btn.classList.add('in-progress');
            
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            if (index === EXPERIMENT_STATE.stepIndex) btn.classList.add('active');
            btn.onclick = () => loadStep(index);
        } else {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
        stepsContainer.appendChild(btn);
    });

    const restartBtn = document.createElement('button');
    restartBtn.classList.add('step-btn', 'restart-btn');
    restartBtn.innerText = "Restart Experiment";
    restartBtn.style.textAlign = 'center';
    restartBtn.style.marginTop = "auto";
    restartBtn.style.backgroundColor = "#1f2937";
    restartBtn.style.color = "white";
    restartBtn.onclick = restartExperiment;
    stepsContainer.appendChild(restartBtn);

    const downloadBtn = document.createElement('button');
    downloadBtn.classList.add('step-btn', 'download-btn');
    downloadBtn.id = 'downloadExperimentBtn';
    downloadBtn.style.textAlign = 'center';
    downloadBtn.style.marginTop = "10px";
    downloadBtn.style.marginBottom = "20px";
    downloadBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" style="margin-right:8px; vertical-align: middle;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download Experiment
    `;

    // Check if all steps are completed
    const allCompleted = checkAllStepsCompleted();

    if (allCompleted) {
        downloadBtn.style.backgroundColor = "#F57C2A"; // Orange when enabled
        downloadBtn.style.opacity = "1";
        downloadBtn.style.cursor = "pointer";
        downloadBtn.style.color = "white";
        downloadBtn.disabled = false;
        downloadBtn.onclick = downloadTrainingAsPDF;
    } else {
        downloadBtn.style.backgroundColor = "#f5f5f5"; // Light grey when disabled
        downloadBtn.style.opacity = "1";
        downloadBtn.style.cursor = "default";
        downloadBtn.style.color = "#9e9e9e";
        downloadBtn.style.border = "1px solid #e0e0e0";
        downloadBtn.disabled = false;
        downloadBtn.title = "Need to run the Experiment to download the pdf.";
        downloadBtn.onclick = function () {
            alert("Need to run the Experiment to download the pdf.");
        };
    }

    stepsContainer.appendChild(downloadBtn);
}

function loadStep(index) {
    EXPERIMENT_STATE.stepIndex = index;
    EXPERIMENT_STATE.subStepIndex = 0;
    renderSidebar();
    updateUI();
}

function restartExperiment() {
    EXPERIMENT_STATE.stepIndex = 0;
    EXPERIMENT_STATE.subStepIndex = 0;
    EXPERIMENT_STATE.stepsStatus = STEPS.map(() => ({ unlocked: false, completed: false, partial: false }));
    EXPERIMENT_STATE.stepsStatus[0].unlocked = true;

    bottomPane.classList.remove('active-output', 'completed-output');
    bottomPane.style.display = '';
    bottomPane.innerHTML = '<div class="output-content" id="outputDisplay"><div class="placeholder-text">Click the Run button to execute...</div></div>';
    outputDisplay = document.getElementById('outputDisplay');

    init();
}

function updateUI() {
    const step = STEPS[EXPERIMENT_STATE.stepIndex];
    if (!step || !step.blocks || step.blocks.length === 0) return;
    
    const block = step.blocks[EXPERIMENT_STATE.subStepIndex];
    if (!block) return;

    let headerComment = "";
    let displayCode = block.code || "";
    
    if (block && block.comment) {
        headerComment = block.comment;
    } else if (block && block.code) {
        const commentMatch = block.code.match(/#\s*([^<\n\r]*)/);
        if (commentMatch) {
            headerComment = commentMatch[1].trim();
        }
    }
    displayCode = displayCode.split('\n').filter(line => !line.trim().startsWith('#')).join('\n').trim();

    const codeHeaderBar = document.getElementById('codeHeaderBar');
    if (codeHeaderBar) {
        if (headerComment) {
            codeHeaderBar.innerText = "# " + headerComment;
            codeHeaderBar.style.display = 'block';
        } else {
            codeHeaderBar.style.display = 'none';
        }
    }

    codeDisplay.innerHTML = highlightCode(displayCode);

    bottomPane.classList.remove('active-output', 'completed-output');
    bottomPane.style.display = '';
    bottomPane.style.flexDirection = 'column';
    bottomPane.style.justifyContent = 'flex-start';
    bottomPane.style.alignItems = 'stretch';
    
    if (outputDisplay) {
        outputDisplay.innerHTML = '<div class="placeholder-text">Click the Run button to execute...</div>';
    }

    runBtn.style.display = 'flex';
    runBtn.classList.remove('completed', 'arrow-mode');
    runBtn.style.backgroundColor = '#F57C2A';
    runBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    runBtn.disabled = false;
    runBtn.onclick = runStep;
}

function runStep() {
    const step = STEPS[EXPERIMENT_STATE.stepIndex];
    const block = step.blocks[EXPERIMENT_STATE.subStepIndex];

    outputDisplay.innerHTML = '<div class="loading-spinner">Running code...</div>';
    runBtn.disabled = true;

    setTimeout(() => {
        outputDisplay.innerHTML = block.output;
        bottomPane.classList.add('active-output');

        runBtn.classList.add('completed');
        runBtn.style.backgroundColor = '#A6CE63';
        runBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

        EXPERIMENT_STATE.stepsStatus[EXPERIMENT_STATE.stepIndex].partial = true;
        renderSidebar();

        const hasNextBlock = EXPERIMENT_STATE.subStepIndex < step.blocks.length - 1;

        if (hasNextBlock) {
             setTimeout(() => {
                runBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
                runBtn.classList.remove('completed');
                runBtn.classList.add('arrow-mode');
                runBtn.style.backgroundColor = '#5FA8E4';
                runBtn.disabled = false;
                runBtn.onclick = nextSubStep;
             }, 500);
        } else {
            EXPERIMENT_STATE.stepsStatus[EXPERIMENT_STATE.stepIndex].completed = true;
            renderSidebar();

            if (EXPERIMENT_STATE.stepIndex < STEPS.length - 1) {
                EXPERIMENT_STATE.stepsStatus[EXPERIMENT_STATE.stepIndex + 1].unlocked = true;
                renderSidebar();
                
                 setTimeout(() => {
                    runBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
                    runBtn.classList.remove('completed');
                    runBtn.classList.add('arrow-mode');
                    runBtn.style.backgroundColor = '#5FA8E4';
                    runBtn.disabled = false;
                    
                    // Show dataset selector when moving from Data Preprocessing (Step 3, index 3) to Model Training (Step 4, index 4)
                    if (EXPERIMENT_STATE.stepIndex === 3) {
                        runBtn.onclick = showDatasetSelector;
                    } else {
                        runBtn.onclick = function() { loadStep(EXPERIMENT_STATE.stepIndex + 1); };
                    }
                 }, 500);
            } else {
                 setTimeout(() => {
                    runBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
                    runBtn.classList.remove('completed');
                    runBtn.classList.add('arrow-mode');
                    runBtn.style.backgroundColor = '#5FA8E4';
                    runBtn.disabled = false;
                    runBtn.onclick = showCompletionMessage;
                 }, 500);
            }
        }
    }, 800);
}

function nextSubStep() {
    EXPERIMENT_STATE.subStepIndex++;
    updateUI();
}

function showCompletionMessage() {
    outputDisplay.innerHTML = `
        <style>
            @keyframes clap {
                0%, 100% { transform: rotate(-15deg) scale(1); }
                50% { transform: rotate(15deg) scale(1.1); }
            }
            .clapping-hands {
                display: inline-block;
                font-size: 2.5rem;
                animation: clap 0.5s ease-in-out infinite;
                margin: 0 5px;
            }
        </style>
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; min-height: 50vh; text-align: center; gap: 20px;">
            <div style="margin-bottom: 10px;">
                <span class="clapping-hands">👏</span>
                <span class="clapping-hands" style="animation-delay: 0.15s;">👏</span>
                <span class="clapping-hands" style="animation-delay: 0.3s;">👏</span>
            </div>
            <div>
                <h2 style="color: #3d8b8b; font-family: 'Courier New', monospace; font-size: 2rem; font-weight: bold; margin-bottom: 10px;">
                    Congratulations!
                </h2>
                <p style="color: #555; font-size: 1.1rem; font-family: 'Courier New', monospace; max-width: 600px;">You have successfully completed the Support Vector Machine (SVM) experiment. You now understand how SVM uses linear kernels for linearly separable data and RBF kernel to transform and classify non-linearly separable data.</p>
            </div>

            <button onclick="SVMAnimation.show()" style="
                background: #1e293b;
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 1rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.2s;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            " onmouseover="this.style.background='#334155'; this.style.transform='translateY(-2px)'" 
               onmouseout="this.style.background='#1e293b'; this.style.transform='translateY(0)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Enter Interactive Animation
            </button>
        </div>
    `;
    runBtn.disabled = true;
    runBtn.style.backgroundColor = '#ccc';
    runBtn.style.cursor = 'default';
}

function highlightCode(code) {
  if (!code) return '';
  return code
    .replace(/\bimport\b/g, '<span class="kw">import</span>')
    .replace(/\bfrom\b/g, '<span class="kw">from</span>')
    .replace(/\bas\b/g, '<span class="kw">as</span>')
    .replace(/\bprint\b/g, '<span class="func">print</span>')
    .replace(/#.*$/gm, match => `<span class="comment">${match}</span>`);
}

function downloadTrainingAsPDF() {
    // Redirect to the PDF file for download
    window.open('assets/EXP-8.pdf', '_blank');
}
