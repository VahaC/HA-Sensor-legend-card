import { CARD_VERSION } from "./src/version.js";
import { SensorLegendCard } from "./src/card.js";
import { SensorLegendCardEditor } from "./src/editor.js";

console.info(
  `%cSENSOR-LEGEND-CARD %c${CARD_VERSION}`,
  "font-weight: 700; color: #1d8ce0",
  "font-weight: 700; color: #1a1a1a"
);

if (!customElements.get("sensor-legend-card")) {
  customElements.define("sensor-legend-card", SensorLegendCard);
}

if (!customElements.get("sensor-legend-card-editor")) {
  customElements.define("sensor-legend-card-editor", SensorLegendCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "sensor-legend-card",
  name: "Sensor Legend Card",
  version: CARD_VERSION,
  description:
    "Shows numeric sensor value with hover tooltip legend. Legend items are fully configurable, including ranges to color the value.",
});
