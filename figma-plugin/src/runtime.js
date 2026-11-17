/* El catálogo se incorpora durante la compilación. Todo funciona sin conexión. */
figma.showUI(__html__, { width: 380, height: 600, themeColors: true });
figma.root.setRelaunchData({ abrir: 'Crear una copia editable del flujo Venezuela v20' });
let busy = false;
let cancelled = false;
let runs = 0;
const fontCache = new Map();
const imageCache = new Map();
const status = (message, extra = {}) => figma.ui.postMessage({ type: 'status', message, ...extra });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const split = (value) => {
  const result = []; let level = 0; let start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') level++;
    if (value[i] === ')') level--;
    if (value[i] === ',' && level === 0) { result.push(value.slice(start, i).trim()); start = i + 1; }
  }
  result.push(value.slice(start).trim()); return result;
};
function rgba(value) {
  const parts = value.match(/[\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3) return { r: 0, g: 0, b: 0, a: 0 };
  return { r: clamp(parts[0] / 255, 0, 1), g: clamp(parts[1] / 255, 0, 1), b: clamp(parts[2] / 255, 0, 1), a: clamp(parts[3] ?? 1, 0, 1) };
}
/** @returns {SolidPaint} */
function solid(value) {
  const { r, g, b, a } = rgba(value);
  return { type: 'SOLID', color: { r, g, b }, opacity: a };
}
/** @returns {GradientPaint | null} */
function gradient(value, box) {
  if (!value?.startsWith('linear-gradient(')) return null;
  const parts = split(value.slice(16, -1));
  let angle = 180;
  if (parts[0].endsWith('deg')) angle = parseFloat(parts.shift());
  const raw = parts.map(part => {
    const match = part.match(/^(rgba?\([^)]+\))\s*(?:([\d.]+)%)?$/);
    if (!match) throw Error('Degradado no reconocido: ' + part);
    return { color: rgba(match[1]), position: match[2] === undefined ? null : Number(match[2]) / 100 };
  });
  if (raw[0].position === null) raw[0].position = 0;
  if (raw[raw.length - 1].position === null) raw[raw.length - 1].position = 1;
  for (let i = 1; i < raw.length - 1; i++) if (raw[i].position === null) {
    let end = i + 1; while (raw[end].position === null) end++;
    const start = raw[i - 1].position; const n = end - i + 1;
    for (let k = i; k < end; k++) raw[k].position = start + (raw[end].position - start) * (k - i + 1) / n;
    i = end - 1;
  }
  const rad = angle * Math.PI / 180;
  const length = Math.abs(box.w * Math.sin(rad)) + Math.abs(box.h * Math.cos(rad));
  const dx = Math.sin(rad) * length / box.w, dy = -Math.cos(rad) * length / box.h;
  const len2 = dx * dx + dy * dy;
  const x = .5 - dx / 2, y = .5 - dy / 2;
  return { type: 'GRADIENT_LINEAR', gradientStops: raw.map(stop => ({ position: clamp(stop.position, 0, 1), color: stop.color })), gradientTransform: [[dx / len2, dy / len2, -(x * dx + y * dy) / len2], [-dy / len2, dx / len2, .5 + (x * dy - y * dx) / len2]] };
}
/** @param {string} hash @param {'FILL' | 'FIT'} [mode] @returns {ImagePaint} */
function imagePaint(hash, mode = 'FILL') {
  if (!imageCache.has(hash)) {
    const data = CATALOGO.assets[hash];
    if (!data || !/^data:image\/(png|jpeg|gif);base64,/.test(data)) throw Error('Imagen no compatible: ' + hash);
    imageCache.set(hash, figma.createImage(figma.base64Decode(data.split(',')[1])).hash);
  }
  return { type: 'IMAGE', imageHash: imageCache.get(hash), scaleMode: mode };
}
/** @param {FrameNode} node @param {any} layer */
function paintFrame(node, layer) {
  const style = layer.style;
  node.fills = [];
  if (!style) return;
  const fills = [];
  const bg = solid(style.background);
  const grad = gradient(style.backgroundImage, layer.box);
  if (grad) fills.push(grad);
  if (layer.image) fills.push(imagePaint(layer.image, style.imageMode));
  if (bg.opacity > 0) fills.push(bg);
  node.fills = fills;
  node.opacity = style.opacity;
  node.clipsContent = ['hidden', 'scroll', 'auto', 'clip'].includes(style.overflow);
  [node.topLeftRadius, node.topRightRadius, node.bottomRightRadius, node.bottomLeftRadius] = style.radius.map(v => Math.max(0, v || 0));
  const border = style.borders.find(b => b.w > 0);
  if (border) {
    node.strokes = [solid(border.color)]; node.strokeAlign = 'INSIDE';
    [node.strokeTopWeight, node.strokeRightWeight, node.strokeBottomWeight, node.strokeLeftWeight] = style.borders.map(b => Math.max(0, b.w));
  } else node.strokes = [];
  if (style.shadow && style.shadow !== 'none') {
    node.effects = split(style.shadow).map(shadow => {
      const color = shadow.match(/rgba?\([^)]+\)/)?.[0];
      const values = shadow.replace(/rgba?\([^)]+\)/, '').match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
      return { type: shadow.includes('inset') ? 'INNER_SHADOW' : 'DROP_SHADOW', color: rgba(color ?? 'rgba(0,0,0,0)'), offset: { x: values[0] ?? 0, y: values[1] ?? 0 }, radius: Math.max(0, values[2] ?? 0), spread: values[3] ?? 0, visible: true, blendMode: 'NORMAL' };
    });
  }
}
/** @type {Font[]} */
let availableFonts;
async function fontFor(style) {
  const family = style.family.includes('Outfit') ? 'Outfit' : 'Inter';
  const weight = Number(style.family.match(/_(\d+)/)?.[1] ?? style.weight) || 400;
  const face = weight >= 800 ? 'ExtraBold' : weight >= 700 ? 'Bold' : weight >= 600 ? 'SemiBold' : weight >= 500 ? 'Medium' : 'Regular';
  const key = family + '/' + face;
  if (!fontCache.has(key)) fontCache.set(key, (async () => {
    const exact = availableFonts.find(f => f.fontName.family === family && f.fontName.style.replace(/\s/g, '').toLowerCase() === face.toLowerCase());
    if (!exact) throw Error(`Falta la fuente ${family} ${face}. Instala las fuentes de la carpeta Fuentes, reinicia Figma y vuelve a generar.`);
    await figma.loadFontAsync(exact.fontName); return exact.fontName;
  })());
  return fontCache.get(key);
}
/** @param {any} layer @param {FrameNode} parent @param {any} parentBox */
async function render(layer, parent, parentBox, depth = 0) {
  if (depth > 60) throw Error('Jerarquía de capas demasiado profunda.');
  const { box } = layer;
  /** @template {SceneNode} T @param {T} node @returns {T} */
  const own = node => { parent.appendChild(node); return node; };
  /** @type {FrameNode | RectangleNode | TextNode} */
  let node;
  if (layer.type === 'text') {
    const font = await fontFor(layer.textStyle);
    node = own(figma.createText()); node.fontName = font;
    node.fontSize = layer.textStyle.size; node.characters = layer.text;
    node.fills = [solid(layer.textStyle.color)];
    node.lineHeight = { unit: 'PIXELS', value: Math.max(1, box.h) };
    node.letterSpacing = { unit: 'PIXELS', value: layer.textStyle.spacing };
    node.textAutoResize = 'WIDTH_AND_HEIGHT';
    if (layer.textStyle.decoration.includes('underline')) node.textDecoration = 'UNDERLINE';
    else if (layer.textStyle.decoration.includes('line-through')) node.textDecoration = 'STRIKETHROUGH';
  } else if (layer.type === 'svg') {
    node = own(figma.createNodeFromSvg(layer.svg));
    node.resize(Math.max(.01, box.w), Math.max(.01, box.h));
    node.opacity = layer.style.opacity;
  } else if (layer.type === 'image') {
    node = own(figma.createRectangle()); node.resize(Math.max(.01, box.w), Math.max(.01, box.h));
    node.fills = [imagePaint(layer.image)]; node.opacity = layer.style.opacity;
  } else {
    node = own(figma.createFrame()); node.resize(Math.max(.01, box.w), Math.max(.01, box.h));
    paintFrame(node, layer);
  }
  node.name = layer.name;
  node.x = box.x - parentBox.x; node.y = box.y - parentBox.y;
  if (layer.type === 'text' && layer.textStyle.italic) node.relativeTransform = [[1, -.14, node.x], [0, 1, node.y]];
  if ('appendChild' in node) for (const child of layer.children ?? []) await render(child, node, box, depth + 1);
  return node;
}
function announce() {
  figma.ui.postMessage({ type: 'catalog', screens: CATALOGO.screens.map(s => ({ id: s.id, name: s.name })), count: CATALOGO.screens.length, sourceCommit: CATALOGO.sourceCommit });
}
figma.ui.onmessage = async (message) => {
  if (!message || typeof message.type !== 'string') return;
  if (message.type === 'ready') { announce(); return; }
  if (message.type === 'cancel') { cancelled = true; return; }
  if (message.type !== 'generate' || busy) return;
  const ids = message.screen === 'all' ? CATALOGO.screens.map(s => s.id)
    : message.screen === 'tour' ? CATALOGO.screens.filter(s => !['10', '11', '11b', '12', '12c', '12d', '13'].includes(s.screen)).map(s => s.id)
    : [message.screen];
  const screens = CATALOGO.screens.filter(s => ids.includes(s.id));
  if (!screens.length || !Number.isInteger(message.columns) || message.columns < 1 || message.columns > 6) { status('Elige una pantalla válida y entre una y seis columnas.', { error: true, done: true }); return; }
  busy = true; cancelled = false;
  let batch;
  try {
    status('Comprobando las fuentes…', { progress: 0 });
    availableFonts = await figma.listAvailableFontsAsync();
    const styles = new Map();
    const queue = screens.map(s => s.tree);
    while (queue.length) { const node = queue.pop(); if (node.type === 'text') styles.set(node.textStyle.family, node.textStyle); queue.push(...(node.children ?? [])); }
    for (const style of styles.values()) await fontFor(style);
    const columns = Math.min(screens.length, Math.floor(message.columns)); const gap = 72; const margin = 40;
    batch = figma.createFrame(); batch.name = 'TuTurno · Venezuela v20 · Pantallas editables'; batch.fills = []; batch.clipsContent = false;
    batch.resize(columns * (CATALOGO.width + gap) - gap + margin * 2, Math.ceil(screens.length / columns) * (CATALOGO.height + gap) - gap + margin * 2);
    batch.x = figma.viewport.center.x - batch.width / 2 + runs * 60; batch.y = figma.viewport.center.y - batch.height / 2 + runs * 60;
    batch.setPluginData('tuturno', JSON.stringify({ schema: 1, sourceCommit: CATALOGO.sourceCommit, createdAt: new Date().toISOString() }));
    batch.setRelaunchData({ abrir: 'Generar más pantallas del catálogo' });
    for (let i = 0; i < screens.length; i++) {
      if (cancelled) throw Error('Generación cancelada. Se retiró solamente el lote que se estaba creando.');
      const screen = screens[i];
      status(`Creando ${i + 1} de ${screens.length}: ${screen.name}`, { progress: i / screens.length });
      const frame = figma.createFrame(); frame.name = screen.name; frame.resize(screen.width, screen.height); frame.fills = []; frame.clipsContent = true;
      batch.appendChild(frame); frame.x = margin + i % columns * (screen.width + gap); frame.y = margin + Math.floor(i / columns) * (screen.height + gap);
      frame.setPluginData('pantalla', screen.id); frame.setPluginData('origen', `https://tuturno-flujo-venezuela.tiamat-agency.workers.dev/?screen=${screen.screen}&variant=${screen.variant}`);
      await render(screen.tree, frame, { x: 0, y: 0 });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (cancelled) throw Error('Generación cancelada. Se retiró solamente el lote que se estaba creando.');
    figma.currentPage.selection = [batch]; figma.viewport.scrollAndZoomIntoView([batch]); runs++;
    status(`${screens.length} pantallas listas. Los textos y vectores se pueden editar; las fotos se pueden reemplazar.`, { progress: 1, done: true, count: screens.length });
    figma.notify(`${screens.length} pantallas editables creadas`);
  } catch (error) {
    if (batch && !batch.removed) batch.remove();
    status(error instanceof Error ? error.message : String(error), { error: true, done: true });
  } finally { busy = false; }
};
