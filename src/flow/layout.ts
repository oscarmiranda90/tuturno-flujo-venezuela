export const REFERENCE_WIDTH = 360;
export const REFERENCE_HEIGHT = 800;
const STATUS_SPACE = 28;
const HOME_SPACE = 12;

export interface CanvasLayout {
  referenceWidth: number;
  width: number;
  referenceHeight: number;
  height: number;
}
export type HorizontalAnchor = "auto" | "left" | "center" | "right" | "stretch";

/** Conserva el tamaño de diseño de textos e imágenes en teléfonos anchos. Las pantallas estrechas se escalan proporcionalmente y las de poca altura permiten desplazarse sin comprimir el contenido. */
export function frameLayout(
  width: number,
  height: number,
  top = 0,
  bottom = 0,
  native = false,
) {
  const availableWidth = Math.min(Math.max(1, width), 480);
  const viewportHeight = Math.max(1, height - top - bottom);
  const scale = Math.min(1, availableWidth / REFERENCE_WIDTH);
  const trimTop = native ? STATUS_SPACE : 0;
  const trimBottom = native ? HOME_SPACE : 0;
  const canvasHeight = Math.max(
    REFERENCE_HEIGHT,
    viewportHeight / scale + trimTop + trimBottom,
  );
  return {
    scale,
    width: availableWidth / scale,
    height: canvasHeight,
    physicalWidth: availableWidth,
    viewportHeight,
    trimTop,
    contentHeight: (canvasHeight - trimTop - trimBottom) * scale,
    overlayHeight: viewportHeight / scale + trimTop + trimBottom,
  };
}

/** Adapta los límites de los paneles y el contenido anclado sin estirar sus elementos. */
export function horizontalRect(
  layout: CanvasLayout,
  x: number,
  width?: number,
  anchor: HorizontalAnchor = "auto",
) {
  const extra = layout.width - layout.referenceWidth;
  if (
    anchor === "stretch" ||
    (anchor === "auto" &&
      width !== undefined &&
      width >= layout.referenceWidth * 0.55 &&
      layout.referenceWidth - x - width <= 32)
  ) {
    return {
      x,
      width: width === undefined ? undefined : Math.max(1, width + extra),
    };
  }
  const alignment =
    anchor !== "auto"
      ? anchor
      : width !== undefined &&
          Math.abs(x + width / 2 - layout.referenceWidth / 2) <= 16
        ? "center"
        : x >= layout.referenceWidth * 0.6
          ? "right"
          : "left";
  const shift =
    alignment === "center"
      ? extra / 2
      : alignment === "right"
        ? extra
        : width === undefined
          ? (extra * x) / layout.referenceWidth
          : 0;
  return { x: x + shift, width };
}
