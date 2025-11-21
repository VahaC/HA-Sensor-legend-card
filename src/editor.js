import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit@2.8.0/index.js?module";

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

      ha-expansion-panel {
        margin-top: 8px;
      }

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
        grid-template-columns: 1fr 90px 90px auto;
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
        <ha-form
          .hass=${this.hass}
          .data=${this._currentConfig}
          .schema=${this._schema}
          .computeLabel=${this._computeLabel.bind(this)}
          .computeHelper=${this._computeHelper.bind(this)}
          @value-changed=${this._handleFormValueChanged}
        ></ha-form>

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

        <ha-expansion-panel header="Legend items" outlined>
          <div class="legend-items-section">
            <div class="legend-section">
              <div class="legend-header">
                Legend items (tooltip + value color)
              </div>
              <div class="legend-helper">
                Text and color are used for tooltip. Min/Max are optional
                numeric bounds used to color the main value:
                <br />- both min & max: inclusive range [min, max]
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
                        @input=${(ev) => this._onLegendColorChange(index, ev)}
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

export { SensorLegendCardEditor };
