// PlantScout - Professional Dark Dashboard Controller
// Fixed left sidebar (5 views), top bar, compact telemetry bar, interactive 3D equipment drawer, and report.

import { EQUIPMENT_REGISTER, INSPECTION_STATIONS } from '../data/equipment.js';
import { CONNECTION_LINES, FLUID_SERVICES } from '../data/graph.js';
import { PROCESS_STAGES } from '../sim/engine.js';
import { galleryZ } from '../data/layout.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export class DashboardController {
  constructor(engine, scenarioManager, rover, metaClient, camera, scene, ThreeInstance) {
    this.engine = engine;
    this.scenarioManager = scenarioManager;
    this.rover = rover;
    this.metaClient = metaClient;
    this.camera = camera;
    this.scene = scene;
    this.T = ThreeInstance;

    this.activeView = 'overview';
    this.reportScenario = 'normal';
    this.travelLogExpanded = false;
    this.lastReportRender = 0;
    this.flightToken = 0;
    this.previousCameraPose = null;
    this.selectedEquipment = null;
    this.pendingEquipmentId = null;
    this.highlightBox = null;
    this.selectedEvidenceIndex = null;

    // Inspection session state
    this.inspectionSession = {
      id: 'INSP-INIT',
      scenario: 'normal',
      startTime: null,
      endTime: null,
      stageAtStart: '',
      findings: [],
      travelObservations: [],
      evidencePhotos: new Map(), // evidenceId -> dataUrl
      visitedStations: new Set(),
      observedEquipment: new Set(),
      status: 'Not Started'
    };
    this.reportSessions = new Map([['normal', this.inspectionSession]]);

    this.initElements();
    this.bindEvents();
    this.updateTopBar();
    this.updateAiStatusBadge();
    this.renderEquipmentList();
    this.updateReportUI();
    this.switchView('overview');
  }

  initElements() {
    this.$ = id => document.getElementById(id);
    this.createHighlightHelper();
  }

  createHighlightHelper() {
    const geo = new this.T.BoxGeometry(1, 1, 1);
    const edges = new this.T.EdgesGeometry(geo);
    this.highlightBox = new this.T.LineSegments(
      edges,
      new this.T.LineBasicMaterial({ color: 0x63b3ed, linewidth: 3, transparent: true, opacity: 0.9 })
    );
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);
  }

  highlightEquipmentInScene(eqId, { distant = false } = {}) {
    const eq = EQUIPMENT_REGISTER.find(e => e.id === eqId);
    if (!eq) return;

    this.highlightBox.position.set(eq.position[0], eq.position[1] + eq.dimensions[1] * 0.5, eq.position[2]);
    this.highlightBox.scale.set(eq.dimensions[0] + 0.3, eq.dimensions[1] + 0.3, eq.dimensions[2] + 0.3);
    this.highlightBox.visible = true;

    if (!this.previousCameraPose) this.previousCameraPose = { position: this.camera.position.clone(), quaternion: this.camera.quaternion.clone(), fov: this.camera.fov };
    // Smoothly fly camera to equipment inspection viewpoint
    if (this.camera && eq.viewpoint) {
      const target = eq.target || [eq.position[0], eq.position[1] + eq.dimensions[1] * 0.55, eq.position[2]];
      if (distant) {
        const dx = eq.viewpoint[0] - target[0];
        const dz = eq.viewpoint[1] - target[2];
        const length = Math.hypot(dx, dz) || 1;
        const radius = Math.max(4.6, Math.max(eq.dimensions[0], eq.dimensions[2]) * 2 + 2);
        const x = this.T.MathUtils.clamp(target[0] + dx / length * radius, -14.8, 14.8);
        const z = this.T.MathUtils.clamp(target[2] + dz / length * radius, -8.4, 8.4);
        this.camera.fov = 63;
        this.camera.updateProjectionMatrix();
        this.flyCameraTo([x, Math.min(4.0, Math.max(1.9, target[1] + 0.5)), z], target);
      } else {
        this.flyCameraTo([eq.viewpoint[0], 1.75, eq.viewpoint[1]], target);
      }
    }
  }

  highlightSpillInScene() {
    const spillPos = [4.8, 0.2, galleryZ(-0.7)];
    this.highlightBox.position.set(spillPos[0], spillPos[1], spillPos[2]);
    this.highlightBox.scale.set(2.2, 0.4, 1.6);
    this.highlightBox.visible = true;

    if (this.camera) {
      this.flyCameraTo([4.8, 1.6, galleryZ(0.8)], [4.8, 0.05, galleryZ(-0.7)]);
    }
  }

  flyCameraTo(pos, target) {
    const flightToken = ++this.flightToken;
    const startPos = this.camera.position.clone();
    const endPos = new this.T.Vector3(...pos);
    const endTarget = new this.T.Vector3(...target);
    const startTarget = new this.T.Vector3();
    this.camera.getWorldDirection(startTarget);
    startTarget.add(startPos);

    let progress = 0;
    const animateFlight = () => {
      if (flightToken !== this.flightToken) return;
      progress += 0.04;
      const t = Math.min(1.0, progress);
      const ease = t * t * (3 - 2 * t);
      this.camera.position.lerpVectors(startPos, endPos, ease);

      const curTarget = new this.T.Vector3().lerpVectors(startTarget, endTarget, ease);
      this.camera.lookAt(curTarget);

      if (progress < 1.0) {
        requestAnimationFrame(animateFlight);
      }
    };
    animateFlight();
  }

  bindEvents() {
    // Sidebar Navigation
    document.querySelectorAll('.sidebar-nav button').forEach(btn => {
      btn.onclick = () => {
        const view = btn.dataset.view;
        this.switchView(view, btn.dataset.scenario);
      };
    });
    this.$('home-open-normal').onclick = () => this.switchView('access', 'normal');
    this.$('home-open-defective').onclick = () => this.switchView('access', 'defective');

    // Scenario Selector
    this.$('scenario-select').onchange = e => {
      this.switchView('access', e.target.value);
    };

    // Auto Advance Toggle
    this.$('btn-auto-advance').onclick = () => {
      this.engine.isAutoAdvancing = !this.engine.isAutoAdvancing;
      this.$('btn-auto-advance').textContent = this.engine.isAutoAdvancing ? 'Auto-Advancing: ON' : 'Auto-Advancing: OFF';
      this.$('btn-auto-advance').classList.toggle('active', this.engine.isAutoAdvancing);
    };

    // Stage Step Buttons
    this.$('btn-prev-stage').onclick = () => this.engine.prevStage();
    this.$('btn-next-stage').onclick = () => this.engine.nextStage();
    this.$('btn-pause-sim').onclick = () => {
      this.engine.isPaused = !this.engine.isPaused;
      this.$('btn-pause-sim').textContent = this.engine.isPaused ? 'Resume Sim' : 'Pause Sim';
    };

    // Emergency Shutdown
    this.$('btn-esd').onclick = () => {
      if (this.engine.isEmergencyStopped) {
        this.engine.resumeFromEmergencyStop();
        this.$('btn-esd').textContent = 'EMERGENCY SHUTDOWN';
        this.$('btn-esd').classList.remove('active');
      } else {
        this.engine.triggerEmergencyStop();
        this.$('btn-esd').textContent = 'RESET ESD INTERLOCK';
        this.$('btn-esd').classList.add('active');
      }
    };

    // Robot Inspection Controls
    this.$('btn-start-inspection').onclick = () => {
      if (this.engine.stageIndex === 0) {
        this.$('btn-start-system').click();
      }
      // Hold a repeatable operating point while the slower inspection covers the whole hall.
      this.engine.setStage(8);
      this.engine.isAutoAdvancing = false;
      this.setInspectionSpeed(Number(this.$('inspection-speed-select').value));
      this.startNewInspection();
      if (this.inspectionSession.status === 'In Progress') this.onRequestFullscreen?.();
    };
    this.$('btn-pause-inspection').onclick = () => {
      this.pauseInspection();
    };
    this.$('btn-resume-inspection').onclick = () => {
      this.resumeInspection();
    };
    this.$('btn-reset-dock').onclick = () => {
      this.stopInspection('Interrupted');
      this.rover.resetToDock();
      this.$('travel-scan-status').textContent = 'Robot returned to Dock. Start a new inspection to collect a complete report.';
      this.updateReportUI();
    };
    this.$('btn-stop-inspection').onclick = () => this.stopInspection();
    this.$('btn-end-inspection').onclick = () => { this.stopInspection(); this.switchView('report'); };

    this.$('inspection-speed-select').onchange = e => {
      this.setInspectionSpeed(Number(e.target.value));
    };
    this.$('scan-speed-select').onchange = e => this.setInspectionSpeed(Number(e.target.value));

    // View Modes
    document.querySelectorAll('.view-btn[data-cam]').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.view-btn[data-cam]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCameraView = btn.dataset.cam;
      };
    });

    // Search Equipment Drawer
    this.$('eq-search-input').oninput = e => this.renderEquipmentList(e.target.value);
    this.$('eq-category-select').onchange = e => this.renderEquipmentList(this.$('eq-search-input').value, e.target.value);

    // Report Export Buttons
    this.$('btn-download-json').onclick = () => this.downloadReportJson();
    this.$('btn-print-report').onclick = () => window.print();
    document.querySelectorAll('.report-tab').forEach(btn => {
      btn.onclick = () => { this.reportScenario = btn.dataset.report; this.travelLogExpanded = false; this.selectedEvidenceIndex = null; this.$('report-evidence-viewer').classList.add('hidden'); this.updateReportUI(true); };
    });
    this.$('btn-toggle-travel-log').onclick = () => { this.travelLogExpanded = !this.travelLogExpanded; this.updateReportUI(true); };
    this.$('btn-close-evidence').onclick = () => {
      this.selectedEvidenceIndex = null;
      this.$('report-evidence-viewer').classList.add('hidden');
      document.querySelectorAll('.finding-card.evidence-selected').forEach(card => card.classList.remove('evidence-selected'));
    };

    // Close Modals
    this.$('btn-close-eq-drawer').onclick = () => this.closeEquipmentDetails();
    this.$('btn-close-equipment-preview').onclick = () => this.closeEquipmentDetails();
    document.addEventListener('pointerdown', event => {
      if (this.$('equipment-details-modal').classList.contains('hidden')) return;
      if (this.$('equipment-details-modal').contains(event.target)) return;
      if (event.target.closest('.equipment-card, .pfd-card, .equipment-preview-hud')) return;
      this.closeEquipmentDetails();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.closeEquipmentDetails();
    });
  }

  closeEquipmentDetails() {
    this.$('equipment-details-modal').classList.add('hidden');
    this.highlightBox.visible = false;
    if (document.body.classList.contains('equipment-preview-open')) {
      document.body.classList.remove('equipment-preview-open');
      this.onPreviewChanged?.();
    }
    if (this.previousCameraPose) {
      ++this.flightToken;
      this.camera.position.copy(this.previousCameraPose.position);
      this.camera.quaternion.copy(this.previousCameraPose.quaternion);
      this.camera.fov = this.previousCameraPose.fov;
      this.camera.updateProjectionMatrix();
      this.previousCameraPose = null;
      this.onCameraRestored?.();
    }
  }

  switchView(viewName, scenarioKey) {
    if (viewName !== 'pfd' && document.body.classList.contains('equipment-preview-open')) this.closeEquipmentDetails();
    const isBasementScreen = ['access', 'explore', 'inspection'].includes(viewName);
    if (isBasementScreen && scenarioKey && scenarioKey !== this.scenarioManager.currentScenario) {
      this.setScenario(scenarioKey);
      viewName = 'access';
    }
    if (viewName === 'access' || ((viewName === 'explore' || viewName === 'inspection') && !this.canEnter?.())) {
      viewName = 'access';
      this.onAccessRequested?.(this.scenarioManager.currentScenario);
    }
    this.activeView = viewName;
    document.body.dataset.screen = viewName;
    document.body.dataset.basement = this.scenarioManager.currentScenario;
    document.querySelectorAll('.sidebar-nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName && (!b.dataset.scenario || b.dataset.scenario === this.scenarioManager.currentScenario));
    });

    const isExplore = (viewName === 'explore');
    const isInspection = (viewName === 'inspection');
    const isPfd = (viewName === 'pfd');
    const isReport = (viewName === 'report');

    // Section 8 rule: "Explore complete basement" shows basement without robot
    this.rover.root.visible = isInspection;

    // Show/hide sub-panels
    this.$('overview-panel').classList.toggle('hidden', !isPfd);
    this.$('equipment-drawer').classList.toggle('hidden', !isPfd);
    this.$('inspection-panel').classList.toggle('hidden', !isInspection);
    this.$('pfd-panel').classList.toggle('hidden', !isPfd);

    if (isExplore) {
      this.activeCameraView = 'walk';
      document.querySelector('.view-btn[data-cam="walk"]')?.click();
    } else if (isInspection) {
      this.activeCameraView = 'follow';
      document.querySelector('.view-btn[data-cam="follow"]')?.click();
    } else if (isReport) {
      this.reportScenario = this.scenarioManager.currentScenario;
      this.updateReportUI(true);
    } else if (isPfd) {
      this.renderPfd();
    }
    const names = { overview:'Overview', access:'Basement access', explore:'Explore basement', inspection:'Robot inspection', report:'Inspection reports', pfd:'Equipment & process', controls:'Controls & help' };
    const basementName = this.scenarioManager.currentScenario === 'normal' ? 'Basement 1' : 'Basement 2';
    this.$('workspace-title').textContent = isBasementScreen ? `${basementName} · ${names[viewName]}` : names[viewName];
    this.$('workspace-subtitle').textContent = ({ overview:'Choose a basement and follow the inspection workflow.', access:'Approach the closed door, then enter the demonstration PIN.', explore:'Walk the resin plant and inspect connected equipment.', inspection:'Follow the robot and review each scan as it happens.', report:'Select a basement to view its own evidence and findings.', pfd:'See the connected resin process and installed equipment.', controls:'Movement, camera, and inspection guidance.' })[viewName];
    this.$('brand-location').textContent = isBasementScreen ? `${basementName} / ${names[viewName]}` : `Resin plant / ${names[viewName]}`;
    this.$('scenario-select').value = this.scenarioManager.currentScenario;
    this.onScreenChanged?.(viewName);
  }

  setScenario(scenarioKey) {
    this.interruptInspection();
    this.reportSessions.set(this.scenarioManager.currentScenario, this.inspectionSession);
    this.scenarioManager.setScenario(scenarioKey, this.scene, this.T);
    this.rover.resetToDock();
    this.inspectionSession = this.reportSessions.get(scenarioKey) || this.makeEmptyReport(scenarioKey);
    this.reportSessions.set(scenarioKey, this.inspectionSession);
    this.reportScenario = scenarioKey;
    this.updateTopBar();
    this.updateReportUI();
  }

  interruptInspection() {
    this.stopSpeech();
    if (this.inspectionSession.status === 'In Progress') {
      this.inspectionSession.status = 'Interrupted';
      this.inspectionSession.endTime = new Date();
      this.reportSessions.set(this.inspectionSession.scenario, this.inspectionSession);
    }
  }

  setInspectionSpeed(speed) {
    if (![1, 2.5, 5].includes(speed)) return;
    this.rover.speedMultiplier = speed;
    this.$('inspection-speed-select').value = String(speed);
    this.$('scan-speed-select').value = String(speed);
    this.updateLiveProgress();
  }

  pauseInspection() {
    if (this.inspectionSession.status !== 'In Progress' || this.rover.isPaused) return;
    this.rover.pause();
    this.stopSpeech();
    this.$('travel-scan-status').textContent = 'Route paused at the current position.';
    this.$('scan-title').textContent = 'SCOUT-01 • PAUSED';
    this.$('scan-detail').textContent = 'Robot and announcements paused. Resume to continue.';
    this.updateLiveProgress();
  }

  resumeInspection() {
    if (this.inspectionSession.status !== 'In Progress') return false;
    const resumed = this.rover.resumeAutomaticInspection();
    const message = resumed ? 'Route resumed from the current robot position.' : 'Route could not resume from this position.';
    this.$('travel-scan-status').textContent = message;
    this.$('scan-title').textContent = resumed ? 'SCOUT-01 • ROUTE ACTIVE' : 'SCOUT-01 • ROUTE BLOCKED';
    this.$('scan-detail').textContent = message;
    this.updateLiveProgress();
    return resumed;
  }

  stopInspection(status = 'Stopped') {
    this.stopSpeech();
    if (this.inspectionSession.status !== 'In Progress') return;
    this.rover.stopAutomaticInspection();
    this.inspectionSession.status = status;
    this.inspectionSession.endTime = new Date();
    this.reportSessions.set(this.inspectionSession.scenario, this.inspectionSession);
    this.$('travel-scan-status').textContent = `Inspection ${status.toLowerCase()} at ${this.inspectionSession.visitedStations.size}/${INSPECTION_STATIONS.length} stops.`;
    this.$('scan-title').textContent = `SCOUT-01 • ${status.toUpperCase()}`;
    this.$('scan-detail').textContent = 'Robot halted. The report contains only completed checks.';
    this.updateLiveProgress();
    this.updateReportUI();
  }

  startNewInspection() {
    if (this.inspectionSession.status === 'In Progress') return;
    const sc = this.scenarioManager.getScenario();
    const snap = this.engine.getTelemetrySnapshot();

    this.stopSpeech();
    this.resetInspectionState();
    this.rover.resetToDock();
    this.$('live-findings-list').replaceChildren();
    this.$('live-current').textContent = 'Current check: leaving the dock';
    this.metaClient.resetBudget();
    this.rover.setAlert(false);
    this.inspectionSession.id = `INSP-${Date.now().toString(36).toUpperCase()}-${sc.id.toUpperCase()}`;
    this.inspectionSession.scenario = sc.id;
    this.inspectionSession.startTime = new Date();
    this.inspectionSession.stageAtStart = snap.stage.name;
    this.inspectionSession.status = 'In Progress';

    if (!this.rover.startAutomaticInspection()) {
      this.inspectionSession.status = 'Route Blocked';
      this.$('travel-scan-status').textContent = 'Route blocked. Reset the robot to dock and retry.';
      document.body.classList.remove('inspection-active');
      this.$('scan-hud').classList.add('hidden');
      if (document.fullscreenElement) document.exitFullscreen();
      this.updateReportUI();
      return;
    }
    this.switchView('inspection');
    this.$('scan-title').textContent = 'SCOUT-01 • ROUTE ACTIVE';
    this.$('scan-detail').textContent = `Starting ${INSPECTION_STATIONS.length}-stop inspection. Simulated sensors and selected Meta camera checks.`;
    this.updateTopBar();
    this.updateLiveProgress();
    this.updateReportUI();
  }

  resetInspectionState() {
    this.inspectionSession = this.makeEmptyReport(this.scenarioManager.currentScenario);
    this.reportSessions.set(this.scenarioManager.currentScenario, this.inspectionSession);
  }

  makeEmptyReport(scenario) {
    return {
      id: `INSP-${Date.now().toString(36).toUpperCase()}`,
      scenario,
      startTime: null,
      endTime: null,
      stageAtStart: '',
      findings: [],
      travelObservations: [],
      evidencePhotos: new Map(),
      visitedStations: new Set(),
      observedEquipment: new Set(),
      status: 'Not Started'
    };
  }

  handleTravelScan(phase, station) {
    if (this.inspectionSession.status !== 'In Progress') return;
    const snap = this.engine.getTelemetrySnapshot();
    const eq = EQUIPMENT_REGISTER.find(item => item.id === station.targetEq);
    const position = this.rover.getTelemetry().position;
    let result = '';
    let source = 'Simulated telemetry';
    if (phase === 'floor') {
      const spill = this.scenarioManager.getScenario().spill;
      const nearby = spill && Math.hypot(position[0] - spill.position[0], position[1] - spill.position[2]) < 3;
      result = nearby ? 'spill fixture near P-301; image review required' : 'no spill fixture at this route segment';
      source = 'Simulation scenario state';
    } else if (phase === 'opposite') {
      const opposite = EQUIPMENT_REGISTER.find(item => item.id !== eq?.id && Math.sign(item.position[2]) !== Math.sign(eq?.position[2] || -1) && Math.abs(item.position[0] - position[0]) < 2);
      result = opposite ? `${opposite.id} across the aisle; camera aimed toward equipment` : 'opposite aisle in view; no matching instrument in range';
      source = 'Scene geometry and equipment register';
    } else {
      const lower = phase === 'lower';
      const instrument = eq?.instruments?.find(item => /temp|bearing/i.test(item.name + ' ' + item.type) && (lower ? /bearing|motor|drive/i.test(item.name + ' ' + item.type) : !/bearing|motor|drive/i.test(item.name + ' ' + item.type)));
      if (instrument) {
        let value = instrument.defaultVal;
        if (instrument.tag === 'P-301.TT-BRG') value = snap.temperatures['P-301_brg'];
        if (instrument.tag === 'R-101.TT-01') value = snap.temperatures['R-101_proc'];
        if (instrument.tag === 'BL-301.TT-01') value = snap.temperatures['BL-301_proc'];
        const alarm = typeof value === 'number' && value >= (instrument.alarmMax ?? Infinity);
        result = `${instrument.tag}: ${typeof value === 'number' ? value.toFixed(1) : value} ${instrument.unit}${alarm ? ' — high alarm' : ' — within configured limit'}`;
      } else result = `${eq?.id || 'route'}: no ${lower ? 'lower' : 'upper'} temperature instrument installed`;
    }
    const label = {upper:'Upper',lower:'Lower',opposite:'Opposite side',floor:'Floor'}[phase];
    const message = `${label}: ${result}.`;
    this.inspectionSession.travelObservations.push({ time: new Date().toISOString(), station: station.name, phase, result, source });
    this.$('travel-scan-status').textContent = message;
    this.$('scan-title').textContent = `SCOUT-01 • ${this.inspectionSession.visitedStations.size}/${INSPECTION_STATIONS.length} CHECKED`;
    this.$('scan-detail').textContent = message;
    this.$('live-current').textContent = `${station.name} · ${message}`;
  }

  async handleStationObservation(station, stationIndex, cameraFrameBase64) {
    if (this.inspectionSession.status !== 'In Progress') return;
    const currentSession = this.inspectionSession;
    this.$('scan-title').textContent = `SCOUT-01 • ${stationIndex + 1}/${INSPECTION_STATIONS.length}`;
    this.$('scan-detail').textContent = `Scanning ${station.name}; reading installed instruments.`;
    this.$('live-current').textContent = `Checking ${station.name} · Capturing camera frame and instrument readings`;
    this.inspectionSession.visitedStations.add(station.id);
    if (station.targetEq) {
      this.inspectionSession.observedEquipment.add(station.targetEq);
    }

    const evidenceId = `EVID-${String(stationIndex + 1).padStart(2, '0')}`;
    this.inspectionSession.evidencePhotos.set(evidenceId, cameraFrameBase64);

    const snap = this.engine.getTelemetrySnapshot();

    // Collect relevant instruments for target equipment
    const relevantTelemetry = {};
    const eqSpec = EQUIPMENT_REGISTER.find(e => e.id === station.targetEq);
    if (eqSpec && eqSpec.instruments) {
      eqSpec.instruments.forEach(inst => {
        let val = inst.defaultVal;
        let st = 'NORMAL';

        // Read live dynamic values
        if (inst.tag === 'P-301.TT-BRG') {
          val = +snap.temperatures['P-301_brg'].toFixed(1);
          if (val >= 90.0) st = 'ALARM';
          else if (val >= 75.0) st = 'WARNING';
        } else if (inst.tag === 'F-301.DPT') {
          val = +snap.pressures['F-301_dp'].toFixed(2);
          if (val >= 2.2) st = 'ALARM';
          else if (val >= 1.5) st = 'WARNING';
        } else if (inst.tag === 'R-101.TT-01') {
          val = +snap.temperatures['R-101_proc'].toFixed(1);
        } else if (inst.tag === 'R-101.LT-01') {
          val = +snap.levels['R-101'].toFixed(1);
        } else if (inst.tag === 'BL-301.TT-01') {
          val = +snap.temperatures['BL-301_proc'].toFixed(1);
        } else if (inst.tag === 'WS-401.WT-01') {
          val = +snap.analyticals['container_mass_kg'].toFixed(1);
        } else if (inst.tag === 'GD-901.AT-01') {
          val = snap.gasDetectorLel;
          if (val >= 20) st = 'ALARM';
          else if (val >= 10) st = 'WARNING';
        }

        relevantTelemetry[inst.tag] = {
          value: val,
          unit: inst.unit,
          type: inst.type,
          warnMin: inst.warnMin,
          alarmMin: inst.alarmMin,
          warnMax: inst.warnMax,
          alarmMax: inst.alarmMax,
          state: st
        };
      });
    }

    // Call server AI endpoint (or deterministic fallback)
    const payload = {
      inspectionId: this.inspectionSession.id,
      stationId: station.id,
      stationName: station.name,
      equipmentIds: station.targetEq ? [station.targetEq] : [],
      cameraImageBase64: cameraFrameBase64,
      telemetry: relevantTelemetry,
      thresholds: eqSpec?.instruments?.map(i => ({ tag: i.tag, warnMax: i.warnMax, alarmMax: i.alarmMax })) || [],
      evidenceId
    };

    const res = await this.metaClient.analyzeStationEvidence(payload);
    if (currentSession !== this.inspectionSession || currentSession.status !== 'In Progress') return;
    const spokenFindings = [];
    if (res && res.finding) {
      res.finding.evidenceId = evidenceId;
      res.finding.thumbnailUrl = cameraFrameBase64;
      res.finding.stationName = station.name;
      this.inspectionSession.findings.push(res.finding);
      this.appendLiveFinding(res.finding);
      spokenFindings.push(res.finding);
      const alarm = res.finding.severity === 'CRITICAL' || res.finding.severity === 'WARNING';
      this.rover.setAlert(alarm);
      this.$('scan-hud').classList.toggle('alarm', alarm);
      this.$('scan-title').textContent = `${station.targetEq || 'AREA'} • ${res.finding.severity}`;
      this.$('scan-detail').textContent = `${res.finding.observation} ${res.finding.source === 'Simulation telemetry only' ? '(telemetry only)' : '(Meta camera analysis)'}`;
    }

    const modelConfirmsVisual = pattern => res?.finding?.source === 'Meta Muse Spark image analysis'
      && ['WARNING', 'CRITICAL'].includes(res.finding.severity)
      && res.finding.confidence >= 0.55
      && pattern.test(res.finding.observation || '')
      && !/(?:no|not|cannot|can't|unclear|obscured|unable).{0,50}(?:visible|seen|confirm|spill|puddle|pipe|particle)/i.test(res.finding.observation || '');
    if (station.isSpillZone && this.scenarioManager.getScenario().spill && !modelConfirmsVisual(/spill|puddle|pooling/i)) {
      const spillFinding = {
        inspectionId: this.inspectionSession.id,
        equipmentOrLocation: 'P-301 floor zone',
        evidenceIds: [evidenceId], evidenceId, thumbnailUrl: cameraFrameBase64,
        observation: 'The defective scenario contains a visible floor puddle near P-301. Review the captured frame.',
        measurementComparison: 'Visual hazard fixture; no chemical identity or measured concentration available.',
        severity: 'WARNING', confidence: 0,
        uncertainty: 'Scenario ground truth only. Photo needs human review; do not treat as an AI visual detection.',
        suggestedFollowUp: 'Review the captured frame and inspect the floor zone in person only under site safety procedures.',
        source: 'Simulation ground truth'
      };
      this.inspectionSession.findings.push(spillFinding);
      this.appendLiveFinding(spillFinding);
      spokenFindings.push(spillFinding);
      this.rover.setAlert(true);
      this.$('scan-hud').classList.add('alarm');
      this.$('scan-detail').textContent = spillFinding.observation;
    }

    const seededVisualChecks = [
      { target: 'P-103', pattern: /(?:cut|broken|discontinu|gap|separat).{0,45}pipe|pipe.{0,45}(?:cut|broken|discontinu|gap|separat)/i,
        place: 'L-SOLV-02 pipe near P-103', severity: 'CRITICAL',
        observation: 'The defective scenario contains a physical gap in L-SOLV-02 and a vapor effect. Review the captured frame.',
        comparison: 'GD-901 simulated detector reads 23.4% LEL; demonstration alarm begins at 20% LEL.' },
      { target: 'F-301', pattern: /particl|impurit|contamin|sediment/i,
        place: 'F-301 sample sight glass', severity: 'WARNING',
        observation: 'The defective scenario contains dark particles in the F-301 sample sight glass. Review the captured frame.',
        comparison: 'Sample composition is unknown; filter differential pressure is recorded separately.' }
    ];
    if (this.scenarioManager.currentScenario === 'defective') for (const check of seededVisualChecks) {
      if (station.targetEq !== check.target || modelConfirmsVisual(check.pattern)) continue;
      const seededFinding = {
        inspectionId: this.inspectionSession.id, equipmentOrLocation: check.place,
        evidenceIds: [evidenceId], evidenceId, thumbnailUrl: cameraFrameBase64,
        observation: check.observation, measurementComparison: check.comparison,
        severity: check.severity, confidence: 0,
        uncertainty: 'Simulation ground truth only. The captured photo requires human review; do not treat this as a Meta visual detection.',
        suggestedFollowUp: 'Review the captured frame and simulated sensor reading.', source: 'Simulation ground truth'
      };
      this.inspectionSession.findings.push(seededFinding);
      this.appendLiveFinding(seededFinding);
      spokenFindings.push(seededFinding);
      this.rover.setAlert(true);
      this.$('scan-hud').classList.add('alarm');
    }

    // If last station, conclude
    if (stationIndex === INSPECTION_STATIONS.length - 1) {
      this.inspectionSession.endTime = new Date();
      this.inspectionSession.status = 'Completed';
      this.$('scan-title').textContent = 'SCOUT-01 • INSPECTION COMPLETE';
      this.$('scan-detail').textContent = `Observed ${this.inspectionSession.observedEquipment.size}/${EQUIPMENT_REGISTER.length} registered assemblies. Open the report for findings and photos.`;
    }

    this.updateLiveProgress();
    this.updateReportUI();
    for (const speechFinding of spokenFindings) {
      if (currentSession !== this.inspectionSession || !['In Progress', 'Completed'].includes(currentSession.status)) break;
      const keyReading = Object.entries(relevantTelemetry).find(([, reading]) => reading.state === 'ALARM')
        || Object.entries(relevantTelemetry).find(([tag, reading]) => Number.isFinite(Number(reading.value)) && /TT|DPT|TEMP/i.test(tag));
      const measurement = speechFinding.source === 'Simulation ground truth' ? 'seeded scenario condition' : keyReading ? `${Number(keyReading[1].value).toFixed(1)} ${keyReading[1].unit}` : 'camera frame saved';
      const result = speechFinding.severity === 'CRITICAL' ? 'high alarm' : speechFinding.severity === 'WARNING' ? 'warning' : 'normal';
      const spoken = speechFinding.source === 'Meta Muse Spark image analysis' && speechFinding.spokenSummary
        ? speechFinding.spokenSummary
        : `${speechFinding.equipmentOrLocation || station.name}. ${measurement}. ${result}.`;
      await this.announce(spoken, { force: stationIndex === INSPECTION_STATIONS.length - 1 });
    }
    if (stationIndex === INSPECTION_STATIONS.length - 1 && currentSession === this.inspectionSession && currentSession.status === 'Completed') {
      await this.announce('Inspection complete. All 37 assemblies checked.', { force: true });
    }
  }

  stopSpeech() {
    if (this.speechResolve) this.speechResolve();
    else if (this.speechTimer) clearTimeout(this.speechTimer);
    this.speechTimer = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  announce(message, { force = false } = {}) {
    if (!('speechSynthesis' in window) || (!force && (this.inspectionSession.status !== 'In Progress' || this.rover.isPaused || this.rover.state.startsWith('Manual')))) return Promise.resolve();
    if (this.speechResolve) this.stopSpeech();
    const speech = new SpeechSynthesisUtterance(message.slice(0, 120));
    const speed = this.rover.speedMultiplier;
    // Browser speech engines often stall or clip phrases above about 2x.
    // The rover waits for this phrase before advancing, so motion and speech stay aligned.
    speech.rate = speed === 1 ? 0.95 : speed === 2.5 ? 1.4 : 1.8;
    speech.volume = 0.8;
    return new Promise(resolve => {
      const finish = () => {
        if (this.speechResolve !== finish) return;
        if (this.speechTimer) clearTimeout(this.speechTimer);
        this.speechTimer = null;
        this.speechResolve = null;
        resolve();
      };
      this.speechResolve = finish;
      speech.onend = finish;
      speech.onerror = finish;
      const watchdogMs = Math.min(15000, 3000 + message.length * 100 / speech.rate);
      this.speechTimer = setTimeout(() => { window.speechSynthesis.cancel(); finish(); }, watchdogMs);
      try { window.speechSynthesis.speak(speech); } catch { finish(); }
    });
  }

  appendLiveFinding(finding) {
    const list = this.$('live-findings-list');
    const card = document.createElement('article');
    card.className = 'live-finding';
    const photo = document.createElement('img');
    photo.src = finding.thumbnailUrl || '';
    photo.alt = `Captured frame for ${finding.equipmentOrLocation}`;
    const detail = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = finding.equipmentOrLocation;
    const result = document.createElement('p');
    result.textContent = finding.observation;
    const source = document.createElement('small');
    source.textContent = `${new Date().toLocaleTimeString()} · ${finding.source}`;
    detail.append(title, result, source);
    const badge = document.createElement('span');
    badge.className = `finding-badge ${finding.severity.toLowerCase()}`;
    badge.textContent = finding.severity;
    card.append(photo, detail, badge);
    list.prepend(card);
    while (list.children.length > 24) list.lastElementChild.remove();
  }

  updateLiveProgress() {
    const visited = this.inspectionSession.visitedStations.size;
    this.$('live-progress').textContent = `${visited} / ${INSPECTION_STATIONS.length} checked`;
    const state = this.inspectionSession.status === 'In Progress' ? this.rover.state : this.inspectionSession.status;
    this.$('live-status').textContent = `${state} · ${visited}/${INSPECTION_STATIONS.length} assemblies · ${this.rover.speedMultiplier}× speed`;
  }

  updateTopBar() {
    const snap = this.engine.getTelemetrySnapshot();
    const sc = this.scenarioManager.getScenario();
    if (this.inspectionSession.status === 'In Progress' && this.rover.state === 'Route Blocked') {
      this.stopSpeech();
      this.inspectionSession.status = 'Route Blocked';
      this.inspectionSession.endTime = new Date();
      this.$('travel-scan-status').textContent = 'Robot route blocked. Review the completed checks and reset to Dock.';
      this.$('scan-title').textContent = 'SCOUT-01 • ROUTE BLOCKED';
      this.$('scan-detail').textContent = 'Inspection halted before full coverage.';
      this.updateReportUI();
    }

    this.$('topbar-stage').textContent = `${snap.stage.id.toUpperCase()}: ${snap.stage.name}`;
    this.$('topbar-stage-desc').textContent = snap.stage.desc;

    // Batch ID badges
    this.$('batch-reactor-pill').textContent = snap.batchReactor;
    this.$('batch-downstream-pill').textContent = snap.batchDownstream;

    // Inspection status
    this.$('topbar-inspection-status').textContent = this.rover.state;
    if (this.activeView === 'inspection') this.updateLiveProgress();
  }

  async updateAiStatusBadge() {
    const st = await this.metaClient.checkServerStatus();
    const pill = this.$('ai-status-pill');
    pill.title = st.statusMessage || '';
    if (st.configured && st.authenticated === true) {
      pill.textContent = 'Meta vision · connected';
      pill.className = 'status-pill ready';
    } else if (st.configured) {
      pill.textContent = 'Meta vision · check connection';
      pill.className = 'status-pill unconfigured';
    } else {
      pill.textContent = st.statusMessage?.includes('endpoint unavailable') ? 'Local preview · sensor demo' : 'Camera analysis · not configured';
      pill.className = 'status-pill unconfigured';
    }
  }

  updateTelemetryBar() {
    const snap = this.engine.getTelemetrySnapshot();

    this.$('telem-stage-progress').style.width = `${((snap.stageIndex + 1) / snap.totalStages) * 100}%`;
    this.$('telem-r101-temp').textContent = `${snap.temperatures['R-101_proc'].toFixed(1)} °C`;
    this.$('telem-r101-level').textContent = `${snap.levels['R-101'].toFixed(1)} %`;
    this.$('telem-bl301-temp').textContent = `${snap.temperatures['BL-301_proc'].toFixed(1)} °C`;

    // Filter DP & Alarm Indicator
    const dpElem = this.$('telem-f301-dp');
    dpElem.textContent = `${snap.pressures['F-301_dp'].toFixed(2)} bar`;
    dpElem.className = snap.pressures['F-301_dp'] >= 2.2 ? 'badge-alarm' : 'badge-normal';

    // Pump Bearing Temp & Alarm Indicator
    const brgElem = this.$('telem-p301-brg');
    brgElem.textContent = `${snap.temperatures['P-301_brg'].toFixed(1)} °C`;
    brgElem.className = snap.temperatures['P-301_brg'] >= 90.0 ? 'badge-alarm' : snap.temperatures['P-301_brg'] >= 75.0 ? 'badge-warn' : 'badge-normal';

    this.$('telem-container-mass').textContent = `${snap.analyticals['container_mass_kg'].toFixed(1)} kg`;
    this.$('telem-acid-val').textContent = `${snap.analyticals['acid_value'].toFixed(1)} mg KOH/g`;
  }

  renderEquipmentList(searchQuery = '', groupFilter = 'All') {
    const container = this.$('eq-list-container');
    const query = searchQuery.toLowerCase().trim();

    const filtered = EQUIPMENT_REGISTER.filter(eq => {
      const matchGroup = groupFilter === 'All' || eq.group === groupFilter;
      const matchQuery = !query ||
        eq.id.toLowerCase().includes(query) ||
        eq.name.toLowerCase().includes(query) ||
        eq.fn.toLowerCase().includes(query);
      return matchGroup && matchQuery;
    });

    container.innerHTML = filtered.map(eq => `
      <div class="equipment-card" data-eq="${eq.id}">
        <div class="eq-header">
          <span class="eq-id">${eq.id}</span>
          <span class="eq-group">${eq.group}</span>
        </div>
        <div class="eq-name">${eq.name}</div>
        <div class="eq-desc">${eq.fn}</div>
        <div class="eq-actions">
          <button class="btn-sm btn-inspect" data-eq="${eq.id}">Locate in 3D</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.equipment-card').forEach(card => {
      card.onclick = () => {
        const id = card.dataset.eq;
        this.openEquipmentInScene(id);
      };
    });
  }

  openEquipmentInScene(eqId) {
    if (this.activeView === 'pfd') {
      document.body.classList.add('equipment-preview-open');
      this.$('equipment-preview-title').textContent = `${eqId} · ${EQUIPMENT_REGISTER.find(eq => eq.id === eqId)?.name || 'Assembly'}`;
      this.onPreviewChanged?.();
      this.selectEquipment(eqId, { distant: true });
      document.querySelector('.viewport-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (!this.canEnter?.()) {
      this.pendingEquipmentId = eqId;
      this.switchView('access');
      return;
    }
    this.switchView('explore');
    this.selectEquipment(eqId);
  }

  selectEquipment(eqId, options = {}) {
    this.selectedEquipment = EQUIPMENT_REGISTER.find(e => e.id === eqId);
    if (!this.selectedEquipment) return;

    this.highlightEquipmentInScene(eqId, options);
    this.openEquipmentDetailsDrawer(this.selectedEquipment);
  }

  openEquipmentDetailsDrawer(eq) {
    const drawer = this.$('equipment-details-modal');
    drawer.classList.remove('hidden');

    this.$('modal-eq-title').textContent = `${eq.id} — ${eq.name}`;
    this.$('modal-eq-group').textContent = eq.group;
    this.$('modal-eq-fn').textContent = eq.fn;

    // Upstream / Downstream lines from connection graph
    const upLines = CONNECTION_LINES.filter(l => l.to.eq === eq.id);
    const downLines = CONNECTION_LINES.filter(l => l.from.eq === eq.id);

    this.$('modal-eq-conn').innerHTML = `
      <p><b>Upstream Lines:</b> ${upLines.length ? upLines.map(l => `${l.id} (${l.from.eq})`).join(', ') : 'None (Feed Interface)'}</p>
      <p><b>Downstream Lines:</b> ${downLines.length ? downLines.map(l => `${l.id} (${l.to.eq})`).join(', ') : 'None (Terminal Unit)'}</p>
    `;

    // Dynamic Instruments
    const snap = this.engine.getTelemetrySnapshot();
    this.$('modal-eq-instruments').innerHTML = (eq.instruments || []).map(inst => {
      let val = inst.defaultVal;
      if (inst.tag === 'P-301.TT-BRG') val = `${snap.temperatures['P-301_brg'].toFixed(1)}`;
      if (inst.tag === 'F-301.DPT') val = `${snap.pressures['F-301_dp'].toFixed(2)}`;
      if (inst.tag === 'R-101.TT-01') val = `${snap.temperatures['R-101_proc'].toFixed(1)}`;
      if (inst.tag === 'R-101.LT-01') val = `${snap.levels['R-101'].toFixed(1)}`;

      return `
        <div class="instrument-row">
          <span class="inst-tag">${inst.tag}</span>
          <span class="inst-type">${inst.type}</span>
          <span class="inst-val">${val} ${inst.unit}</span>
          <span class="inst-range">Expected: ${inst.normalMin ?? 0} - ${inst.normalMax ?? 100} ${inst.unit}</span>
        </div>
      `;
    }).join('') || '<p>No live instruments installed on this passive assembly.</p>';
  }

  renderPfd() {
    const container = this.$('pfd-container');
    container.innerHTML = `
      <div class="pfd-schematic">
        <h3>Solvent-Assisted Batch Alkyd Resin Process Flow Diagram</h3>
        <p class="micro">Shared data model topology driven directly from <code>data/graph.js</code>.</p>
        <div class="pfd-grid">
          ${EQUIPMENT_REGISTER.map(eq => {
            const up = CONNECTION_LINES.filter(l => l.to.eq === eq.id).map(l => l.from.eq).join(', ') || 'Inlet';
            const down = CONNECTION_LINES.filter(l => l.from.eq === eq.id).map(l => l.to.eq).join(', ') || 'Discharge';
            return `
              <div class="pfd-card" data-eq="${eq.id}">
                <div class="pfd-card-header">${eq.id}</div>
                <div class="pfd-card-name">${eq.name}</div>
                <div class="pfd-card-flow">In: ${up} &rarr; Out: ${down}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.pfd-card').forEach(card => {
      card.onclick = () => {
        this.openEquipmentInScene(card.dataset.eq);
      };
    });
  }

  updateReportUI(force = false) {
    if (!force && this.activeView !== 'report') return;
    const now = performance.now();
    if (!force && now - this.lastReportRender < 3000) return;
    this.lastReportRender = now;
    const report = this.reportSessions.get(this.reportScenario) || this.makeEmptyReport(this.reportScenario);
    document.querySelectorAll('.report-tab').forEach(b => b.classList.toggle('active', b.dataset.report === this.reportScenario));
    const snap = this.engine.getTelemetrySnapshot();

    this.$('rep-id').textContent = report.id;
    this.$('rep-scenario').textContent = report.scenario.toUpperCase();
    this.$('rep-status').textContent = report.status;
    this.$('rep-start').textContent = report.startTime ? report.startTime.toLocaleTimeString() : '--:--:--';
    this.$('rep-end').textContent = report.endTime ? report.endTime.toLocaleTimeString() : '--:--:--';

    const visitedCount = report.visitedStations.size;
    const totalStations = INSPECTION_STATIONS.length;
    const observedCount = report.observedEquipment.size;
    const totalEquipment = EQUIPMENT_REGISTER.length;
    const coveragePercent = Math.round((visitedCount / totalStations) * 100);

    this.$('rep-coverage-stat').textContent = `${visitedCount}/${totalStations} Stations (${coveragePercent}%)`;
    this.$('rep-observed-stat').textContent = `${observedCount}/${totalEquipment} Visited Assemblies`;

    // Calculate Overall Conclusion
    const criticals = report.findings.filter(f => f.severity === 'CRITICAL');
    const warnings = report.findings.filter(f => f.severity === 'WARNING');

    let overallConclusion = 'Inspection has not run.';
    let conclusionClass = 'conclusion-normal';

    if (report.status === 'Not Started') {
      overallConclusion = 'Inspection has not run.';
      conclusionClass = 'conclusion-incomplete';
    } else if (report.status === 'Interrupted' || report.status === 'Stopped') {
      overallConclusion = `Inspection ${report.status.toLowerCase()} after ${visitedCount}/${totalStations} stops. Findings below cover only the stops reached.`;
      conclusionClass = 'conclusion-incomplete';
    } else if (report.status === 'Route Blocked') {
      overallConclusion = 'Inspection could not start because the route is blocked.';
      conclusionClass = 'conclusion-incomplete';
    } else if (report.status === 'In Progress') {
      overallConclusion = `Inspection in progress: ${visitedCount}/${totalStations} stops reached.`;
      conclusionClass = 'conclusion-incomplete';
    } else if (criticals.length > 0 || warnings.length > 0) {
      overallConclusion = `Anomalies detected: ${criticals.length} critical condition(s) and ${warnings.length} warning(s) observed.`;
      conclusionClass = 'conclusion-anomaly';
    } else {
      overallConclusion = 'No threshold alarms found in sampled simulated telemetry. Unreviewed camera frames may contain undetected defects.';
    }

    const conclusionElem = this.$('rep-conclusion');
    conclusionElem.textContent = overallConclusion;
    conclusionElem.className = `report-conclusion ${conclusionClass}`;

    // Render Findings Cards with Clickable Highlight
    const findingsContainer = this.$('rep-findings-list');
    const travel = report.travelObservations || [];
    const visibleTravel = this.travelLogExpanded ? travel : travel.slice(-32);
    this.$('btn-toggle-travel-log').textContent = this.travelLogExpanded ? 'Show recent scans' : `Show full log (${travel.length})`;
    this.$('rep-travel-log').innerHTML = travel.length ? `${this.travelLogExpanded ? '' : `<p class="travel-log-summary">Showing the latest ${visibleTravel.length} of ${travel.length} checks. Export JSON for the complete log.</p>`}${visibleTravel.map(item => `<div class="travel-log-row"><b>${escapeHtml(item.phase.toUpperCase())}</b><span>${escapeHtml(item.station)}</span><span>${escapeHtml(item.result)}</span><small>${escapeHtml(item.source)}</small></div>`).join('')}` : '<p class="micro">No travel scans recorded yet.</p>';
    if (report.findings.length === 0) {
      findingsContainer.innerHTML = '<p class="micro">No inspection stops logged yet. Launch "Start Inspection" to gather findings.</p>';
    } else {
      findingsContainer.innerHTML = report.findings.map((f, index) => {
        const evidenceNote = f.source === 'Meta Muse Spark image analysis'
          ? `<p><b>Visual assessment:</b> ${(f.confidence * 100).toFixed(0)}% confidence — ${escapeHtml(f.uncertainty)}</p>`
          : f.source === 'Simulation ground truth'
            ? '<p><b>Evidence status:</b> Seeded fault in the simulation; visual confirmation pending.</p>'
            : '<p><b>Evidence status:</b> Simulated sensor check; photo saved for review.</p>';
        const sourceLabel = f.source === 'Meta Muse Spark image analysis' ? 'Camera analysis'
          : f.source === 'Simulation ground truth' ? 'Seeded fault' : 'Simulated sensor';
        return `
          <div class="finding-card ${f.severity.toLowerCase()} ${this.selectedEvidenceIndex === index ? 'evidence-selected' : ''}">
            <div class="finding-header">
              <span class="finding-eq">${escapeHtml(f.equipmentOrLocation)}</span>
              <span class="finding-badge ${f.severity.toLowerCase()}">${f.severity}</span>
              <span class="finding-evidence">${escapeHtml(f.evidenceIds.join(', '))} • ${sourceLabel}</span>
            </div>
            <div class="finding-body">
              ${f.thumbnailUrl ? `<img src="${f.thumbnailUrl}" class="evidence-thumb" alt="Captured Frame" />` : ''}
              <div class="finding-details">
                <p><b>Observation:</b> ${escapeHtml(f.observation)}</p>
                <p><b>Measurement Comparison:</b> ${escapeHtml(f.measurementComparison)}</p>
                ${evidenceNote}
                <p class="finding-action"><b>Recommended Follow-up:</b> ${escapeHtml(f.suggestedFollowUp)}</p>
              </div>
            </div>
            <div class="finding-footer">
              <button class="btn-sm btn-view-evidence" data-finding-index="${index}">
                View full photo & evidence
              </button>
            </div>
          </div>
        `;
      }).join('');

      findingsContainer.querySelectorAll('.btn-view-evidence').forEach(btn => {
        btn.onclick = () => this.showEvidenceFinding(report, Number(btn.dataset.findingIndex));
      });
    }

    // Equipment Coverage Table
    this.$('rep-coverage-table').innerHTML = EQUIPMENT_REGISTER.map(eq => {
      const isObserved = report.observedEquipment.has(eq.id);
      return `
        <tr>
          <td><b>${eq.id}</b></td>
          <td>${eq.name}</td>
          <td>${eq.group}</td>
          <td><span class="badge-${isObserved ? 'normal' : 'incomplete'}">${isObserved ? 'OBSERVED' : 'SKIPPED / UNREACHED'}</span></td>
        </tr>
      `;
    }).join('');
  }

  showEvidenceFinding(report, index) {
    const finding = report.findings[index];
    if (!finding) return;
    this.selectedEvidenceIndex = index;
    document.querySelectorAll('.finding-card').forEach((card, cardIndex) => card.classList.toggle('evidence-selected', cardIndex === index));
    this.$('evidence-viewer-title').textContent = `${finding.equipmentOrLocation} · ${finding.severity}`;
    this.$('evidence-viewer-tag').textContent = `${finding.evidenceIds.join(', ')} · ${finding.equipmentOrLocation}`;
    this.$('evidence-viewer-note').textContent = `${finding.observation} ${finding.measurementComparison}`;
    const visualBox = this.$('evidence-visual-box');
    if (finding.source === 'Meta Muse Spark image analysis' && Array.isArray(finding.visualBox)) {
      const [left, top, right, bottom] = finding.visualBox;
      Object.assign(visualBox.style, { left: `${left * 100}%`, top: `${top * 100}%`, width: `${(right - left) * 100}%`, height: `${(bottom - top) * 100}%` });
      visualBox.classList.remove('hidden');
      this.$('evidence-viewer-source').textContent = `Evidence source: ${finding.source}. Orange box is a model-estimated visual location; review the full frame.`;
    } else {
      visualBox.classList.add('hidden');
      this.$('evidence-viewer-source').textContent = `Evidence source: ${finding.source}. No visual location was confirmed for this frame.`;
    }
    const image = this.$('evidence-viewer-image');
    image.src = finding.thumbnailUrl || report.evidencePhotos.get(finding.evidenceId) || '';
    image.alt = `Full captured robot frame for ${finding.equipmentOrLocation}`;
    const viewer = this.$('report-evidence-viewer');
    viewer.classList.remove('hidden');
    viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  downloadReportJson() {
    const report = this.reportSessions.get(this.reportScenario) || this.makeEmptyReport(this.reportScenario);
    const data = {
      reportType: 'PlantScout Robot Inspection Report',
      facility: `PlantScout Alkyd-Resin Process Basement ${report.scenario === 'normal' ? '1' : '2'}`,
      processRoute: 'Solvent-assisted batch alkyd resin (fatty acid route)',
      inspectionId: report.id,
      scenario: report.scenario,
      startTime: report.startTime,
      endTime: report.endTime,
      stageAtInspection: report.stageAtStart,
      conclusion: this.$('rep-conclusion').textContent,
      coverageSummary: {
        visitedStations: Array.from(report.visitedStations),
        observedEquipment: Array.from(report.observedEquipment),
        totalStations: INSPECTION_STATIONS.length,
        totalEquipment: EQUIPMENT_REGISTER.length
      },
      findings: report.findings.map(f => ({
        equipmentOrLocation: f.equipmentOrLocation,
        severity: f.severity,
        observation: f.observation,
        measurementComparison: f.measurementComparison,
        confidence: f.confidence,
        uncertainty: f.uncertainty,
        source: f.source,
        spokenSummary: f.spokenSummary || null,
        visualBox: f.visualBox || null,
        suggestedFollowUp: f.suggestedFollowUp,
        evidenceIds: f.evidenceIds
      })),
      travelObservations: report.travelObservations || [],
      evidenceImages: Array.from(report.evidencePhotos.entries()).map(([id, image]) => ({ id, image })),
      disclaimer: 'Educational software simulation report. Not certified for industrial chemical safety or human entry.'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantscout-report-${report.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
