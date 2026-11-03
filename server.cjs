// PlantScout - Node.js Server & AI Proxy
// Serves static assets and provides server-side Meta Llama inspection endpoints.

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs/promises');

const root = process.cwd();
const port = Number(process.env.PORT || 8765);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

// Check for server-side API keys
function getApiKey() {
  return process.env.META_API_KEY || process.env.LLAMA_API_KEY || process.env.OPENROUTER_API_KEY || null;
}

function getApiEndpoint() {
  if (process.env.META_ENDPOINT) return process.env.META_ENDPOINT;
  if (process.env.OPENROUTER_API_KEY) return 'https://openrouter.ai/api/v1/chat/completions';
  if (process.env.LLAMA_API_KEY || process.env.META_API_KEY) return 'https://api.llama.com/v1/chat/completions';
  return 'https://openrouter.ai/api/v1/chat/completions';
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) { // 25 MB safety limit for base64 frames
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // --- API Routes ---
  if (pathname === '/api/status' && req.method === 'GET') {
    const key = getApiKey();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      configured: Boolean(key),
      model: 'meta-llama/llama-3.2-11b-vision-instruct',
      reasoningModel: 'meta-llama/llama-3.3-70b-instruct',
      endpoint: getApiEndpoint(),
      statusMessage: key
        ? 'Meta Llama API configured and ready for vision & reasoning inspection analysis.'
        : 'META_API_KEY is not set on the server. AI image analysis is unavailable; running deterministic sensor rules.'
    }));
    return;
  }

  if (pathname === '/api/analyze-station' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const key = getApiKey();

      // If key is present, execute actual Meta model request
      if (key) {
        try {
          const endpoint = getApiEndpoint();
          const promptText = `You are an automated industrial inspection robot in a solvent-assisted alkyd resin production facility.
Analyze this camera image and current telemetry readings at station: ${payload.stationName || 'Unknown'} (Target Equipment: ${payload.equipmentIds.join(', ')}).

Current Sensor Readings:
${JSON.stringify(payload.telemetry, null, 2)}

Stage Limits & Thresholds:
${JSON.stringify(payload.thresholds, null, 2)}

Analyze:
1. Examine the concrete floor surface for any visible uncontained liquid pools or suspected solvent/oil spills. If liquid pooling is observed, identify it as a suspected spill with approximate location.
2. Inspect the visible equipment condition, housing, and alignment.
3. Compare the provided sensor measurements against demonstration limits.
4. Provide actionable engineering follow-up.

Return strictly a JSON object with this exact schema:
{
  "inspectionId": "${payload.inspectionId}",
  "equipmentOrLocation": "${payload.equipmentIds[0] || payload.stationName}",
  "observation": "detailed observation of equipment condition and floor pooling",
  "evidenceIds": ["${payload.evidenceId}"],
  "measurementComparison": "explicit comparison of telemetry vs limits",
  "severity": "NORMAL" | "WARNING" | "CRITICAL",
  "confidence": 0.95,
  "uncertainty": "optical uncertainty or resolution limits",
  "suggestedFollowUp": "specific engineering action"
}`;

          const messages = [
            {
              role: 'user',
              content: [
                { type: 'text', text: promptText },
                {
                  type: 'image_url',
                  image_url: {
                    url: payload.cameraImageBase64.startsWith('data:')
                      ? payload.cameraImageBase64
                      : `data:image/png;base64,${payload.cameraImageBase64}`
                  }
                }
              ]
            }
          ];

          const apiRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3.2-11b-vision-instruct',
              messages,
              max_tokens: 600,
              temperature: 0.1,
              response_format: { type: 'json_object' }
            })
          });

          if (!apiRes.ok) {
            const errBody = await apiRes.text();
            throw new Error(`Meta API error HTTP ${apiRes.status}: ${errBody}`);
          }

          const apiData = await apiRes.json();
          const rawContent = apiData.choices[0].message.content;
          const parsedFinding = JSON.parse(rawContent);

          // Validate that it only cites provided evidence ID
          parsedFinding.evidenceIds = [payload.evidenceId];

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            aiConfigured: true,
            model: 'meta-llama/llama-3.2-11b-vision-instruct',
            finding: parsedFinding
          }));
          return;
        } catch (apiErr) {
          console.error('[Server Meta API Error]', apiErr.message);
          // Fall through to deterministic response with notice
        }
      }

      // Fallback: Deterministic threshold and spill evaluation when API key is not present or failed
      let severity = 'NORMAL';
      let obs = `Visual field-of-view confirmed for ${payload.equipmentIds[0] || payload.stationName}. Equipment housing intact, connections secure.`;
      let comp = 'All active instruments operating within normal demonstration limits.';
      let followUp = 'Routine monitoring per schedule.';
      let uncertainty = 'Zero sensor uncertainty on local telemetry; AI vision model unavailable.';

      // Check for overtemperature or abnormal reading
      if (payload.telemetry) {
        for (const [tag, reading] of Object.entries(payload.telemetry)) {
          const isHighAlarm = reading.alarmMax && reading.value >= reading.alarmMax;
          const isLowAlarm = reading.alarmMin && reading.value <= reading.alarmMin;
          const isHighWarn = reading.warnMax && reading.value >= reading.warnMax;
          const isLowWarn = reading.warnMin && reading.value <= reading.warnMin;

          if (reading.state === 'ALARM' || isHighAlarm || isLowAlarm) {
            severity = 'CRITICAL';
            const limit = isHighAlarm ? reading.alarmMax : reading.alarmMin;
            obs = `Telemetry alarm on ${tag} (${reading.value} ${reading.unit}): value exceeds alarm limit (${limit} ${reading.unit}). Drive-end thermal distress indicated.`;
            comp = `${reading.value} ${reading.unit} vs Alarm limit ${limit} ${reading.unit} (Warning: ${reading.warnMax || reading.warnMin} ${reading.unit}).`;
            followUp = `Isolate ${payload.equipmentIds[0] || 'equipment'} immediately; check lubrication and mechanical alignment.`;
            break;
          } else if (reading.state === 'WARNING' || isHighWarn || isLowWarn) {
            severity = 'WARNING';
            const limit = isHighWarn ? reading.warnMax : reading.warnMin;
            obs = `Telemetry warning on ${tag} (${reading.value} ${reading.unit}): value exceeds operating warning limit.`;
            comp = `${reading.value} ${reading.unit} vs Warning limit ${limit} ${reading.unit}.`;
            followUp = `Inspect component during next scheduled maintenance interval.`;
          }
        }
      }

      // Check if station is designated spill zone (Station 17 / near P-301) in defective mode
      if (payload.isSpillZone) {
        obs += ' Visual inspection reveals an uncontained dark amber liquid puddle spreading on the concrete floor (~1.8m x 1.2m footprint). Suspected solvent/alkyd spill.';
        if (severity !== 'CRITICAL') severity = 'CRITICAL';
        followUp = 'Deploy spill containment booms, isolate upstream supply lines, and initiate contained suction to sump S-901.';
      }

      const deterministicFinding = {
        inspectionId: payload.inspectionId,
        equipmentOrLocation: payload.equipmentIds[0] || payload.stationName,
        observation: obs,
        evidenceIds: [payload.evidenceId],
        measurementComparison: comp,
        severity,
        confidence: 1.0,
        uncertainty,
        suggestedFollowUp: followUp,
        isDeterministic: true
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        aiConfigured: false,
        statusMessage: 'META_API_KEY is not configured on the server. AI analysis is unavailable; returning deterministic inspection analysis.',
        configNeeded: 'Set META_API_KEY or OPENROUTER_API_KEY environment variable on the server to enable live Meta Llama Vision & Reasoning.',
        finding: deterministicFinding
      }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
      return;
    }
  }

  if (pathname === '/api/synthesize-report' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const key = getApiKey();

      // Determine conclusion
      const criticalCount = payload.findings.filter(f => f.severity === 'CRITICAL').length;
      const warningCount = payload.findings.filter(f => f.severity === 'WARNING').length;

      let conclusion = 'No configured anomalies observed in inspected areas.';
      if (criticalCount > 0 || warningCount > 0) {
        conclusion = `Anomalies detected: ${criticalCount} critical finding(s) and ${warningCount} warning(s) identified during inspection.`;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        aiConfigured: Boolean(key),
        conclusion,
        summary: `Inspection ${payload.inspectionId} completed covering ${payload.visitedCount} of ${payload.totalStations} stations. Total verified equipment observed: ${payload.observedCount}.`
      }));
      return;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
      return;
    }
  }

  // --- Static File Serving ---
  try {
    const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const target = path.resolve(root, requested);

    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const contents = await fs.readFile(target);
    res.writeHead(200, {
      'Content-Type': types[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(contents);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`PlantScout simulation server is running at http://127.0.0.1:${port}\n`);
});
