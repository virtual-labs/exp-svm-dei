<style>
.formula-block {
    display: flex;
    justify-content: center;
    margin: 18px 0;
}

.formula-block--left {
    justify-content: flex-start;
}

.formula-block--center {
    justify-content: center;
}

/* Stacked fractions without MathJax */
.frac {
    display: inline-block;
    vertical-align: middle;
    text-align: center;
    line-height: 1;
}

.frac .num {
    display: block;
    padding: 0 0.2em;
}

.frac .den {
    display: block;
    padding: 0.05em 0.2em 0;
    border-top: 1px solid currentColor;
    margin-top: 0.08em;
}

/* Inline exponent block (lets us put a fraction inside an exponent) */
.exp {
    display: inline-block;
    vertical-align: super;
    font-size: 0.82em;
    line-height: 1;
    margin-left: 0.05em;
}

.formula-text {
    display: inline-block;
    font-family: "Cambria Math", "Times New Roman", "Georgia", serif;
    font-size: 1.15em;
    line-height: 1.45;
}

.kernel-list {
    margin: 8px 0 0 22px;
    padding: 0;
}

.kernel-list li {
    margin: 10px 0;
}

.kernel-label {
    display: block;
}

.kernel-list .formula-block {
    margin: 6px 0 0;
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

### 1. Introduction

Support Vector Machines (SVMs) are supervised machine learning algorithms used for 
classification and regression tasks. They were formally introduced by Cortes and Vapnik in 1995 as 
part of the statistical learning theory based on the principle of Structural Risk Minimization (SRM). 

The main objective of SVM is to find an optimal decision boundary that separates different classes 
in a dataset with the maximum possible margin. Instead of simply minimizing classification error, 
SVM attempts to maximize the distance between the separating boundary and the closest data points 
of each class, which improves the model’s generalization ability. 

In a feature space, SVM identifies a boundary known as a hyperplane that divides the data points 
into different categories. Among many possible hyperplanes, the algorithm selects the one that 
maximizes the margin between classes, making the classifier robust and less sensitive to noise. 

### 2. Hyperplane

The hyperplane divides the feature space into two regions corresponding to different classes. For a 
two-dimensional dataset, the hyperplane is a straight line, whereas in three dimensions it becomes 
a plane. In higher-dimensional spaces, it is referred to as a hyperplane. 

SVM does not choose just any separating hyperplane; instead, it selects the optimal hyperplane that 
maximizes the distance from the nearest training points of both classes. This property makes SVM 
robust and improves its ability to generalize to unseen data. 

the SVM seeks a separating hyperplane defined by:

<div class="formula-block">
    <span class="formula-text">
        <i>w</i><sup>T</sup><i>x</i> + <i>b</i> = 0
    </span>
</div>

where 𝑤 is the weight vector which is normal to the hyperplane and 𝑏 is the bias term. 
Note - An optimal hyperplane is the one that maximizes the margin between the classes.

<div class="figure-block">
    <img src="images/fig-1_svm.png" alt="Linear SVM Maximum Margin">
    <p class="figure-caption">Figure 1: Linear Support Vector Machine (SVM): Maximum Margin Classifier.</p>
</div>
As shown in Figure 1, the Support Vector Machine (SVM) separates two classes of data points in a 
two-dimensional feature space defined by 𝑥1 and 𝑥2. The green points represent Class 1, while the 
orange points represent Class 2. The solid line 𝑤 ⋅ 𝑥 − 𝑏 = 0 represents the optimal 
separating hyperplane that divides the two classes. The dashed lines 𝑤 ⋅ 𝑥 − 𝑏 = 1 and 𝑤 ⋅ 𝑥 −
𝑏 = −1 denote the margin boundaries, and the distance between them is referred to as the 
maximum margin. The vector 𝑤 is perpendicular to the hyperplane and determines its orientation. 

### 3. Support Vectors

Support vectors are the data points that lie closest to the separating hyperplane. These points play a 
critical role in defining the position and orientation of the decision boundary. The distance between 
the hyperplane and these closest data points is known as the margin. Only these boundary points 
influence the formation of the hyperplane, while other points that lie farther away do not 
significantly affect the model. Because the hyperplane depends directly on these points, the 
algorithm is called a Support Vector Machine. 

<div class="figure-block">
    <img src="images/fig-2_svm.png" alt="SVM Support Vectors">
    <p class="figure-caption">Figure 2: SVM Classification with Maximum Margin and Support Vectors.</p>
</div>

As shown in Figure 2, the Support Vector Machine (SVM) separates two classes of data points in a 
two-dimensional feature space represented by 𝑥1 and 𝑥2. The orange circular points represent 
the first class, while the green square points represent the second class. The central dashed line 
represents the decision boundary that divides the two classes, and the two parallel dashed lines on 
either side denote the hyperplanes that define the margin. 
 
The region between these hyperplanes represents the margin, which is the distance between the 
decision boundary and the nearest data points. The data points that lie closest to these margin boundaries are known as support vectors, and they play a crucial role in determining the optimal 
separating hyperplane. SVM aims to maximize this margin to achieve improved classification 
performance and better generalization. 

### 4. Margin Maximization

This optimization problem attempts to minimize the magnitude of the weight vector while satisfying 
the classification constraints. By minimizing || 𝑤 ||2, the margin between the two classes becomes 
larger. A larger margin leads to a classifier that is less sensitive to noise and better able to generalize 
to unseen data. 

The margin maximization problem can be formulated as:

<div class="formula-block formula-block--center">
    <span class="formula-text">
        <i>min</i><sub><i>w</i>,<i>b</i></sub>
        <span class="frac"><span class="num">1</span><span class="den">2</span></span>
        ||<i>w</i>||<sup>2</sup>
    </span>
</div>

with constraint,

<div class="formula-block formula-block--center">
    <span class="formula-text"><i>y</i><sub>i</sub>(<i>w</i> · <i>x</i><sub>i</sub> + <i>b</i>) ≥ 1</span>
</div>

for all training samples (𝑥𝑖, 𝑦𝑖) This formulation ensures that the separating hyperplane lies as far 
as possible from the closest data points, thereby enhancing the classifier’s ability to generalize to 
unseen data.

<div class="figure-block">
    <img src="images/fig-3_svm.png" alt="Optimal Hyperplane and Margin">
    <p class="figure-caption">Figure 3: Optimal Hyperplane and Maximum Margin in Support Vector Machines.</p>
</div>

As shown Figure 3, the Support Vector Machine (SVM) separates two classes of data points in a 
two-dimensional feature space defined by the axes 𝑥1 and 𝑥2. The purple circular points 
represent one class, while the orange triangular points represent the other. The solid slanted line 
labelled “Optimal hyperplane” acts as the decision boundary that divides the two classes. 

The two parallel dashed lines on either side of this hyperplane denote the margin boundaries. The 
distance between these boundaries is referred to as the maximum margin, which SVM aims to 
maximize for improved generalization. The data points that lie closest to these margin lines are 
known as support vect

### 5. Kernel Trick

In many real-world problems, the data is not linearly separable in the original feature space. SVM 
solves this problem using the kernel trick, which implicitly maps the data into a higher-dimensional 
feature space where linear separation becomes possible. Instead of explicitly computing the 
transformation into the higher-dimensional space, kernel functions compute the inner product of 
transformed feature vectors directly. This makes the computation efficient even when the 
dimensionality of the transformed space is very large. 

The kernel trick allows SVM to construct non-linear decision boundaries in the original input space 
while still maintaining the mathematical formulation of a linear classifier in the transformed feature 
space.

<div class="figure-block">
    <img src="images/fig-4_svm.png" alt="Kernel Trick Mapping">
    <p class="figure-caption">Figure 4: Kernel Trick: Mapping Data to Higher-Dimensional Space in SVM.</p>
</div>

As shown in the above Figure 4, the diagram explains how Kernel Support Vector Machines (Kernel 
SVM) work. On the left side, the data points belong to two different classes: green circles and red 
squares. In this two-dimensional space, the data is not linearly separable, meaning a straight line 
cannot properly divide the two classes. 

To solve this problem, a kernel function is applied, which transforms the data into a higher- 
dimensional space. This transformation is illustrated on the right side of the figure, where the data 
is mapped into a three-dimensional space. In this higher dimension, the data becomes linearly 
separable, and a decision surface (hyperplane) can be used to separate the two classes effectively. 

Thus, the kernel trick allows SVM to handle complex, non-linear classification problems by 
mapping the data into a higher-dimensional feature space where a linear separator can be found. 


#### Common Kernel Functions include 

**Linear Kernel:**  The linear kernel is suitable when the data is approximately linearly separable:
<div class="formula-block">
    <span class="formula-text">
        <i>K</i>(<i>x</i><sub>i</sub>, <i>x</i><sub>j</sub>) = <i>x</i><sub>i</sub> · <i>x</i><sub>j</sub>
    </span>
</div>

**RBF Kernel:** The RBF kernel maps data into an infinite-dimensional 
feature space and is highly effective for capturing complex, non-linear relationships:

<div class="formula-block">
    <span class="formula-text">
        <i>K</i>(<i>x</i><sub>i</sub>, <i>x</i><sub>j</sub>) = <i>e</i>
        <span class="exp">-
            <span class="frac">
                <span class="num">||<i>x</i><sub>i</sub> - <i>x</i><sub>j</sub>||<sup>2</sup></span>
                <span class="den">2<i>&sigma;</i><sup>2</sup></span>
            </span>
        </span>
    </span>
</div>

The variance <i>&sigma;</i><sup>2</sup> controls how far the influence of individual training samples. Higher values lead to 
tighter decision boundaries. 

The RBF kernel is particularly effective and is commonly used for modelling complex, non- 
linear relationships due to its radially localised response characteristics. 

<div class="figure-block">
    <img src="images/fig-5_svm.png" alt="Linear vs RBF Kernel">
    <p class="figure-caption">Figure 5: Comparison of Linear and RBF Kernels in SVM.</p>
</div>
The figure compares Support Vector Machine classification using Linear and RBF kernels. In the 
Linear kernel, a straight-line decision boundary separates the data, suitable for linearly separable 
patterns. In contrast, the RBF kernel produces a curved boundary, allowing it to capture complex, 
non-linear relationships and achieve better separation of overlapping classes. 

### 6. L1 Regularization in SVM

Regularization plays an important role in controlling model complexity and preventing overfitting. 
In Support Vector Machines, regularization is controlled through the parameter C, which balances 
margin maximization and classification error. 

L1 regularization introduces sparsity in the model by encouraging some weight coefficients to 
become zero. This helps in feature selection and improves model interpretability. By penalizing the 
absolute magnitude of the weights, L1 regularization reduces the influence of less important features 
and helps create simpler models. 

### 7. Algorithm

**Step 1:** Given training data with labels +1 and -1.

**Step 2:** Find hyperplane:

<div class="formula-block formula-block--left">
    <span class="formula-text">
        <i>w</i> · <i>x</i> + <i>b</i> = 0
    </span>
</div>
w = weight vector (perpendicular to hyperplane) 

b = bias term

**Step 3:** Define margin constraints:

<div class="formula-block formula-block--left">
    <span class="formula-text">
        For class +1 points: <i>w</i> · <i>x</i><sub>i</sub> + <i>b</i> ≥ +1, &nbsp; if <i>y</i><sub>i</sub> = +1
    </span>
</div>

<div class="formula-block formula-block--left">
    <span class="formula-text">
        For class -1 points:<i>w</i> · <i>x</i><sub>i</sub> + <i>b</i> ≤ -1, &nbsp; if <i>y</i><sub>i</sub> = -1
    </span>
</div>

<div class="formula-block formula-block--left">
    <span class="formula-text">
        Combined:<i>y</i><sub>i</sub>(<i>w</i> · <i>x</i><sub>i</sub> + <i>b</i>) ≥ 1
    </span>
</div>

**Step 4:** 

<div class="formula-block formula-block--left">
    <span class="formula-text">
        Margin width = 2 / ||<i>w</i>||
    </span>
</div>

**Step 5:** Solve optimization:

<div class="formula-block formula-block--left">
    <span class="formula-text">
        <i>min</i><sub><i>w</i>,<i>b</i></sub> =
        <span class="frac"><span class="num">1</span><span class="den">2</span></span>
        ||<i>w</i>||<sup>2</sup>
    </span>
</div>

<div class="formula-block formula-block--left">
    <span class="formula-text">
        Subject to: &nbsp; <i>y</i><sub>i</sub>(<i>w</i> · <i>x</i><sub>i</sub> + <i>b</i>) ≥ 1, &nbsp; for all <i>i</i>
    </span>
</div>

**Step 6:** Solve using Lagrange multipliers: 

Convert to dual form 

Find αᵢ values for each training point 

Support vectors are points where <i>&alpha;</i><sub>i</sub>.

**Step 7:**  For non-linear data, apply Kernel Trick: 

<ul class="kernel-list">
    <li>
        <div class="kernel-label">Linear Kernel:</div>
        <div class="formula-block formula-block--left">
            <span class="formula-text">
                <i>K</i>(<i>x</i>, <i>x</i>') = <i>x</i> · <i>x</i>'
            </span>
        </div>
    </li>
    <li>
        <div class="kernel-label">RBF Kernel:</div>
        <div class="formula-block formula-block--left">
            <span class="formula-text">
                <i>K</i>(<i>x</i>, <i>x</i>') = <i>e</i>
                <span class="exp">-
                    <span class="frac">
                        <span class="num">||<i>x</i> - <i>x</i>'||<sup>2</sup></span>
                        <span class="den">2<i>&sigma;</i><sup>2</sup></span>
                    </span>
                </span>
            </span>
        </div>
    </li>
    <li>
        <div class="kernel-label">Polynomial Kernel:</div>
        <div class="formula-block formula-block--left">
            <span class="formula-text">
                <i>K</i>(<i>x</i>, <i>x</i>') = (<i>x</i> · <i>x</i>' + <i>c</i>)<sup>d</sup>
            </span>
        </div>
    </li>
</ul>

Maps data to higher dimension where linear separation is possible

**Step 8:** For Prediction:

<div class="formula-block formula-block--left">
    <span class="formula-text">
       Calculate: <i>f</i>(<i>x</i>) = &sum;<sub><i>i</i>=1</sub><sup><i>m</i></sup> <i>&alpha;</i><sub>i</sub><i>y</i><sub>i</sub><i>K</i>(<i>x</i><sub>i</sub>, <i>x</i>) + <i>b</i>
    </span>
</div>

If <i>f</i>(<i>x</i>) ≥ 0, predict class +1; otherwise class -1.

### 8. Merits of Support Vector Machines

- **Good generalization performance** 
SVMs focus on maximizing the margin between classes, which helps the model perform well 
on unseen data and reduces overfitting, especially in high-dimensional datasets.
- **Works well for both linear and non-linear data**
By using different kernel functions such as Linear and RBF, SVMs can handle simple linearly 
separable data as well as complex non-linear patterns effectively. 
- **Uses only important data points** 
The model depends mainly on support vectors, which are the most critical data points near the 
decision boundary. This makes the classifier efficient and robust. 

### 9. Demerits of Support Vector Machines

- **High training time for large datasets** 
SVM training can be slow and computationally expensive when the dataset is very large, 
particularly when non-linear kernels are used. 
- **Sensitive to parameter selection** 
The performance of SVM strongly depends on choosing the right kernel and hyper- 
parameters. Incorrect values can lead to poor classification results. 
- **Harder to interpret results** 
Unlike simpler models such as Linear Regression or Decision Trees, especially SVMs with 
non-linear kernels do not provide clear insights into how individual features might affect 
predictions.

