// sensor-legend-card.js
// All comments in English (per user preference)

import { LitElement, html, css } from "lit";

const CARD_VERSION = "0.2.7";

console.info(
  `%cSENSOR-LEGEND-CARD %c${CARD_VERSION}`,
  "font-weight: 700; color: #1d8ce0",
  "font-weight: 700; color: #1a1a1a"
);

// -------------------- MAIN CARD --------------------

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
        white-space: nowrap;       /* single line */
        overflow: hidden;          /* hide overflow */
        text-overflow: ellipsis;   /* show "..." when clipped */
      }

      .value-row {
        display: flex;
        align-items: baseline;
        gap: 4px;
        white-space: nowrap;       /* single line */
        overflow: hidden;          /* hide overflow */
        text-overflow: ellipsis;   /* show "..." when clipped */
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

  /**
   * Returns color for the given numeric value based on legend_items.
   * legend item may have:
   *   - min and max -> inclusive range [min, max]
   *   - only min    -> value >= min
   *   - only max    -> value <= max
   */
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
        // No numeric range for this item, skip for value coloring
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

  /**
   * Resolve icon with:
   *  1) explicit config icon (non-empty)
   *     - if it is "none" (case-insensitive) => hide icon completely
   *  2) entity attributes.icon (non-empty)
   *  3) domain/device_class-based defaults
   */
  _getIcon(entityId, stateObj) {
    // 1) explicit icon in card config
    if (this._config && typeof this._config.icon === "string") {
      const raw = this._config.icon.trim();
      if (!raw) {
        // empty string -> ignore
      } else if (raw.toLowerCase() === "none") {
        // special keyword: do not render icon at all
        return null;
      } else {
        // explicit icon name
        return raw;
      }
    }

    // 2) explicit icon attribute on entity (non-empty)
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

    // 3) fallback by domain / device_class
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

    // 4) global fallback
    return "mdi:help-circle";
  }

  /**
   * Shared executor for tap / icon tap actions.
   * If config is undefined -> default to more-info.
   */
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

  /**
   * Handle tap on whole card.
   */
  _handleCardClick() {
    this._handleAction(this._config.tap_action);
  }

  /**
   * Handle tap specifically on icon.
   */
  _handleIconClick(ev) {
    ev.stopPropagation(); // do not trigger card click
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

      // Try to pick a color based on legend ranges
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

if (!customElements.get("sensor-legend-card")) {
  customElements.define("sensor-legend-card", SensorLegendCard);
}

// -------------------- EDITOR --------------------

class SensorLegendCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { attribute: false },
      _config: { attribute: false },
      _legendItems: { attribute: false },
      _schema: { attribute: false },
    };
  }

  constructor() {
    super();
    this._config = {};
    this._legendItems = [];
    // Only entity stays in ha-form; the rest is in a separate expansion panel
    this._schema = [
      {
        name: "entity",
        required: true,
        selector: {
          entity: {
            // filter: [{ domain: "sensor" }],
          },
        },
      },
    ];
  }

  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* Vertical spacing between blocks */
      ha-expansion-panel {
        margin-top: 8px;
      }

      /* Inner margins only when panel is expanded */
      ha-expansion-panel[expanded] .appearance-section,
      ha-expansion-panel[expanded] .interactions-section,
      ha-expansion-panel[expanded] .legend-items-section {
        margin: 8px;
      }

      .appearance-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .appearance-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      @media (max-width: 640px) {
        .appearance-grid {
          grid-template-columns: 1fr;
        }
      }

      .field-helper {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
      }

      .interactions-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .interactions-row {
        margin-top: 0;
      }

      .interactions-row ha-select {
        width: 100%;
      }

      .tap-helper {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      .legend-section {
        margin-top: 16px;
      }

      .legend-header {
        font-size: 0.9rem;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .legend-helper {
        font-size: 0.8rem;
        color: var(--secondary-text-color);
        margin-bottom: 8px;
      }

      .legend-row-editor {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 10px;
      }

      .legend-row-line {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .legend-row-line-top ha-textfield {
        width: 100%;
      }

      .legend-row-line-bottom {
        display: grid;
        grid-template-columns: 1fr 90px 90px auto; /* Color | Min | Max | Delete */
        gap: 8px;
        align-items: center;
      }

      .legend-row-line-bottom ha-textfield {
        width: 100%;
      }

      .legend-row-editor button {
        height: 36px;
        padding: 0 12px;
        background: var(--error-color);
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }

      .legend-row-editor button:hover {
        filter: brightness(1.1);
      }

      .add-btn {
        margin-top: 4px;
        padding: 0 12px;
        height: 36px;
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 0.85rem;
      }

      .add-btn:hover {
        filter: brightness(1.08);
      }
    `;
  }

  setConfig(config) {
    this._config = {
      type: "custom:sensor-legend-card",
      decimals: 0,
      ...config,
    };

    this._legendItems = Array.isArray(config.legend_items)
      ? config.legend_items.map((i) => ({ ...i }))
      : [];

    // Ensure legend_items in config is synced
    this._config.legend_items = this._legendItems;
  }

  get _currentConfig() {
    return this._config || {};
  }

  render() {
    if (!this.hass) return html``;

    const tap = this._config.tap_action || {};
    const tapAction = tap.action || "more-info";

    const iconTap = this._config.icon_tap_action || {};
    const iconTapAction = iconTap.action || "more-info";

    return html`
      <div class="card-config">
        <!-- ENTITY -->
        <ha-form
          .hass=${this.hass}
          .data=${this._currentConfig}
          .schema=${this._schema}
          .computeLabel=${this._computeLabel.bind(this)}
          .computeHelper=${this._computeHelper.bind(this)}
          @value-changed=${this._handleFormValueChanged}
        >
        </ha-form>

        <!-- APPEARANCE -->
        <ha-expansion-panel header="Appearance" outlined>
          <div class="appearance-section">
            <div class="appearance-grid">
              <ha-textfield
                label="Name (optional)"
                .value=${this._config.name ?? ""}
                @input=${this._onNameChanged}
              ></ha-textfield>

              <ha-icon-picker
                label="Icon (optional)"
                .value=${this._config.icon ?? ""}
                @value-changed=${this._onIconChanged}
              ></ha-icon-picker>

              <ha-textfield
                label="Decimals (optional)"
                type="number"
                .value=${this._config.decimals ?? ""}
                @input=${this._onDecimalsChanged}
              ></ha-textfield>

              <ha-textfield
                label="Unit (optional)"
                .value=${this._config.unit ?? ""}
                @input=${this._onUnitChanged}
              ></ha-textfield>
            </div>
            <div class="field-helper">
              Decimals – how many decimal places to show. Unit overrides
              the entity unit. Type "none" as icon in YAML to hide icon.
            </div>
          </div>
        </ha-expansion-panel>

        <!-- INTERACTIONS -->
        <ha-expansion-panel header="Interactions" outlined>
          <div class="interactions-section">
            <div class="interactions-row">
              <ha-select
                label="Tap behavior"
                .value=${tapAction}
                @selected=${this._onTapActionTypeChanged}
                @closed=${this._stopPropagation}
              >
                <mwc-list-item value="more-info">
                  More info dialog (default)
                </mwc-list-item>
                <mwc-list-item value="toggle">Toggle entity</mwc-list-item>
                <mwc-list-item value="navigate">Navigate</mwc-list-item>
                <mwc-list-item value="url">Open URL</mwc-list-item>
                <mwc-list-item value="none">Nothing</mwc-list-item>
              </ha-select>
              <div class="tap-helper">
                What to do when the card is clicked.
              </div>

              ${tapAction === "navigate"
                ? html`
                    <ha-textfield
                      label="Navigation path (e.g. /lovelace/0/)"
                      .value=${tap.navigation_path || ""}
                      @input=${this._onTapNavigationPathChange}
                    ></ha-textfield>
                  `
                : ""}
              ${tapAction === "url"
                ? html`
                    <ha-textfield
                      label="URL (https://...)"
                      .value=${tap.url_path || ""}
                      @input=${this._onTapUrlPathChange}
                    ></ha-textfield>
                  `
                : ""}
            </div>

            <div class="interactions-row">
              <ha-select
                label="Icon tap behavior"
                .value=${iconTapAction}
                @selected=${this._onIconTapActionTypeChanged}
                @closed=${this._stopPropagation}
              >
                <mwc-list-item value="more-info">
                  More info dialog (default)
                </mwc-list-item>
                <mwc-list-item value="toggle">Toggle entity</mwc-list-item>
                <mwc-list-item value="navigate">Navigate</mwc-list-item>
                <mwc-list-item value="url">Open URL</mwc-list-item>
                <mwc-list-item value="none">Nothing</mwc-list-item>
              </ha-select>
              <div class="tap-helper">
                What to do when the icon is clicked.
              </div>

              ${iconTapAction === "navigate"
                ? html`
                    <ha-textfield
                      label="Icon navigation path (e.g. /lovelace/0/)"
                      .value=${iconTap.navigation_path || ""}
                      @input=${this._onIconTapNavigationPathChange}
                    ></ha-textfield>
                  `
                : ""}
              ${iconTapAction === "url"
                ? html`
                    <ha-textfield
                      label="Icon URL (https://...)"
                      .value=${iconTap.url_path || ""}
                      @input=${this._onIconTapUrlPathChange}
                    ></ha-textfield>
                  `
                : ""}
            </div>
          </div>
        </ha-expansion-panel>

        <!-- LEGEND ITEMS -->
        <ha-expansion-panel header="Legend items" outlined>
          <div class="legend-items-section">
            <div class="legend-section">
              <div class="legend-header">
                Legend items (tooltip + value color)
              </div>
              <div class="legend-helper">
                Text and color are used for tooltip. Min/Max are optional
                numeric bounds used to color the main value:
                <br />- both min &amp; max: inclusive range [min, max]
                <br />- only min: value ≥ min
                <br />- only max: value ≤ max
              </div>

              ${this._legendItems.map(
                (item, index) => html`
                  <div class="legend-row-editor">
                    <div class="legend-row-line legend-row-line-top">
                      <ha-textfield
                        label="Text"
                        .value=${item.text || ""}
                        @input=${(ev) => this._onLegendTextChange(index, ev)}
                      ></ha-textfield>
                    </div>

                    <div class="legend-row-line legend-row-line-bottom">
                      <ha-textfield
                        label="Color (CSS/hex)"
                        .value=${item.color || ""}
                        @input=${(ev) =>
                          this._onLegendColorChange(index, ev)}
                      ></ha-textfield>

                      <ha-textfield
                        label="Min"
                        type="number"
                        .value=${item.min ?? ""}
                        @input=${(ev) => this._onLegendMinChange(index, ev)}
                      ></ha-textfield>

                      <ha-textfield
                        label="Max"
                        type="number"
                        .value=${item.max ?? ""}
                        @input=${(ev) => this._onLegendMaxChange(index, ev)}
                      ></ha-textfield>

                      <button @click=${() => this._removeLegendItem(index)}>
                        Delete
                      </button>
                    </div>
                  </div>
                `
              )}

              <button class="add-btn" @click=${this._addLegendItem}>
                Add item
              </button>
            </div>
          </div>
        </ha-expansion-panel>
      </div>
    `;
  }

  _computeLabel(schema) {
    // Hide label for entity – leave only native picker UI
    if (schema.name === "entity") return "";
    return "";
  }

  _computeHelper(schema) {
    if (schema.name === "entity") {
      return "Select sensor entity for numeric value (required).";
    }
    return undefined;
  }

  _handleFormValueChanged(ev) {
    ev.stopPropagation();

    const value = ev.detail.value || {};

    const newConfig = {
      ...this._config,
      ...value,
      type: "custom:sensor-legend-card",
      legend_items: this._legendItems,
    };

    this._config = newConfig;
    this._fireConfigChanged();
  }

  _stopPropagation(ev) {
    ev.stopPropagation();
  }

  // ---- simple field handlers (Appearance) ----

  _onNameChanged(ev) {
    const name = ev.target.value;
    this._config = {
      ...this._config,
      name: name || undefined,
    };
    this._fireConfigChanged();
  }

  _onIconChanged(ev) {
    const icon = ev.detail?.value ?? "";
    this._config = {
      ...this._config,
      icon: icon || "",
    };
    this._fireConfigChanged();
  }

  _onDecimalsChanged(ev) {
    const raw = ev.target.value;
    if (raw === "" || raw === null || raw === undefined) {
      const { decimals, ...rest } = this._config;
      this._config = rest;
    } else {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        this._config = {
          ...this._config,
          decimals: num,
        };
      }
    }
    this._fireConfigChanged();
  }

  _onUnitChanged(ev) {
    const unit = ev.target.value;
    this._config = {
      ...this._config,
      unit: unit || undefined,
    };
    this._fireConfigChanged();
  }

  // ---- Tap behavior handlers ----

  _onTapActionTypeChanged(ev) {
    const action = ev.target.value || "more-info";
    const oldTap = this._config.tap_action || {};

    this._config = {
      ...this._config,
      tap_action: {
        ...oldTap,
        action,
      },
    };

    this._fireConfigChanged();
  }

  _onTapNavigationPathChange(ev) {
    const navigation_path = ev.target.value;
    const oldTap = this._config.tap_action || { action: "navigate" };
    this._config = {
      ...this._config,
      tap_action: {
        ...oldTap,
        action: "navigate",
        navigation_path,
      },
    };
    this._fireConfigChanged();
  }

  _onTapUrlPathChange(ev) {
    const url_path = ev.target.value;
    const oldTap = this._config.tap_action || { action: "url" };
    this._config = {
      ...this._config,
      tap_action: {
        ...oldTap,
        action: "url",
        url_path,
      },
    };
    this._fireConfigChanged();
  }

  // ---- Icon tap behavior handlers ----

  _onIconTapActionTypeChanged(ev) {
    const action = ev.target.value || "more-info";
    const oldTap = this._config.icon_tap_action || {};

    this._config = {
      ...this._config,
      icon_tap_action: {
        ...oldTap,
        action,
      },
    };

    this._fireConfigChanged();
  }

  _onIconTapNavigationPathChange(ev) {
    const navigation_path = ev.target.value;
    const oldTap = this._config.icon_tap_action || { action: "navigate" };
    this._config = {
      ...this._config,
      icon_tap_action: {
        ...oldTap,
        action: "navigate",
        navigation_path,
      },
    };
    this._fireConfigChanged();
  }

  _onIconTapUrlPathChange(ev) {
    const url_path = ev.target.value;
    const oldTap = this._config.icon_tap_action || { action: "url" };
    this._config = {
      ...this._config,
      icon_tap_action: {
        ...oldTap,
        action: "url",
        url_path,
      },
    };
    this._fireConfigChanged();
  }

  // ---- Legend handlers ----

  _addLegendItem() {
    const items = [
      ...this._legendItems,
      { text: "", color: "", min: undefined, max: undefined },
    ];
    this._legendItems = items;
    this._config = {
      ...this._config,
      legend_items: items,
    };
    this._fireConfigChanged();
  }

  _removeLegendItem(index) {
    const items = this._legendItems.filter((_, i) => i !== index);
    this._legendItems = items;
    this._config = {
      ...this._config,
      legend_items: items,
    };
    this._fireConfigChanged();
  }

  _onLegendTextChange(index, ev) {
    const value = ev.target.value;
    const items = this._legendItems.map((it, i) =>
      i === index ? { ...it, text: value } : it
    );
    this._legendItems = items;
    this._config = {
      ...this._config,
      legend_items: items,
    };
    this._fireConfigChanged();
  }

  _onLegendColorChange(index, ev) {
    const value = ev.target.value;
    const items = this._legendItems.map((it, i) =>
      i === index ? { ...it, color: value } : it
    );
    this._legendItems = items;
    this._config = {
      ...this._config,
      legend_items: items,
    };
    this._fireConfigChanged();
  }

  _onLegendMinChange(index, ev) {
    const raw = ev.target.value;
    const items = this._legendItems.map((it, i) => {
      if (i !== index) return it;
      if (raw === "" || raw === null || raw === undefined) {
        const { min, ...rest } = it;
        return rest;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) return it;
      return { ...it, min: num };
    });
    this._legendItems = items;
    this._config = {
      ...this._config,
      legend_items: items,
    };
    this._fireConfigChanged();
  }

  _onLegendMaxChange(index, ev) {
    const raw = ev.target.value;
    const items = this._legendItems.map((it, i) => {
      if (i !== index) return it;
      if (raw === "" || raw === null || raw === undefined) {
        const { max, ...rest } = it;
        return rest;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) return it;
      return { ...it, max: num };
    });
    this._legendItems = items;
    this._config = {
      ...this._config,
      legend_items: items,
    };
    this._fireConfigChanged();
  }

  _fireConfigChanged() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

if (!customElements.get("sensor-legend-card-editor")) {
  customElements.define("sensor-legend-card-editor", SensorLegendCardEditor);
}

// -------------------- CARD PICKER METADATA --------------------

window.customCards = window.customCards || [];
window.customCards.push({
  type: "sensor-legend-card",
  name: "Sensor Legend Card",
  version: CARD_VERSION,
  description:
    "Shows numeric sensor value with hover tooltip legend. Legend items are fully configurable, including ranges to color the value.",
});
