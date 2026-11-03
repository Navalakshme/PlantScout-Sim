// PlantScout - Professional Dark Dashboard Controller
// Fixed left sidebar (5 views), top bar, compact telemetry bar, interactive 3D equipment drawer, and report.

import { EQUIPMENT_REGISTER, INSPECTION_STATIONS } from '../data/equipment.js';
import { CONNECTION_LINES, FLUID_SERVICES } from '../data/graph.js';
import { PROCESS_STAGES } from '../sim/engine.js';
import { galleryZ } from '../data/layout.js';

export class DashboardController {
  constructor(engine, scenarioManager, rover, metaClient, camera, scene, ThreeInstance) {
    this.engine = engine;
    this.scenarioManager = scenarioManager;
    this.rover = rover;
    this.metaClient = metaClient;
    this.camera = camera;
    this.scene = scene;
    this.T = ThreeInstance;

    this.activeView = 'explore'; // 'overview' | 'explore' | 'inspection' | 'report' | 'pfd'
    this.selectedEquipment = null;
    this.highlightBox = null;

    // Inspection session state
    this.inspectionSession = {
      id: 'INSP-INIT',
      scenario: 'normal',
      startTime: null,
      endTime: null,
      stageAtStart: '',
      findings: [],
      evidencePhotos: new Map(), // evidenceId -> dataUrl
      visitedStations: new Set(),
      observedEquipment: new Set(),
      status: 'Not Started'
    };

    this.initElements();
    this.bindEvents();
    this.updateTopBar();
    this.updateAiStatusBadge();
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

  highlightEquipmentInScene(eqId) {
    const eq = EQUIPMENT_REGISTER.find(e => e.id === eqId);
    if (!eq) return;

    this.highlightBox.position.set(eq.position[0], eq.position[1] + eq.dimensions[1] * 0.5, eq.position[2]);
    this.highlightBox.scale.set(eq.dimensions[0] + 0.3, eq.dimensions[1] + 0.3, eq.dimensions[2] + 0.3);
    this.highlightBox.visible = true;

    // Smoothly fly camera to equipment inspection viewpoint
    if (this.camera && eq.viewpoint) {
      this.flyCameraTo(
        [eq.viewpoint[0], 1.75, eq.viewpoint[1]],
        eq.target || eq.position
      );
    }
  }

  highlightSpillInScene() {
    const spillPos = [4.8, 0.2, galleryZ(-3.2)];
    this.highlightBox.position.set(spillPos[0], spillPos[1], spillPos[2]);
    this.highlightBox.scale.set(2.2, 0.4, 1.6);
    this.highlightBox.visible = true;

    if (this.camera) {
      this.flyCameraTo([4.8, 1.6, galleryZ(-1.8)], [4.8, 0.05, galleryZ(-3.2)]);
    }
  }

  flyCameraTo(pos, target) {
    const startPos = this.camera.position.clone();
    const endPos = new this.T.Vector3(...pos);
    const endTarget = new this.T.Vector3(...target);
    const startTarget = new this.T.Vector3();
    this.camera.getWorldDirection(startTarget);
    startTarget.add(startPos);

    let progress = 0;
    const animateFlight = () => {
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
        this.switchView(view);
      };
    });

    // Scenario Selector
    this.$('scenario-select').onchange = e => {
      const newScenario = e.target.value;
      this.setScenario(newScenario);
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
    this.$('btn-start-inspection').onclick = () => this.startNewInspection();
    this.$('btn-pause-inspection').onclick = () => this.rover.pause();
    this.$('btn-reset-dock').onclick = () => this.rover.resetToDock();

    this.$('inspection-speed-select').onchange = e => {
      this.rover.speedMultiplier = Number(e.target.value);
    };

    // View Modes
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
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

    // Close Modals
    this.$('btn-close-eq-drawer').onclick = () => {
      this.$('equipment-drawer').classList.add('hidden');
      this.highlightBox.visible = false;
    };
  }

  switchView(viewName) {
    this.activeView = viewName;
    document.querySelectorAll('.sidebar-nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });

    const isExplore = (viewName === 'explore');
    const isInspection = (viewName === 'inspection');
    const isPfd = (viewName === 'pfd');
    const isReport = (viewName === 'report');

    // Section 8 rule: "Explore complete basement" shows basement without robot
    this.rover.root.visible = !isExplore;

    // Show/hide sub-panels
    this.$('overview-panel').classList.toggle('hidden', viewName !== 'overview');
    this.$('equipment-drawer').classList.toggle('hidden', !isExplore);
    this.$('inspection-panel').classList.toggle('hidden', !isInspection);
    this.$('pfd-panel').classList.toggle('hidden', !isPfd);

    if (isExplore) {
      this.renderEquipmentList();
      this.activeCameraView = 'walk';
    } else if (isInspection) {
      this.activeCameraView = 'follow';
    } else if (isReport) {
      // Scroll directly down to report
      this.$('report-section').scrollIntoView({ behavior: 'smooth' });
    } else if (isPfd) {
      this.renderPfd();
    }
  }

  setScenario(scenarioKey) {
    this.scenarioManager.setScenario(scenarioKey, this.scene, this.T);
    this.rover.resetToDock();
    this.resetInspectionState();
    this.updateTopBar();
    this.updateReportUI();
  }

  startNewInspection() {
    const sc = this.scenarioManager.getScenario();
    const snap = this.engine.getTelemetrySnapshot();

    this.resetInspectionState();
    this.inspectionSession.id = `INSP-${Date.now().toString(36).toUpperCase()}-${sc.id.toUpperCase()}`;
    this.inspectionSession.scenario = sc.id;
    this.inspectionSession.startTime = new Date();
    this.inspectionSession.stageAtStart = snap.stage.name;
    this.inspectionSession.status = 'In Progress';

    this.rover.startAutomaticInspection();
    this.switchView('inspection');
    this.updateTopBar();
    this.updateReportUI();
  }

  resetInspectionState() {
    this.inspectionSession = {
      id: `INSP-${Date.now().toString(36).toUpperCase()}`,
      scenario: this.scenarioManager.currentScenario,
      startTime: null,
      endTime: null,
      stageAtStart: '',
      findings: [],
      evidencePhotos: new Map(),
      visitedStations: new Set(),
      observedEquipment: new Set(),
      status: 'Not Started'
    };
  }

  async handleStationObservation(station, stationIndex, cameraFrameBase64) {
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
          if (val >= 2.2) st = 'WARNING';
        } else if (inst.tag === 'R-101.TT-01') {
          val = +snap.temperatures['R-101_proc'].toFixed(1);
        } else if (inst.tag === 'R-101.LT-01') {
          val = +snap.levels['R-101'].toFixed(1);
        } else if (inst.tag === 'BL-301.TT-01') {
          val = +snap.temperatures['BL-301_proc'].toFixed(1);
        } else if (inst.tag === 'WS-401.WT-01') {
          val = +snap.analyticals['container_mass_kg'].toFixed(1);
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
      isSpillZone: Boolean(station.isSpillZone && this.scenarioManager.currentScenario === 'defective'),
      cameraImageBase64: cameraFrameBase64,
      telemetry: relevantTelemetry,
      thresholds: eqSpec?.instruments?.map(i => ({ tag: i.tag, warnMax: i.warnMax, alarmMax: i.alarmMax })) || [],
      evidenceId
    };

    const res = await this.metaClient.analyzeStationEvidence(payload);
    if (res && res.finding) {
      res.finding.evidenceId = evidenceId;
      res.finding.thumbnailUrl = cameraFrameBase64;
      res.finding.stationName = station.name;
      this.inspectionSession.findings.push(res.finding);
    }

    // If last station, conclude
    if (stationIndex === INSPECTION_STATIONS.length - 1) {
      this.inspectionSession.endTime = new Date();
      this.inspectionSession.status = 'Completed';
    }

    this.updateReportUI();
  }

  updateTopBar() {
    const snap = this.engine.getTelemetrySnapshot();
    const sc = this.scenarioManager.getScenario();

    this.$('topbar-stage').textContent = `${snap.stage.id.toUpperCase()}: ${snap.stage.name}`;
    this.$('topbar-stage-desc').textContent = snap.stage.desc;

    // Batch ID badges
    this.$('batch-reactor-pill').textContent = snap.batchReactor;
    this.$('batch-downstream-pill').textContent = snap.batchDownstream;

    // Inspection status
    this.$('topbar-inspection-status').textContent = this.rover.state;
  }

  async updateAiStatusBadge() {
    const st = await this.metaClient.checkServerStatus();
    const pill = this.$('ai-status-pill');
    if (st.configured) {
      pill.textContent = `Meta Llama 3.2 Vision: Connected`;
      pill.className = 'status-pill ready';
    } else {
      pill.textContent = `Meta AI: Unconfigured (Deterministic Telemetry Mode)`;
      pill.className = 'status-pill unconfigured';
      pill.title = 'Set META_API_KEY on the server to enable live vision inference.';
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
        this.selectEquipment(id);
      };
    });
  }

  selectEquipment(eqId) {
    this.selectedEquipment = EQUIPMENT_REGISTER.find(e => e.id === eqId);
    if (!this.selectedEquipment) return;

    this.highlightEquipmentInScene(eqId);
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
        this.selectEquipment(card.dataset.eq);
        this.switchView('explore');
      };
    });
  }

  updateReportUI() {
    const report = this.inspectionSession;
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
    this.$('rep-observed-stat').textContent = `${observedCount}/${totalEquipment} Verified Assemblies`;

    // Calculate Overall Conclusion
    const criticals = report.findings.filter(f => f.severity === 'CRITICAL');
    const warnings = report.findings.filter(f => f.severity === 'WARNING');

    let overallConclusion = 'No configured anomalies observed in inspected areas.';
    let conclusionClass = 'conclusion-normal';

    if (report.status !== 'Completed') {
      overallConclusion = 'Inspection incomplete: Robot currently in route or docked.';
      conclusionClass = 'conclusion-incomplete';
    } else if (criticals.length > 0 || warnings.length > 0) {
      overallConclusion = `Anomalies detected: ${criticals.length} critical condition(s) and ${warnings.length} warning(s) observed.`;
      conclusionClass = 'conclusion-anomaly';
    }

    const conclusionElem = this.$('rep-conclusion');
    conclusionElem.textContent = overallConclusion;
    conclusionElem.className = `report-conclusion ${conclusionClass}`;

    // Render Findings Cards with Clickable Highlight
    const findingsContainer = this.$('rep-findings-list');
    if (report.findings.length === 0) {
      findingsContainer.innerHTML = '<p class="micro">No inspection stops logged yet. Launch "Start Inspection" to gather findings.</p>';
    } else {
      findingsContainer.innerHTML = report.findings.map(f => {
        const isSpill = f.observation.toLowerCase().includes('spill') || f.observation.toLowerCase().includes('puddle');
        return `
          <div class="finding-card ${f.severity.toLowerCase()}">
            <div class="finding-header">
              <span class="finding-eq">${f.equipmentOrLocation}</span>
              <span class="finding-badge ${f.severity.toLowerCase()}">${f.severity}</span>
              <span class="finding-evidence">${f.evidenceIds.join(', ')}</span>
            </div>
            <div class="finding-body">
              ${f.thumbnailUrl ? `<img src="${f.thumbnailUrl}" class="evidence-thumb" alt="Captured Frame" />` : ''}
              <div class="finding-details">
                <p><b>Observation:</b> ${f.observation}</p>
                <p><b>Measurement Comparison:</b> ${f.measurementComparison}</p>
                <p><b>Confidence & Uncertainty:</b> ${(f.confidence * 100).toFixed(0)}% — ${f.uncertainty}</p>
                <p class="finding-action"><b>Recommended Follow-up:</b> ${f.suggestedFollowUp}</p>
              </div>
            </div>
            <div class="finding-footer">
              <button class="btn-sm btn-highlight-finding" data-target="${f.equipmentOrLocation}" data-is-spill="${isSpill}">
                Locate & Highlight in 3D
              </button>
            </div>
          </div>
        `;
      }).join('');

      findingsContainer.querySelectorAll('.btn-highlight-finding').forEach(btn => {
        btn.onclick = () => {
          const isSpill = btn.dataset.isSpill === 'true';
          const target = btn.dataset.target;
          if (isSpill) {
            this.highlightSpillInScene();
          } else {
            this.selectEquipment(target);
          }
          // Scroll back up to viewport
          document.getElementById('viewport').scrollIntoView({ behavior: 'smooth' });
        };
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

  downloadReportJson() {
    const data = {
      reportType: 'PlantScout Robot Inspection Report',
      facility: 'PlantScout Alkyd-Resin Process Basement B1',
      processRoute: 'Solvent-assisted batch alkyd resin (fatty acid route)',
      inspectionId: this.inspectionSession.id,
      scenario: this.inspectionSession.scenario,
      startTime: this.inspectionSession.startTime,
      endTime: this.inspectionSession.endTime,
      stageAtInspection: this.inspectionSession.stageAtStart,
      conclusion: this.$('rep-conclusion').textContent,
      coverageSummary: {
        visitedStations: Array.from(this.inspectionSession.visitedStations),
        observedEquipment: Array.from(this.inspectionSession.observedEquipment),
        totalStations: INSPECTION_STATIONS.length,
        totalEquipment: EQUIPMENT_REGISTER.length
      },
      findings: this.inspectionSession.findings.map(f => ({
        equipmentOrLocation: f.equipmentOrLocation,
        severity: f.severity,
        observation: f.observation,
        measurementComparison: f.measurementComparison,
        confidence: f.confidence,
        uncertainty: f.uncertainty,
        suggestedFollowUp: f.suggestedFollowUp,
        evidenceIds: f.evidenceIds
      })),
      disclaimer: 'Educational software simulation report. Not certified for industrial chemical safety or human entry.'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantscout-report-${this.inspectionSession.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
