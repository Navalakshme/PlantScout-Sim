// Separates measured simulation telemetry from optional Meta camera analysis.
export class MetaInspectionClient {
  constructor() {
    this.status = { configured: false, model: 'muse-spark-1.3', statusMessage: 'Checking Meta connection…' };
    this.requestCounter = 0;
    this.stationCounter = 0;
    this.maxRequestsPerInspection = 10;
    this.consecutiveFailures = 0;
  }

  async checkServerStatus() {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.status = await response.json();
    } catch {
      this.status = { configured: false, model: 'muse-spark-1.3', statusMessage: 'Meta endpoint unavailable; telemetry checks only.' };
    }
    return this.status;
  }

  resetBudget() {
    this.requestCounter = 0;
    this.stationCounter = 0;
    this.consecutiveFailures = 0;
  }

  checkTelemetry(payload) {
    let severity = 'NORMAL';
    const comparisons = [];
    const alarms = [];
    for (const [tag, reading] of Object.entries(payload.telemetry || {})) {
      const value = Number(reading.value);
      if (!Number.isFinite(value)) continue;
      const alarm = (reading.alarmMax != null && value >= reading.alarmMax) || (reading.alarmMin != null && value <= reading.alarmMin) || reading.state === 'ALARM';
      const warning = (reading.warnMax != null && value >= reading.warnMax) || (reading.warnMin != null && value <= reading.warnMin) || reading.state === 'WARNING';
      comparisons.push(`${tag}: ${value} ${reading.unit || ''}${reading.alarmMax != null ? ` (alarm ≥${reading.alarmMax})` : ''}`);
      if (alarm) { severity = 'CRITICAL'; alarms.push(`${tag} is beyond its simulated alarm limit`); }
      else if (warning) { if (severity !== 'CRITICAL') severity = 'WARNING'; alarms.push(`${tag} is beyond its simulated warning limit`); }
    }
    return {
      inspectionId: payload.inspectionId,
      equipmentOrLocation: payload.equipmentIds?.[0] || payload.stationName,
      evidenceIds: [payload.evidenceId],
      observation: alarms.length ? alarms.join('; ') : 'Recorded simulated instrument readings; camera frame has not been interpreted by AI.',
      measurementComparison: comparisons.join('; ') || 'No instrument measurement at this assembly.',
      severity,
      confidence: 0,
      uncertainty: 'Visual condition unknown unless a separate Meta image finding is available. Sensor values are simulated.',
      suggestedFollowUp: alarms.length ? 'Review the indicated equipment and camera image.' : 'Continue route; review photo manually if needed.',
      source: 'Simulation telemetry only'
    };
  }

  async analyzeStationEvidence(payload) {
    const telemetryFinding = this.checkTelemetry(payload);
    const stationNumber = this.stationCounter++;
    const hasAlarm = telemetryFinding.severity !== 'NORMAL';
    const sampleStation = stationNumber > 0 && stationNumber % 6 === 0;
    const mustInspectImage = payload.stationId === 'STATION-17';
    if (!this.status.configured || this.consecutiveFailures >= 2 || this.requestCounter >= this.maxRequestsPerInspection || !(hasAlarm || sampleStation || mustInspectImage)) {
      if (this.consecutiveFailures >= 2) telemetryFinding.uncertainty += ' Meta image checks paused after repeated errors to protect credits.';
      return { success: true, aiConfigured: false, finding: telemetryFinding };
    }
    this.requestCounter++;
    try {
      const response = await fetch('/api/analyze-station', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`Meta request returned HTTP ${response.status}`);
      const result = await response.json();
      if (!result.finding || !Array.isArray(result.finding.evidenceIds)) throw new Error('Invalid Meta finding');
      this.consecutiveFailures = 0;
      result.finding.evidenceIds = [payload.evidenceId];
      // Instrument alarms are deterministic and must survive a missed visual inference.
      if (telemetryFinding.severity === 'CRITICAL' && result.finding.severity !== 'CRITICAL') {
        result.finding.severity = 'CRITICAL';
        result.finding.measurementComparison += `; ${telemetryFinding.measurementComparison}`;
      }
      return result;
    } catch (error) {
      this.consecutiveFailures++;
      telemetryFinding.uncertainty += ` Meta image request failed: ${error.message}.`;
      return { success: false, aiConfigured: false, finding: telemetryFinding };
    }
  }
}
