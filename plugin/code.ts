const DebugMode = false;

function logDebug(message?: any, ...optionalParams: any[]) {
  if (DebugMode) {
    console.log(message, optionalParams);
  }
}

interface HSL {
  readonly h: number // 0 - 360
  readonly s: number // 0 - 1.0
  readonly l: number // 0 - 1.0
}

function RGBtoHSL(rgb: RGB): HSL {
  // Find greatest and smallest channel values
  let cmin = Math.min(rgb.r, rgb.g, rgb.b),
    cmax = Math.max(rgb.r, rgb.g, rgb.b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  // Calculate hue
  // No difference
  if (delta == 0)
    h = 0;
  // Red is max
  else if (cmax == rgb.r)
    h = ((rgb.g - rgb.b) / delta) % 6;
  // Green is max
  else if (cmax == rgb.g)
    h = (rgb.b - rgb.r) / delta + 2;
  // Blue is max
  else
    h = (rgb.r - rgb.g) / delta + 4;

  h = Math.round(h * 60);

  // Make negative hues positive behind 360°
  if (h < 0)
    h += 360;

  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h: h, s: s, l: l };
}

function HSLtoRGB(hsl: HSL): RGB {
  let c = (1 - Math.abs(2 * hsl.l - 1)) * hsl.s,
    x = c * (1 - Math.abs((hsl.h / 60) % 2 - 1)),
    m = hsl.l - c / 2,
    r = 0,
    g = 0,
    b = 0;

  if (0 <= hsl.h && hsl.h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= hsl.h && hsl.h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= hsl.h && hsl.h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= hsl.h && hsl.h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= hsl.h && hsl.h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= hsl.h && hsl.h < 360) {
    r = c; g = 0; b = x;
  }
  r = r + m;
  g = g + m;
  b = b + m;

  return { r: r, g: g, b: b }
}

function darkenHSL(hsl: HSL): HSL {
  if (hsl.l < 0.2) {
    return { h: hsl.h, s: hsl.s, l: 1 }
  }

  var h = hsl.h, s = hsl.s, l = hsl.l

  if (hsl.h > (30.0 / 360.0) && hsl.h < (90.0 / 360.0) && hsl.s > (40.0 / 100.0) && hsl.l < (70.0 / 100.0)) {
    h = (219.0 / 360.0);
    s = (63.0 / 100.0);
    l = (41.0 / 100.0);
  }

  if (hsl.s > (60.0 / 100.0)) {
    s = (60.0 / 100.0);
  }

  if (hsl.l > (60.0 / 100.0)) {
    l = 0.1 + (1.0 - hsl.l);
  }

  return { h: h, s: s, l: l }
}

function toDarkness() {
  if (figma.currentPage.selection.length == 0) {
    figma.closePlugin("🤔 No object selected. Please select any object");
    return
  } else {
    try {
      var allSelection = figma.currentPage.selection;
      allSelection = allSelection.concat((figma.currentPage.selection[0] as DefaultFrameMixin).findAll());
    } catch (error) {
      logDebug("Can't get selection")
    }
  }

  logDebug("Selected items: ", allSelection)

  for (let obj of allSelection) {
    try {
      let frame = obj as DefaultFrameMixin
      frame.fillStyleId = "";
      frame.strokeStyleId = "";

      var paints: Array<Paint> = []
      for (const paint of (frame.fills as Array<Paint>)) {
        logDebug("Fill paint", paint);
        try {
          if (paint.type === "SOLID" && paint.visible) {
            let c: RGB = HSLtoRGB(darkenHSL(RGBtoHSL(paint.color)))
            let p: SolidPaint = { type: "SOLID", color: c, opacity: paint.opacity, visible: true };
            paints.push(p)
          } else {
            paints.push(paint)
          }
        } catch (error) {
        }
      }
      frame.fills = paints

      var strokes: Array<Paint> = []
      for (const paint of (frame.strokes as Array<Paint>)) {
        logDebug("Stroke paint", paint);
        try {
          if (paint.type === "SOLID" && paint.visible) {
            let c: RGB = HSLtoRGB(darkenHSL(RGBtoHSL(paint.color)))
            let p: SolidPaint = { type: "SOLID", color: c, opacity: paint.opacity, visible: true };
            strokes.push(p)
          } else {
            strokes.push(paint)
          }
        } catch (error) {
        }
      }
      frame.strokes = strokes

    } catch (error) {
      logDebug("Can't update fillStyle", obj)
    }
  }

  figma.closePlugin(`Darkness applyed!`);
}

toDarkness()