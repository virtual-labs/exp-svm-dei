## Part 1: Linear SVM on Wine Recognition Dataset

The objective of this part of the experiment is to implement a Support Vector Machine (SVM) classifier on a real-world dataset to study linear class separability. The Wine Recognition dataset is used, where selected chemical attributes are employed to classify three types of wines: Barolo, Grignolino, and Barbera. This part focuses on understanding linear decision boundaries, margin maximization, and the effect of feature selection on classification accuracy.

**Step 1:** Import numpy and pandas for numerical computation and data handling, matplotlib and seaborn for data visualization, and sklearn for pipelines, model calls and evaluations.

**Step 2:** Dataset Loading and Description:
- Load the Wine Recognition Dataset using `load_wine()` from `sklearn.datasets`
- The dataset consists of:
  - 178 instances
  - 13 numerical chemical attributes
  - 3 target classes representing wine cultivars:
    - Class 0: Barolo
    - Class 1: Grignolino
    - Class 2: Barbera
- Select only two features: Flavanoids and Color Intensity as using two features enables direct 2D visualization and gives clear interpretation of class separability

**Step 3:** Exploratory Data Analysis (EDA):
- Plot scatter plots of Flavanoids vs Color Intensity with class-wise colour coding.
- Plot histograms for each selected feature across different classes.
- Analyse overlap between classes to assess linear separability.

**Step 4:** Data Preprocessing:
- Define feature matrix X using the selected attributes and target vector y using class labels.
- Split the dataset into training and testing sets using an 80:20 ratio.
- Apply standardization using `StandardScaler()` to normalize feature distributions.

**Step 5:** Model Training:
- Train a Support Vector Machine classifier with a linear kernel on the training data.
- The model attempts to find an optimal hyperplane that maximizes the margin between classes.

**Step 6:** Model Evaluation (Linear SVM):
- Evaluate the trained model on the test dataset using Accuracy, Precision, Recall and F1-score metrics and visualize using Confusion Matrix.
- Analyse misclassifications and class-wise performance.

**Step 7:** Decision Boundary Visualization:
- Plot the linear decision boundary along with support vectors.
- Observe how a straight hyperplane separates the wine classes in feature space.

---

## Part 2: Non-Linear SVM on Two Moons Dataset

The Two Moons dataset is used to demonstrate the limitations of linear classifiers and the necessity of kernel-based transformations. By applying an RBF kernel, this part highlights how kernel selection enables flexible decision boundaries and improves classification performance on non-linearly structured data.

**Step 1:** Import numpy, matplotlib, and relevant modules from sklearn.

**Step 2:** Generate the Two Moons dataset using `make_moons()`

**Step 3:** Exploratory Data Analysis (EDA):
- Plot a scatter plot of the dataset to visualize the non-linear class distribution.
- Observe the curved structure that motivates the use of kernel methods.

**Step 4:** Data Preprocessing:
- Define X as the 2D coordinates of the points and y as the binary class labels.
- Split the dataset into training and testing sets using an 80:20 ratio.
- Apply `StandardScaler()` to improve kernel performance and convergence.

**Step 5:** Train an SVM classifier using the Radial Basis Function (RBF) kernel.

**Step 6:** Evaluate the model using Accuracy, Precision, Recall and F1-score metrics and visualize using Confusion Matrix.

**Step 7:** Decision Boundary Visualization:
- Plot the non-linear decision boundary produced by the RBF SVM.
- Observe the flexible, curved boundary adapting to the moon-shaped clusters.