# PlantScout — Resin Works Interior

A browser-based, first-person chemical process basement simulation. This iteration focuses on the industry environment; robot, inspection routes and reports are removed from the interface.

## Walkthrough

1. Descend the enclosed access stair.
2. Unlock the insulated access door with demo PIN **2048**.
3. Enter the high-ceiling enclosed process gallery.
4. Start ventilation, circulation and mixing in sequence.
5. Explore with drag-to-look, WASD or touch arrows, and location shortcuts.
6. Enable synthesized machinery sound; run the timed utility steam demonstration; stop the process or return to the stair.

The PIN is a client-side interaction, not authentication. The roof is continuous; there is no cutaway toggle. Movement is bounded by room and equipment clearance regions. Location shortcuts reposition the visitor.

## Process basis

Equipment follows an epoxy-resin solution unit: reactor, condenser, separator, holding vessel, transfer pumps, filtration and utilities. The process reference is the [Star Industries EIA/EMP report](https://environmentclearance.nic.in/writereaddata/online/EC/020420224ezpn1q5ohl49620151ADSreplywithenclosures.pdf). The report does not specify this basement layout. All geometry and textures are original procedural artwork; no source illustrations are reproduced.

## Scope

This is an interactive visual simulation, not a photorealistic scan, engineered plant, thermal/fire certification or chemical physics model. Readings and startup sequencing are illustrative. Visible steam is confined to a utility demonstration; normal xylene handling is represented as closed pipework. Audio is synthesized in the browser after the visitor enables it. No Meta API is used in this environment stage.

## Files and preview

- `app.js`: entry, walking, process states, audio and interface.
- `interior.js`: enclosed building, textures, stair, door and machinery animation.
- `industrial-layout.js`: resin-unit equipment geometry.
- `index.html` / `styles.css`: responsive walkthrough controls.

Serve this folder with `python -m http.server 8766` or `node serve.cjs`. Three.js and fonts require internet access.

## Direction to preserve

Concentrate on a human-scale, enclosed industry before adding robotics. Keep the stair and PIN door entry, high ceiling, insulated-looking surfaces, physical machinery details, sound and animated process behaviour. Do not restore the robot dashboard or an open-top model without a new request.
