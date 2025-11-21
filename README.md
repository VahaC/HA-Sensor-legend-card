# Sensor Legend Card

Custom Lovelace card for Home Assistant dashboards that shows a single sensor value together with a fully configurable tooltip legend. The card is compact, mobile friendly, and now ships as a HACS-compatible repository.

## Features
- One sensor per card with auto-resolved icon and unit
- Tooltip legend with per-row color, text, and optional numeric range used to color the main reading
- Independent tap actions for the card body and the icon
- Lightweight bundle written in plain Lit + JavaScript, no build step required
- Ships with an editor for the Lovelace UI so you can configure everything without YAML if desired

## Installation

### HACS (recommended)
1. In Home Assistant open **HACS → Frontend → ⋮ → Custom repositories**.
2. Add this repo URL (`https://github.com/VahaC/HA-Sensor-legend-card`) and pick category **Lovelace**.
3. After the repository appears in HACS, press **Download**. HACS will copy the entire folder (including the `src/` directory) into `/config/www/community/sensor-legend-card/`. If you already had an older version installed manually, delete the old folder first so nothing is left behind.
4. Restart Home Assistant (or click **Reload resources**) so the new resource is picked up.
5. Add the resource automatically via HACS prompt or manually under **Settings → Dashboards → Resources** with:
	 - URL: `/hacsfiles/sensor-legend-card/sensor-legend-card.js`
	 - Resource type: `module`

### Manual
1. Download the latest `sensor-legend-card.js` from the releases page.
2. Copy it to your Home Assistant `config/www/sensor-legend-card/` folder (create the folder if missing).
3. Make sure the `src/` folder sits next to `sensor-legend-card.js` (the card was split into multiple modules starting with v0.2.2, so both the root file and the files inside `src/` must be copied).
4. Add a Lovelace resource pointing to `/local/sensor-legend-card/sensor-legend-card.js` with resource type `module`.
5. Clear browser cache or reload resources from **Developer Tools → YAML → Reload resources**.

## Usage

Once the resource is available, add the card either through the visual editor (search for *Sensor Legend Card*) or via YAML:

```yaml
type: custom:sensor-legend-card
entity: sensor.air_quality
name: Living room AQI
decimals: 1
unit: "µg/m³"
tap_action:
    action: more-info
legend_items:
    - text: Excellent (0-50)
        color: "#2ecc71"
        max: 50
    - text: Moderate (51-100)
        color: "#f1c40f"
        min: 51
        max: 100
    - text: Poor (>100)
        color: "#e74c3c"
        min: 101
```
![alt text](card-image.png)
![alt text](editor-image.png)

Legend `min`/`max` values are optional; when provided they color the numeric value whenever it falls inside the defined bounds.
Leave `icon` blank to keep the entity icon or set it to `none` to hide the icon entirely.
