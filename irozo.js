"use strict";

class Irozo {
  constructor() {
    this.colors = [];
    this.colorRows = [];
    this.selectedRowIndex = -1;
    this.base = document.querySelector("#base");
    this.mainBox = document.querySelector("#mainBox");
    this.initialBaseFontSize = Number(getComputedStyleValue(this.base, "font-size").slice(0, -2));
    this.baseFontSize = this.initialBaseFontSize;
    this.descText = document.querySelector("#descText");
  
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

    this.adjustSize = () => {
      if (
        (this.mainBox.clientHeight >= this.base.clientHeight ||
         this.mainBox.clientWidth >= (this.base.clientWidth / 2)) &&
        this.baseFontSize > (this.initialBaseFontSize * 0.2)) {
        this.baseFontSize *= 0.8;
      }
      else if (
        (this.mainBox.clientHeight < (this.base.clientHeight * 0.6) &&
         this.mainBox.clientWidth < ((this.base.clientWidth / 2) * 0.6)) &&
        this.baseFontSize < this.initialBaseFontSize) {
        this.baseFontSize /= 0.8;
      }
      else {
        return;
      }
      this.base.style.fontSize = `${this.baseFontSize}px`;
      // this.base.ontransitionend = (event) => this.adjustSize();
      setTimeout(this.adjustSize, 100);
    };

    this.updateColorRows = (colors) => {
      const colorRowBox = document.querySelector("#colorRowBox");
      if (colors.length != this.colorRows.length) {
        colorRowBox.textContent = null;
        this.colorRows = [];
        colors.forEach((color, index) => {
          const row = document.createElement("div");
          row.onclick = (evevt) => this.colorRowClick(evevt.target, index);
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

      this.adjustSize();
    };

    this.selectedRowChanged = (index, updateInputSelection) => {
      let selectedRow = this.colorRows[this.selectedRowIndex];
      if (selectedRow) {
        selectedRow.classList.remove("p-color-row--selected");
      }
      this.selectedRowIndex = index;
      selectedRow = this.colorRows[index];
      selectedRow.classList.add("p-color-row--selected");

      const selectedColor = this.colors[index];
      let t = "";
      if (selectedColor) {
        const rgb = selectedColor.toRgb();
        t += selectedColor.toString("rgb") + "<br>";
        t += selectedColor.toString("prgb") + "<br>";
        const hex3 = tinycolor({
          r: (rgb.r & 0xF0) | ((rgb.r & 0xF0) >> 4),
          g: (rgb.g & 0xF0) | ((rgb.g & 0xF0) >> 4),
          b: (rgb.b & 0xF0) | ((rgb.b & 0xF0) >> 4)
        });
        t += hex3.toString("hex3") + "<br>";
        t += selectedColor.toString((rgb.a < 1.0) ? "hex8" : "hex6") + "<br>";
        t += selectedColor.toString("hsl") + "<br>";
        const name = tinycolor({ r: rgb.r, g: rgb.g, b: rgb.b }).toString("name");
        t += (/^#/.test(name) ? "-" : name) + "<br>";
      }
      this.descText.innerHTML = t;

      if (updateInputSelection) {
        const colorInput = document.querySelector("#colorInput");
        colorInput.focus();
        const text = colorInput.value;
        let startIndex = 0;
        for (let i = 0; i < index; i++) {
          startIndex = text.indexOf("\n", startIndex) + 1;
        }
        let endIndex = text.indexOf("\n", startIndex);
        endIndex = (endIndex < 0) ? text.length : endIndex;
        colorInput.selectionStart = startIndex;
        colorInput.selectionEnd = endIndex;
      }
    }

    this.colorInputTextChanged = (element) => {
      const lines = element.value.split("\n");
      this.colors = lines.map(t => this.parseColor(t));
      element.rows = this.colors.length;
      this.updateColorRows(this.colors);
    };

    this.colorInputCaretMove = (element) => {
      setTimeout(() => {
        const start = element.selectionEnd;
        const text = element.value;
        const index = text.slice(0, start).split("\n").length - 1;
        this.selectedRowChanged(index, false);
      }, 10);
    };

    this.colorRowClick = (element, index) => {
      this.selectedRowChanged(index, true);
    };

    const colorInput = document.querySelector("#colorInput");
    colorInput.oninput = (event) => this.colorInputTextChanged(event.target);
    colorInput.onkeydown = (event) => this.colorInputCaretMove(event.target);
    // colorInput.onkeyup = (event) => this.colorInputCaretMove(event.target);
    colorInput.onclick = (event) => this.colorInputCaretMove(event.target);
    window.onresize = () => this.adjustSize();

    //debug{
    colorInput.value = "ff0\ndfdd00\nbb0\n990\n770";
    this.colorInputTextChanged(colorInput);
    //}
  }
}
const irozo = new Irozo;
