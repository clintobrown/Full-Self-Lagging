"""Build trees/fleet.json from the Vehicle Fleet Tracking Sheet.

Usage: in the sheet, open the "Master Sheet" tab, File > Download > CSV, then
    python3 tools/build_fleet.py "Vehicle Fleet Tracking Sheet - Master Sheet.csv"
"""
import csv, json, sys, datetime, os

TRUCK_STATUSES = {"Active", "Delivered", "Bringup", "Not Active"}
TRAILER_STATUSES = {"Active", "Delivered"}
LOCATION_ORDER = ["Palmer Terminal", "Aledo Terminal", "Aledo Terminal Guard Geofence", "HOU2 Terminal",
                  "El Paso Terminal", "Laredo Tru by Hilton", "PHX1 Terminal", "DFW", "FTW"]

def platform(r):
    p, make, model = r.get("AV Platform", ""), r.get("Make", ""), r.get("Model", "")
    if make == "Peterbilt" or r.get("Aurora ID", "").lower().startswith(("a579m", "pbt")): return "peterbilt"
    if p.startswith("Volvo") or make == "Volvo" or model.startswith("VNL"): return "volvo"
    rid = r.get("Aurora ID", "").lower()
    if make == "International" or make.startswith("LT6") or model.startswith("LT6") or rid.startswith("alts"): return "international"
    if rid.startswith("asvat"): return "volvo"
    return ""

KNOWN_MAKES = {"Peterbilt", "Volvo", "International", "Freightliner", "Kenworth", "Mack"}
def desc(r):
    p = r.get("AV Platform", "")
    if p and p not in ("N/A", "TBD"): return p
    m = r.get("Make", "")
    return m if m in KNOWN_MAKES else ""

def build(rows):
    rows = [{k.strip(): (v or "").strip() for k, v in r.items() if k} for r in rows]
    trucks, trailers = [], []
    for r in rows:
        rid, sub, st = r.get("Aurora ID", ""), r.get("Sub-Class", ""), r.get("Vehicle Status", "")
        if not rid or rid.upper().startswith("PEN-") or (rid.lower().startswith("a579m-") and rid[6:].isdigit() and int(rid[6:]) < 600): continue  # never troubleshot
        loc = r.get("Location", "") or "Other / unknown"
        if sub == "Class 8 Truck" and st in TRUCK_STATUSES:
            trucks.append({"id": rid, "loc": loc, "platform": platform(r), "status": st,
                           "desc": desc(r)})
        elif "Trailer" in sub and st in TRAILER_STATUSES:
            trailers.append({"id": rid, "loc": loc})
    key = lambda x: (LOCATION_ORDER.index(x["loc"]) if x["loc"] in LOCATION_ORDER else 99, x["loc"], x["id"])
    return {"source": "Vehicle Fleet Tracking Sheet / Master Sheet",
            "generated": datetime.date.today().isoformat(),
            "locationOrder": LOCATION_ORDER,
            "trucks": sorted(trucks, key=key), "trailers": sorted(trailers, key=key)}

if __name__ == "__main__":
    with open(sys.argv[1], newline="", encoding="utf-8-sig") as f:
        out = build(list(csv.DictReader(f)))
    path = os.path.join(os.path.dirname(__file__), "..", "trees", "fleet.json")
    json.dump(out, open(path, "w"), indent=1)
    print(f"wrote {len(out['trucks'])} trucks, {len(out['trailers'])} trailers to {path}")
