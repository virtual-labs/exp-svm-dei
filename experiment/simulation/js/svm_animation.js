/**
 * SVM Animation Module - Updated with sliders, C param, XOR, margin lines
 */
const SVMAnimation = {
    // Config maps for slider index -> value
    CONFIG: {
        samples: [100, 300, 500, 750, 1000],
        noise: [0.1, 0.2, 0.3, 0.4, 0.5],
        c: [0.1, 1, 10, 100, 1000],
        gamma: [0.1, 0.5, 2, 5, 10]
    },

    state: {
        dataset: 'moons', // 'moons' or 'xor'
        moons: {
            metadata: null,
            samples: 750,
            noise: 0.1,
            gamma: 2,
            cValue: 1,
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
            'support-vectors': true,
            'margin-lines': true
        }
    },

    colors: {
        class0: '#1f77b4',
        class1: '#ff7f0e',
        support: '#9c27b0',
        testCorrect: '#4caf50',
        testWrong: '#f44336'
    },

    datasetDescriptions: {
        moons: "Two interleaving half circles (moons) used to demonstrate non-linear classification. This dataset is a classic example where linear classifiers fail and RBF kernels excel.",
        xor: "XOR (exclusive-or) pattern with 4 clusters arranged diagonally. Class 0 occupies top-right and bottom-left, Class 1 occupies top-left and bottom-right. Linear classifiers cannot solve this; RBF kernels can capture the non-linear boundary."
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
        const mainContainer = document.getElementById('main-container');
        if (container) {
            container.style.display = 'block';
            if (mainContainer) mainContainer.style.display = 'none';
            this.init();
        }
    },

    hide() {
        const container = document.getElementById('svm-animation-container');
        const mainContainer = document.getElementById('main-container');
        if (container) {
            container.style.display = 'none';
            if (mainContainer) mainContainer.style.display = 'block';
            this.closeModal();
        }
    },

    async init() {
        try {
            const ds = this.state.dataset;
            const metaRes = await fetch(`data/${ds}/metadata.json`);
            if (!metaRes.ok) throw new Error(`Metadata HTTP ${metaRes.status}`);
            this.state.moons.metadata = await metaRes.json();
        } catch (err) {
            console.error('Failed to load metadata:', err);
            return;
        }

        const descEl = document.getElementById('moonsDescription');
        if (descEl) {
            descEl.textContent = this.datasetDescriptions[this.state.dataset];
        }

        this.populateSliderTicks();
        this.updateOverview();
        if (!this._listenersSetup) {
            this.setupEventListeners();
            this._listenersSetup = true;
        }
        await this.loadMoonsData();

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

    populateSliderTicks() {
        const tickConfigs = [
            { id: 'samplesTicks', values: this.CONFIG.samples },
            { id: 'noiseTicks', values: this.CONFIG.noise },
            { id: 'cTicks', values: this.CONFIG.c },
            { id: 'gammaTicks', values: this.CONFIG.gamma }
        ];
        tickConfigs.forEach(cfg => {
            const el = document.getElementById(cfg.id);
            if (el) {
                el.innerHTML = cfg.values.map(v => `<span>${v}</span>`).join('');
            }
        });
    },

    getSliderValue(sliderId, configKey) {
        const slider = document.getElementById(sliderId);
        if (!slider) return this.CONFIG[configKey][0];
        return this.CONFIG[configKey][parseInt(slider.value)];
    },

    setSliderByValue(sliderId, valDisplayId, configKey, value) {
        const idx = this.CONFIG[configKey].indexOf(value);
        if (idx === -1) return;
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(valDisplayId);
        if (slider) slider.value = idx;
        if (display) display.textContent = value;
    },

    updateOverview() {
        const trainSamples = Math.floor(this.state.moons.samples * 0.8);
        const testSamples = this.state.moons.samples - trainSamples;
        const dsName = this.state.dataset === 'moons' ? 'Two Moons' : 'XOR';

        const overview = document.getElementById('overviewDetails');
        if (overview) {
            overview.innerHTML = `
                <table class="overview-table">
                    <tr><th>Dataset</th><td>${dsName}</td></tr>
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
        if (backBtn) {
            backBtn.addEventListener('click', () => self.hide());
        }

        // Dataset toggle
        document.querySelectorAll(`${container} .dataset-toggle-btn`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ds = e.target.dataset.dataset;
                if (ds === self.state.dataset) return;
                document.querySelectorAll(`${container} .dataset-toggle-btn`).forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                self.state.dataset = ds;
                self.state.formation.firstLoad = true;
                const descEl = document.getElementById('moonsDescription');
                if (descEl) descEl.textContent = self.datasetDescriptions[ds];
                self.init();
            });
        });

        // Legend buttons
        document.querySelectorAll(`${container} .legend-btn`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;

                if (type === 'margin-lines') {
                    self.state.visibility['margin-lines'] = !self.state.visibility['margin-lines'];
                    e.currentTarget.classList.toggle('active', self.state.visibility['margin-lines']);
                    self.renderMoonsPlots();
                    return;
                }

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

        // Sidebar sliders
        this.setupSlider('samplesSlider', 'samplesVal', 'samples', (val) => {
            self.state.moons.samples = val;
            self.syncModalControls();
            self.updateOverview();
            self.loadMoonsData();
        });
        this.setupSlider('noiseSlider', 'noiseVal', 'noise', (val) => {
            self.state.moons.noise = val;
            self.syncModalControls();
            self.updateOverview();
            self.loadMoonsData();
        });
        this.setupSlider('cSlider', 'cVal', 'c', (val) => {
            self.state.moons.cValue = val;
            self.syncModalControls();
            self.loadMoonsData();
        });
        this.setupSlider('gammaSlider', 'gammaVal', 'gamma', (val) => {
            self.state.moons.gamma = val;
            self.syncModalControls();
            self.loadMoonsData();
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

    setupSlider(sliderId, displayId, configKey, onChange) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        if (!slider) return;
        const self = this;
        slider.addEventListener('input', () => {
            const val = self.CONFIG[configKey][parseInt(slider.value)];
            if (display) display.textContent = val;
        });
        slider.addEventListener('change', () => {
            const val = self.CONFIG[configKey][parseInt(slider.value)];
            onChange(val);
        });
    },

    setupModalConfigListeners() {
        const self = this;
        this.setupSlider('modalSamplesSlider', 'modalSamplesVal', 'samples', (val) => {
            self.state.moons.samples = val;
            self.syncSidebarControls();
            self.updateOverview();
            self.loadMoonsDataAndUpdate3D();
        });
        this.setupSlider('modalNoiseSlider', 'modalNoiseVal', 'noise', (val) => {
            self.state.moons.noise = val;
            self.syncSidebarControls();
            self.updateOverview();
            self.loadMoonsDataAndUpdate3D();
        });
        this.setupSlider('modalCSlider', 'modalCVal', 'c', (val) => {
            self.state.moons.cValue = val;
            self.syncSidebarControls();
            self.loadMoonsDataAndUpdate3D();
        });
        this.setupSlider('modalGammaSlider', 'modalGammaVal', 'gamma', (val) => {
            self.state.moons.gamma = val;
            self.syncSidebarControls();
            self.loadMoonsDataAndUpdate3D();
        });
    },

    syncModalControls() {
        this.setSliderByValue('modalSamplesSlider', 'modalSamplesVal', 'samples', this.state.moons.samples);
        this.setSliderByValue('modalNoiseSlider', 'modalNoiseVal', 'noise', this.state.moons.noise);
        this.setSliderByValue('modalCSlider', 'modalCVal', 'c', this.state.moons.cValue);
        this.setSliderByValue('modalGammaSlider', 'modalGammaVal', 'gamma', this.state.moons.gamma);
    },

    syncSidebarControls() {
        this.setSliderByValue('samplesSlider', 'samplesVal', 'samples', this.state.moons.samples);
        this.setSliderByValue('noiseSlider', 'noiseVal', 'noise', this.state.moons.noise);
        this.setSliderByValue('cSlider', 'cVal', 'c', this.state.moons.cValue);
        this.setSliderByValue('gammaSlider', 'gammaVal', 'gamma', this.state.moons.gamma);
    },

    updateFormationButtonsState() {
        const container = '#svm-animation-container';
        const coreVis = { ...this.state.visibility };
        delete coreVis['margin-lines'];
        const allVisible = Object.values(coreVis).every(v => v === true);
        const allHidden = Object.values(coreVis).every(v => v === false);

        document.querySelectorAll(`${container} .formation-btn[data-kernel]`).forEach(btn => {
            btn.disabled = !allVisible;
            btn.title = !allVisible ? 'Enable all legend items to use formation animation' : '';
        });

        const modalFormationBtn = document.getElementById('modal3DFormation');
        if (modalFormationBtn) {
            modalFormationBtn.disabled = !allVisible;
        }

        document.querySelectorAll(`${container} .hyperplane-btn`).forEach(btn => {
            btn.disabled = allHidden;
        });
    },

    async loadMoonsDataAndUpdate3D() {
        await this.loadMoonsData();
        if (this.currentHyperplaneKernel) {
            this.currentHyperplaneData = this.currentHyperplaneKernel.includes('linear')
                ? this.state.moons.linearData
                : this.state.moons.rbfData;
            this.renderHyperplane();
        }
    },

    async loadMoonsData() {
        const { samples, noise, gamma, cValue } = this.state.moons;
        const ds = this.state.dataset;
        const cacheBust = Date.now();

        try {
            const [linearRes, rbfRes] = await Promise.all([
                fetch(`data/${ds}/linear/C_${cValue}/samples_${samples}_noise_${noise}/data.json?t=${cacheBust}`),
                fetch(`data/${ds}/rbf/C_${cValue}/gamma_${gamma}/samples_${samples}_noise_${noise}/data.json?t=${cacheBust}`)
            ]);

            if (!linearRes.ok || !rbfRes.ok) {
                throw new Error(`Data HTTP error linear=${linearRes.status} rbf=${rbfRes.status}`);
            }

            this.state.moons.linearData = await linearRes.json();
            this.state.moons.rbfData = await rbfRes.json();
        } catch (err) {
            console.error('Error loading data:', err);
            return;
        }

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

        // Draw margin lines during formation if visible
        if (this.state.visibility['margin-lines'] && progress >= 0.5) {
            this.drawMarginLines(ctx, data, progress, bounds, w, h, padding, gridSize);
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

    drawMarginLines(ctx, data, progress, bounds, w, h, padding, gridSize) {
        const decisionValues = this.getDecisionValuesAtProgress(data, progress);
        if (!decisionValues || decisionValues.length === 0) return;

        const highRes = this.BOUNDARY_RESOLUTION;
        const origSize = gridSize;

        // Build flat arrays for +1 and -1 thresholds (same layout as boundary bitmap)
        const flatPlus = new Int8Array(origSize * origSize);
        const flatMinus = new Int8Array(origSize * origSize);

        for (let j = 0; j < origSize; j++) {
            for (let i = 0; i < origSize; i++) {
                const idx = j * origSize + i;
                if (idx < decisionValues.length) {
                    flatPlus[idx] = decisionValues[idx] >= 1 ? 1 : 0;
                    flatMinus[idx] = decisionValues[idx] >= -1 ? 1 : 0;
                }
            }
        }

        // Draw both margin contours with dashed lines
        ctx.save();
        ctx.setLineDash([8, 5]);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = Math.min(1, progress * 1.5);

        const gridPlus = this.upsampleBoundary(flatPlus, origSize, highRes, bounds);
        this.drawSmoothContour(ctx, gridPlus, highRes, w, h, padding, 1.0);

        const gridMinus = this.upsampleBoundary(flatMinus, origSize, highRes, bounds);
        this.drawSmoothContour(ctx, gridMinus, highRes, w, h, padding, 1.0);

        ctx.restore();
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

        // Only set stroke style if not already set by caller (for margin lines)
        const isMarginCall = ctx.getLineDash && ctx.getLineDash().length > 0;
        if (!isMarginCall) {
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2.5 * progress;
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (!isMarginCall) ctx.globalAlpha = progress;

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
                    case 5: segments.push([left, top], [bottom, right]); break; // Saddle point
                    case 6: case 9: segments.push([top, bottom]); break;
                    case 7: case 8: segments.push([left, top]); break;
                    case 10: segments.push([top, right], [left, bottom]); break; // Saddle point
                }
            }
        }

        // Assemble segments into continuous polylines so line dash patterns work properly
        const paths = [];
        let remaining = [...segments];
        const eps = 0.5;
        const pointsMatch = (p1, p2) => Math.abs(p1.x - p2.x) < eps && Math.abs(p1.y - p2.y) < eps;

        while (remaining.length > 0) {
            const seg = remaining.pop();
            const poly = [seg[0], seg[1]];
            let changed = true;
            while (changed) {
                changed = false;
                for (let i = 0; i < remaining.length; i++) {
                    const cand = remaining[i];
                    if (pointsMatch(cand[0], poly[poly.length - 1])) {
                        poly.push(cand[1]); remaining.splice(i, 1); changed = true; break;
                    } else if (pointsMatch(cand[1], poly[poly.length - 1])) {
                        poly.push(cand[0]); remaining.splice(i, 1); changed = true; break;
                    } else if (pointsMatch(cand[0], poly[0])) {
                        poly.unshift(cand[1]); remaining.splice(i, 1); changed = true; break;
                    } else if (pointsMatch(cand[1], poly[0])) {
                        poly.unshift(cand[0]); remaining.splice(i, 1); changed = true; break;
                    }
                }
            }
            paths.push(poly);
        }

        ctx.beginPath();
        paths.forEach(poly => {
            if (poly.length > 0) {
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let i = 1; i < poly.length; i++) {
                    ctx.lineTo(poly[i].x, poly[i].y);
                }
            }
        });
        ctx.stroke();

        if (!isMarginCall) ctx.globalAlpha = 1;
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

            const coreVis = { ...this.state.visibility };
            delete coreVis['margin-lines'];
            const allHidden = Object.values(coreVis).every(v => v === false);

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

            const gridSize = data.grid_size || 50;
            const finalBoundary = this.getBoundaryAtProgress(data, 1.0);
            this.drawAnimatedBoundary(ctx, finalBoundary, bounds, w, h, padding, gridSize, 1.0);

            // Draw margin lines
            if (this.state.visibility['margin-lines']) {
                this.drawMarginLines(ctx, data, 1.0, bounds, w, h, padding, gridSize);
            }

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

        const coreVis = { ...this.state.visibility };
        delete coreVis['margin-lines'];
        const allHidden = Object.values(coreVis).every(v => v === false);
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
            // Decision boundary (dv = 0)
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

            // Margin lines (dv = +1 and dv = -1) in 3D
            if (this.state.visibility['margin-lines']) {
                const marginThresholds = [1, -1];
                ctx.save();
                ctx.setLineDash([8, 5]);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.lineWidth = 1.5 * progress;
                ctx.globalAlpha = progress * 0.8;
                marginThresholds.forEach(threshold => {
                    for (let j = 0; j < gridSize - 1; j++) {
                        for (let i = 0; i < gridSize - 1; i++) {
                            const mv1 = decisionValues[j * gridSize + i] - threshold;
                            const mv2 = decisionValues[j * gridSize + (i + 1)] - threshold;
                            if ((mv1 > 0 && mv2 < 0) || (mv1 < 0 && mv2 > 0)) {
                                const mx1n = ((i / (gridSize - 1)) * xRange + bounds.x_min - (bounds.x_min + xRange / 2)) / (xRange / 2);
                                const mx2n = (((i + 1) / (gridSize - 1)) * xRange + bounds.x_min - (bounds.x_min + xRange / 2)) / (xRange / 2);
                                const myn = ((j / (gridSize - 1)) * yRange + bounds.y_min - (bounds.y_min + yRange / 2)) / (yRange / 2);
                                const mt = Math.abs(mv1) / (Math.abs(mv1) + Math.abs(mv2));
                                const mxCross = mx1n + mt * (mx2n - mx1n);
                                const mp = this.project3D({ x: mxCross, y: myn, z: 0 }, w, h);
                                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                                ctx.beginPath();
                                ctx.arc(mp.x, mp.y, 1.5, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                    }
                });
                ctx.restore();
            }
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

            const baseColor = p.class === 0 ? this.colors.class0 : this.colors.class1;
            const r = 6;
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.arc(projected.x + 2, projected.y + 2, r, 0, Math.PI * 2);
            ctx.fill();
            // Sphere gradient
            const grad = ctx.createRadialGradient(projected.x - r * 0.3, projected.y - r * 0.3, r * 0.1, projected.x, projected.y, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, baseColor);
            grad.addColorStop(1, this.darkenColor(baseColor, 0.4));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 0.5;
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

                const testColor = p.class === p.predicted ? this.colors.testCorrect : this.colors.testWrong;
                const tr = 5;
                const tGrad = ctx.createRadialGradient(projected.x - tr * 0.3, projected.y - tr * 0.3, tr * 0.1, projected.x, projected.y, tr);
                tGrad.addColorStop(0, '#ffffff');
                tGrad.addColorStop(0.35, testColor);
                tGrad.addColorStop(1, this.darkenColor(testColor, 0.4));
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = tGrad;
                ctx.beginPath();
                ctx.arc(projected.x, projected.y, tr, 0, Math.PI * 2);
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

    darkenColor(hex, amount) {
        // Darken a hex color by amount (0-1)
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
        const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
        const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
        return `rgb(${r},${g},${b})`;
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
