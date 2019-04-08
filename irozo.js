"use strict";

class TextareaHelper {
  // @return String
  static getSelectedText = (element) => {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    return element.value.slice(start, end);
  };

  // @return Number 0 based line index.
  static getLineIndex = (element, position) => {
    return element.value.slice(0, position).split("\n").length - 1;
  };

  // @return Object { start, end }
  static getLineStartEndPosition = (element, index) => {
    const text = element.value;
    const position = { start: 0, end: 0 };
    for (let i = 0; i < index; i++) {
      position.start = text.indexOf("\n", position.start) + 1;
    }
    position.end = text.indexOf("\n", position.start);
    position.end = (position.end < 0) ? text.length : position.end;
    return position;
  };

  // @return Object { start, end }
  static getSelectedLineIndex = (element) => {
    return {
      start: this.getLineIndex(element, element.selectionStart),
      end: this.getLineIndex(element, element.selectionEnd)
    };
  };
}

class Irozo {
  constructor() {
    this.colors = [];
    this.colorBars = [];
    this.selectedBarIndex = 0;
    this.base = document.querySelector("#base");
    this.mainBox = document.querySelector("#mainBox");
    this.initialBaseFontSize = Number(getComputedStyleValue(this.base, "font-size").slice(0, -2));
    this.baseFontSize = this.initialBaseFontSize;
    this.colorInput = document.querySelector("#colorInput");
    this.descColor = document.querySelector("#descColor");
    this.descText = document.querySelector("#descText");
    this.colorBarBox = document.querySelector("#colorBarBox");
    this.pastedImageCanvas = document.querySelector("#pastedImageCanvas");
    this.pastedImageContext = this.pastedImageCanvas.getContext("2d");
    this.pastedImage = null;
    this.hoveredColor = null;

    this.parseColor = (text) => {
      let color = tinycolor(text);
      if (color.isValid()) return color;

      const rgba = text.match(/(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*(?:,\s*(\w+))?/);
      if (rgba) {
        const [r, g, b, a] = rgba.slice(1).map(t => Number(t));
        color = isNaN(a) ?
          tinycolor(`rgb ${r} ${g} ${b}`) :
          tinycolor(`rgba ${r} ${g} ${b} ${a / 255.0}`);
        if (color.isValid()) return color;
      }

      const name = text.match(/\w+/);
      if (name) {
        color = tinycolor(name[0]);
        if (color.isValid()) return color;
      }

      return null;
    };

    this.adjustMainBoxSize = () => {
      if (
        (this.mainBox.clientHeight >= (this.base.clientHeight * 0.9) ||
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
      setTimeout(this.adjustMainBoxSize, 100);
    };

    this.updateColorBars = (colors) => {
      // 必要に応じてColorBar要素の準備
      if (colors.length != this.colorBars.length) {
        const colorBarClick = (index) => {
          if (this.pastedImage) {
            this.closePastedImage();
          }
          this.selectedBarChanged(index);
          this.colorInput.focus();
          const position = TextareaHelper.getLineStartEndPosition(this.colorInput, index);
          this.colorInput.selectionStart = position.start;
          this.colorInput.selectionEnd = position.end;
        }
        this.colorBarBox.textContent = null;
        this.colorBars = [];
        colors.forEach((color, index) => {
          const bar = document.createElement("div");
          bar.onclick = (evevt) => colorBarClick(index);
          this.colorBarBox.appendChild(bar);
          this.colorBars.push(bar);
        });
        this.adjustMainBoxSize();
      }
      // class更新
      colors.forEach((color, index) => {
        const bar = this.colorBars[index];
        bar.className = "p-color-bar";
        if (color) {
          bar.style.backgroundColor = color.toString();
          if (index == this.selectedBarIndex) {
            bar.classList.add("p-color-bar--selected");
          }
        } else {
          bar.classList.add("p-color-bar--hidden");
        }
      });
    };

    this.selectedBarChanged = (index) => {
      const previousSelectedBar = this.colorBars[this.selectedBarIndex];
      if (previousSelectedBar) {
        previousSelectedBar.classList.remove("p-color-bar--selected");
      }
      this.selectedBarIndex = index;
      const currentSelectedBar = this.colorBars[index];
      if (currentSelectedBar) {
        currentSelectedBar.classList.add("p-color-bar--selected");
      }
      this.updateColorDescription(this.colors[index]);
    }

    this.updateColorDescription = (color) => {
      let t = null;
      if (color) {
        const rgb = color.toRgb();
        t = color.toString("rgb") + "<br>";
        t += color.toString("prgb") + "<br>";
        const hex3 = tinycolor({
          r: (rgb.r & 0xF0) | ((rgb.r & 0xF0) >> 4),
          g: (rgb.g & 0xF0) | ((rgb.g & 0xF0) >> 4),
          b: (rgb.b & 0xF0) | ((rgb.b & 0xF0) >> 4)
        });
        t += hex3.toString("hex3") + "<br>";
        t += color.toString((rgb.a < 1.0) ? "hex8" : "hex6") + "<br>";
        t += color.toString("hsl") + "<br>";
        const name = tinycolor({ r: rgb.r, g: rgb.g, b: rgb.b }).toString("name");
        t += (/^#/.test(name) ? "-" : name) + "<br>";
        this.descColor.style.backgroundColor = color.toString();
      }
      this.descText.innerHTML = t;
      this.descColor.style.visibility = (t && this.pastedImage) ? "visible" : "hidden";
    };

    this.colorInputKeyDown = (event) => {
      if (event.key == "Enter") {
        const text = this.colorInput.value;
        const m = text.match(/^\?(\d+)?$/)
        if (m) {
          const count = Math.min(m[1], 100) || 1;
          let randomText = "";
          for (let i = 0; i < count; ++i) {
            const names = Object.keys(tinycolor.names);
            const index = Math.floor(names.length * Math.random());
            const color = tinycolor(tinycolor.names[names[index]]);
            randomText += color.toString() + "\n";
          }
          this.colorInput.value = randomText.slice(0, -1);
          this.colorInputTextChanged();
          event.preventDefault();
        }
      }
      // キャレットが移動するまでちょいお待ち
      setTimeout(this.colorInputCaretMove, 10);
    }

    this.colorInputCaretMove = () => {
      if (this.pastedImage) {
        // スポイトモードおしまい
        this.closePastedImage();
      }
      const index = TextareaHelper.getLineIndex(this.colorInput, this.colorInput.selectionEnd);
      this.selectedBarChanged(index);
    };

    this.closePastedImage = () => {
      this.pastedImage = null;
      this.pastedImageCanvas.style.opacity = 0.0;
    };

    this.colorInputTextChanged = () => {
      const lines = this.colorInput.value.split("\n");
      this.colors = lines.map(t => this.parseColor(t));
      this.colorInput.rows = this.colors.length;
      this.updateColorBars(this.colors);
      this.selectedBarChanged(this.selectedBarIndex);
    };

    this.onResize = () => {
      this.pastedImageCanvas.width = this.base.clientWidth;
      this.pastedImageCanvas.height = this.base.clientHeight;
      if (this.pastedImage) {
        const context = this.pastedImageContext;
        const sw = this.pastedImage.width;
        const sh = this.pastedImage.height;
        const dw = this.pastedImageCanvas.width;
        const dh = this.pastedImageCanvas.height;
        const dr = dw / dh;
        const sr = sw / sh;
        let w = dw;
        let h = dh;
        if (sr > dr) {
          h = w / sr;
        } else {
          w = h * sr;
        }
        // 拡大はしません
        if (w > sw || h > sh) {
          w = sw;
          h = sh;
        }
        const x = Math.floor((dw - w) / 2);
        const y = Math.floor((dh - h) / 2);
        context.drawImage(this.pastedImage, 0, 0, sw, sh, x, y, w, h);
      }
      this.adjustMainBoxSize();
    }

    this.onKeyDown = (event) => {
      if (event.key == "Escape") {
        this.closePastedImage();
      }
    }

    this.onPaste = (event) => {
      const items = (event.clipboardData).items;
      for (let item of items) {
        if (/image/.test(item.type)) {
          const imageFile = item.getAsFile();
          this.pastedImage = new Image();
          this.pastedImage.src = window.URL.createObjectURL(imageFile);
          this.pastedImage.onload = () => {
            this.onResize();
            this.pastedImageCanvas.style.opacity = 1.0;
          }
          this.selectedBarIndex = -1;
          break;
        }
      }
    };

    this.onMouseMove = (event) => {
      if (!this.pastedImage) return;
      const x = event.clientX - this.base.clientLeft;
      const y = event.clientY - this.base.clientTop;
      const imageData = this.pastedImageContext.getImageData(x, y, 1, 1);
      const rgba = imageData.data;

      this.hoveredColor = (rgba[3] != 0) ? tinycolor(`rgb ${rgba[0]},${rgba[1]},${rgba[2]}`) : null;
      this.updateColorDescription(this.hoveredColor);
    };

    this.onClick = (event) => {
      if (!this.pastedImage || !this.hoveredColor) return;
      const rgb = this.hoveredColor.toRgb();
      if (this.colorInput.value.length > 0 && this.colorInput.value.slice(-1) != "\n") {
        this.colorInput.value += "\n";
      }
      this.colorInput.value += `${rgb.r},${rgb.g},${rgb.b}`;
      this.colorInputTextChanged();
    };

    this.colorInput.oninput = this.colorInputTextChanged;
    this.colorInput.onkeydown = this.colorInputKeyDown;
    this.colorInput.onclick = this.colorInputCaretMove;
    window.onresize = this.onResize;
    document.onkeydown = this.onKeyDown;
    document.onpaste = this.onPaste;
    // 要素に隠れてるところも色取りたいのでwindowのイベントをひろう
    window.onmousemove = this.onMouseMove;
    window.onclick = this.onClick;

    this.onResize();
  }
}
const irozo = new Irozo;
