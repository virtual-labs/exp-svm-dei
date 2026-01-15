/**
 * SVM Animation Module - Exact Port from Original
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
        }
    },

    colors: {
        class0: '#1f77b4',
        class1: '#ff7f0e',
        support: '#9c27b0',
        testCorrect: '#4caf50',
        testWrong: '#f44336'
    },

    hyperplaneRotation: { x: 0.5, y: 0.3 },
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    isAnimating: false,
    animationId: null,
    currentHyperplaneData: null,

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

        // Show main app immediately (no loading screen in integrated mode)
        const mainApp = document.getElementById('svmMainApp');
        if (mainApp) mainApp.classList.remove('hidden');
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
    },

    setupEventListeners() {
        // Back Button
        const backBtn = document.querySelector('#svm-animation-container .back-to-exp-btn');
        if (backBtn) backBtn.onclick = () => this.hide();

        // Sample buttons
        document.querySelectorAll('#svm-animation-container #samplesButtons .toggle-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('#svm-animation-container #samplesButtons .toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.moons.samples = parseInt(e.target.dataset.samples);
                this.updateOverview();
                this.loadMoonsData();
            };
        });

        // Noise buttons
        document.querySelectorAll('#svm-animation-container #noiseButtons .toggle-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('#svm-animation-container #noiseButtons .toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.moons.noise = parseFloat(e.target.dataset.noise);
                this.updateOverview();
                this.loadMoonsData();
            };
        });

        // Gamma buttons
        document.querySelectorAll('#svm-animation-container #gammaButtons .toggle-btn').forEach(btn => {
            btn.onclick = (e) => {
                document.querySelectorAll('#svm-animation-container #gammaButtons .toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.moons.gamma = parseFloat(e.target.dataset.gamma);
                this.loadMoonsData();
            };
        });

        // Hyperplane buttons
        document.querySelectorAll('#svm-animation-container .hyperplane-btn').forEach(btn => {
            btn.onclick = (e) => {
                const kernel = e.target.dataset.kernel;
                this.showHyperplane(kernel);
            };
        });

        // Modal controls
        const closeModal = document.getElementById('closeModal');
        if (closeModal) closeModal.onclick = () => this.closeModal();

        const modal = document.getElementById('hyperplaneModal');
        if (modal) modal.onclick = (e) => { if (e.target.id === 'hyperplaneModal') this.closeModal(); };

        const resetView = document.getElementById('resetView');
        if (resetView) resetView.onclick = () => this.resetHyperplaneView();

        const toggleAnim = document.getElementById('toggleAnimation');
        if (toggleAnim) toggleAnim.onclick = () => this.toggleAnimation();
    },

    loadMoonsData() {
        const { samples, noise, gamma } = this.state.moons;
        const configKey = `${samples}_${noise}`;

        this.state.moons.linearData = SVM_PLOT_DATA.moons.linear[configKey];
        this.state.moons.rbfData = SVM_PLOT_DATA.moons.rbf[gamma][configKey];

        this.renderMoonsPlots();
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
        const tp = Array(numClasses).fill(0);
        const fp = Array(numClasses).fill(0);
        const fn = Array(numClasses).fill(0);

        for (let i = 0; i < trueLabels.length; i++) {
            const t = trueLabels[i];
            const p = predictions[i];
            if (t === p) tp[t]++;
            else { fp[p]++; fn[t]++; }
        }

        let totalPrecision = 0, totalRecall = 0, totalF1 = 0, validClasses = 0;
        for (let i = 0; i < numClasses; i++) {
            const precision = (tp[i] + fp[i]) > 0 ? tp[i] / (tp[i] + fp[i]) : 0;
            const recall = (tp[i] + fn[i]) > 0 ? tp[i] / (tp[i] + fn[i]) : 0;
            const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
            if ((tp[i] + fp[i] + fn[i]) > 0) {
                totalPrecision += precision; totalRecall += recall; totalF1 += f1; validClasses++;
            }
        }

        const accuracy = trueLabels.reduce((acc, val, idx) => acc + (val === predictions[idx] ? 1 : 0), 0) / trueLabels.length;
        return {
            accuracy, precision: validClasses > 0 ? totalPrecision / validClasses : 0,
            recall: validClasses > 0 ? totalRecall / validClasses : 0,
            f1: validClasses > 0 ? totalF1 / validClasses : 0, testCount: trueLabels.length
        };
    },

    renderMoonsPlots() {
        const linearCanvas = document.getElementById('moonsLinearCanvas');
        const rbfCanvas = document.getElementById('moonsRbfCanvas');

        if (linearCanvas && this.state.moons.linearData) {
            this.drawMoonsPlot(linearCanvas, this.state.moons.linearData);
            const metrics = this.calculateMetrics(
                this.state.moons.linearData.test_points.map(p => this.getPoint(p).class),
                this.state.moons.linearData.test_points.map(p => this.getPoint(p).predicted), 2
            );
            this.updateMetrics('moonsLinearMetrics', metrics, this.state.moons.linearData.metrics.n_support_vectors);
        }
        if (rbfCanvas && this.state.moons.rbfData) {
            this.drawMoonsPlot(rbfCanvas, this.state.moons.rbfData);
            const metrics = this.calculateMetrics(
                this.state.moons.rbfData.test_points.map(p => this.getPoint(p).class),
                this.state.moons.rbfData.test_points.map(p => this.getPoint(p).predicted), 2
            );
            this.updateMetrics('moonsRbfMetrics', metrics, this.state.moons.rbfData.metrics.n_support_vectors);
        }
    },

    drawMoonsPlot(canvas, data) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const bounds = data.grid_bounds;
        const padding = 30;
        const scaleX = (w - 2 * padding) / (bounds.x_max - bounds.x_min);
        const scaleY = (h - 2 * padding) / (bounds.y_max - bounds.y_min);
        const toX = (x) => padding + (x - bounds.x_min) * scaleX;
        const toY = (y) => h - padding - (y - bounds.y_min) * scaleY;

        // Decision boundary
        this.drawDecisionBoundary(ctx, data, w, h, padding);

        // Test points
        data.test_points.forEach(pt => {
            const p = this.getPoint(pt);
            ctx.fillStyle = p.class === p.predicted ? this.colors.testCorrect : this.colors.testWrong;
            ctx.globalAlpha = 0.9;
            ctx.beginPath(); ctx.arc(toX(p.x), toY(p.y), 4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Support vectors
        data.support_vectors.forEach(svArr => {
            const sv = this.getSV(svArr);
            ctx.strokeStyle = this.colors.support; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(toX(sv.x), toY(sv.y), 7, 0, Math.PI * 2); ctx.stroke();
        });

        // Train points
        data.train_points.forEach(pt => {
            const p = this.getPoint(pt);
            ctx.fillStyle = p.class === 0 ? this.colors.class0 : this.colors.class1;
            ctx.beginPath(); ctx.arc(toX(p.x), toY(p.y), 4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 0.5; ctx.stroke();
        });

        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.strokeRect(padding, padding, w - 2 * padding, h - 2 * padding);
    },

    drawDecisionBoundary(ctx, data, w, h, padding) {
        const gridSize = data.grid_size || 50;
        const boundary = data.decision_boundary;
        const cellW = (w - 2 * padding) / gridSize;
        const cellH = (h - 2 * padding) / gridSize;

        ctx.globalAlpha = 0.35;
        for (let j = 0; j < gridSize; j++) {
            for (let i = 0; i < gridSize; i++) {
                const val = boundary[(gridSize - 1 - j) * gridSize + i];
                ctx.fillStyle = val === 0 ? this.colors.class0 : this.colors.class1;
                ctx.fillRect(padding + i * cellW, padding + j * cellH, cellW + 1, cellH + 1);
            }
        }
        ctx.globalAlpha = 1;

        ctx.strokeStyle = '#222'; ctx.lineWidth = 2.5;
        for (let j = 0; j < gridSize - 1; j++) {
            for (let i = 0; i < gridSize - 1; i++) {
                const curr = boundary[(gridSize - 1 - j) * gridSize + i];
                const right = boundary[(gridSize - 1 - j) * gridSize + (i + 1)];
                const down = boundary[(gridSize - 2 - j) * gridSize + i];
                if (curr !== right) {
                    ctx.beginPath(); ctx.moveTo(padding + (i + 1) * cellW, padding + j * cellH);
                    ctx.lineTo(padding + (i + 1) * cellW, padding + (j + 1) * cellH); ctx.stroke();
                }
                if (curr !== down) {
                    ctx.beginPath(); ctx.moveTo(padding + i * cellW, padding + (j + 1) * cellH);
                    ctx.lineTo(padding + (i + 1) * cellW, padding + (j + 1) * cellH); ctx.stroke();
                }
            }
        }
    },

    updateMetrics(elId, metrics, nSupportVectors) {
        const el = document.getElementById(elId);
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

    // 3D Hyperplane
    showHyperplane(kernel) {
        const modal = document.getElementById('hyperplaneModal');
        modal.classList.remove('hidden');

        if (kernel === 'linear-moons') {
            this.currentHyperplaneData = this.state.moons.linearData;
            document.getElementById('modalTitle').innerHTML = '<strong>3D Hyperplane - Linear Kernel</strong>';
        } else {
            this.currentHyperplaneData = this.state.moons.rbfData;
            document.getElementById('modalTitle').innerHTML = '<strong>3D Hyperplane - RBF Kernel</strong>';
        }

        this.hyperplaneRotation = { x: 0.5, y: 0.3 };
        this.renderHyperplane();
        this.setupHyperplaneControls();
    },

    closeModal() {
        document.getElementById('hyperplaneModal').classList.add('hidden');
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
        this.isAnimating = false;
        const btn = document.getElementById('toggleAnimation');
        if (btn) btn.textContent = 'Animate';
    },

    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const btn = document.getElementById('toggleAnimation');
        btn.textContent = this.isAnimating ? 'Stop' : 'Animate';
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
        canvas.onmousedown = (e) => {
            if (this.isAnimating) return;
            this.isDragging = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        };
        canvas.onmousemove = (e) => {
            if (!this.isDragging || this.isAnimating) return;
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;
            this.hyperplaneRotation.y += dx * 0.01;
            this.hyperplaneRotation.x += dy * 0.01;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            this.renderHyperplane();
        };
        canvas.onmouseup = () => { this.isDragging = false; };
        canvas.onmouseleave = () => { this.isDragging = false; };
    },

    renderHyperplane() {
        if (!this.currentHyperplaneData) return;
        const data = this.currentHyperplaneData;
        const canvas = document.getElementById('hyperplaneCanvas');
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        ctx.clearRect(0, 0, w, h);
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#1a1a2e'); bgGrad.addColorStop(1, '#16213e');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, w, h);

        const bounds = data.grid_bounds;
        const dv = data.decision_values;
        const gridSize = data.grid_size || 50;
        const xRange = bounds.x_max - bounds.x_min;
        const yRange = bounds.y_max - bounds.y_min;
        const minDV = Math.min(...dv), maxDV = Math.max(...dv), dvRange = maxDV - minDV || 1;

        const step = Math.max(2, Math.floor(gridSize / 20));
        ctx.globalAlpha = 0.6;

        for (let j = 0; j < gridSize - step; j += step) {
            for (let i = 0; i < gridSize - step; i += step) {
                const idx1 = j * gridSize + i, idx4 = (j + step) * gridSize + (i + step);
                if (idx4 >= dv.length) continue;

                const x1 = ((i / (gridSize - 1)) * xRange + bounds.x_min - (bounds.x_min + xRange / 2)) / (xRange / 2);
                const y1 = ((j / (gridSize - 1)) * yRange + bounds.y_min - (bounds.y_min + yRange / 2)) / (yRange / 2);
                const x2 = (((i + step) / (gridSize - 1)) * xRange + bounds.x_min - (bounds.x_min + xRange / 2)) / (xRange / 2);
                const y2 = (((j + step) / (gridSize - 1)) * yRange + bounds.y_min - (bounds.y_min + yRange / 2)) / (yRange / 2);

                const z1 = (dv[idx1] - minDV) / dvRange * 2 - 1;
                const z4 = (dv[idx4] - minDV) / dvRange * 2 - 1;

                const p1 = this.project3D({ x: x1, y: y1, z: z1 * 0.5 }, w, h);
                const p2 = this.project3D({ x: x2, y: y1, z: z1 * 0.5 }, w, h);
                const p3 = this.project3D({ x: x1, y: y2, z: z4 * 0.5 }, w, h);
                const p4 = this.project3D({ x: x2, y: y2, z: z4 * 0.5 }, w, h);

                const avgZ = (z1 + z4) / 2;
                ctx.fillStyle = avgZ > 0 ? `rgba(255, 127, 14, ${0.3 + avgZ * 0.3})` : `rgba(31, 119, 180, ${0.3 - avgZ * 0.3})`;
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p4.x, p4.y); ctx.lineTo(p3.x, p3.y); ctx.closePath(); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
        this.drawAxes3D(ctx, w, h);
        this.drawPoints3D(ctx, data, w, h, bounds, dv, minDV, dvRange, gridSize);
    },

    drawPoints3D(ctx, data, w, h, bounds, dv, minDV, dvRange, gridSize) {
        const xRange = bounds.x_max - bounds.x_min;
        const yRange = bounds.y_max - bounds.y_min;

        // Train points
        data.train_points.forEach(pt => {
            const p = this.getPoint(pt);
            const nx = (p.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
            const ny = (p.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
            const gridI = Math.floor((p.x - bounds.x_min) / xRange * (gridSize - 1));
            const gridJ = Math.floor((p.y - bounds.y_min) / yRange * (gridSize - 1));
            const idx = Math.min(gridJ * gridSize + gridI, dv.length - 1);
            const z = ((dv[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * 0.5;
            const proj = this.project3D({ x: nx, y: ny, z: z }, w, h);

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.arc(proj.x + 2, proj.y + 2, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = p.class === 0 ? this.colors.class0 : this.colors.class1;
            ctx.beginPath(); ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
        });

        // Test points
        data.test_points.forEach(pt => {
            const p = this.getPoint(pt);
            const nx = (p.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
            const ny = (p.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
            const gridI = Math.floor((p.x - bounds.x_min) / xRange * (gridSize - 1));
            const gridJ = Math.floor((p.y - bounds.y_min) / yRange * (gridSize - 1));
            const idx = Math.min(gridJ * gridSize + gridI, dv.length - 1);
            const z = ((dv[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * 0.5;
            const proj = this.project3D({ x: nx, y: ny, z: z }, w, h);

            ctx.globalAlpha = 0.7;
            ctx.fillStyle = p.class === p.predicted ? this.colors.testCorrect : this.colors.testWrong;
            ctx.beginPath(); ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Support vectors
        data.support_vectors.forEach(svArr => {
            const sv = this.getSV(svArr);
            const nx = (sv.x - (bounds.x_min + xRange / 2)) / (xRange / 2);
            const ny = (sv.y - (bounds.y_min + yRange / 2)) / (yRange / 2);
            const gridI = Math.floor((sv.x - bounds.x_min) / xRange * (gridSize - 1));
            const gridJ = Math.floor((sv.y - bounds.y_min) / yRange * (gridSize - 1));
            const idx = Math.min(gridJ * gridSize + gridI, dv.length - 1);
            const z = ((dv[Math.max(0, idx)] - minDV) / dvRange * 2 - 1) * 0.5;
            const proj = this.project3D({ x: nx, y: ny, z: z }, w, h);

            ctx.strokeStyle = this.colors.support; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2); ctx.stroke();
        });
    },

    project3D(point, w, h) {
        const { x, y, z } = point;
        const scale = 200;
        const cosX = Math.cos(this.hyperplaneRotation.x), sinX = Math.sin(this.hyperplaneRotation.x);
        const cosY = Math.cos(this.hyperplaneRotation.y), sinY = Math.sin(this.hyperplaneRotation.y);

        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;
        let x2 = x * cosY + z1 * sinY;
        let y2 = y1;

        return { x: w / 2 + x2 * scale, y: h / 2 - y2 * scale };
    },

    drawAxes3D(ctx, w, h) {
        const o = this.project3D({ x: 0, y: 0, z: 0 }, w, h);
        const xP = this.project3D({ x: 1.5, y: 0, z: 0 }, w, h);
        const yP = this.project3D({ x: 0, y: 1.5, z: 0 }, w, h);
        const zP = this.project3D({ x: 0, y: 0, z: 1 }, w, h);

        ctx.lineWidth = 3; ctx.globalAlpha = 1;

        ctx.strokeStyle = '#dfd1d1';
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(xP.x, xP.y); ctx.stroke();
        ctx.fillStyle = '#dfd1d1'; ctx.font = 'bold 14px Consolas'; ctx.fillText('X', xP.x + 10, xP.y);

        ctx.strokeStyle = '#dfd1d1';
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(yP.x, yP.y); ctx.stroke();
        ctx.fillStyle = '#dfd1d1'; ctx.fillText('Y', yP.x + 10, yP.y);

        ctx.strokeStyle = '#fce874';
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(zP.x, zP.y); ctx.stroke();
        ctx.fillStyle = '#fce874'; ctx.fillText('Decision', zP.x + 10, zP.y);
    }
};
