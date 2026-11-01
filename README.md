# READY STATE or DIE: adding or editing a fault tree

All diagnostic content lives in `trees/*.json`. `index.html` holds no procedures, so you never edit app code to change a tree.

## Files
`index.html` is the app. `sw.js` makes it work offline. `trees/manifest.json` lists which tree files load (in display order) plus the tool and platform lists. `trees/schema.json` is the format reference (point your editor at it for autocomplete). Each other file in `trees/` is one symptom category; `triage.json` is the "I'm not sure" tree.

## Node types
A **question** has `options`, and each option has a `label` and a `next` node id. An **action** has `steps`, `next` (where to go if the operator answers "No, still blocked" or can't do it), optional `resolvedNext` (a RESOLVED terminal), and must have `"authorizedRole": "VO"`. The app asks "Did this resolve it?" after every action automatically, so don't write that question yourself. A **terminal** has `terminal` set to `RESOLVED` or `ESCALATE_VRE`; the handoff summary is built automatically on escalation. A **route** (triage only) has `tree`, the id of the category tree to continue in.

## Platform and tool differences
Use `variants` to change wording or steps for one tool or platform without branching: `{"when": {"platform": "volvo"}, "steps": [...]}`. To show a node only on some platforms, add `"platforms": [...]` and `"skipTo"` (where everyone else goes). The same works with `tools`, and on individual answer options.

## Sources: three levels
A node's `source` decides how the app labels it. Missing or `TODO` shows a yellow placeholder warning. `TS: DTP-…` means it was drafted from past TS tickets: it shows a draft banner with the ticket numbers and is counted in every handoff. Anything else (e.g. `"VO Cold Start SOP rev C, §4.2"`) is treated as an approved doc. Escalation terminals can carry a `handoffNote` (likely VRE ask, known causes) that's added to the handoff.

## Replacing a placeholder or TS draft
1. Paste in the real wording from the approved doc.
2. Set the node's `source` to the doc name and section.
3. Bump the tree's `version` (every run records the version it used).
4. Add the doc to `sourceDocs`. When no node is placeholder or `TS:`, set `status` to `VERIFIED`.

## Adding a new category
Copy `calibration.json`, give it a new `id` (lowercase, underscores) and `title`, then add the filename to `manifest.json`. Add a route to it from `triage.json` if it should be reachable from "I'm not sure."

## Truck and trailer lists
`trees/fleet.json` fills the truck and trailer dropdowns and is built from the Master Sheet tab of the Vehicle Fleet Tracking Sheet. To refresh it, download that tab as CSV and run `python3 tools/build_fleet.py "<file>.csv"`. Operators can add anything missing with "+ Add manually", which is saved on that tablet only.

## Checking your work
Open the app's **Trees** screen. A tree with errors is not loaded and its errors are listed. The app rejects: broken `next`/`skipTo` links; actions not marked `VO`; trees with no path to ESCALATE_VRE; `VERIFIED` trees with placeholder or `TS:` nodes; and any text containing bypass, override, defeat, jumper, "disable interlock/safety/check", "ignore fault/warning", or "skip check/SOP". There's no way to switch that last check off. If it trips, reword the step or move it behind a VRE escalation. Unreachable nodes and loops show as warnings.

## Deploying
Push the folder to GitHub Pages (or any https host), open it once on the tablet with signal, and it works offline after that. Tree edits reach the tablet the next time it loads with signal. If you change `index.html`, bump `CACHE` in `sw.js`. Without hosting, open `index.html` directly and use **Trees → Import tree files** to load the JSON from the tablet's storage.


## Jira checkpoint (recent truck tickets)
recent.js shows the truck's last 5 DTP tickets in purple under the "From past TS tickets" banner, read from tickets/<truck-id>.json (lowercase truck id, e.g. tickets/alts1-00009.json). If the file is missing or its updated date is more than 24h old, the box shows a Jira checkpoint prompt and an "Open last tickets in Jira" link.

To refresh during TS:
Step 1: Finish intake (truck, trailer, tool, platform, symptom).  
Step 2: Log into Jira (jira.int.aurora.tech) yourself.  
Step 3: Search: project = DTP AND summary ~ "<truck-id>" ORDER BY created DESC  
Step 4: For the newest 5, record key, date, discrepancy and resolution (leave resolution empty if none; the app shows "No resolution recorded").  
Step 5: Update tickets/<truck-id>.json with those 5 and set updated to the current date/time (ISO, e.g. 2026-11-01T14:30:00). No CACHE bump needed for ticket files.
