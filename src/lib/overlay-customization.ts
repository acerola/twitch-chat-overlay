import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export type FontPresetId = "kiwi" | "zen" | "mplus" | "kaisei";
export type AvatarPresetId = "blossom" | "crescent" | "gem" | "star" | "vampire";
export type OverlayColorOverrideKey = "fc" | "nb" | "nt" | "mc" | "ac" | "ar" | "as";

export interface OverlayStyleConfig {
  v: 1;
  f: FontPresetId;
  c: string;
  a: AvatarPresetId;
  fc?: string;
  nb?: string;
  nt?: string;
  mc?: string;
  ac?: string;
  ar?: string;
  as?: string;
}

export interface FontPresetOption {
  id: FontPresetId;
  label: string;
  previewText: string;
  fontFamily: string;
}

export interface AvatarPresetOption {
  id: AvatarPresetId;
  label: string;
  description: string;
}

export interface OverlayContrastWarning {
  id: "name" | "message" | "alert";
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  minimum: number;
}

export const DEFAULT_OVERLAY_STYLE_CONFIG: OverlayStyleConfig = {
  v: 1,
  f: "kiwi",
  c: "ffa9b5",
  a: "blossom",
};

export const FONT_PRESET_OPTIONS: readonly FontPresetOption[] = [
  {
    id: "kiwi",
    label: "Kiwi Maru",
    previewText: "やわらか丸文字",
    fontFamily: '"Kiwi Maru", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  },
  {
    id: "zen",
    label: "Zen Maru Gothic",
    previewText: "すっきり丸ゴ",
    fontFamily: '"Zen Maru Gothic", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  },
  {
    id: "mplus",
    label: "M PLUS Rounded 1c",
    previewText: "配信向け丸ゴ",
    fontFamily: '"M PLUS Rounded 1c", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  },
  {
    id: "kaisei",
    label: "Kaisei Decol",
    previewText: "和風デコ文字",
    fontFamily: '"Kaisei Decol", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  },
];

export const AVATAR_PRESET_OPTIONS: readonly AvatarPresetOption[] = [
  { id: "blossom", label: "Blossom", description: "現在の桜バッジ" },
  { id: "crescent", label: "Crescent", description: "月と小花のバッジ" },
  { id: "gem", label: "Gem", description: "宝石モチーフ" },
  { id: "star", label: "Star", description: "星モチーフ" },
  { id: "vampire", label: "Vampire Wings", description: "吸血鬼の翼モチーフ" },
];

const FONT_PRESET_IDS = new Set<FontPresetId>(FONT_PRESET_OPTIONS.map((option) => option.id));
const AVATAR_PRESET_IDS = new Set<AvatarPresetId>(AVATAR_PRESET_OPTIONS.map((option) => option.id));
const DEFAULT_FONT_FAMILY = '"Kiwi Maru", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
const MIN_TEXT_CONTRAST_RATIO = 4.5;
const REPRESENTATIVE_MESSAGE_PLATE_COLOR = "#23181b";
const DEFAULT_OVERLAY_THEME_VARS = {
  "--flower-color": "#ffa9b5",
  "--message-color": "#fffefe",
  "--name-background-color": "#ffc9d4",
  "--name-color": "#7b563c",
  "--alert-text-color": "#fffefe",
  "--role-pill-background-color": "rgba(255, 201, 212, 0.2)",
  "--role-pill-border-color": "rgba(255, 255, 255, 0.86)",
  "--avatar-ring-color": "#ffc9d4",
  "--avatar-stem-color": "#7b563c",
  "--avatar-accent-1": "#ffe2eb",
  "--avatar-accent-2": "#ffd2e0",
  "--avatar-accent-3": "#ffc1d4",
  "--avatar-accent-4": "#ffb5cc",
  "--avatar-accent-5": "#ffc8da",
} satisfies Record<`--${string}`, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFontPresetId(value: unknown): value is FontPresetId {
  return typeof value === "string" && FONT_PRESET_IDS.has(value as FontPresetId);
}

function isAvatarPresetId(value: unknown): value is AvatarPresetId {
  return typeof value === "string" && AVATAR_PRESET_IDS.has(value as AvatarPresetId);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(color: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeAccentColor(color);
  if (!normalized) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: lightness };
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  if (max === rn) {
    hue = (gn - bn) / delta + (gn < bn ? 6 : 0);
  } else if (max === gn) {
    hue = (bn - rn) / delta + 2;
  } else {
    hue = (rn - gn) / delta + 4;
  }

  return { h: hue / 6, s: saturation, l: lightness };
}

function hueToRgb(p: number, q: number, t: number): number {
  let adjusted = t;
  if (adjusted < 0) {
    adjusted += 1;
  }
  if (adjusted > 1) {
    adjusted -= 1;
  }
  if (adjusted < 1 / 6) {
    return p + (q - p) * 6 * adjusted;
  }
  if (adjusted < 1 / 2) {
    return q;
  }
  if (adjusted < 2 / 3) {
    return p + (q - p) * (2 / 3 - adjusted) * 6;
  }
  return p;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const value = l * 255;
    return { r: value, g: value, b: value };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hueToRgb(p, q, h + 1 / 3) * 255,
    g: hueToRgb(p, q, h) * 255,
    b: hueToRgb(p, q, h - 1 / 3) * 255,
  };
}

function adjustLightness(color: string, amount: number, mode: "lighten" | "darken"): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return `#${DEFAULT_OVERLAY_STYLE_CONFIG.c}`;
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const nextLightness =
    mode === "lighten"
      ? hsl.l + (1 - hsl.l) * amount
      : hsl.l * (1 - amount);
  const adjusted = hslToRgb(hsl.h, hsl.s, clamp(nextLightness, 0, 1));
  return rgbToHex(adjusted.r, adjusted.g, adjusted.b);
}

function withAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "rgba(255, 169, 181, 0.22)";
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1).toFixed(2)})`;
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(color: string): number | null {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return null;
  }

  return (
    0.2126 * srgbChannelToLinear(rgb.r) +
    0.7152 * srgbChannelToLinear(rgb.g) +
    0.0722 * srgbChannelToLinear(rgb.b)
  );
}

function getContrastRatio(foreground: string, background: string): number | null {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) {
    return null;
  }

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function normalizeAccentColor(rawColor: string | null | undefined): string | null {
  if (!rawColor) {
    return null;
  }

  const normalized = rawColor.trim().replace(/^#/, "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(normalized) ? normalized : null;
}

export function formatAccentColor(color: string): string {
  return `#${normalizeAccentColor(color) ?? DEFAULT_OVERLAY_STYLE_CONFIG.c}`;
}

export function getFontPresetFontFamily(presetId: FontPresetId): string {
  return FONT_PRESET_OPTIONS.find((option) => option.id === presetId)?.fontFamily ?? DEFAULT_FONT_FAMILY;
}

export function resolveOverlayStyleConfig(input: Partial<OverlayStyleConfig> | null | undefined): OverlayStyleConfig {
  return {
    v: 1,
    f: isFontPresetId(input?.f) ? input.f : DEFAULT_OVERLAY_STYLE_CONFIG.f,
    c: normalizeAccentColor(input?.c) ?? DEFAULT_OVERLAY_STYLE_CONFIG.c,
    a: isAvatarPresetId(input?.a) ? input.a : DEFAULT_OVERLAY_STYLE_CONFIG.a,
    fc: normalizeAccentColor(input?.fc) ?? undefined,
    nb: normalizeAccentColor(input?.nb) ?? undefined,
    nt: normalizeAccentColor(input?.nt) ?? undefined,
    mc: normalizeAccentColor(input?.mc) ?? undefined,
    ac: normalizeAccentColor(input?.ac) ?? undefined,
    ar: normalizeAccentColor(input?.ar) ?? undefined,
    as: normalizeAccentColor(input?.as) ?? undefined,
  };
}

export function encodeOverlayStyleConfig(config: OverlayStyleConfig): string {
  return compressToEncodedURIComponent(JSON.stringify(resolveOverlayStyleConfig(config)));
}

export function decodeOverlayStyleConfig(packedConfig: string | null | undefined): OverlayStyleConfig {
  if (!packedConfig) {
    return DEFAULT_OVERLAY_STYLE_CONFIG;
  }

  try {
    const json = decompressFromEncodedURIComponent(packedConfig);
    if (!json) {
      return DEFAULT_OVERLAY_STYLE_CONFIG;
    }

    const parsed = JSON.parse(json);
    if (!isRecord(parsed) || parsed.v !== 1) {
      return DEFAULT_OVERLAY_STYLE_CONFIG;
    }

    return resolveOverlayStyleConfig(parsed);
  } catch {
    return DEFAULT_OVERLAY_STYLE_CONFIG;
  }
}

export function createOverlayStyleVars(config: OverlayStyleConfig): Record<`--${string}`, string> {
  const resolved = resolveOverlayStyleConfig(config);
  const accentHex = resolved.c;
  const baseVars = {
    "--overlay-font-family": getFontPresetFontFamily(resolved.f),
    ...DEFAULT_OVERLAY_THEME_VARS,
  } satisfies Record<`--${string}`, string>;

  const derivedVars =
    accentHex === DEFAULT_OVERLAY_STYLE_CONFIG.c
      ? baseVars
      : {
          ...baseVars,
          "--flower-color": formatAccentColor(accentHex),
          "--name-background-color": adjustLightness(accentHex, 0.32, "lighten"),
          "--name-color": adjustLightness(accentHex, 0.48, "darken"),
          "--role-pill-background-color": withAlpha(accentHex, 0.18),
          "--role-pill-border-color": withAlpha(accentHex, 0.54),
          "--avatar-ring-color": adjustLightness(accentHex, 0.36, "lighten"),
          "--avatar-stem-color": adjustLightness(accentHex, 0.48, "darken"),
          "--avatar-accent-1": adjustLightness(accentHex, 0.56, "lighten"),
          "--avatar-accent-2": adjustLightness(accentHex, 0.46, "lighten"),
          "--avatar-accent-3": adjustLightness(accentHex, 0.34, "lighten"),
          "--avatar-accent-4": adjustLightness(accentHex, 0.22, "lighten"),
          "--avatar-accent-5": adjustLightness(accentHex, 0.12, "lighten"),
        };

  return {
    ...derivedVars,
    ...(resolved.fc ? { "--flower-color": formatAccentColor(resolved.fc) } : {}),
    ...(resolved.nb ? { "--name-background-color": formatAccentColor(resolved.nb) } : {}),
    ...(resolved.nt ? { "--name-color": formatAccentColor(resolved.nt) } : {}),
    ...(resolved.mc ? { "--message-color": formatAccentColor(resolved.mc) } : {}),
    ...(resolved.ac ? { "--alert-text-color": formatAccentColor(resolved.ac) } : {}),
    ...(resolved.ar ? { "--avatar-ring-color": formatAccentColor(resolved.ar) } : {}),
    ...(resolved.as ? { "--avatar-stem-color": formatAccentColor(resolved.as) } : {}),
  };
}

export function getOverlayContrastWarnings(config: OverlayStyleConfig): OverlayContrastWarning[] {
  const styleVars = createOverlayStyleVars(config);
  const checks = [
    {
      id: "name" as const,
      label: "ネーム文字",
      foreground: styleVars["--name-color"] ?? DEFAULT_OVERLAY_THEME_VARS["--name-color"],
      background:
        styleVars["--name-background-color"] ??
        DEFAULT_OVERLAY_THEME_VARS["--name-background-color"],
    },
    {
      id: "message" as const,
      label: "メッセージ文字",
      foreground:
        styleVars["--message-color"] ?? DEFAULT_OVERLAY_THEME_VARS["--message-color"],
      background: REPRESENTATIVE_MESSAGE_PLATE_COLOR,
    },
    {
      id: "alert" as const,
      label: "通知文字",
      foreground:
        styleVars["--alert-text-color"] ??
        DEFAULT_OVERLAY_THEME_VARS["--alert-text-color"],
      background: REPRESENTATIVE_MESSAGE_PLATE_COLOR,
    },
  ];

  return checks.flatMap((check) => {
    const ratio = getContrastRatio(check.foreground, check.background);
    if (ratio === null || ratio >= MIN_TEXT_CONTRAST_RATIO) {
      return [];
    }

    return [
      {
        ...check,
        ratio: Number(ratio.toFixed(2)),
        minimum: MIN_TEXT_CONTRAST_RATIO,
      } satisfies OverlayContrastWarning,
    ];
  });
}

export function buildOverlayUrl(appBaseUrl: string, config: OverlayStyleConfig): string {
  const url = new URL(appBaseUrl);
  url.search = "";
  url.searchParams.set("cfg", encodeOverlayStyleConfig(config));
  return url.toString();
}

export function buildCustomizerUrl(appBaseUrl: string): string {
  const url = new URL(appBaseUrl);
  url.search = "";
  url.searchParams.set("customize", "1");
  return url.toString();
}
