import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit@2.8.0/index.js?module";

class SensorLegendCard extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { attribute: false },
    };
  }

  static get styles() {
    return css`
      ha-card {
        padding: 8px;
        cursor: pointer;
      }

      .wrapper {
        position: relative;
        display: flex;
        flex-direction: column;
      }

      .header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .icon {
        --mdc-icon-size: 20px;
        color: var(--state-icon-color, var(--primary-text-color));
        flex-shrink: 0;
      }

      .text-block {
        display: flex;
        flex-direction: column;
        min-width: 0; /* allow children to shrink inside flex */
      }

      .name {
        font-size: 0.9rem;
        color: var(--secondary-text-color);
        white-space: nowrap; /* single line */
        overflow: hidden; /* hide overflow */
        text-overflow: ellipsis; /* show "..." when clipped */
      }

      .value-row {
        display: flex;
        align-items: baseline;
        gap: 4px;
        white-space: nowrap; /* single line */
        overflow: hidden; /* hide overflow */
        text-overflow: ellipsis; /* show "..." when clipped */
      }

      .value {
        font-size: 1.25rem;
      }

      .unit {
        font-size: 0.9rem;
        color: var(--secondary-text-color);
      }

      .tooltip {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 6px;
        padding: 8px 10px;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.86);
        color: #fff;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
        min-width: 160px;
        max-width: 260px;
        opacity: 0;
        pointer-events: none;
        transform: translateY(4px);
        transition:
          opacity 0.12s ease-out,
          transform 0.12s ease-out;
        z-index: 10;
      }

      .wrapper:hover .tooltip {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }

      .legend-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        font-size: 0.8rem;
        line-height: 1.25;
        white-space: normal; /* allow wrapping */
      }

      .legend-row:last-child {
        margin-bottom: 0;
      }

      .color-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        border: 1px solid rgba(255, 255, 255, 0.7);
      }

      .legend-text {
        word-break: break-word;
      }
    `;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must define an entity");
    }

    this._config = {
      decimals: 0,
      ...config,
      legend_items: config.legend_items || [],
    };
  }

  getCardSize() {
    return 2;
  }

  _fireEvent(type, detail, options = {}) {
    const event = new CustomEvent(type, {
      detail,
      bubbles: options.bubbles ?? true,
      composed: options.composed ?? true,
    });
    this.dispatchEvent(event);
  }

  _getColorForValue(value) {
    const items = this._config.legend_items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return null;
    }

    for (const item of items) {
      if (!item) continue;

      const hasMin =
        item.min !== undefined &&
        item.min !== null &&
        item.min !== "" &&
        !Number.isNaN(Number(item.min));
      const hasMax =
        item.max !== undefined &&
        item.max !== null &&
        item.max !== "" &&
        !Number.isNaN(Number(item.max));

      if (!hasMin && !hasMax) {
        continue;
      }

      const min = hasMin ? Number(item.min) : undefined;
      const max = hasMax ? Number(item.max) : undefined;

      let match = false;

      if (hasMin && hasMax) {
        match = value >= min && value <= max;
      } else if (hasMin) {
        match = value >= min;
      } else if (hasMax) {
        match = value <= max;
      }

      if (match && item.color) {
        return item.color;
      }
    }

    return null;
  }

  _getIcon(entityId, stateObj) {
    if (this._config && typeof this._config.icon === "string") {
      const raw = this._config.icon.trim();
      if (!raw) {
        // empty string -> ignore
      } else if (raw.toLowerCase() === "none") {
        return null;
      } else {
        return raw;
      }
    }

    let attrIcon = "";
    if (
      stateObj &&
      stateObj.attributes &&
      typeof stateObj.attributes.icon === "string"
    ) {
      attrIcon = stateObj.attributes.icon.trim();
    }
    if (attrIcon) {
      return attrIcon;
    }

    const domain = entityId ? entityId.split(".")[0] : null;
    const deviceClass =
      stateObj && stateObj.attributes
        ? stateObj.attributes.device_class
        : undefined;

    if (domain === "sensor") {
      switch (deviceClass) {
        case "temperature":
          return "mdi:thermometer";
        case "humidity":
          return "mdi:water-percent";
        case "carbon_dioxide":
        case "co2":
          return "mdi:molecule-co2";
        case "pressure":
          return "mdi:gauge";
        case "power":
        case "energy":
          return "mdi:flash";
        case "signal_strength":
          return "mdi:wifi";
        case "volatile_organic_compounds":
        case "volatile_organic_compounds_parts":
          return "mdi:chemical-weapon";
        case "pm1":
        case "pm10":
        case "pm25":
          return "mdi:blur";
        case "timestamp":
          return "mdi:clock-outline";
        default:
          return "mdi:gauge";
      }
    }

    if (domain === "binary_sensor") {
      switch (deviceClass) {
        case "motion":
          return "mdi:motion-sensor";
        case "door":
          return "mdi:door-closed";
        case "window":
          return "mdi:window-closed";
        case "smoke":
          return "mdi:smoke-detector";
        case "heat":
        case "cold":
          return "mdi:thermometer";
        case "moisture":
          return "mdi:water-alert";
        default:
          return "mdi:radiobox-blank";
      }
    }

    if (domain === "light") {
      return "mdi:lightbulb";
    }

    if (domain === "switch") {
      return "mdi:toggle-switch";
    }

    if (domain === "climate") {
      return "mdi:thermostat";
    }

    if (domain === "fan") {
      return "mdi:fan";
    }

    return "mdi:help-circle";
  }

  _handleAction(actionConfig) {
    if (!this._config || !this.hass) return;

    const tap = actionConfig || { action: "more-info" };
    const action = tap.action || "more-info";
    if (action === "none") return;

    const entityId = this._config.entity;

    if (action === "toggle" && entityId) {
      this.hass.callService("homeassistant", "toggle", {
        entity_id: entityId,
      });
      return;
    }

    if (action === "more-info" && entityId) {
      this._fireEvent("hass-more-info", { entityId });
      return;
    }

    if (action === "navigate" && tap.navigation_path) {
      history.pushState(null, "", tap.navigation_path);
      window.dispatchEvent(new Event("location-changed"));
      return;
    }

    if (action === "url" && tap.url_path) {
      window.open(tap.url_path, "_blank");
      return;
    }
  }

  _handleCardClick() {
    this._handleAction(this._config.tap_action);
  }

  _handleIconClick(ev) {
    ev.stopPropagation();
    this._handleAction(this._config.icon_tap_action);
  }

  render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    const entityId = this._config.entity;
    const stateObj = this.hass.states[entityId];

    const decimals =
      typeof this._config.decimals === "number" ? this._config.decimals : 0;

    let valueText = "N/A";
    let valueColor = null;

    if (stateObj && !isNaN(Number(stateObj.state))) {
      const num = Number(stateObj.state);
      valueText = num.toFixed(decimals);

      const rangeColor = this._getColorForValue(num);
      if (rangeColor) valueColor = rangeColor;
    } else if (stateObj) {
      valueText = stateObj.state;
    }

    const unit =
      this._config.unit ||
      (stateObj && stateObj.attributes.unit_of_measurement) ||
      "";

    const name =
      this._config.name ||
      (stateObj && stateObj.attributes.friendly_name) ||
      entityId;

    const legendItems = this._config.legend_items || [];

    const icon = this._getIcon(entityId, stateObj);

    const iconTemplate = icon
      ? html`<ha-icon
          class="icon"
          .icon=${icon}
          @click=${(ev) => this._handleIconClick(ev)}
        ></ha-icon>`
      : null;

    return html`
      <ha-card @click=${this._handleCardClick}>
        <div class="wrapper">
          <div class="header">
            ${iconTemplate}

            <div class="text-block">
              <div class="name">${name}</div>
              <div class="value-row">
                <span
                  class="value"
                  style=${valueColor ? `color:${valueColor}` : ""}
                  >${valueText}</span
                >
                ${unit ? html`<span class="unit">${unit}</span>` : ""}
              </div>
            </div>
          </div>

          ${legendItems.length
            ? html`
                <div class="tooltip">
                  ${legendItems.map(
                    (item) => html`
                      <div class="legend-row">
                        <span
                          class="color-dot"
                          style=${item.color ? `background:${item.color}` : ""}
                        ></span>
                        <span class="legend-text">${item.text || ""}</span>
                      </div>
                    `
                  )}
                </div>
              `
            : ""}
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("sensor-legend-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "sensor.example",
      decimals: 0,
      unit: "",
      legend_items: [],
    };
  }
}

export { SensorLegendCard };
