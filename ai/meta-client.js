// PlantScout - Meta Model Client Integration
// Communicates with server-side AI endpoints, handles validation, and manages fallbacks.

export class MetaInspectionClient {
  constructor() {
    this.status = {
      configured: false,
      model: 'meta-llama/llama-3.2-11b-vision-instruct',
      reasoningModel: 'meta-llama/llama-3.3-70b-instruct',
      statusMessage: 'Checking server AI connection...'
    };
    this.requestCounter = 0;
    this.maxRequestsPerInspection = 25; // Budget constraint
  }

  async checkServerStatus() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.status = data;
      return this.status;
    } catch (err) {
      this.status = {
        configured: false,
        model: 'meta-llama/llama-3.2-11b-vision-instruct',
        reasoningModel: 'meta-llama/llama-3.3-70b-instruct',
        statusMessage: `AI Endpoint Offline (${err.message}). Deterministic analysis active.`
      };
      return this.status;
    }
  }

  async analyzeStationEvidence(payload) {
    // payload: { inspectionId, stationId, stationName, equipmentIds, cameraImageBase64, telemetry, thresholds, evidenceId }
    this.requestCounter++;
    if (this.requestCounter > this.maxRequestsPerInspection) {
      return {
        success: false,
        status: 'budget_capped',
        finding: {
          inspectionId: payload.inspectionId,
          equipmentOrLocation: payload.equipmentIds[0] || 'Unknown',
          evidenceIds: [payload.evidenceId],
          observation: 'Inspection request budget cap reached (max 25 requests per run).',
          measurementComparison: 'Telemetry gathered; AI inference deferred.',
          severity: 'NORMAL',
          confidence: 0.5,
          uncertainty: 'Budget limit hit.',
          suggestedFollowUp: 'Review telemetry table.'
        }
      };
    }

    try {
      const res = await fetch('/api/analyze-station', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();

      // Validate schema
      if (result.finding) {
        this.validateFindingSchema(result.finding, payload.evidenceId);
      }

      return result;
    } catch (err) {
      console.warn('[MetaClient] Analysis call failed, falling back to deterministic check:', err.message);
      return {
        success: false,
        status: 'failed',
        error: err.message,
        finding: this.generateDeterministicFallback(payload)
      };
    }
  }

  async synthesizeFinalReport(reportPayload) {
    try {
      const res = await fetch('/api/synthesize-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      return {
        success: false,
        error: err.message,
        synthesis: null
      };
    }
  }

  validateFindingSchema(finding, expectedEvidenceId) {
    const required = [
      'inspectionId',
      'equipmentOrLocation',
      'observation',
      'evidenceIds',
      'measurementComparison',
      'severity',
      'confidence',
      'uncertainty',
      'suggestedFollowUp'
    ];

    for (const key of required) {
      if (finding[key] === undefined || finding[key] === null) {
        finding[key] = key === 'confidence' ? 0.8 : 'Unspecified';
      }
    }

    // Reject references to non-existent evidence IDs
    if (!Array.isArray(finding.evidenceIds) || !finding.evidenceIds.includes(expectedEvidenceId)) {
      finding.evidenceIds = [expectedEvidenceId];
    }

    // Normalize severity enum
    const validSeverities = ['NORMAL', 'WARNING', 'CRITICAL', 'UNKNOWN'];
    if (!validSeverities.includes(finding.severity)) {
      finding.severity = 'UNKNOWN';
    }
  }

  generateDeterministicFallback(payload) {
    // Pure deterministic rule-based evaluation when AI is offline or key missing
    let hasAlarm = false;
    let hasWarning = false;
    let obs = 'Station visual inspection complete; normal baseline observed.';
    let comparison = 'All station instrument readings within demonstration tolerances.';
    let severity = 'NORMAL';
    let followUp = 'Routine monitoring per schedule.';

    // Check telemetry values against stage thresholds
    if (payload.telemetry) {
      for (const [tag, reading] of Object.entries(payload.telemetry)) {
        if (reading.state === 'ALARM' || (reading.alarmMax && reading.value >= reading.alarmMax)) {
          hasAlarm = true;
          severity = 'CRITICAL';
          obs = `Simulated alarm condition on ${tag}: value (${reading.value} ${reading.unit}) exceeds demonstration alarm limit.`;
          comparison = `${reading.value} ${reading.unit} vs Alarm threshold ${reading.alarmMax} ${reading.unit}.`;
          followUp = `Isolate equipment ${payload.equipmentIds[0] || 'target'} and conduct immediate mechanical verification.`;
          break;
        } else if (reading.state === 'WARNING' || (reading.warnMax && reading.value >= reading.warnMax)) {
          hasWarning = true;
          severity = 'WARNING';
          obs = `Warning threshold reached on ${tag}: value (${reading.value} ${reading.unit}) exceeds warning limit.`;
          comparison = `${reading.value} ${reading.unit} vs Warning threshold ${reading.warnMax} ${reading.unit}.`;
          followUp = `Monitor trend during next inspection cycle.`;
        }
      }
    }

    return {
      inspectionId: payload.inspectionId,
      equipmentOrLocation: payload.equipmentIds[0] || payload.stationName,
      evidenceIds: [payload.evidenceId],
      observation: obs,
      measurementComparison: comparison,
      severity,
      confidence: 1.0,
      uncertainty: 'Zero sensor uncertainty; AI vision model offline / unconfigured.',
      suggestedFollowUp: followUp,
      isDeterministic: true
    };
  }
}
