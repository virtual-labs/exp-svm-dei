/**
 * SVM Animation Module - Complete Port from SVM-final
 * Includes: Formation animation, Interactive legend, Modal config, 3D formation
 */
const SVMAnimation = {
    state: {
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
            firstLoad: true
        },
        visibility: {
            'train-class0': true,
            'train-class1': true,
            'test-correct': true,
            'test-wrong': true,
            'support-vectors': true
        }
    },

    colors: {
        class0: '#1f77b4',
        class1: '#ff7f0e',
        support: '#9c27b0',
        testCorrect: '#4caf50',
        testWrong: '#f44336'
    },

    kernelDescriptions: {
        linear: "In the Linear kernel approach, a hyperplane is constructed in the original feature space to maximally separate the two classes. The decision boundary is a straight line (in 2D) or a flat surface (in higher dimensions). Support vectors are the data points lying closest to the decision boundary that define the optimal separating hyperplane.",
        rbf: "In the RBF kernel approach, input data points are implicitly projected into a higher-dimensional feature space via the radial basis function transformation. Within this augmented space, a hyperplane is constructed such that it maximally separates the two classes. The data points lying on the margin boundaries, termed support vectors, define the optimal decision surface."
    },

    BOUNDARY_RESOLUTION: 400,

    hyperplaneRotation: { x: 0.5, y: 0.3 },
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    isAnimating: false,
    isFormationAnimating: false,
    animationId: null,
    currentHyperplaneData: null,
    currentHyperplaneKernel: null,

    show() {
        const container = document.getElementById('svm-animation-container');
        if (container) {
            container.style.display = 'block';
            this.init();
        }
    },

    hide() {
        const container = document.getElementById('svm-animation-container');
        if (container) {
            container.style.display = 'none';
            this.closeModal();
        }
    },

    init() {
        if (typeof SVM_PLOT_DATA === 'undefined') {
            console.error('SVM_PLOT_DATA not found.');
            return;
        }

        this.state.moons.metadata = SVM_PLOT_DATA.metadata;
        document.getElementById('moonsDescription').textContent = this.state.moons.metadata.description;
        
        this.updateOverview();
        this.setupEventListeners();
        this.loadMoonsData();

        const mainApp = document.getElementById('svmMainApp');
        if (mainApp) mainApp.classList.remove('hidden');

        if (this.state.formation.firstLoad) {
            this.state.formation.firstLoad = false;
            setTimeout(() => {
                this.startFormationAnimation('linear');
                this.startFormationAnimation('rbf');
            }, 300);
        }
    },

    updateOverview() {
        const trainSamples = Math.floor(this.state.moons.samples * 0.8);
        const testSamples = this.state.moons.samples - trainSamples;

        const overview = document.getElementById('overviewDetails');
        if (overview) {
            overview.innerHTML = `
                <table class="overview-table">
                    <tr><th>Dataset</th><td>Two Moons</td></tr>
                    <tr><th>Total Samples</th><td>${this.state.moons.samples}</td></tr>
                    <tr><th>Train (80%)</th><td>${trainSamples}</td></tr>
                    <tr><th>Test (20%)</th><td>${testSamples}</td></tr>
                </table>
            `;
        }
        const stats = document.getElementById('moonsStats');
        if (stats) stats.innerHTML = '';
    },

    setupEventListeners() {
        const self = this;
        const container = '#svm-animation-container';

        const backBtn = document.querySelector(`${container} .back-to-exp-btn`);
        if (backBtn) backBtn.onclick = () => self.hide();

        document.querySelectorAll(`${container} .legend-btn`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                const trainingGroup = ['train-class0', 'train-class1', 'support-vectors'];
                const testGroup = ['test-correct', 'test-wrong'];

                let group = null;
                if (trainingGroup.includes(type)) group = trainingGroup;
                else if (testGroup.includes(type)) group = testGroup;

                if (group) {
                    const newState = !self.state.visibility[type];
                    group.forEach(groupType => {
                        self.state.visibility[groupType] = newState;
                        const groupBtn = document.querySelector(`${container} .legend-btn[data-type="${groupType}"]`);
                        if (groupBtn) groupBtn.classList.toggle('active', newState);
                    });
                }

                self.updateFormationButtonsState();
                self.renderMoonsPlots();
            });
        });

        document.querySelectorAll(`${container} #samplesButtons .toggle-btn`).forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll(`${container} #samplesButtons .toggle-btn`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                self.state.moons.samples = parseInt(e.target.dataset.samples);
                self.syncModalControls();
                self.updateOverview();
                self.loadMoonsData();
            };
        });

        document.querySelectorAll(`${container} #noiseButtons .toggle-btn`).forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll(`${container} #noiseButtons .toggle-btn`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                self.state.moons.noise = parseFloat(e.target.dataset.noise);
                self.syncModalControls();
                self.updateOverview();
                self.loadMoonsData();
            };
        });

        document.querySelectorAll(`${container} #gammaButtons .toggle-btn`).forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll(`${container} #gammaButtons .toggle-btn`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                self.state.moons.gamma = parseFloat(e.target.dataset.gamma);
                self.syncModalControls();
                self.loadMoonsData();
            };
        });

        this.setupModalConfigListeners();

        document.querySelectorAll(`${container} .formation-btn[data-kernel]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                self.startFormationAnimation(e.target.dataset.kernel);
            });
        });

        const modal3DBtn = document.getElementById('modal3DFormation');
        if (modal3DBtn) {
            modal3DBtn.addEventListener('click', () => {
                if (self.currentHyperplaneKernel) self.startModal3DFormation();
            });
        }

        document.querySelectorAll(`${container} .hyperplane-btn`).forEach(btn => {
            btn.onclick = (e) => self.showHyperplane(e.target.dataset.kernel);
        });

        const closeModal = document.getElementById('closeModal');
        if (closeModal) closeModal.onclick = () => self.closeModal();

        const modal = document.getElementById('hyperplaneModal');
        if (modal) modal.onclick = (e) => { if (e.target.id === 'hyperplaneModal') self.closeModal(); };

        const resetView = document.getElementById('resetView');
        if (resetView) resetView.onclick = () => self.resetHyperplaneView();

        const toggleAnim = document.getElementById('toggleAnimation');
        if (toggleAnim) toggleAnim.onclick = () => self.toggleAnimation();
    },

    setupModalConfigListeners() {
        const self = this;
        const container = '#svm-animation-container';

        document.querySelectorAll(`${container} #modalSamplesButtons .toggle-btn`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll(`${container} #modalSamplesButtons .toggle-btn`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                self.state.moons.samples = parseInt(e.target.dataset.samples);
                self.syncSidebarControls();
                self.updateOverview();
                self.loadMoonsDataAndUpdate3D();
            });
        });

        document.querySelectorAll(`${container} #modalNoiseButtons .toggle-btn`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll(`${container} #modalNoiseButtons .toggle-btn`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                self.state.moons.noise = parseFloat(e.target.dataset.noise);
                self.syncSidebarControls();
                self.updateOverview();
                self.loadMoonsDataAndUpdate3D();
            });
        });

        document.querySelectorAll(`${container} #modalGammaButtons .toggle-btn`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll(`${container} #modalGammaButtons .toggle-btn`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                self.state.moons.gamma = parseFloat(e.target.dataset.gamma);
                self.syncSidebarControls();
                self.loadMoonsDataAndUpdate3D();
            });
        });
    },

    syncModalControls() {
        const container = '#svm-animation-container';
        document.querySelectorAll(`${container} #modalSamplesButtons .toggle-btn`).forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.samples) === this.state.moons.samples);
        });
        document.querySelectorAll(`${container} #modalNoiseButtons .toggle-btn`).forEach(b => {
            b.classList.toggle('active', parseFloat(b.dataset.noise) === this.state.moons.noise);
        });
        document.querySelectorAll(`${container} #modalGammaButtons .toggle-btn`).forEach(b => {
            b.classList.toggle('active', parseFloat(b.dataset.gamma) === this.state.moons.gamma);
        });
    },

    syncSidebarControls() {
        const container = '#svm-animation-container';
        document.querySelectorAll(`${container} #samplesButtons .toggle-btn`).forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.samples) === this.state.moons.samples);
        });
        document.querySelectorAll(`${container} #noiseButtons .toggle-btn`).forEach(b => {
            b.classList.toggle('active', parseFloat(b.dataset.noise) === this.state.moons.noise);
        });
        document.querySelectorAll(`${container} #gammaButtons .toggle-btn`).forEach(b => {
            b.classList.toggle('active', parseFloat(b.dataset.gamma) === this.state.moons.gamma);
        });
    },

    updateFormationButtonsState() {
        const container = '#svm-animation-container';
        const allVisible = Object.values(this.state.visibility).every(v => v === true);
        const allHidden = Object.values(this.state.visibility).every(v => v === false);

        document.querySelectorAll(`${container} .formation-btn[data-kernel]`).forEach(btn => {
            btn.disabled = !allVisible;
            btn.title = !allVisible ? 'Enable all legend items to use formation animation' : '';
        });

        const modalFormationBtn = document.getElementById('modal3DFormation');
        if (modalFormationBtn) {
            modalFormationBtn.disabled = !allVisible;
            modalFormationBtn.title = !allVisible ? 'Enable all legend items to use formation animation' : '';
        }

        document.querySelectorAll(`${container} .hyperplane-btn`).forEach(btn => {
            btn.disabled = allHidden;
            btn.title = allHidden ? 'Enable legend items to view 3D' : '';
        });

        const configButtons = [
            ...document.querySelectorAll(`${container} #samplesButtons .toggle-btn`),
            ...document.querySelectorAll(`${container} #noiseButtons .toggle-btn`),
            ...document.querySelectorAll(`${container} #gammaButtons .toggle-btn`)
        ];
        configButtons.forEach(btn => { btn.disabled = allHidden; });
    },

    loadMoonsDataAndUpdate3D() {
        this.loadMoonsData();
        if (this.currentHyperplaneKernel) {
            this.currentHyperplaneData = this.currentHyperplaneKernel.includes('linear') 
                ? this.state.moons.linearData 
                : this.state.moons.rbfData;
            this.renderHyperplane();
        }
    },

    loadMoonsData() {
        const { samples, noise, gamma } = this.state.moons;
        const configKey = `${samples}_${noise}`;

        this.state.moons.linearData = SVM_PLOT_DATA.moons.linear[configKey];
        this.state.moons.rbfData = SVM_PLOT_DATA.moons.rbf[gamma][configKey];

        this.renderMoonsPlots();
    },

    startFormationAnimation(kernel) {
        const canvas = kernel === 'linear' ? document.getElementById('moonsLinearCanvas') : document.getElementById('moonsRbfCanvas');
        const data = kernel === 'linear' ? this.state.moons.linearData : this.state.moons.rbfData;
        const btn = document.querySelector(`.formation-btn[data-kernel="${kernel}"]`);

        if (!data) return;
        if (btn) btn.disabled = true;

        const stages = data.progress_stages || [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];
        let stageIndex = 0;
        const delay = 400;
        const self = this;

        function animate() {
            const progress = stages[stageIndex];
            const sampleCount = Math.floor(data.train_points.length * progress);

            self.renderPartialPlot(canvas, data, sampleCount, progress);

            if (stageIndex < stages.length - 1) {
                stageIndex++;
                setTimeout(animate, delay);
            } else {
                if (btn) btn.disabled = false;
                self.updateMetricsForKernel(kernel);
            }
        }
        animate();
    },

    renderPartialPlot(canvas, data, sampleCount, progress) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const bounds = data.grid_bounds;
        const padding = 30;
        const scaleX = (w - 2 * padding) / (bounds.x_max - bounds.x_min);
        const scaleY = (h - 2 * padding) / (bounds.y_max - bounds.y_min);
        const toCanvasX = (x) => padding + (x - bounds.x_min) * scaleX;
        const toCanvasY = (y) => h - padding - (y - bounds.y_min) * scaleY;

        const gridSize = data.grid_size || 50;
        const boundary = this.getBoundaryAtProgress(data, progress);

        if (boundary && boundary.length > 0) {
            this.drawAnimatedBoundary(ctx, boundary, bounds, w, h, padding, gridSize, Math.min(1, progress * 1.2));
        }

        const testCount = Math.floor(data.test_points.length * (sampleCount / data.train_points.length));
        data.test_points.slice(0, testCount).forEach(pt => {
            const p = this.getPoint(pt);
            ctx.fillStyle = p.class === p.predicted ? this.colors.testCorrect : this.colors.testWrong;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        const visibleTrainPoints = data.train_points.slice(0, sampleCount);
        data.support_vectors.forEach(svArr => {
            const sv = this.getSV(svArr);
            const isVisible = visibleTrainPoints.some(pt => {
                const p = this.getPoint(pt);
                return Math.abs(p.x - sv.x) < 0.001 && Math.abs(p.y - sv.y) < 0.001;
            });
            if (!isVisible) return;

            ctx.strokeStyle = this.colors.support;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(toCanvasX(sv.x), toCanvasY(sv.y), 7, 0, Math.PI * 2);
            ctx.stroke();
        });

        data.train_points.slice(0, sampleCount).forEach(pt => {
            const p = this.getPoint(pt);
            ctx.fillStyle = p.class === 0 ? this.colors.class0 : this.colors.class1;
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
    },

    getBoundaryAtProgress(data, progress) {
        let rawBoundary = null;

        if (data.progressive_boundaries && data.progress_stages) {
            const stages = data.progress_stages;
            const boundaries = data.progressive_boundaries;

            for (let i = 0; i < stages.length; i++) {
                if (progress <= stages[i]) {
                    if (boundaries[i]) { rawBoundary = boundaries[i]; break; }
                }
            }
            if (!rawBoundary) {
                for (let i = boundaries.length - 1; i >= 0; i--) {
                    if (boundaries[i]) { rawBoundary = boundaries[i]; break; }
                }
            }
        } else {
            rawBoundary = data.decision_boundary;
        }

        if (data.encoded && typeof rawBoundary === 'string') {
            const gridSize = data.grid_size || 50;
            return this.decodeBitmap(rawBoundary, gridSize * gridSize);
        }

        return rawBoundary || [];
    },

    getDecisionValuesAtProgress(data, progress) {
        let rawValues = null;

        if (data.progressive_decision_values && data.progress_stages) {
            const stages = data.progress_stages;
            const decisionValues = data.progressive_decision_values;

            for (let i = 0; i < stages.length; i++) {
                if (progress <= stages[i]) {
                    if (decisionValues[i]) { rawValues = decisionValues[i]; break; }
                }
            }
            if (!rawValues) {
                for (let i = decisionValues.length - 1; i >= 0; i--) {
                    if (decisionValues[i]) { rawValues = decisionValues[i]; break; }
                }
            }
        } else {
            rawValues = data.decision_values;
        }

        if (data.encoded && rawValues && typeof rawValues.b64 === 'string') {
            return this.decodeFloats(rawValues);
        }

        if (data.encoded && rawValues && rawValues.const) {
            const gridSize = data.grid_size || 50;
            const val = (rawValues.min + rawValues.max) / 2;
            return new Float32Array(gridSize * gridSize).fill(val);
        }

        return rawValues || [];
    },

    decodeBitmap(b64, size) {
        if (!b64) return [];
        const binString = atob(b64);
        const len = binString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binString.charCodeAt(i);

        const result = new Int8Array(size);
        for (let i = 0; i < size; i++) {
            const byteIndex = Math.floor(i / 8);
            if (byteIndex >= len) break;
            const bitOffset = i % 8;
            result[i] = (bytes[byteIndex] & (1 << bitOffset)) ? 1 : 0;
        }
        return result;
    },

    decodeFloats(encodedObj) {
        if (!encodedObj) return [];
        const binString = atob(encodedObj.b64);
        const len = binString.length;
        const result = new Float32Array(len);
        const min = encodedObj.min;
        const rng = encodedObj.max - encodedObj.min;

        for (let i = 0; i < len; i++) {
            result[i] = min + (binString.charCodeAt(i) / 255) * rng;
        }
        return result;
    },

    drawAnimatedBoundary(ctx, boundary, bounds, w, h, padding, gridSize, progress) {
        const highRes = this.BOUNDARY_RESOLUTION;
        const grid = this.upsampleBoundary(boundary, gridSize, highRes, bounds);

        const cellW = (w - 2 * padding) / highRes;
        const cellH = (h - 2 * padding) / highRes;

        ctx.globalAlpha = 0.35;
        for (let j = 0; j < highRes; j++) {
            for (let i = 0; i < highRes; i++) {
                if (grid[j][i] !== null) {
                    ctx.fillStyle = grid[j][i] === 0 ? this.colors.class0 : this.colors.class1;
                    ctx.fillRect(padding + i * cellW, padding + j * cellH, cellW + 0.5, cellH + 0.5);
                }
            }
        }
        ctx.globalAlpha = 1;

        this.drawSmoothContour(ctx, grid, highRes, w, h, padding, 1.0);
    },

    upsampleBoundary(boundary, originalSize, targetSize, bounds) {
        const origGrid = Array(originalSize).fill(null).map(() => Array(originalSize).fill(null));
        const isCoordinateList = boundary.length > 0 && typeof boundary[0] === 'object' && 'x' in boundary[0];

        if (!isCoordinateList) {
            for (let j = 0; j < originalSize; j++) {
                for (let i = 0; i < originalSize; i++) {
                    const idx = j * originalSize + i;
                    if (idx < boundary.length) origGrid[originalSize - 1 - j][i] = boundary[idx];
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

                const v00 = origGrid[j0]?.[i0] ?? 0;
                const v10 = origGrid[j0]?.[i1] ?? 0;
                const v01 = origGrid[j1]?.[i0] ?? 0;
                const v11 = origGrid[j1]?.[i1] ?? 0;

                const interpolated = (1 - tj) * ((1 - ti) * v00 + ti * v10) + tj * ((1 - ti) * v01 + ti * v11);
                newGrid[j][i] = interpolated >= 0.5 ? 1 : 0;
            }
        }

        return newGrid;
    },

    drawSmoothContour(ctx, grid, gridSize, w, h, padding, progress) {
        const cellW = (w - 2 * padding) / gridSize;
        const cellH = (h - 2 * padding) / gridSize;

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2.5 * progress;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = progress;

        const segments = [];

        for (let j = 0; j < gridSize - 1; j++) {
            for (let i = 0; i < gridSize - 1; i++) {
                const tl = grid[j][i], tr = grid[j][i + 1];
                const bl = grid[j + 1][i], br = grid[j + 1][i + 1];

                if (tl === null || tr === null || bl === null || br === null) continue;

                const config = (tl === 1 ? 8 : 0) | (tr === 1 ? 4 : 0) | (br === 1 ? 2 : 0) | (bl === 1 ? 1 : 0);
                if (config === 0 || config === 15) continue;

                const x0 = padding + i * cellW;
                const y0 = padding + j * cellH;
                const x1 = x0 + cellW;
                const y1 = y0 + cellH;

                const threshold = 0.5;
                const v_tl = tl === 1 ? 1 : 0, v_tr = tr === 1 ? 1 : 0;
                const v_bl = bl === 1 ? 1 : 0, v_br = br === 1 ? 1 : 0;

                const topT = Math.abs(v_tr - v_tl) > 0.001 ? (threshold - v_tl) / (v_tr - v_tl) : 0.5;
                const top = { x: x0 + topT * cellW, y: y0 };
                const bottomT = Math.abs(v_br - v_bl) > 0.001 ? (threshold - v_bl) / (v_br - v_bl) : 0.5;
                const bottom = { x: x0 + bottomT * cellW, y: y1 };
                const leftT = Math.abs(v_bl - v_tl) > 0.001 ? (threshold - v_tl) / (v_bl - v_tl) : 0.5;
                const left = { x: x0, y: y0 + leftT * cellH };
                const rightT = Math.abs(v_br - v_tr) > 0.001 ? (threshold - v_tr) / (v_br - v_tr) : 0.5;
                const right = { x: x1, y: y0 + rightT * cellH };

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

        segments.forEach(seg => {
            if (seg.length === 2) {
                ctx.beginPath();
                ctx.moveTo(seg[0].x, seg[0].y);
                ctx.lineTo(seg[1].x, seg[1].y);
                ctx.stroke();
            }
        });

        ctx.globalAlpha = 1;
    },

    getPoint(p) {
        if (Array.isArray(p)) return { x: p[0], y: p[1], class: p[2], predicted: p[3] };
        return p;
    },

    getSV(sv) {
        if (Array.isArray(sv)) return { x: sv[0], y: sv[1], class: sv[2] };
        return sv;
    },

    calculateMetrics(trueLabels, predictions, numClasses) {
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
    },

    updateMetricsForKernel(kernel) {
        const data = kernel === 'linear' ? this.state.moons.linearData : this.state.moons.rbfData;
        const elementId = kernel === 'linear' ? 'moonsLinearMetrics' : 'moonsRbfMetrics';
        const metrics = this.calculateMetrics(
            data.test_points.map(p => this.getPoint(p).class),
            data.test_points.map(p => this.getPoint(p).predicted), 2
        );
        this.updateMetrics(elementId, metrics, data.metrics.n_support_vectors);
    },

    renderMoonsPlots() {
        const linearCanvas = document.getElementById('moonsLinearCanvas');
        const rbfCanvas = document.getElementById('moonsRbfCanvas');

        if (linearCanvas && this.state.moons.linearData) {
            this.drawMoonsPlot(linearCanvas, this.state.moons.linearData);
        }
        if (rbfCanvas && this.state.moons.rbfData) {
            this.drawMoonsPlot(rbfCanvas, this.state.moons.rbfData);
        }
        ['linear', 'rbf'].forEach(k => this.updateMetricsForKernel(k));
    },

    drawMoonsPlot(canvas, data) {
        try {
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            const bounds = data.grid_bounds;
            const padding = 30;
            const toCanvasX = (x) => padding + (x - bounds.x_min) * ((w - 2 * padding) / (bounds.x_max - bounds.x_min));
            const toCanvasY = (y) => h - padding - (y - bounds.y_min) * ((h - 2 * padding) / (bounds.y_max - bounds.y_min));

            const allHidden = Object.values(this.state.visibility).every(v => v === false);

            if (allHidden) {
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
                ctx.strokeStyle = '#ccc';
                ctx.lineWidth = 1;
                ctx.strokeRect(padding, padding, w - 2 * padding, h - 2 * padding);
                return;
            }

            const finalBoundary = this.getBoundaryAtProgress(data, 1.0);
            this.drawAnimatedBoundary(ctx, finalBoundary, bounds, w, h, padding, data.grid_size || 50, 1.0);

            if (this.state.visibility['test-correct'] || this.state.visibility['test-wrong']) {
                data.test_points.forEach(pt => {
                    const p = this.getPoint(pt);
                    const isCorrect = p.class === p.predicted;
                    if (isCorrect && !this.state.visibility['test-correct']) return;
                    if (!isCorrect && !this.state.visibility['test-wrong']) return;

                    ctx.fillStyle = isCorrect ? this.colors.testCorrect : this.colors.testWrong;
                    ctx.globalAlpha = 0.9;
                    ctx.beginPath();
                    ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                });
            }

            if (this.state.visibility['support-vectors']) {
                data.support_vectors.forEach(svArr => {
                    const sv = this.getSV(svArr);
                    ctx.strokeStyle = this.colors.support;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(toCanvasX(sv.x), toCanvasY(sv.y), 7, 0, Math.PI * 2);
                    ctx.stroke();
                });
            }

            data.train_points.forEach(pt => {
                const p = this.getPoint(pt);
                if (p.class === 0 && !this.state.visibility['train-class0']) return;
                if (p.class === 1 && !this.state.visibility['train-class1']) return;

                ctx.fillStyle = p.class === 0 ? this.colors.class0 : this.colors.class1;
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
    },

    updateMetrics(elementId, metrics, nSupportVectors) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.innerHTML = `
            <h4><strong>Performance Metrics</strong></h4>
            <div class="metric-item"><span class="metric-label">Test Samples</span><span class="metric-value">${metrics.testCount}</span></div>
            <div class="metric-item" style="border-bottom: 3px solid #e3f2fd;"><span class="metric-label">Support Vectors</span><span class="metric-value">${nSupportVectors}</span></div>
            <div class="metric-item"><span class="metric-label">Accuracy</span><span class="metric-value">${(metrics.accuracy * 100).toFixed(1)}%</span></div>
            <div class="metric-item"><span class="metric-label">Precision</span><span class="metric-value">${(metrics.precision * 100).toFixed(1)}%</span></div>
            <div class="metric-item"><span class="metric-label">Recall</span><span class="metric-value">${(metrics.recall * 100).toFixed(1)}%</span></div>
            <div class="metric-item"><span class="metric-label">F1 Score</span><span class="metric-value">${(metrics.f1 * 100).toFixed(1)}%</span></div>
        `;
    },

    showHyperplane(kernel) {
        const modal = document.getElementById('hyperplaneModal');
        const descEl = document.getElementById('modalDescription');
        const gammaGroup = document.getElementById('modalGammaGroup');

        modal.classList.remove('hidden');
        this.currentHyperplaneKernel = kernel;
        this.syncModalControls();

        if (kernel === 'linear-moons') {
            this.currentHyperplaneData = this.state.moons.linearData;
            document.getElementById('modalTitle').innerHTML = '<strong>3D Hyperplane - Linear Kernel</strong>';
            if (descEl) {
                descEl.textContent = this.kernelDescriptions.linear;
                descEl.className = 'modal-description linear';
            }
            if (gammaGroup) gammaGroup.style.display = 'none';
            const formBtn = document.getElementById('modal3DFormation');
            if (formBtn) formBtn.style.display = 'none';
        } else {
            this.currentHyperplaneData = this.state.moons.rbfData;
            document.getElementById('modalTitle').innerHTML = '<strong>3D Hyperplane - RBF Kernel</strong>';
            if (descEl) {
                descEl.textContent = this.kernelDescriptions.rbf;
                descEl.className = 'modal-description rbf';
            }
            if (gammaGroup) gammaGroup.style.display = 'block';
            const formBtn = document.getElementById('modal3DFormation');
            if (formBtn) formBtn.style.display = 'inline-block';
        }

        this.hyperplaneRotation = { x: 0.5, y: 0.3 };
        this.setupHyperplaneControls();
        this.renderHyperplane();
    },

    startModal3DFormation() {
        if (!this.currentHyperplaneData || this.isFormationAnimating) return;
        const data = this.currentHyperplaneData;
        const btn = document.getElementById('modal3DFormation');
        if (btn) btn.disabled = true;
        this.isFormationAnimating = true;

        this.hyperplaneRotation = { x: 1.5, y: 0.3 };

        const stages = data.progress_stages || [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];
        let stageIndex = 0;
        const delay = 400;
        const self = this;

        function animate() {
            const progress = stages[stageIndex];
            const sampleCount = Math.floor(data.train_points.length * progress);

            self.renderPartialHyperplane(sampleCount, progress);

            if (stageIndex < stages.length - 1) {
                stageIndex++;
                setTimeout(animate, delay);
            } else {
                if (btn) btn.disabled = false;
                self.isFormationAnimating = false;
            }
        }
        animate();
    },

    renderPartialHyperplane(sampleCount, progress) {
        if (!this.currentHyperplaneData) return;
        const data = this.currentHyperplaneData;
        const canvas = document.getElementById('hyperplaneCanvas');
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const allHidden = Object.values(this.state.visibility).every(v => v === false);
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
        const decisionValues = this.getDecisionValuesAtProgress(data, progress);
        if (!decisionValues || decisionValues.length === 0) {
            this.drawAxes3D(ctx, w, h);
            return;
        }

        const xRange = bounds.x_max - bounds.x_min;
        const yRange = bounds.y_max - bounds.y_min;
        const minDV = Math.min(...decisionValues);
        const maxDV = Math.max(...decisionValues);
        const dvRange = maxDV - minDV || 1;
        const gridSize = data.grid_size || 50;
        const step = Math.max(2, Math.floor(gridSize / 20));
        const heightScale = 0.5 * progress;

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

                const p1 = this.project3D({ x: x1, y: y1, z: z1 * heightScale }, w, h);
                const p2 = this.project3D({ x: x2, y: y1, z: z2 * heightScale }, w, h);
                const p3 = this.project3D({ x: x1, y: y2, z: z3 * heightScale }, w, h);
                const p4 = this.project3D({ x: x2, y: y2, z: z4 * heightScale }, w, h);

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
                        const p = this.project3D({ x: xCross, y: yn, z: 0 }, w, h);
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        this.drawAxes3D(ctx, w, h);

        const ratio = sampleCount / data.train_points.length;

        data.train_points.slice(0, sampleCount).forEach(pt => {
            const p = this.getPoint(pt);
            if (p.class === 0 && !this.state.visibility['train-class0']) return;
            if (p.class === 1 && !this.state.visibility['train-class1']) return;

            const nx = (p.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
            const ny = (p.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
            const gridI = Math.floor((p.x - bounds.x_min) / xRange * (gridSize - 1));
            const gridJ = Math.floor((p.y - bounds.y_min) / yRange * (gridSize - 1));
            const idx = Math.min(gridJ * gridSize + gridI, decisionValues.length - 1);
            const z = ((decisionValues[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * heightScale;
            const projected = this.project3D({ x: nx, y: ny, z }, w, h);

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(projected.x + 2, projected.y + 2, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = p.class === 0 ? this.colors.class0 : this.colors.class1;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        if (this.state.visibility['test-correct'] || this.state.visibility['test-wrong']) {
            const testCount = Math.floor(data.test_points.length * ratio);
            data.test_points.slice(0, testCount).forEach(pt => {
                const p = this.getPoint(pt);
                const isCorrect = p.class === p.predicted;
                if (isCorrect && !this.state.visibility['test-correct']) return;
                if (!isCorrect && !this.state.visibility['test-wrong']) return;

                const nx = (p.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
                const ny = (p.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
                const gridI = Math.floor((p.x - bounds.x_min) / xRange * (gridSize - 1));
                const gridJ = Math.floor((p.y - bounds.y_min) / yRange * (gridSize - 1));
                const idx = Math.min(gridJ * gridSize + gridI, decisionValues.length - 1);
                const z = ((decisionValues[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * heightScale;
                const projected = this.project3D({ x: nx, y: ny, z }, w, h);

                ctx.globalAlpha = 0.7;
                ctx.fillStyle = p.class === p.predicted ? this.colors.testCorrect : this.colors.testWrong;
                ctx.beginPath();
                ctx.arc(projected.x, projected.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });
        }

        if (this.state.visibility['support-vectors']) {
            const visibleTrainPoints3D = data.train_points.slice(0, sampleCount);
            data.support_vectors.forEach(svArr => {
                const sv = this.getSV(svArr);
                const isVisible = visibleTrainPoints3D.some(pt => {
                    const p = this.getPoint(pt);
                    return Math.abs(p.x - sv.x) < 0.001 && Math.abs(p.y - sv.y) < 0.001;
                });
                if (!isVisible) return;

                const nx = (sv.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
                const ny = (sv.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
                const gridI = Math.floor((sv.x - bounds.x_min) / xRange * (gridSize - 1));
                const gridJ = Math.floor((sv.y - bounds.y_min) / yRange * (gridSize - 1));
                const idx = Math.min(gridJ * gridSize + gridI, decisionValues.length - 1);
                const z = ((decisionValues[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * heightScale;
                const projected = this.project3D({ x: nx, y: ny, z }, w, h);

                ctx.strokeStyle = this.colors.support;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(projected.x, projected.y, 8, 0, Math.PI * 2);
                ctx.stroke();
            });
        }
    },

    closeModal() {
        const modal = document.getElementById('hyperplaneModal');
        if (modal) modal.classList.add('hidden');
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
        this.isAnimating = false;
        const btn = document.getElementById('toggleAnimation');
        if (btn) btn.textContent = 'Animate';
        this.currentHyperplaneKernel = null;
    },

    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const btn = document.getElementById('toggleAnimation');
        if (btn) btn.textContent = this.isAnimating ? 'Stop Animation' : 'Animate';
        if (this.isAnimating) this.animate3D();
        else if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    },

    animate3D() {
        if (!this.isAnimating) return;
        this.hyperplaneRotation.y += 0.015;
        this.renderHyperplane();
        this.animationId = requestAnimationFrame(() => this.animate3D());
    },

    resetHyperplaneView() {
        this.hyperplaneRotation = { x: 0.5, y: 0.3 };
        this.renderHyperplane();
    },

    setupHyperplaneControls() {
        const canvas = document.getElementById('hyperplaneCanvas');
        const self = this;
        canvas.onmousedown = (e) => {
            if (self.isAnimating || self.isFormationAnimating) return;
            self.isDragging = true;
            self.lastMouse = { x: e.clientX, y: e.clientY };
        };
        canvas.onmousemove = (e) => {
            if (!self.isDragging || self.isAnimating || self.isFormationAnimating) return;
            self.hyperplaneRotation.y += (e.clientX - self.lastMouse.x) * 0.01;
            self.hyperplaneRotation.x += (e.clientY - self.lastMouse.y) * 0.01;
            self.lastMouse = { x: e.clientX, y: e.clientY };
            self.renderHyperplane();
        };
        canvas.onmouseup = () => { self.isDragging = false; };
        canvas.onmouseleave = () => { self.isDragging = false; };
    },

    renderHyperplane() {
        if (!this.currentHyperplaneData) return;
        this.renderPartialHyperplane(this.currentHyperplaneData.train_points.length, 1.0);
    },

    project3D(point, w, h) {
        const { x, y, z } = point;
        const scale = 200;
        const cosX = Math.cos(this.hyperplaneRotation.x), sinX = Math.sin(this.hyperplaneRotation.x);
        const cosY = Math.cos(this.hyperplaneRotation.y), sinY = Math.sin(this.hyperplaneRotation.y);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;
        let x2 = x * cosY + z1 * sinY;
        return { x: w / 2 + x2 * scale, y: h / 2 - y1 * scale };
    },

    drawAxes3D(ctx, w, h) {
        const o = this.project3D({ x: 0, y: 0, z: 0 }, w, h);
        const xP = this.project3D({ x: 1.5, y: 0, z: 0 }, w, h);
        const yP = this.project3D({ x: 0, y: 1.5, z: 0 }, w, h);
        const zP = this.project3D({ x: 0, y: 0, z: 1 }, w, h);

        ctx.lineWidth = 3;
        ctx.font = 'bold 14px Consolas, monospace';

        ctx.strokeStyle = '#dfd1d1ff';
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(xP.x, xP.y); ctx.stroke();
        ctx.fillStyle = '#dfd1d1ff'; ctx.fillText('X', xP.x + 10, xP.y);

        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(yP.x, yP.y); ctx.stroke();
        ctx.fillText('Y', yP.x + 10, yP.y);

        if (this.currentHyperplaneKernel !== 'linear-moons') {
            ctx.strokeStyle = '#fce874ff';
            ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(zP.x, zP.y); ctx.stroke();
            ctx.fillStyle = '#fce874ff'; ctx.fillText('Decision', zP.x + 10, zP.y);
        }
    }
};
