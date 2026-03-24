// Global State
const state = {
    moons: {
        metadata: null,
        samples: 750,
        noise: 0.1,
        gamma: 2,
        linearData: null,
        rbfData: null
    },
    formation: {
        inProgress: false,
        currentStep: 0,
        requestId: null,
        firstLoad: true,
    },
    visibility: {
        'train-class0': true,
        'train-class1': true,
        'test-correct': true,
        'test-wrong': true,
        'support-vectors': true
    }
};

// Color Schemes
const colors = {
    class0: '#1f77b4',
    class1: '#ff7f0e',
    support: '#9c27b0',
    testCorrect: '#4caf50',
    testWrong: '#f44336'
};

// Kernel descriptions
const kernelDescriptions = {
    linear: "In the Linear kernel approach, a hyperplane is constructed in the original feature space to maximally separate the two classes. The decision boundary is a straight line (in 2D) or a flat surface (in higher dimensions). Support vectors are the data points lying closest to the decision boundary that define the optimal separating hyperplane.",
    rbf: "In the RBF kernel approach, input data points are implicitly projected into a higher-dimensional feature space via the radial basis function transformation. Within this augmented space, a hyperplane is constructed such that it maximally separates the two classes. The data points lying on the margin boundaries, termed support vectors, define the optimal decision surface."
};

// Higher resolution for smoother boundaries
const BOUNDARY_RESOLUTION = 400;

// Initialize
window.addEventListener('DOMContentLoaded', init);

async function init() {
    showLoading('Loading Two Moons dataset...');
    try {
        await loadMoonsMetadata();
        setupEventListeners();
        await loadMoonsData();
        hideLoading();
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('loadingText').textContent = 'Error loading data. Please check console.';
    }
}

function showLoading(text) {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    const loading = document.getElementById('loadingScreen');
    loading.style.opacity = '0';
    setTimeout(() => {
        loading.style.display = 'none';
        document.getElementById('mainApp').classList.remove('hidden');
        if (state.formation.firstLoad) {
            state.formation.firstLoad = false;
            setTimeout(() => {
                startFormationAnimation('linear');
                startFormationAnimation('rbf');
            }, 300);
        }
    }, 1500);
}

async function loadMoonsMetadata() {
    const res = await fetch('data/moons/metadata.json');
    state.moons.metadata = await res.json();
    document.getElementById('moonsDescription').textContent = state.moons.metadata.description;
    updateOverview();
}

function updateOverview() {
    const trainSamples = Math.floor(state.moons.samples * 0.8);
    const testSamples = state.moons.samples - trainSamples;
    document.getElementById('overviewDetails').innerHTML = `
        <table class="overview-table">
            <tr><th>Dataset</th><td>Two Moons</td></tr>
            <tr><th>Total Samples</th><td>${state.moons.samples}</td></tr>
            <tr><th>Train (80%)</th><td>${trainSamples}</td></tr>
            <tr><th>Test (20%)</th><td>${testSamples}</td></tr>
        </table>`;
    document.getElementById('moonsStats').innerHTML = '';
}

function setupEventListeners() {
    // Legend visibility toggles with grouped behavior
    document.querySelectorAll('.legend-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.currentTarget.dataset.type;

            // Define button groups
            const trainingGroup = ['train-class0', 'train-class1', 'support-vectors'];
            const testGroup = ['test-correct', 'test-wrong'];

            // Determine which group this button belongs to
            let group = null;
            if (trainingGroup.includes(type)) {
                group = trainingGroup;
            } else if (testGroup.includes(type)) {
                group = testGroup;
            }

            // Toggle all buttons in the group
            if (group) {
                const newState = !state.visibility[type];
                group.forEach(groupType => {
                    state.visibility[groupType] = newState;
                    const groupBtn = document.querySelector(`.legend-btn[data-type="${groupType}"]`);
                    if (groupBtn) {
                        if (newState) {
                            groupBtn.classList.add('active');
                        } else {
                            groupBtn.classList.remove('active');
                        }
                    }
                });
            }

            // Update formation button state based on visibility
            updateFormationButtonsState();

            // Redraw both plots with updated visibility
            renderMoonsPlots();
        });
    });

    document.querySelectorAll('#samplesButtons .toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#samplesButtons .toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.moons.samples = parseInt(e.target.dataset.samples);
            syncModalControls();
            updateOverview();
            loadMoonsData();
        });
    });

    document.querySelectorAll('#noiseButtons .toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#noiseButtons .toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.moons.noise = parseFloat(e.target.dataset.noise);
            syncModalControls();
            updateOverview();
            loadMoonsData();
        });
    });

    document.querySelectorAll('#gammaButtons .toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#gammaButtons .toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.moons.gamma = parseFloat(e.target.dataset.gamma);
            syncModalControls();
            loadMoonsData();
        });
    });

    setupModalConfigListeners();

    document.querySelectorAll('.formation-btn[data-kernel]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            startFormationAnimation(e.target.dataset.kernel);
        });
    });

    document.getElementById('modal3DFormation').addEventListener('click', () => {
        if (currentHyperplaneKernel) startModal3DFormation();
    });

    document.querySelectorAll('.hyperplane-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showHyperplane(e.target.dataset.kernel));
    });

    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('resetView').addEventListener('click', resetHyperplaneView);
    document.getElementById('toggleAnimation').addEventListener('click', toggleAnimation);
    document.getElementById('hyperplaneModal').addEventListener('click', (e) => {
        if (e.target.id === 'hyperplaneModal') closeModal();
    });
}

function setupModalConfigListeners() {
    document.querySelectorAll('#modalSamplesButtons .toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#modalSamplesButtons .toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.moons.samples = parseInt(e.target.dataset.samples);
            syncSidebarControls();
            updateOverview();
            loadMoonsDataAndUpdate3D();
        });
    });

    document.querySelectorAll('#modalNoiseButtons .toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#modalNoiseButtons .toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.moons.noise = parseFloat(e.target.dataset.noise);
            syncSidebarControls();
            updateOverview();
            loadMoonsDataAndUpdate3D();
        });
    });

    document.querySelectorAll('#modalGammaButtons .toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#modalGammaButtons .toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.moons.gamma = parseFloat(e.target.dataset.gamma);
            syncSidebarControls();
            loadMoonsDataAndUpdate3D();
        });
    });
}

function syncModalControls() {
    document.querySelectorAll('#modalSamplesButtons .toggle-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.samples) === state.moons.samples);
    });
    document.querySelectorAll('#modalNoiseButtons .toggle-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.dataset.noise) === state.moons.noise);
    });
    document.querySelectorAll('#modalGammaButtons .toggle-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.dataset.gamma) === state.moons.gamma);
    });
}

function syncSidebarControls() {
    document.querySelectorAll('#samplesButtons .toggle-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.samples) === state.moons.samples);
    });
    document.querySelectorAll('#noiseButtons .toggle-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.dataset.noise) === state.moons.noise);
    });
    document.querySelectorAll('#gammaButtons .toggle-btn').forEach(b => {
        b.classList.toggle('active', parseFloat(b.dataset.gamma) === state.moons.gamma);
    });
}

function updateFormationButtonsState() {
    // Check if all visibility toggles are ON
    const allVisible = Object.values(state.visibility).every(v => v === true);

    // Enable/disable formation buttons based on visibility state
    document.querySelectorAll('.formation-btn[data-kernel]').forEach(btn => {
        btn.disabled = !allVisible;
        if (!allVisible) {
            btn.title = 'Enable all legend items to use formation animation';
        } else {
            btn.title = '';
        }
    });

    // Also update modal formation button
    const modalFormationBtn = document.getElementById('modal3DFormation');
    if (modalFormationBtn) {
        modalFormationBtn.disabled = !allVisible;
        if (!allVisible) {
            modalFormationBtn.title = 'Enable all legend items to use formation animation';
        } else {
            modalFormationBtn.title = '';
        }
    }

    // Disable View 3D buttons when all are OFF
    const allHidden = Object.values(state.visibility).every(v => v === false);
    document.querySelectorAll('.hyperplane-btn').forEach(btn => {
        btn.disabled = allHidden;
        if (allHidden) {
            btn.title = 'Enable legend items to view 3D';
        } else {
            btn.title = '';
        }
    });

    // Disable configuration controls when all are OFF
    const configButtons = [
        ...document.querySelectorAll('#samplesButtons .toggle-btn'),
        ...document.querySelectorAll('#noiseButtons .toggle-btn'),
        ...document.querySelectorAll('#gammaButtons .toggle-btn')
    ];
    configButtons.forEach(btn => {
        btn.disabled = allHidden;
    });
}

async function loadMoonsDataAndUpdate3D() {
    await loadMoonsData();
    if (currentHyperplaneKernel) {
        currentHyperplaneData = currentHyperplaneKernel.includes('linear') ? state.moons.linearData : state.moons.rbfData;
        renderHyperplane();
    }
}

async function loadMoonsData() {
    const { samples, noise, gamma } = state.moons;
    const cacheBust = Date.now(); // Force fresh data load
    try {
        const [linearRes, rbfRes] = await Promise.all([
            fetch(`data/moons/linear/samples_${samples}_noise_${noise}/data.json?t=${cacheBust}`),
            fetch(`data/moons/rbf/gamma_${gamma}/samples_${samples}_noise_${noise}/data.json?t=${cacheBust}`)
        ]);
        state.moons.linearData = await linearRes.json();
        state.moons.rbfData = await rbfRes.json();
        renderMoonsPlots();
    } catch (error) {
        console.error('Error loading moons data:', error);
    }
}

// Formation Animation - Points appear in batches synced with boundary changes
function startFormationAnimation(kernel) {
    const canvas = kernel === 'linear' ? document.getElementById('moonsLinearCanvas') : document.getElementById('moonsRbfCanvas');
    const data = kernel === 'linear' ? state.moons.linearData : state.moons.rbfData;
    const btn = document.querySelector(`.formation-btn[data-kernel="${kernel}"]`);

    if (!data) return;
    if (btn) btn.disabled = true;

    // Get the progress stages from data (or use defaults)
    const stages = data.progress_stages || [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];
    let stageIndex = 0;
    const delay = 400; // Slower to see boundary changes clearly

    function animate() {
        // Progress matches the current stage
        const progress = stages[stageIndex];
        const sampleCount = Math.floor(data.train_points.length * progress);

        renderPartialPlot(canvas, data, sampleCount, progress);

        if (stageIndex < stages.length - 1) {
            stageIndex++;
            setTimeout(animate, delay);
        } else {
            if (btn) btn.disabled = false;
            updateMetricsForKernel(kernel);
        }
    }
    animate();
}

function renderPartialPlot(canvas, data, sampleCount, progress) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const bounds = data.grid_bounds;
    const padding = 30;
    const scaleX = (w - 2 * padding) / (bounds.x_max - bounds.x_min);
    const scaleY = (h - 2 * padding) / (bounds.y_max - bounds.y_min);
    const toCanvasX = (x) => padding + (x - bounds.x_min) * scaleX;
    const toCanvasY = (y) => h - padding - (y - bounds.y_min) * scaleY;

    // Get the appropriate progressive boundary for current progress
    const gridSize = data.grid_size || 50;
    const boundary = getBoundaryAtProgress(data, progress);

    // Draw decision boundary (reshapes based on progress!)
    if (boundary && boundary.length > 0) {
        drawAnimatedBoundary(ctx, boundary, bounds, w, h, padding, gridSize, Math.min(1, progress * 1.2));
    }

    // Draw partial test points
    const testCount = Math.floor(data.test_points.length * (sampleCount / data.train_points.length));
    data.test_points.slice(0, testCount).forEach(pt => {
        const p = getPoint(pt);
        ctx.fillStyle = p.class === p.predicted ? colors.testCorrect : colors.testWrong;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Draw partial support vectors - only for points that are already visible
    const visibleTrainPoints = data.train_points.slice(0, sampleCount);
    data.support_vectors.forEach(svArr => {
        const sv = getSV(svArr);
        // Check if this support vector matches a visible train point
        const isVisible = visibleTrainPoints.some(pt => {
            const p = getPoint(pt);
            return Math.abs(p.x - sv.x) < 0.001 && Math.abs(p.y - sv.y) < 0.001;
        });
        if (!isVisible) return;

        ctx.strokeStyle = colors.support;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(toCanvasX(sv.x), toCanvasY(sv.y), 7, 0, Math.PI * 2);
        ctx.stroke();
    });

    // Draw partial train points
    data.train_points.slice(0, sampleCount).forEach(pt => {
        const p = getPoint(pt);
        ctx.fillStyle = p.class === 0 ? colors.class0 : colors.class1;
        ctx.beginPath();
        ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    });

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, w - 2 * padding, h - 2 * padding);
}

// Helper function to decode Base64 bitmap
function decodeBitmap(b64, size) {
    if (!b64) return [];

    // Decode Base64 string to binary string
    const binString = atob(b64);
    const len = binString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binString.charCodeAt(i);
    }

    // Unpack bits
    const result = new Int8Array(size);
    for (let i = 0; i < size; i++) {
        // Find byte index and bit offset
        const byteIndex = Math.floor(i / 8);
        if (byteIndex >= len) break;

        const bitOffset = i % 8;
        // Check if bit is set
        if (bytes[byteIndex] & (1 << bitOffset)) {
            result[i] = 1;
        } else {
            result[i] = 0;
        }
    }
    return result;
}

// Helper function to decode quantized floats
function decodeFloats(encodedObj) {
    if (!encodedObj) return [];
    if (encodedObj.const) {
        // Return array filled with constant value (approx average of min/max)
        const val = (encodedObj.min + encodedObj.max) / 2;
        // We assume grid size is squared 
        // But we don't know grid size here easily, so we rely on context or assume it's large enough
        // Actually, returning a proxy object or handling this at call site is better
        // For now, let's just return a filled array if we can infer length, or handle upstream
        return [];
    }

    const binString = atob(encodedObj.b64);
    const len = binString.length;
    const result = new Float32Array(len);
    const min = encodedObj.min;
    const rng = encodedObj.max - encodedObj.min;

    for (let i = 0; i < len; i++) {
        const val = binString.charCodeAt(i);
        result[i] = min + (val / 255) * rng;
    }
    return result;
}

// Helper function to get the appropriate boundary for current animation progress
function getBoundaryAtProgress(data, progress) {
    let rawBoundary = null;

    // If we have progressive boundaries, select appropriate stage
    if (data.progressive_boundaries && data.progress_stages) {
        const stages = data.progress_stages;
        const boundaries = data.progressive_boundaries;

        // Find the stage that matches current progress
        for (let i = 0; i < stages.length; i++) {
            if (progress <= stages[i]) {
                if (boundaries[i]) {
                    rawBoundary = boundaries[i];
                    break;
                }
            }
        }
        // Fall back to last valid boundary
        if (!rawBoundary) {
            for (let i = boundaries.length - 1; i >= 0; i--) {
                if (boundaries[i]) {
                    rawBoundary = boundaries[i];
                    break;
                }
            }
        }
    } else {
        // Fall back to final decision boundary
        rawBoundary = data.decision_boundary;
    }

    // Decode if needed
    if (data.encoded && typeof rawBoundary === 'string') {
        const gridSize = data.grid_size || 50;
        return decodeBitmap(rawBoundary, gridSize * gridSize);
    }

    return rawBoundary || [];
}

// Helper function to get the appropriate decision values for current animation progress (for 3D)
function getDecisionValuesAtProgress(data, progress) {
    let rawValues = null;

    // If we have progressive decision values, select appropriate stage
    if (data.progressive_decision_values && data.progress_stages) {
        const stages = data.progress_stages;
        const decisionValues = data.progressive_decision_values;

        // Find the stage that matches current progress
        for (let i = 0; i < stages.length; i++) {
            if (progress <= stages[i]) {
                if (decisionValues[i]) {
                    rawValues = decisionValues[i];
                    break;
                }
            }
        }
        // Fall back to last valid decision values
        if (!rawValues) {
            for (let i = decisionValues.length - 1; i >= 0; i--) {
                if (decisionValues[i]) {
                    rawValues = decisionValues[i];
                    break;
                }
            }
        }
    } else {
        // Fall back to final decision values
        rawValues = data.decision_values;
    }

    // Decode if needed
    if (data.encoded && rawValues && typeof rawValues.b64 === 'string') {
        return decodeFloats(rawValues);
    }

    // Handle constant value special case (rare)
    if (data.encoded && rawValues && rawValues.const) {
        const gridSize = data.grid_size || 50;
        const val = (rawValues.min + rawValues.max) / 2;
        return new Float32Array(gridSize * gridSize).fill(val);
    }

    return rawValues || [];
}

// Animated boundary drawing with progressive reveal
function drawAnimatedBoundary(ctx, boundary, bounds, w, h, padding, gridSize, progress) {
    // Upsample to higher resolution for smoother boundaries
    const highRes = BOUNDARY_RESOLUTION;
    const grid = upsampleBoundary(boundary, gridSize, highRes);

    const cellW = (w - 2 * padding) / highRes;
    const cellH = (h - 2 * padding) / highRes;

    // Draw filled regions - CONSTANT alpha so boundary SHAPE changes are visible
    // The boundary itself changes between stages, not the opacity
    ctx.globalAlpha = 0.35;

    for (let j = 0; j < highRes; j++) {
        for (let i = 0; i < highRes; i++) {
            if (grid[j][i] !== null) {
                ctx.fillStyle = grid[j][i] === 0 ? colors.class0 : colors.class1;
                ctx.fillRect(padding + i * cellW, padding + j * cellH, cellW + 0.5, cellH + 0.5);
            }
        }
    }
    ctx.globalAlpha = 1;

    // Draw smooth contour - always visible so shape changes are clear
    drawSmoothContour(ctx, grid, highRes, w, h, padding, 1.0);
}

// Upsample boundary grid to higher resolution using bilinear interpolation
function upsampleBoundary(boundary, originalSize, targetSize) {
    // First, reconstruct original grid
    const origGrid = Array(originalSize).fill(null).map(() => Array(originalSize).fill(null));

    // Check if we have coordinate objects (legacy/sparse format) or flat values (grid/bitmap)
    const isCoordinateList = boundary.length > 0 && typeof boundary[0] === 'object' && 'x' in boundary[0];

    if (!isCoordinateList) {
        for (let j = 0; j < originalSize; j++) {
            for (let i = 0; i < originalSize; i++) {
                const idx = j * originalSize + i;
                if (idx < boundary.length) {
                    origGrid[originalSize - 1 - j][i] = boundary[idx];
                }
            }
        }
    } else {
        boundary.forEach(p => {
            const i = Math.round(((p.x - bounds.x_min) / (bounds.x_max - bounds.x_min)) * (originalSize - 1));
            const j = Math.round(((p.y - bounds.y_min) / (bounds.y_max - bounds.y_min)) * (originalSize - 1));
            if (i >= 0 && i < originalSize && j >= 0 && j < originalSize) {
                origGrid[originalSize - 1 - j][i] = p.z;
            }
        });
    }

    // Upsample using BILINEAR interpolation for smoother boundaries
    const scale = (originalSize - 1) / (targetSize - 1);
    const newGrid = Array(targetSize).fill(null).map(() => Array(targetSize).fill(null));

    for (let j = 0; j < targetSize; j++) {
        for (let i = 0; i < targetSize; i++) {
            const srcI = i * scale;
            const srcJ = j * scale;

            const i0 = Math.floor(srcI);
            const j0 = Math.floor(srcJ);
            const i1 = Math.min(i0 + 1, originalSize - 1);
            const j1 = Math.min(j0 + 1, originalSize - 1);

            const ti = srcI - i0;
            const tj = srcJ - j0;

            // Get 4 corner values
            const v00 = origGrid[j0] && origGrid[j0][i0] !== null ? origGrid[j0][i0] : 0;
            const v10 = origGrid[j0] && origGrid[j0][i1] !== null ? origGrid[j0][i1] : 0;
            const v01 = origGrid[j1] && origGrid[j1][i0] !== null ? origGrid[j1][i0] : 0;
            const v11 = origGrid[j1] && origGrid[j1][i1] !== null ? origGrid[j1][i1] : 0;

            // Bilinear interpolation - result > 0.5 means class 1
            const interpolated = (1 - tj) * ((1 - ti) * v00 + ti * v10) + tj * ((1 - ti) * v01 + ti * v11);
            newGrid[j][i] = interpolated >= 0.5 ? 1 : 0;
        }
    }

    return newGrid;
}

// Draw smooth contour lines using marching squares with interpolation
function drawSmoothContour(ctx, grid, gridSize, w, h, padding, progress) {
    const cellW = (w - 2 * padding) / gridSize;
    const cellH = (h - 2 * padding) / gridSize;

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2.5 * progress;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = progress;

    // Collect all contour segments
    const segments = [];

    for (let j = 0; j < gridSize - 1; j++) {
        for (let i = 0; i < gridSize - 1; i++) {
            const tl = grid[j][i], tr = grid[j][i + 1];
            const bl = grid[j + 1][i], br = grid[j + 1][i + 1];

            if (tl === null || tr === null || bl === null || br === null) continue;

            // Marching squares case detection
            const config = (tl === 1 ? 8 : 0) | (tr === 1 ? 4 : 0) | (br === 1 ? 2 : 0) | (bl === 1 ? 1 : 0);

            if (config === 0 || config === 15) continue;

            const x0 = padding + i * cellW;
            const y0 = padding + j * cellH;
            const x1 = x0 + cellW;
            const y1 = y0 + cellH;
            const midX = (x0 + x1) / 2;
            const midY = (y0 + y1) / 2;

            // Linear interpolation for smooth edge positions
            // For binary classification, we treat 0 as -1 and 1 as +1, interpolating to find the 0.5 threshold
            const v_tl = tl === 1 ? 1 : 0;
            const v_tr = tr === 1 ? 1 : 0;
            const v_bl = bl === 1 ? 1 : 0;
            const v_br = br === 1 ? 1 : 0;

            // Interpolate positions along edges where the boundary crosses (at 0.5)
            const threshold = 0.5;

            // Top edge: interpolate between tl and tr
            const topT = Math.abs(v_tr - v_tl) > 0.001 ? (threshold - v_tl) / (v_tr - v_tl) : 0.5;
            const top = { x: x0 + topT * cellW, y: y0 };

            // Bottom edge: interpolate between bl and br
            const bottomT = Math.abs(v_br - v_bl) > 0.001 ? (threshold - v_bl) / (v_br - v_bl) : 0.5;
            const bottom = { x: x0 + bottomT * cellW, y: y1 };

            // Left edge: interpolate between tl and bl
            const leftT = Math.abs(v_bl - v_tl) > 0.001 ? (threshold - v_tl) / (v_bl - v_tl) : 0.5;
            const left = { x: x0, y: y0 + leftT * cellH };

            // Right edge: interpolate between tr and br
            const rightT = Math.abs(v_br - v_tr) > 0.001 ? (threshold - v_tr) / (v_br - v_tr) : 0.5;
            const right = { x: x1, y: y0 + rightT * cellH };

            // Add segments based on marching squares configuration
            switch (config) {
                case 1: case 14: segments.push([left, bottom]); break;
                case 2: case 13: segments.push([bottom, right]); break;
                case 3: case 12: segments.push([left, right]); break;
                case 4: case 11: segments.push([top, right]); break;
                case 5: segments.push([left, top], [bottom, right]); break;
                case 6: case 9: segments.push([top, bottom]); break;
                case 7: case 8: segments.push([left, top]); break;
                case 10: segments.push([top, right], [left, bottom]); break;
            }
        }
    }

    // Draw segments with smooth curves
    segments.forEach(seg => {
        if (seg.length === 2) {
            ctx.beginPath();
            ctx.moveTo(seg[0].x, seg[0].y);
            ctx.lineTo(seg[1].x, seg[1].y);
            ctx.stroke();
        }
    });

    ctx.globalAlpha = 1;
}

function updateMetricsForKernel(kernel) {
    const data = kernel === 'linear' ? state.moons.linearData : state.moons.rbfData;
    const elementId = kernel === 'linear' ? 'moonsLinearMetrics' : 'moonsRbfMetrics';
    const metrics = calculateMetrics(
        data.test_points.map(p => getPoint(p).class),
        data.test_points.map(p => getPoint(p).predicted), 2
    );
    updateMetrics(elementId, metrics, data.metrics.n_support_vectors);
}

function calculateMetrics(trueLabels, predictions, numClasses) {
    const tp = Array(numClasses).fill(0), fp = Array(numClasses).fill(0), fn = Array(numClasses).fill(0);
    for (let i = 0; i < trueLabels.length; i++) {
        const t = trueLabels[i], p = predictions[i];
        if (t === p) tp[t]++; else { fp[p]++; fn[t]++; }
    }
    let totalPrecision = 0, totalRecall = 0, totalF1 = 0, validClasses = 0;
    for (let i = 0; i < numClasses; i++) {
        const precision = (tp[i] + fp[i]) > 0 ? tp[i] / (tp[i] + fp[i]) : 0;
        const recall = (tp[i] + fn[i]) > 0 ? tp[i] / (tp[i] + fn[i]) : 0;
        const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
        if ((tp[i] + fp[i] + fn[i]) > 0) { totalPrecision += precision; totalRecall += recall; totalF1 += f1; validClasses++; }
    }
    const accuracy = trueLabels.reduce((acc, val, idx) => acc + (val === predictions[idx] ? 1 : 0), 0) / trueLabels.length;
    return { accuracy, precision: validClasses > 0 ? totalPrecision / validClasses : 0, recall: validClasses > 0 ? totalRecall / validClasses : 0, f1: validClasses > 0 ? totalF1 / validClasses : 0, testCount: trueLabels.length };
}

function getPoint(p) { return Array.isArray(p) ? { x: p[0], y: p[1], class: p[2], predicted: p[3] } : p; }
function getSV(sv) { return Array.isArray(sv) ? { x: sv[0], y: sv[1], class: sv[2] } : sv; }

function renderMoonsPlots() {
    drawMoonsPlot(document.getElementById('moonsLinearCanvas'), state.moons.linearData);
    drawMoonsPlot(document.getElementById('moonsRbfCanvas'), state.moons.rbfData);
    ['linear', 'rbf'].forEach(k => updateMetricsForKernel(k));
}

function drawMoonsPlot(canvas, data) {
    try {
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const bounds = data.grid_bounds;
        const padding = 30;
        const toCanvasX = (x) => padding + (x - bounds.x_min) * ((w - 2 * padding) / (bounds.x_max - bounds.x_min));
        const toCanvasY = (y) => h - padding - (y - bounds.y_min) * ((h - 2 * padding) / (bounds.y_max - bounds.y_min));

        // Check if all visibility toggles are OFF
        const allHidden = Object.values(state.visibility).every(v => v === false);

        if (allHidden) {
            // Display message when all buttons are OFF
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Please turn ON all points', w / 2, h / 2 - 10);

            ctx.font = '16px Arial, sans-serif';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('Click legend buttons to show data', w / 2, h / 2 + 20);

            // Draw border
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1;
            ctx.strokeRect(padding, padding, w - 2 * padding, h - 2 * padding);
            return;
        }

        // Use helper to get the final (completed) boundary
        const finalBoundary = getBoundaryAtProgress(data, 1.0);

        // Draw boundary at full progress
        drawAnimatedBoundary(ctx, finalBoundary, bounds, w, h, padding, data.grid_size || 50, 1.0);

        // Draw test points (check visibility)
        if (state.visibility['test-correct'] || state.visibility['test-wrong']) {
            data.test_points.forEach(pt => {
                const p = getPoint(pt);
                const isCorrect = p.class === p.predicted;

                // Skip if this type is hidden
                if (isCorrect && !state.visibility['test-correct']) return;
                if (!isCorrect && !state.visibility['test-wrong']) return;

                ctx.fillStyle = isCorrect ? colors.testCorrect : colors.testWrong;
                ctx.globalAlpha = 0.9;
                ctx.beginPath();
                ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
        }

        // Draw support vectors (check visibility)
        if (state.visibility['support-vectors']) {
            data.support_vectors.forEach(svArr => {
                const sv = getSV(svArr);
                ctx.strokeStyle = colors.support;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(toCanvasX(sv.x), toCanvasY(sv.y), 7, 0, Math.PI * 2);
                ctx.stroke();
            });
        }

        // Draw train points (check visibility by class)
        data.train_points.forEach(pt => {
            const p = getPoint(pt);

            // Skip if this class is hidden
            if (p.class === 0 && !state.visibility['train-class0']) return;
            if (p.class === 1 && !state.visibility['train-class1']) return;

            ctx.fillStyle = p.class === 0 ? colors.class0 : colors.class1;
            ctx.beginPath();
            ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });

        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding, padding, w - 2 * padding, h - 2 * padding);
    } catch (e) {
        console.error('Error drawing plot:', e);
    }
}

function updateMetrics(elementId, metrics, nSupportVectors) {
    document.getElementById(elementId).innerHTML = `
        <h4><strong>Performance Metrics</strong></h4>
        <div class="metric-item"><span class="metric-label">Test Samples</span><span class="metric-value">${metrics.testCount}</span></div>
        <div class="metric-item" style="border-bottom: 3px solid #e3f2fd;"><span class="metric-label">Support Vectors</span><span class="metric-value">${nSupportVectors}</span></div>
        <div class="metric-item"><span class="metric-label">Accuracy</span><span class="metric-value">${(metrics.accuracy * 100).toFixed(1)}%</span></div>
        <div class="metric-item"><span class="metric-label">Precision</span><span class="metric-value">${(metrics.precision * 100).toFixed(1)}%</span></div>
        <div class="metric-item"><span class="metric-label">Recall</span><span class="metric-value">${(metrics.recall * 100).toFixed(1)}%</span></div>
        <div class="metric-item"><span class="metric-label">F1 Score</span><span class="metric-value">${(metrics.f1 * 100).toFixed(1)}%</span></div>`;
}

// 3D Hyperplane Visualization
let hyperplaneRotation = { x: 0.5, y: 0.3 };
let isDragging = false, lastMouse = { x: 0, y: 0 };
let isAnimating = false, animationId = null;
let isFormationAnimating = false; // Track formation animation state
let currentHyperplaneData = null, currentHyperplaneKernel = null;

function showHyperplane(kernel) {
    const modal = document.getElementById('hyperplaneModal');
    const descEl = document.getElementById('modalDescription');
    const gammaGroup = document.getElementById('modalGammaGroup');

    modal.classList.remove('hidden');
    currentHyperplaneKernel = kernel;
    syncModalControls();

    if (kernel === 'linear-moons') {
        currentHyperplaneData = state.moons.linearData;
        document.getElementById('modalTitle').innerHTML = '<strong>3D Hyperplane - Linear Kernel</strong>';
        descEl.textContent = kernelDescriptions.linear;
        descEl.className = 'modal-description linear';
        gammaGroup.style.display = 'none';
        // Hide formation button for linear (no progressive animation)
        document.getElementById('modal3DFormation').style.display = 'none';
    } else {
        currentHyperplaneData = state.moons.rbfData;
        document.getElementById('modalTitle').innerHTML = '<strong>3D Hyperplane - RBF Kernel</strong>';
        descEl.textContent = kernelDescriptions.rbf;
        descEl.className = 'modal-description rbf';
        gammaGroup.style.display = 'block';
        // Show formation button for RBF
        document.getElementById('modal3DFormation').style.display = 'inline-block';
    }

    hyperplaneRotation = { x: 0.5, y: 0.3 };
    setupHyperplaneControls();

    // Only render static view - formation happens on button click
    renderHyperplane();
}

function startModal3DFormation() {
    if (!currentHyperplaneData || isFormationAnimating) return;
    const data = currentHyperplaneData;
    const btn = document.getElementById('modal3DFormation');
    btn.disabled = true;
    isFormationAnimating = true; // Disable drag during formation

    // Set side/edge view (plane as line, height visible) for formation animation
    hyperplaneRotation = { x: 1.5, y: 0.3 };

    // Use the same stages as 2D animation
    const stages = data.progress_stages || [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];
    let stageIndex = 0;
    const delay = 400; // Same as 2D animation

    function animate() {
        const progress = stages[stageIndex];
        const sampleCount = Math.floor(data.train_points.length * progress);

        renderPartialHyperplane(sampleCount, progress);

        if (stageIndex < stages.length - 1) {
            stageIndex++;
            setTimeout(animate, delay);
        } else {
            btn.disabled = false;
            isFormationAnimating = false; // Re-enable drag after formation
        }
    }
    animate();
}

function renderPartialHyperplane(sampleCount, progress) {
    if (!currentHyperplaneData) return;
    const data = currentHyperplaneData;
    const canvas = document.getElementById('hyperplaneCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Check for all hidden state
    const allHidden = Object.values(state.visibility).every(v => v === false);
    if (allHidden) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#1a1a2e');
        bgGrad.addColorStop(1, '#16213e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Please turn ON all points', w / 2, h / 2 - 10);

        ctx.font = '16px Arial, sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Click legend buttons to show data', w / 2, h / 2 + 20);
        return;
    }

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const bounds = data.grid_bounds;
    // Use progressive decision values for animation!
    const decisionValues = getDecisionValuesAtProgress(data, progress);
    if (!decisionValues || decisionValues.length === 0) {
        drawAxes3D(ctx, w, h);
        return;
    }
    const xRange = bounds.x_max - bounds.x_min;
    const yRange = bounds.y_max - bounds.y_min;
    const minDV = Math.min(...decisionValues);
    const maxDV = Math.max(...decisionValues);
    const dvRange = maxDV - minDV || 1;
    const gridSize = data.grid_size || 50;
    const step = Math.max(2, Math.floor(gridSize / 20));

    // Height multiplier: starts at 0 (flat) and inflates to 0.5 with progress
    const heightScale = 0.5 * progress;

    // Draw surface mesh
    ctx.globalAlpha = 0.6;
    for (let j = 0; j < gridSize - step; j += step) {
        for (let i = 0; i < gridSize - step; i += step) {
            const idx1 = j * gridSize + i, idx4 = (j + step) * gridSize + (i + step);
            if (idx4 >= decisionValues.length) continue;

            const x1 = ((i / (gridSize - 1)) * xRange + bounds.x_min - (bounds.x_min + xRange / 2)) / (xRange / 2);
            const y1 = ((j / (gridSize - 1)) * yRange + bounds.y_min - (bounds.y_min + yRange / 2)) / (yRange / 2);
            const x2 = (((i + step) / (gridSize - 1)) * xRange + bounds.x_min - (bounds.x_min + xRange / 2)) / (xRange / 2);
            const y2 = (((j + step) / (gridSize - 1)) * yRange + bounds.y_min - (bounds.y_min + yRange / 2)) / (yRange / 2);

            const z1 = (decisionValues[idx1] - minDV) / dvRange * 2 - 1;
            const z2 = (decisionValues[j * gridSize + (i + step)] - minDV) / dvRange * 2 - 1;
            const z3 = (decisionValues[(j + step) * gridSize + i] - minDV) / dvRange * 2 - 1;
            const z4 = (decisionValues[idx4] - minDV) / dvRange * 2 - 1;

            // Height scales from 0 (flat) to full height based on progress
            const p1 = project3D({ x: x1, y: y1, z: z1 * heightScale }, w, h);
            const p2 = project3D({ x: x2, y: y1, z: z2 * heightScale }, w, h);
            const p3 = project3D({ x: x1, y: y2, z: z3 * heightScale }, w, h);
            const p4 = project3D({ x: x2, y: y2, z: z4 * heightScale }, w, h);

            const avgZ = (z1 + z2 + z3 + z4) / 4;
            ctx.fillStyle = avgZ > 0 ? `rgba(255, 127, 14, ${0.3 + avgZ * 0.3})` : `rgba(31, 119, 180, ${0.3 - avgZ * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // Draw decision boundary line with progressive alpha
    if (progress > 0.2) {
        ctx.strokeStyle = '#88daeeff';
        ctx.lineWidth = 3 * progress;
        ctx.globalAlpha = progress;
        for (let j = 0; j < gridSize - 1; j++) {
            for (let i = 0; i < gridSize - 1; i++) {
                const v1 = decisionValues[j * gridSize + i];
                const v2 = decisionValues[j * gridSize + (i + 1)];
                if ((v1 > 0 && v2 < 0) || (v1 < 0 && v2 > 0)) {
                    const x1n = ((i / (gridSize - 1)) * xRange + bounds.x_min - (bounds.x_min + xRange / 2)) / (xRange / 2);
                    const x2n = (((i + 1) / (gridSize - 1)) * xRange + bounds.x_min - (bounds.x_min + xRange / 2)) / (xRange / 2);
                    const yn = ((j / (gridSize - 1)) * yRange + bounds.y_min - (bounds.y_min + yRange / 2)) / (yRange / 2);
                    const t = Math.abs(v1) / (Math.abs(v1) + Math.abs(v2));
                    const xCross = x1n + t * (x2n - x1n);
                    const p = project3D({ x: xCross, y: yn, z: 0 }, w, h);
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    drawAxes3D(ctx, w, h);

    // Draw partial points
    const ratio = sampleCount / data.train_points.length;

    data.train_points.slice(0, sampleCount).forEach(pt => {
        const p = getPoint(pt);

        // Skip if this class is hidden
        if (p.class === 0 && !state.visibility['train-class0']) return;
        if (p.class === 1 && !state.visibility['train-class1']) return;

        const nx = (p.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
        const ny = (p.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
        const gridI = Math.floor((p.x - bounds.x_min) / xRange * (gridSize - 1));
        const gridJ = Math.floor((p.y - bounds.y_min) / yRange * (gridSize - 1));
        const idx = Math.min(gridJ * gridSize + gridI, decisionValues.length - 1);
        // Points inflate with surface using heightScale
        const z = ((decisionValues[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * heightScale;
        const projected = project3D({ x: nx, y: ny, z }, w, h);

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(projected.x + 2, projected.y + 2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.class === 0 ? colors.class0 : colors.class1;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // Check if any test points are visible
    if (state.visibility['test-correct'] || state.visibility['test-wrong']) {
        const testCount = Math.floor(data.test_points.length * ratio);
        data.test_points.slice(0, testCount).forEach(pt => {
            const p = getPoint(pt);
            const isCorrect = p.class === p.predicted;

            // Skip if this type is hidden
            if (isCorrect && !state.visibility['test-correct']) return;
            if (!isCorrect && !state.visibility['test-wrong']) return;

            const nx = (p.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
            const ny = (p.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
            const gridI = Math.floor((p.x - bounds.x_min) / xRange * (gridSize - 1));
            const gridJ = Math.floor((p.y - bounds.y_min) / yRange * (gridSize - 1));
            const idx = Math.min(gridJ * gridSize + gridI, decisionValues.length - 1);
            // Test points inflate with surface using heightScale
            const z = ((decisionValues[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * heightScale;
            const projected = project3D({ x: nx, y: ny, z }, w, h);

            ctx.globalAlpha = 0.7;
            ctx.fillStyle = p.class === p.predicted ? colors.testCorrect : colors.testWrong;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    // Draw support vectors - only for points that are already visible
    if (state.visibility['support-vectors']) {
        const visibleTrainPoints3D = data.train_points.slice(0, sampleCount);
        data.support_vectors.forEach(svArr => {
            const sv = getSV(svArr);
            // Check if this support vector matches a visible train point
            // Note: visibleTrainPoints3D includes hidden-by-toggle points too, but we draw SV only if SV toggle is ON
            // We should arguably also check if the underlying train point is toggle-visible? 
            // The requirement says "how points disappear and appear", usually SVs are independent layer.
            // Let's stick to just checking SV toggle.

            const isVisible = visibleTrainPoints3D.some(pt => {
                const p = getPoint(pt);
                return Math.abs(p.x - sv.x) < 0.001 && Math.abs(p.y - sv.y) < 0.001;
            });
            if (!isVisible) return;

            const nx = (sv.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
            const ny = (sv.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
            const gridI = Math.floor((sv.x - bounds.x_min) / xRange * (gridSize - 1));
            const gridJ = Math.floor((sv.y - bounds.y_min) / yRange * (gridSize - 1));
            const idx = Math.min(gridJ * gridSize + gridI, decisionValues.length - 1);
            // Support vectors inflate with surface using heightScale
            const z = ((decisionValues[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * heightScale;
            const projected = project3D({ x: nx, y: ny, z }, w, h);

            ctx.strokeStyle = colors.support;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, 8, 0, Math.PI * 2);
            ctx.stroke();
        });
    }
}

function animate3D() {
    if (!isAnimating) return;
    hyperplaneRotation.y += 0.015;
    renderHyperplane();
    animationId = requestAnimationFrame(animate3D);
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    document.getElementById('toggleAnimation').textContent = isAnimating ? 'Stop Animation' : 'Start Animation';
    if (isAnimating) animate3D();
    else if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
}

function renderHyperplane() {
    if (!currentHyperplaneData) return;
    renderPartialHyperplane(currentHyperplaneData.train_points.length, 1.0);
}

function project3D(point, w, h) {
    const { x, y, z } = point;
    const scale = Math.min(w, h) / 3.5;
    const cosX = Math.cos(hyperplaneRotation.x), sinX = Math.sin(hyperplaneRotation.x);
    const cosY = Math.cos(hyperplaneRotation.y), sinY = Math.sin(hyperplaneRotation.y);
    let y1 = y * cosX - z * sinX;
    let z1 = y * sinX + z * cosX;
    let x2 = x * cosY + z1 * sinY;
    return { x: w / 2 + x2 * scale, y: h / 2 - y1 * scale };
}

function drawAxes3D(ctx, w, h) {
    const o = project3D({ x: 0, y: 0, z: 0 }, w, h);
    const xP = project3D({ x: 1.5, y: 0, z: 0 }, w, h);
    const yP = project3D({ x: 0, y: 1.5, z: 0 }, w, h);
    const zP = project3D({ x: 0, y: 0, z: 1 }, w, h);

    ctx.lineWidth = 3;
    ctx.font = 'bold 14px Consolas, monospace';

    ctx.strokeStyle = '#dfd1d1ff';
    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(xP.x, xP.y); ctx.stroke();
    ctx.fillStyle = '#dfd1d1ff'; ctx.fillText('X', xP.x + 10, xP.y);

    ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(yP.x, yP.y); ctx.stroke();
    ctx.fillText('Y', yP.x + 10, yP.y);

    // Hide Z-axis for linear kernel (flat hyperplane has no height variation)
    if (currentHyperplaneKernel !== 'linear-moons') {
        ctx.strokeStyle = '#fce874ff';
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(zP.x, zP.y); ctx.stroke();
        ctx.fillStyle = '#fce874ff'; ctx.fillText('Decision', zP.x + 10, zP.y);
    }
}

function setupHyperplaneControls() {
    const canvas = document.getElementById('hyperplaneCanvas');
    canvas.onmousedown = (e) => { if (!isAnimating && !isFormationAnimating) { isDragging = true; lastMouse = { x: e.clientX, y: e.clientY }; } };
    canvas.onmousemove = (e) => {
        if (!isDragging || isAnimating || isFormationAnimating) return;
        hyperplaneRotation.y += (e.clientX - lastMouse.x) * 0.01;
        hyperplaneRotation.x += (e.clientY - lastMouse.y) * 0.01;
        lastMouse = { x: e.clientX, y: e.clientY };
        renderHyperplane();
    };
    canvas.onmouseup = () => isDragging = false;
    canvas.onmouseleave = () => isDragging = false;
}

function resetHyperplaneView() {
    hyperplaneRotation = { x: 0.5, y: 0.3 };
    renderHyperplane();
}

function closeModal() {
    document.getElementById('hyperplaneModal').classList.add('hidden');
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    isAnimating = false;
    document.getElementById('toggleAnimation').textContent = 'Start Animation';
    currentHyperplaneKernel = null;
}