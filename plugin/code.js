const DebugMode = false;
function logDebug(message, ...optionalParams) {
    if (DebugMode) {
        console.log(message, optionalParams);
    }
}
function RGBtoHSL(rgb) {
    // Find greatest and smallest channel values
    let cmin = Math.min(rgb.r, rgb.g, rgb.b), cmax = Math.max(rgb.r, rgb.g, rgb.b), delta = cmax - cmin, h = 0, s = 0, l = 0;
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
function HSLtoRGB(hsl) {
    let c = (1 - Math.abs(2 * hsl.l - 1)) * hsl.s, x = c * (1 - Math.abs((hsl.h / 60) % 2 - 1)), m = hsl.l - c / 2, r = 0, g = 0, b = 0;
    if (0 <= hsl.h && hsl.h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (60 <= hsl.h && hsl.h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (120 <= hsl.h && hsl.h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (180 <= hsl.h && hsl.h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (240 <= hsl.h && hsl.h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else if (300 <= hsl.h && hsl.h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    r = r + m;
    g = g + m;
    b = b + m;
    return { r: r, g: g, b: b };
}
function darkenHSL(hsl) {
    var h = hsl.h, s = hsl.s, l = hsl.l;
    //переключаем 100% белый и 100% чёрный
    if (hsl.l == 0) {
        return { h: hsl.h, s: hsl.s, l: 1 };
    }
    if (hsl.l == 1) {
        return { h: hsl.h, s: hsl.s, l: 0 };
    }
    //все тёмные цвета инвертируются 
    if (hsl.l < 20.0 / 100.0) {
        l = 1 - hsl.l;
    }
    if (hsl.l < 10.0 / 100.0) {
        l = 1;
    }
    //все светлые цвета инвертируются
    if (hsl.l > 90.0 / 100.0 && hsl.s < 50.0 / 100.0) {
        l = 1.0 - hsl.l;
        s = 0;
    }
    if (hsl.l > 94.0 / 100.0) {
        l = 1.0 - hsl.l;
        s = 0;
    }
    if (hsl.l > 80.0 / 100.0) {
        l = (1.0 - hsl.l) + 0.05;
    }
    //чуть приглушаем яркость обычных цветов
    if (hsl.s > 30.0 / 100.0 && hsl.l > 20.0 / 100.0 && hsl.l < 70.0 / 100.0) {
        l = hsl.l + 0.05;
    }
    return { h: h, s: s, l: l };
}
function toDarkness() {
    if (figma.currentPage.selection.length == 0) {
        figma.closePlugin("🤔 No object selected. Please select any object");
        return;
    }
    else {
        try {
            var allSelection = figma.currentPage.selection;
            allSelection = allSelection.concat(figma.currentPage.selection[0].findAll());
        }
        catch (error) {
            logDebug("Can't get selection");
        }
    }
    logDebug("Selected items: ", allSelection);
    for (let obj of allSelection) {
        try {
            let frame = obj;
            frame.fillStyleId = "";
            frame.strokeStyleId = "";
            var paints = [];
            for (const paint of frame.fills) {
                logDebug("Fill paint", paint);
                try {
                    if (paint.type === "SOLID" && paint.visible) {
                        let c = HSLtoRGB(darkenHSL(RGBtoHSL(paint.color)));
                        let p = { type: "SOLID", color: c, opacity: paint.opacity, visible: true };
                        paints.push(p);
                    }
                    else {
                        paints.push(paint);
                    }
                }
                catch (error) {
                }
            }
            frame.fills = paints;
            var strokes = [];
            for (const paint of frame.strokes) {
                logDebug("Stroke paint", paint);
                try {
                    if (paint.type === "SOLID" && paint.visible) {
                        let c = HSLtoRGB(darkenHSL(RGBtoHSL(paint.color)));
                        let p = { type: "SOLID", color: c, opacity: paint.opacity, visible: true };
                        strokes.push(p);
                    }
                    else {
                        strokes.push(paint);
                    }
                }
                catch (error) {
                }
            }
            frame.strokes = strokes;
        }
        catch (error) {
            logDebug("Can't update fillStyle", obj);
        }
    }
    figma.closePlugin(`Darkness applyed!`);
}
toDarkness();
