"use strict";

class Irozo {
  constructor() {
    this.colorRows = [];
    this.selectedRowIndex = -1;
    this.base = document.querySelector("#base");
  
    this.parseColor = (text) => {
      let color = tinycolor(text);
      if (!color.isValid()) {
        const m = text.match(/(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*(?:,\s*(\w+))?/);
        if (m) {
          const [r, g, b, a] = m.slice(1).map(t => Number(t));
          color = isNaN(a) ?
            tinycolor(`rgb ${r} ${g} ${b}`) :
            tinycolor(`rgba ${r} ${g} ${b} ${a / 255.0}`);
        }
      }
      return color.isValid() ? color : null;
    };

    this.updateColorRows = (colors) => {
      const colorRowBox = document.querySelector("#colorRowBox");
      if (colors.length != this.colorRows.length) {
        colorRowBox.textContent = null;
        this.colorRows = [];
        colors.forEach(() => {
          const row = document.createElement("div");
          colorRowBox.appendChild(row);
          this.colorRows.push(row);
        });
      }
      colors.forEach((color, index) => {
        const row = this.colorRows[index];
        row.className = "p-color-row";
        if (color) {
          row.style.backgroundColor = color.toString();
          if (index == this.selectedRowIndex) {
            row.classList.add("p-color-row--selected");  
          }
        } else {
          row.classList.add("p-color-row--hidden");
        }
      });
    };

    this.selectedRowChanged = (index) => {
      let selectedRow = this.colorRows[this.selectedRowIndex];
      if (selectedRow) {
        selectedRow.classList.remove("p-color-row--selected");
      }
      this.selectedRowIndex = index;
      selectedRow = this.colorRows[index];
      selectedRow.classList.add("p-color-row--selected");
    }

    this.colorInputTextChanged = (target) => {
      const lines = target.value.split("\n");
      const colors = lines.map(t => this.parseColor(t));
      target.rows = colors.length;
      this.updateColorRows(colors);
    };

    this.colorInputKeyUp = (target) => {
      const start = target.selectionStart;
      const text = target.value;
      const index = text.slice(0, start).split("\n").length - 1;
      this.selectedRowChanged(index);
    };

    const colorInput = document.querySelector("#colorInput");
    colorInput.oninput = (event) => this.colorInputTextChanged(event.target);
    colorInput.onkeyup = (event) => this.colorInputKeyUp(event.target);
    colorInput.onclick = (event) => this.colorInputKeyUp(event.target);

    //debug{
    colorInput.value = "1,12,123\n1 ,12, 123 , 255\n0x12,0x9a,0xBc\n0x12 ,0x9a, 0xBc , 0xEF\n";
    this.colorInputTextChanged(colorInput);
    //}
  }
}
const irozo = new Irozo;
