const MODEL = 'muse-spark-1.3';
const BASE = 'https://api.meta.ai/v1';
const inspectionCounts = new Map();

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8_000_000) throw new Error('Image payload exceeds 8 MB');
  }
  return JSON.parse(body || '{}');
}

function cleanFinding(finding, payload) {
  let severity = ['NORMAL', 'WARNING', 'CRITICAL', 'UNKNOWN'].includes(finding.severity) ? finding.severity : 'UNKNOWN';
  const targetNotVisible = /target[^.]{0,100}(?:not visible|not in view|cannot be seen)/i.test(String(finding.observation || ''));
  if (targetNotVisible && severity === 'NORMAL') severity = 'UNKNOWN';
  const box = Array.isArray(finding.visualBox) && finding.visualBox.length === 4
    ? finding.visualBox.map(Number) : null;
  const visualBox = box && box.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
    && box[2] > box[0] && box[3] > box[1] && !targetNotVisible ? box : null;
  return {
    inspectionId: String(payload.inspectionId).slice(0, 100),
    equipmentOrLocation: String(payload.equipmentIds?.[0] || payload.stationName).slice(0, 100),
    evidenceIds: [String(payload.evidenceId).slice(0, 100)],
    observation: String(finding.observation || 'No visual conclusion returned.').slice(0, 1200),
    measurementComparison: String(finding.measurementComparison || 'See recorded telemetry.').slice(0, 800),
    severity,
    confidence: targetNotVisible ? Math.min(0.3, Math.max(0, Number(finding.confidence) || 0)) : Math.min(1, Math.max(0, Number(finding.confidence) || 0)),
    uncertainty: String(finding.uncertainty || 'Visual inference requires human review.').slice(0, 700),
    suggestedFollowUp: String(targetNotVisible ? 'Reposition the mast camera and repeat visual check of the target.' : (finding.suggestedFollowUp || 'Review evidence image and instrument readings.')).slice(0, 800),
    spokenSummary: String(finding.spokenSummary || '').slice(0, 160),
    visualBox,
    source: 'Meta Muse Spark image analysis'
  };
}

async function status(req, res) {
  const configured = Boolean(process.env.META_API_KEY);
  if (req.query?.verify === '1' || new URL(req.url, 'http://local').searchParams.get('verify') === '1') {
    if (!configured) return send(res, 200, { configured: false, authenticated: false, model: MODEL, statusMessage: 'META_API_KEY missing.' });
    try {
      const upstream = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${process.env.META_API_KEY}` }, signal: AbortSignal.timeout(12000) });
      return send(res, 200, { configured, authenticated: upstream.ok, model: MODEL, statusMessage: upstream.ok ? 'Meta Model API authenticated.' : `Meta Model API returned HTTP ${upstream.status}.` });
    } catch {
      return send(res, 200, { configured, authenticated: false, model: MODEL, statusMessage: 'Meta Model API could not be reached.' });
    }
  }
  return send(res, 200, { configured, authenticated: null, model: MODEL, statusMessage: configured ? 'Meta key configured; live authentication not yet checked.' : 'META_API_KEY missing. Camera AI unavailable.' });
}

async function analyze(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST required' });
  if (!process.env.META_API_KEY) return send(res, 503, { error: 'Meta API key is not configured.' });
  let payload;
  try { payload = await bodyOf(req); } catch { return send(res, 400, { error: 'Invalid inspection payload.' }); }
  if (!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(payload.cameraImageBase64 || '') || (payload.cameraImageBase64 || '').length > 8_000_000 || !Array.isArray(payload.equipmentIds)) {
    return send(res, 400, { error: 'Valid camera image and equipment IDs required.' });
  }
  const inspectionId = String(payload.inspectionId || '');
  if (!/^INSP-[A-Z0-9-]{8,80}$/.test(inspectionId)) return send(res, 400, { error: 'Invalid inspection ID.' });
  const used = inspectionCounts.get(inspectionId) || 0;
  if (used >= 10) return send(res, 429, { error: 'This inspection reached its 10-image Meta limit.' });
  inspectionCounts.set(inspectionId, used + 1);
  if (inspectionCounts.size > 500) inspectionCounts.delete(inspectionCounts.keys().next().value);
  const prompt = `Inspect this rendered mast-camera frame from an educational alkyd resin basement simulation. Target: ${String(payload.stationName).slice(0, 100)}. Instrument telemetry: ${JSON.stringify(payload.telemetry).slice(0, 5000)}. Demonstration limits: ${JSON.stringify(payload.thresholds).slice(0, 3500)}. Look carefully for visible floor liquid, a disconnected or cut pipe, a vapor-like plume, and dark particles in a filter sample sight glass. Report only what is actually visible; a gas leak cannot be proven by pixels alone, so cite the simulated % LEL detector separately. Compare measurements numerically. Distinguish visual observations from sensor readings and simulator context. Do not infer chemical identity or particle composition from appearance. If a target is obscured or small, say so. Return only one JSON object with fields observation, measurementComparison, severity (NORMAL/WARNING/CRITICAL/UNKNOWN), confidence (0..1), uncertainty, suggestedFollowUp, spokenSummary (one short sentence for the robot to announce), and visualBox (four normalized 0..1 coordinates [left,top,right,bottom] around a visible defect, or null if no confidently localized defect). The browser will speak your spokenSummary; do not claim this API synthesized audio. This is a simulation, not a real plant safety certification.`;
  try {
    const upstream = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.META_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: payload.cameraImageBase64 } }] }], reasoning_effort: 'minimal', max_completion_tokens: 1200, response_format: { type: 'json_object' } }),
      signal: AbortSignal.timeout(25000)
    });
    if (!upstream.ok) {
      const upstreamError = await upstream.json().catch(() => ({}));
      const detail = String(upstreamError.error?.message || 'No error detail').slice(0, 180);
      console.error('Meta image request rejected', upstream.status, detail);
      return send(res, 502, { error: `Meta Model API returned HTTP ${upstream.status}: ${detail}` });
    }
    const data = await upstream.json();
    const raw = data.choices?.[0]?.message?.content || '';
    if (!raw || !raw.includes('{')) throw new Error(`No JSON content from Meta (finish reason: ${data.choices?.[0]?.finish_reason || 'unknown'}).`);
    const parsed = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    return send(res, 200, { success: true, aiConfigured: true, model: MODEL, finding: cleanFinding(parsed, payload), usage: data.usage || null });
  } catch (error) {
    console.error('Meta image analysis failed', error.name, String(error.message).slice(0, 150));
    return send(res, 502, { error: error.name === 'TimeoutError' ? 'Meta analysis timed out.' : `Meta analysis failed: ${error.name}.` });
  }
}

async function synthesize(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST required' });
  let payload;
  try { payload = await bodyOf(req); } catch { return send(res, 400, { error: 'Invalid report payload.' }); }
  const findings = Array.isArray(payload.findings) ? payload.findings : [];
  const critical = findings.filter(f => f.severity === 'CRITICAL').length;
  const warning = findings.filter(f => f.severity === 'WARNING').length;
  return send(res, 200, { success: true, aiConfigured: false, conclusion: `${critical} critical and ${warning} warning findings in the simulated inspection.`, summary: `Visited ${Number(payload.visitedCount) || 0} of ${Number(payload.totalStations) || 0} stations.` });
}

module.exports = { status, analyze, synthesize };
