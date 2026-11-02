# PlantScout — Resin Works Interior

A browser-based, first-person chemical process basement simulation. The plant is one continuous, compact working hall, based on the earlier layout the user preferred. Neutral concrete, darker steel, connected pipework, a raised process deck and restrained safety markings replace the bright white room treatment. Robot, inspection routes and reports remain removed.

## Walkthrough

1. Descend the enclosed access stair.
2. Unlock the insulated access door with demo PIN **2048**.
3. Enter the high-ceiling enclosed process gallery and see the connected resin unit from the door.
4. Expand **Plant controls** to start ventilation, circulation and mixing in sequence. The panel starts collapsed to keep the view clear.
5. Explore with drag-to-look, WASD or touch arrows, and location shortcuts.
6. Use **Labels on/off** to show equipment tags. The four viewpoint shortcuts remain inside the same hall: whole plant, pumps, reactor and utilities.
7. Enable synthesized machinery sound; run the timed utility steam demonstration; stop the process or return to the stair.

The PIN is a client-side interaction, not authentication. The roof is continuous; there is no cutaway toggle. Movement is bounded by room and equipment clearance regions. Location shortcuts reposition the visitor.

## Process basis

Equipment follows an epoxy-resin solution unit: reactor, condenser, separator, holding vessel, transfer pumps, filtration and utilities. The process reference is the [Star Industries EIA/EMP report](https://environmentclearance.nic.in/writereaddata/online/EC/020420224ezpn1q5ohl49620151ADSreplywithenclosures.pdf). The report does not specify this basement layout. All geometry and textures are original procedural artwork; no source illustrations are reproduced.

## Scope

This is an interactive visual simulation, not a photorealistic scan, engineered plant, thermal/fire certification or chemical physics model. Readings and startup sequencing are illustrative. Visible steam is confined to a utility demonstration; normal xylene handling is represented as closed pipework. Audio is synthesized in the browser after the visitor enables it. No Meta API is used in this environment stage.

## Files and preview

- `app.js`: entry, walking, process states, audio and interface.
- `interior.js`: enclosed shell, stair and PIN door, narrow process access deck, pipe bridges, labels, collisions and machinery animation. Fixed geometry is batched by material for browser performance.
- `industrial-layout.js`: restored integrated resin unit with pump gallery, electrical bay, reactor, condenser, holding tank, day tank, filtration and utilities.
- `floor-concrete.png`: original AI-generated neutral industrial surface texture, generated with the built-in image tool. Prompt: seamless orthographic maintained grey concrete/epoxy screed floor, mild aggregate and scuffing, even lighting, no objects, joints, text, shadows or green tint.
- `index.html` / `styles.css`: responsive walkthrough controls.

Serve this folder with `python -m http.server 8766` or `node serve.cjs`. Three.js and fonts require internet access.

## Direction to preserve

Concentrate on a human-scale, enclosed industry before adding robotics. Keep the stair and PIN door entry, high ceiling, insulated-looking surfaces, physical machinery details, sound and animated process behaviour. The user approved eight concept images but then clarified that the later separated white rooms felt artificial. Preserve one whole, visibly connected industry from the entrance and the navigation of the earlier version. Do not restore a green aesthetic, the oversized introductory card, the robot dashboard or an open-top model without a new request. The approved images remain art direction for equipment detail; this interactive procedural model does not reproduce their photographic detail exactly.
