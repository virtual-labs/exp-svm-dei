<style>
.formula-block {
    text-align: center;
    margin: 18px 0;
}

.formula-text {
    display: inline-block;
    font-family: "Cambria Math", "Times New Roman", "Georgia", serif;
    font-size: 1.15em;
    line-height: 1.45;
}

.figure-block {
    text-align: center;
    margin: 18px 0;
}

.figure-block img {
    max-height: 320px;
    width: auto;
}

.figure-caption {
    color: #64748b;
    font-size: 0.92rem;
    margin-top: 8px;
    font-style: italic;
}
</style>

### Introduction

Support Vector Machines (SVMs) are supervised machine learning algorithms used for classification and regression tasks. They were introduced by Cortes and Vapnik (1995) within the framework of Statistical Learning Theory and Structural Risk Minimization (SRM).

The main objective of SVM is to find a decision boundary that separates classes with the maximum possible margin. Instead of minimizing only training error, SVM balances training fit and model complexity to improve generalization on unseen data.

### 1. Hyperplane

A hyperplane divides the feature space into two regions corresponding to different classes. In a 2D feature space, the hyperplane is a line; in 3D, it is a plane; in higher dimensions, it is referred to as a hyperplane.

For a linearly separable dataset, SVM seeks a separating hyperplane:

<div class="formula-block">
    <span class="formula-text">
        <i>w</i><sup>T</sup><i>x</i> + <i>b</i> = 0
    </span>
</div>

where w is the weight vector (normal to the hyperplane) and b is the bias term.

An optimal hyperplane is the one that maximizes the margin between the classes.

<div class="figure-block">
    <img src="images/fig-1_svm.png" alt="Linear SVM Maximum Margin">
    <p class="figure-caption">Figure 1: Linear Support Vector Machine (SVM): Maximum Margin Classifier.</p>
</div>

### 2. Support Vectors

Support vectors are the training samples closest to the separating hyperplane. These points determine the position and orientation of the boundary. Points farther from the boundary have little or no direct effect on the final hyperplane.

<div class="figure-block">
    <img src="images/fig-2_svm.png" alt="SVM Support Vectors">
    <p class="figure-caption">Figure 2: SVM Classification with Maximum Margin and Support Vectors.</p>
</div>

### 3. Margin Maximization

SVM maximizes the geometric margin by minimizing the norm of the weight vector under classification constraints:

<div class="formula-block">
    <span class="formula-text">
        min<sub>w,b</sub> (1/2)||<i>w</i>||<sup>2</sup>
    </span>
</div>

subject to

<div class="formula-block">
    <span class="formula-text">
        <i>y</i><sub>i</sub>(<i>w</i> · <i>x</i><sub>i</sub> + <i>b</i>) >= 1, for all <i>i</i>
    </span>
</div>

This gives a robust classifier with better resistance to noise and improved generalization.

<div class="figure-block">
    <img src="images/fig-3_svm.png" alt="Optimal Hyperplane and Margin">
    <p class="figure-caption">Figure 3: Optimal Hyperplane and Maximum Margin in Support Vector Machines.</p>
</div>

### 4. Kernel Trick

Many real datasets are not linearly separable in the original feature space. The kernel trick addresses this by implicitly mapping data into a higher-dimensional feature space where a linear separator can be found.

Instead of computing explicit transformed coordinates, SVM uses a kernel function to compute inner products directly in transformed space:

<div class="formula-block">
    <span class="formula-text">
        <i>K</i>(<i>x</i><sub>i</sub>, <i>x</i><sub>j</sub>) = <i>&phi;</i>(<i>x</i><sub>i</sub>)<sup>T</sup><i>&phi;</i>(<i>x</i><sub>j</sub>)
    </span>
</div>

This enables efficient non-linear classification.

<div class="figure-block">
    <img src="images/fig-4_svm.png" alt="Kernel Trick Mapping">
    <p class="figure-caption">Figure 4: Kernel Trick: Mapping Data to Higher-Dimensional Space in SVM.</p>
</div>

#### Common Kernel Functions

**Linear Kernel** (suitable for approximately linearly separable data):

<div class="formula-block">
    <span class="formula-text">
        <i>K</i>(<i>x</i><sub>i</sub>, <i>x</i><sub>j</sub>) = <i>x</i><sub>i</sub> · <i>x</i><sub>j</sub>
    </span>
</div>

**RBF Kernel** (effective for complex non-linear patterns):

<div class="formula-block">
    <span class="formula-text">
        <i>K</i>(<i>x</i><sub>i</sub>, <i>x</i><sub>j</sub>) = <i>e</i><sup>-||<i>x</i><sub>i</sub> - <i>x</i><sub>j</sub>||<sup>2</sup> / (2<i>&sigma;</i><sup>2</sup>)</sup>
    </span>
</div>

RBF has localized response and can create flexible non-linear boundaries. The variance <i>&sigma;</i><sup>2</sup> controls how far the influence of each training point extends.

<div class="figure-block">
    <img src="images/fig-5_svm.png" alt="Linear vs RBF Kernel">
    <p class="figure-caption">Figure 5: Comparison of Linear and RBF Kernels in SVM.</p>
</div>

### 5. L1 Regularization in SVM

Regularization in SVM is controlled by parameter C, which balances margin maximization against training misclassification.

- Higher C: lower tolerance for misclassification, narrower effective margin, risk of overfitting.
- Lower C: more tolerance for misclassification, wider margin, better robustness.

L1 regularization encourages sparse weight vectors by penalizing absolute coefficient magnitude. This can reduce the influence of weak features and improve interpretability in linear SVM formulations.

### 6. Algorithm

**Step 1:** Given training data with labels +1 and -1.

**Step 2:** Define hyperplane:

<div class="formula-block">
    <span class="formula-text">
        <i>w</i> · <i>x</i> + <i>b</i> = 0
    </span>
</div>

**Step 3:** Define margin constraints:

<div class="formula-block">
    <span class="formula-text">
        <i>w</i> · <i>x</i><sub>i</sub> + <i>b</i> >= +1, &nbsp; if <i>y</i><sub>i</sub> = +1
    </span>
</div>

<div class="formula-block">
    <span class="formula-text">
        <i>w</i> · <i>x</i><sub>i</sub> + <i>b</i> <= -1, &nbsp; if <i>y</i><sub>i</sub> = -1
    </span>
</div>

<div class="formula-block">
    <span class="formula-text">
        <i>y</i><sub>i</sub>(<i>w</i> · <i>x</i><sub>i</sub> + <i>b</i>) >= 1
    </span>
</div>

**Step 4:** Margin width:

<div class="formula-block">
    <span class="formula-text">
        Margin = 2 / ||<i>w</i>||
    </span>
</div>

**Step 5:** Solve optimization:

<div class="formula-block">
    <span class="formula-text">
        min<sub><i>w</i>,<i>b</i></sub> (1/2)||<i>w</i>||<sup>2</sup>
    </span>
</div>

<div class="formula-block">
    <span class="formula-text">
        subject to &nbsp; <i>y</i><sub>i</sub>(<i>w</i> · <i>x</i><sub>i</sub> + <i>b</i>) >= 1, &nbsp; for all <i>i</i>
    </span>
</div>

**Step 6:** Use Lagrange multipliers and dual optimization. Support vectors are points with non-zero multipliers <i>&alpha;</i><sub>i</sub>.

**Step 7:** For non-linear data, use kernels such as:
- Linear Kernel:

<div class="formula-block">
    <span class="formula-text">
        <i>K</i>(<i>x</i>, <i>x</i>') = <i>x</i> · <i>x</i>'
    </span>
</div>

- RBF Kernel:

<div class="formula-block">
    <span class="formula-text">
        <i>K</i>(<i>x</i>, <i>x</i>') = <i>e</i><sup>-||<i>x</i>-<i>x</i>'||<sup>2</sup> / (2<i>&sigma;</i><sup>2</sup>)</sup>
    </span>
</div>

- Polynomial Kernel:

<div class="formula-block">
    <span class="formula-text">
        <i>K</i>(<i>x</i>, <i>x</i>') = (<i>x</i> · <i>x</i>' + <i>c</i>)<sup>d</sup>
    </span>
</div>

**Step 8:** Prediction function:

<div class="formula-block">
    <span class="formula-text">
        <i>f</i>(<i>x</i>) = &sum;<sub><i>i</i>=1</sub><sup><i>m</i></sup> <i>&alpha;</i><sub>i</sub><i>y</i><sub>i</sub><i>K</i>(<i>x</i><sub>i</sub>, <i>x</i>) + <i>b</i>
    </span>
</div>

If <i>f</i>(<i>x</i>) >= 0, predict class +1; otherwise class -1.

### 7. Merits of Support Vector Machines

- Good generalization due to margin maximization.
- Effective for both linear and non-linear classification.
- Uses only support vectors to define the boundary, making it robust.

### 8. Demerits of Support Vector Machines

- Computationally expensive for very large datasets.
- Sensitive to kernel and hyper-parameter selection.
- Less interpretable than simpler linear/probabilistic models for non-linear kernels.

