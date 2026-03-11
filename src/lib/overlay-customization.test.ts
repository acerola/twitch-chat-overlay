import { compressToEncodedURIComponent } from "lz-string";
import { describe, expect, it } from "vitest";
import {
  buildCustomizerUrl,
  buildOverlayUrl,
  createOverlayStyleVars,
  decodeOverlayStyleConfig,
  DEFAULT_OVERLAY_STYLE_CONFIG,
  encodeOverlayStyleConfig,
  normalizeAccentColor,
  resolveOverlayStyleConfig,
} from "./overlay-customization";

describe("overlay customization", () => {
  it("round-trips a non-default packed config", () => {
    const packed = encodeOverlayStyleConfig({
      v: 1,
      f: "kaisei",
      c: "123456",
      a: "vampire",
      nt: "faf7ff",
      ar: "eeddff",
    });

    expect(decodeOverlayStyleConfig(packed)).toEqual({
      v: 1,
      f: "kaisei",
      c: "123456",
      a: "vampire",
      nt: "faf7ff",
      ar: "eeddff",
    });
  });

  it("falls back to defaults when packed config is invalid", () => {
    expect(decodeOverlayStyleConfig("bad-data")).toEqual(DEFAULT_OVERLAY_STYLE_CONFIG);
  });

  it("falls back to defaults when packed config has an unsupported version", () => {
    const packed = compressToEncodedURIComponent(JSON.stringify({ v: 2, f: "zen", c: "123456", a: "star" }));

    expect(decodeOverlayStyleConfig(packed)).toEqual(DEFAULT_OVERLAY_STYLE_CONFIG);
  });

  it("normalizes accent colors and resolves invalid values to defaults", () => {
    expect(normalizeAccentColor("#ABCDEF")).toBe("abcdef");
    expect(resolveOverlayStyleConfig({ c: "not-a-color" })).toEqual(DEFAULT_OVERLAY_STYLE_CONFIG);
  });

  it("builds overlay and customizer URLs with the expected params", () => {
    const config = {
      v: 1,
      f: "zen",
      c: "556677",
      a: "crescent",
    } as const;

    const overlayUrl = new URL(buildOverlayUrl("https://example.com/twitch-chat-overlay/", config));
    const customizerUrl = new URL(buildCustomizerUrl("https://example.com/twitch-chat-overlay/"));

    expect(overlayUrl.pathname).toBe("/twitch-chat-overlay/");
    expect(overlayUrl.searchParams.has("channel")).toBe(false);
    expect(overlayUrl.searchParams.get("cfg")).toBeTruthy();
    expect(overlayUrl.searchParams.has("test")).toBe(false);

    expect(customizerUrl.searchParams.get("customize")).toBe("1");
    expect(customizerUrl.searchParams.has("channel")).toBe(false);
    expect(customizerUrl.searchParams.has("cfg")).toBe(false);
  });

  it("creates derived theme variables from the main accent color", () => {
    const styleVars = createOverlayStyleVars({
      v: 1,
      f: "mplus",
      c: "225588",
      a: "star",
    });

    expect(styleVars["--overlay-font-family"]).toContain("M PLUS Rounded 1c");
    expect(styleVars["--flower-color"]).toBe("#225588");
    expect(styleVars["--name-background-color"]).toMatch(/^#/);
    expect(styleVars["--avatar-accent-1"]).toMatch(/^#/);
  });

  it("applies explicit color overrides on top of the derived palette", () => {
    const styleVars = createOverlayStyleVars({
      v: 1,
      f: "kiwi",
      c: "225588",
      a: "blossom",
      mc: "f8f4ff",
      nt: "24111f",
      ar: "eed0ff",
    });

    expect(styleVars["--message-color"]).toBe("#f8f4ff");
    expect(styleVars["--name-color"]).toBe("#24111f");
    expect(styleVars["--avatar-ring-color"]).toBe("#eed0ff");
    expect(styleVars["--flower-color"]).toBe("#225588");
  });

  it("preserves the original main-branch palette for the default config", () => {
    const styleVars = createOverlayStyleVars(DEFAULT_OVERLAY_STYLE_CONFIG);

    expect(styleVars["--flower-color"]).toBe("#ffa9b5");
    expect(styleVars["--name-background-color"]).toBe("#ffc9d4");
    expect(styleVars["--name-color"]).toBe("#7b563c");
    expect(styleVars["--role-pill-background-color"]).toBe("rgba(255, 201, 212, 0.2)");
    expect(styleVars["--role-pill-border-color"]).toBe("rgba(255, 255, 255, 0.86)");
    expect(styleVars["--avatar-accent-1"]).toBe("#ffe2eb");
  });
});
