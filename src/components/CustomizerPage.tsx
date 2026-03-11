import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AvatarBadgeIcon } from "./AvatarBadgeIcon";
import { OverlayScreen } from "./OverlayScreen";
import {
  AVATAR_PRESET_OPTIONS,
  buildCustomizerUrl,
  buildOverlayUrl,
  createOverlayStyleVars,
  DEFAULT_OVERLAY_STYLE_CONFIG,
  FONT_PRESET_OPTIONS,
  formatAccentColor,
  getOverlayContrastWarnings,
  normalizeAccentColor,
  type OverlayColorOverrideKey,
  type OverlayStyleConfig,
} from "../lib/overlay-customization";

interface CustomizerPageProps {
  appBaseUrl: string;
  initialConfig: OverlayStyleConfig;
}

const pageStyle = {
  background: `
    radial-gradient(circle at top left, var(--customizer-page-glow-1), transparent 36%),
    radial-gradient(circle at bottom right, var(--customizer-page-glow-2), transparent 32%),
    linear-gradient(160deg, var(--customizer-page-bg-start) 0%, var(--customizer-page-bg-mid) 48%, var(--customizer-page-bg-end) 100%)
  `,
} satisfies CSSProperties;

const panelStyle = {
  background:
    "linear-gradient(180deg, var(--customizer-panel-top), var(--customizer-panel-bottom))",
  backdropFilter: "blur(18px)",
  boxShadow: "0 18px 52px rgba(0, 0, 0, 0.28)",
} satisfies CSSProperties;

const stageStyle = {
  background: `
    linear-gradient(180deg, var(--customizer-stage-top), var(--customizer-stage-bottom)),
    linear-gradient(135deg, var(--customizer-stage-start), var(--customizer-stage-end))
  `,
} satisfies CSSProperties;

const sectionClassName =
  "flex flex-col gap-3 rounded-[18px] border border-[var(--customizer-border)] bg-[var(--customizer-surface-muted)] p-4";
const sectionHeadClassName = "flex flex-col gap-1";
const helperTextClassName =
  "m-0 text-[13px] leading-[1.55] text-[var(--customizer-text-muted)]";
const choiceBaseClassName =
  "cursor-pointer rounded-[18px] border border-[var(--customizer-border-soft)] bg-[var(--customizer-surface)] text-left text-inherit transition-[border-color,transform,background] duration-150 ease-in-out hover:-translate-y-px hover:border-[var(--customizer-border-accent)] hover:bg-[var(--customizer-surface-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customizer-focus)]";
const selectedChoiceClassName =
  "border-[var(--customizer-border-accent)] bg-[var(--customizer-surface-strong)] -translate-y-px";
const secondaryButtonClassName =
  "cursor-pointer rounded-full border border-[var(--customizer-border-strong)] bg-[var(--customizer-surface-strong)] px-4 py-[10px] text-[13px] font-medium text-[var(--customizer-text)] transition-[background,border-color,transform] duration-150 ease-in-out hover:-translate-y-px hover:border-[var(--customizer-border-accent)] hover:bg-[var(--customizer-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customizer-focus)] disabled:cursor-not-allowed disabled:opacity-48";
const primaryButtonClassName =
  "cursor-pointer rounded-full border border-[var(--customizer-border-accent-soft)] bg-[var(--customizer-primary)] px-4 py-[10px] text-[13px] font-medium text-[var(--customizer-text)] transition-[transform,filter] duration-150 ease-in-out hover:-translate-y-px hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customizer-focus)] disabled:cursor-not-allowed disabled:opacity-48";
const inputClassName =
  "w-full rounded-2xl border border-[var(--customizer-border-strong)] bg-[var(--customizer-surface)] px-[14px] py-[13px] text-[var(--customizer-text-body)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--customizer-focus-soft)]";
const statusChipClassName =
  "inline-flex items-center rounded-full border border-[var(--customizer-border)] bg-[var(--customizer-surface)] px-3 py-[6px] text-[12px] font-medium text-[var(--customizer-text)]";

const CUSTOMIZER_DESKTOP_MEDIA_QUERY = "(min-width: 721px)";
const CUSTOMIZER_PREVIEW_TOP_OFFSET = 24;

type ColorFieldKey = "c" | OverlayColorOverrideKey;
type ColorCodeInputs = Record<ColorFieldKey, string>;

const ADVANCED_COLOR_OPTIONS: ReadonlyArray<{
  key: OverlayColorOverrideKey;
  label: string;
  description: string;
}> = [
  {
    key: "fc",
    label: "装飾アクセント",
    description: "区切りアイコンやサイドマーカーの差し色です。",
  },
  {
    key: "nb",
    label: "ネーム背景",
    description: "ユーザー名ピルの背景色です。",
  },
  {
    key: "nt",
    label: "ネーム文字",
    description: "ユーザー名ピルの文字色です。",
  },
  {
    key: "mc",
    label: "メッセージ文字",
    description: "チャット本文の文字色です。",
  },
  { key: "ac", label: "通知文字", description: "アラート通知の文字色です。" },
  {
    key: "ar",
    label: "アバター外枠",
    description: "プロフィールアイコンの輪郭色です。",
  },
  { key: "as", label: "装飾線色", description: "バッジやマーカーの線画色です。" },
  { key: "dc", label: "サイドドット", description: "メッセージ横の装飾ドットの色です。" },
] as const;

function buildColorCodeInputs(config: OverlayStyleConfig): ColorCodeInputs {
  const styleVars = createOverlayStyleVars(config);
  return {
    c: formatAccentColor(config.c),
    fc: styleVars["--flower-color"] ?? "#ffa9b5",
    nb: styleVars["--name-background-color"] ?? "#ffc9d4",
    nt: styleVars["--name-color"] ?? "#7b563c",
    mc: styleVars["--message-color"] ?? "#fffefe",
    ac: styleVars["--alert-text-color"] ?? "#fffefe",
    ar: styleVars["--avatar-ring-color"] ?? "#ffc9d4",
    as: styleVars["--avatar-stem-color"] ?? "#7b563c",
    dc: styleVars["--side-dot-color"] ?? "#fffff0",
  };
}

function getChoiceClassName(selected: boolean): string {
  return `${choiceBaseClassName} flex flex-col gap-[6px] p-[14px]${selected ? ` ${selectedChoiceClassName}` : ""}`;
}

function getAvatarChoiceClassName(selected: boolean): string {
  return `${choiceBaseClassName} grid justify-items-start gap-2 px-3 py-[14px]${selected ? ` ${selectedChoiceClassName}` : ""}`;
}

export function getCustomizerPreviewOffset({
  containerTop,
  containerHeight,
  panelHeight,
  topOffset = CUSTOMIZER_PREVIEW_TOP_OFFSET,
}: {
  containerTop: number;
  containerHeight: number;
  panelHeight: number;
  topOffset?: number;
}): number {
  if (
    containerHeight <= 0 ||
    panelHeight <= 0 ||
    panelHeight >= containerHeight
  ) {
    return 0;
  }

  const desiredOffset = topOffset - containerTop;
  const maxOffset = containerHeight - panelHeight;

  return Math.min(Math.max(desiredOffset, 0), maxOffset);
}

export function CustomizerPage({
  appBaseUrl,
  initialConfig,
}: CustomizerPageProps) {
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const previewPanelRef = useRef<HTMLDivElement | null>(null);
  const generatedUrlRef = useRef<HTMLTextAreaElement | null>(null);
  const [draftConfig, setDraftConfig] =
    useState<OverlayStyleConfig>(initialConfig);
  const [colorCodeInputs, setColorCodeInputs] = useState<ColorCodeInputs>(() =>
    buildColorCodeInputs(initialConfig),
  );
  const [showAdvancedColors, setShowAdvancedColors] = useState(() =>
    ADVANCED_COLOR_OPTIONS.some((option) => Boolean(initialConfig[option.key])),
  );
  const [copyLabel, setCopyLabel] = useState("コピー");

  const previewConfig = useDeferredValue(draftConfig);
  const avatarPreviewStyle = useMemo(
    () => createOverlayStyleVars(draftConfig) as CSSProperties,
    [draftConfig],
  );
  const customizeHref = useMemo(
    () => buildCustomizerUrl(appBaseUrl),
    [appBaseUrl],
  );
  const generatedUrl = useMemo(
    () => buildOverlayUrl(appBaseUrl, draftConfig),
    [appBaseUrl, draftConfig],
  );
  const selectedFontOption =
    FONT_PRESET_OPTIONS.find((option) => option.id === draftConfig.f) ??
    FONT_PRESET_OPTIONS[0];
  const selectedAvatarOption =
    AVATAR_PRESET_OPTIONS.find((option) => option.id === draftConfig.a) ??
    AVATAR_PRESET_OPTIONS[0];
  const activeOverrideCount = ADVANCED_COLOR_OPTIONS.filter(
    (option) => draftConfig[option.key],
  ).length;
  const contrastWarnings = useMemo(
    () => getOverlayContrastWarnings(draftConfig),
    [draftConfig],
  );

  useEffect(() => {
    setColorCodeInputs(buildColorCodeInputs(draftConfig));
  }, [draftConfig]);

  useEffect(() => {
    setCopyLabel("コピー");
  }, [generatedUrl]);

  const syncPreviewPanelPosition = useEffectEvent(() => {
    if (!layoutRef.current || !previewPanelRef.current) {
      return;
    }

    const mediaQuery = window.matchMedia(CUSTOMIZER_DESKTOP_MEDIA_QUERY);
    const nextOffset = mediaQuery.matches
      ? getCustomizerPreviewOffset({
          containerTop: layoutRef.current.getBoundingClientRect().top,
          containerHeight: layoutRef.current.offsetHeight,
          panelHeight: previewPanelRef.current.offsetHeight,
        })
      : 0;

    previewPanelRef.current.style.transform = `translateY(${nextOffset}px)`;
  });

  useEffect(() => {
    let frameId = 0;
    const mediaQuery = window.matchMedia(CUSTOMIZER_DESKTOP_MEDIA_QUERY);

    const scheduleSync = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncPreviewPanelPosition);
    };

    scheduleSync();

    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    mediaQuery.addEventListener("change", scheduleSync);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(scheduleSync);
      if (layoutRef.current) {
        observer.observe(layoutRef.current);
      }
      if (previewPanelRef.current) {
        observer.observe(previewPanelRef.current);
      }
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      mediaQuery.removeEventListener("change", scheduleSync);
      observer?.disconnect();
    };
  }, [syncPreviewPanelPosition]);

  const onCopyUrl = async () => {
    if (!generatedUrl) {
      return;
    }

    const selectGeneratedUrl = () => {
      generatedUrlRef.current?.focus();
      generatedUrlRef.current?.select();
      setCopyLabel("手動コピー");
    };

    if (!navigator.clipboard) {
      selectGeneratedUrl();
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopyLabel("コピー済み");
    } catch {
      selectGeneratedUrl();
    }
  };

  const onResetTheme = () => {
    setDraftConfig(DEFAULT_OVERLAY_STYLE_CONFIG);
    setCopyLabel("コピー");
  };

  const onResetColorOverrides = () => {
    setDraftConfig((current) => ({
      ...current,
      fc: undefined,
      nb: undefined,
      nt: undefined,
      mc: undefined,
      ac: undefined,
      ar: undefined,
      as: undefined,
      dc: undefined,
    }));
    setShowAdvancedColors(false);
    setCopyLabel("コピー");
  };

  const onColorFieldChange = (key: ColorFieldKey, rawColor: string) => {
    const nextColor = normalizeAccentColor(rawColor);
    if (!nextColor) {
      return;
    }

    if (key !== "c") {
      setShowAdvancedColors(true);
    }

    setDraftConfig((current) => {
      if (key === "c") {
        return { ...current, c: nextColor };
      }

      return { ...current, [key]: nextColor };
    });
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden p-[14px] pb-8 text-[var(--customizer-text-body)] min-[721px]:p-5 min-[721px]:pb-10 min-[1180px]:p-6"
      style={pageStyle}
      data-testid="customizer-page"
    >
      <div
        ref={layoutRef}
        className="mx-auto grid w-[min(1380px,100%)] grid-cols-1 items-start gap-5 min-[721px]:gap-6 min-[960px]:grid-cols-[minmax(320px,390px)_minmax(0,1fr)] min-[1180px]:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]"
      >
        <main
          className="flex flex-col gap-5 rounded-[20px] border border-[var(--customizer-border-soft)] p-4 min-[721px]:rounded-[24px] min-[721px]:p-5 min-[1180px]:p-6"
          style={panelStyle}
        >
          <div className="flex flex-col gap-4 rounded-[20px] border border-[var(--customizer-border)] bg-[var(--customizer-surface)] p-4">
            <div>
              <p className="mb-[6px] text-xs font-medium uppercase tracking-[0.16em] text-[var(--customizer-text-accent)]">
                Overlay Studio
              </p>
              <h1 className="m-0 text-[clamp(30px,4vw,42px)] leading-[1.1] text-[var(--customizer-text-heading)]">
                オーバーレイ調整
              </h1>
            </div>
            <div className="flex flex-wrap gap-[10px]">
              <span className={statusChipClassName}>
                フォント: {selectedFontOption?.label ?? draftConfig.f}
              </span>
              <span className={statusChipClassName}>
                アイコン: {selectedAvatarOption?.label ?? draftConfig.a}
              </span>
              <span className={statusChipClassName}>
                アクセント: {colorCodeInputs.c}
              </span>
              <span className={statusChipClassName}>
                詳細カラー {activeOverrideCount} 件
              </span>
            </div>
          </div>

          <div className={sectionClassName}>
            <div className={sectionHeadClassName}>
              <h2 className="m-0 text-[17px] font-medium text-[var(--customizer-text-heading)]">
                フォント
              </h2>
            </div>
            <div
              className="grid grid-cols-1 gap-[10px] min-[1180px]:grid-cols-2"
              role="group"
              aria-label="フォント選択"
            >
              {FONT_PRESET_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={getChoiceClassName(draftConfig.f === option.id)}
                  aria-pressed={draftConfig.f === option.id}
                  onClick={() =>
                    setDraftConfig((current) => ({ ...current, f: option.id }))
                  }
                >
                  <span className="text-sm font-medium text-[var(--customizer-text)]">
                    {option.label}
                  </span>
                  <span
                    className="text-lg leading-[1.35] text-[var(--customizer-text-preview)]"
                    style={{ fontFamily: option.fontFamily }}
                  >
                    {option.previewText}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={sectionClassName}>
            <div className={sectionHeadClassName}>
              <h2 className="m-0 text-[17px] font-medium text-[var(--customizer-text-heading)]">
                メインカラー
              </h2>
              <p className={helperTextClassName}>
                装飾・ネームピル・バッジ配色はこの 1 色から自動で組み立てます。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                aria-label="メインカラー"
                className="h-12 w-[68px] cursor-pointer rounded-[14px] border-none bg-transparent"
                type="color"
                value={colorCodeInputs.c}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setColorCodeInputs((current) => ({
                    ...current,
                    c: nextValue,
                  }));
                  onColorFieldChange("c", nextValue);
                }}
              />
              <div className="inline-flex items-center gap-[10px] rounded-2xl bg-[var(--customizer-surface)] px-[14px] py-3 text-[var(--customizer-text)]">
                <span
                  className="h-[18px] w-[18px] rounded-full border border-white/[0.36] shadow-[0_0_0_3px_var(--customizer-swatch-ring)]"
                  style={{ backgroundColor: colorCodeInputs.c }}
                />
                <code className="text-[13px]">{colorCodeInputs.c}</code>
              </div>
            </div>
            <input
              aria-label="メインカラーコード"
              className={`${inputClassName} font-mono text-[14px] tracking-[0.04em]`}
              type="text"
              inputMode="text"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={7}
              value={colorCodeInputs.c}
              placeholder="#ffa9b5"
              onChange={(event) => {
                const nextValue = event.target.value;
                setColorCodeInputs((current) => ({ ...current, c: nextValue }));
                onColorFieldChange("c", nextValue);
              }}
              onBlur={() => {
                setColorCodeInputs((current) => ({
                  ...current,
                  c: buildColorCodeInputs(draftConfig).c,
                }));
              }}
            />
          </div>

          <div className={sectionClassName}>
            <div className={sectionHeadClassName}>
              <h2 className="m-0 text-[17px] font-medium text-[var(--customizer-text-heading)]">
                プロフィールアイコン
              </h2>
              <p className={helperTextClassName}>
                プリセットを選ぶと、区切りアイコンやサイドマーカーも連動して変わります。
              </p>
            </div>
            <div
              className="grid grid-cols-1 gap-[10px] min-[1180px]:grid-cols-2"
              role="group"
              aria-label="プロフィールアイコン選択"
            >
              {AVATAR_PRESET_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={getAvatarChoiceClassName(
                    draftConfig.a === option.id,
                  )}
                  aria-pressed={draftConfig.a === option.id}
                  onClick={() =>
                    setDraftConfig((current) => ({ ...current, a: option.id }))
                  }
                >
                  <span
                    className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-[18px] p-[6px]"
                    style={{
                      ...avatarPreviewStyle,
                      background:
                        "radial-gradient(circle at top, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04))",
                    }}
                  >
                    <AvatarBadgeIcon className="h-14 w-14" preset={option.id} />
                  </span>
                  <span className="text-sm font-medium text-[var(--customizer-text)]">
                    {option.label}
                  </span>
                  <span className={helperTextClassName}>
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={sectionClassName}>
            <div className="flex flex-col gap-3 min-[1180px]:flex-row min-[1180px]:items-start min-[1180px]:justify-between">
              <div className={sectionHeadClassName}>
                <h2 className="m-0 text-[17px] font-medium text-[var(--customizer-text-heading)]">
                  詳細カラー
                </h2>
                <p className={helperTextClassName}>
                  必要な場所だけ個別色にできます。未調整ならメインカラーの派生値を使います。
                </p>
              </div>
              <div className="flex flex-wrap gap-[10px]">
                <span className={statusChipClassName}>
                  {showAdvancedColors ? "詳細表示中" : "簡易表示"}
                </span>
                <button
                  type="button"
                  className={`${secondaryButtonClassName} min-h-[44px]`}
                  onClick={() => setShowAdvancedColors((current) => !current)}
                  aria-expanded={showAdvancedColors}
                  aria-controls="advanced-color-panel"
                >
                  {showAdvancedColors
                    ? "詳細カラーを閉じる"
                    : "詳細カラーを開く"}
                </button>
                <button
                  type="button"
                  className={`${secondaryButtonClassName} min-h-[44px]`}
                  onClick={onResetColorOverrides}
                >
                  個別色を解除
                </button>
              </div>
            </div>
            {showAdvancedColors ? (
              <div
                id="advanced-color-panel"
                className="grid grid-cols-1 gap-[10px] min-[1180px]:grid-cols-2"
              >
                {ADVANCED_COLOR_OPTIONS.map((option) => (
                  <div
                    key={option.key}
                    className="flex flex-col gap-3 rounded-[18px] border border-[var(--customizer-border-soft)] bg-[var(--customizer-surface)] p-[14px]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <h3 className="m-0 text-sm font-medium text-[var(--customizer-text)]">
                          {option.label}
                        </h3>
                        <p className={helperTextClassName}>
                          {option.description}
                        </p>
                      </div>
                      <span
                        className="h-8 w-8 shrink-0 rounded-full border border-white/16 shadow-[0_0_0_3px_var(--customizer-swatch-ring-soft)]"
                        style={{ backgroundColor: colorCodeInputs[option.key] }}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        aria-label={`${option.label}カラーピッカー`}
                        className="h-11 w-[60px] cursor-pointer rounded-[14px] border-none bg-transparent"
                        type="color"
                        value={colorCodeInputs[option.key]}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setColorCodeInputs((current) => ({
                            ...current,
                            [option.key]: nextValue,
                          }));
                          onColorFieldChange(option.key, nextValue);
                        }}
                      />
                      <input
                        aria-label={`${option.label}コード`}
                        className={`${inputClassName} font-mono text-[14px] tracking-[0.04em]`}
                        type="text"
                        inputMode="text"
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        maxLength={7}
                        value={colorCodeInputs[option.key]}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setColorCodeInputs((current) => ({
                            ...current,
                            [option.key]: nextValue,
                          }));
                          onColorFieldChange(option.key, nextValue);
                        }}
                        onBlur={() => {
                          setColorCodeInputs((current) => ({
                            ...current,
                            [option.key]:
                              buildColorCodeInputs(draftConfig)[option.key],
                          }));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-[var(--customizer-border-soft)] bg-[var(--customizer-surface)] p-4">
                <p className={helperTextClassName}>
                  まずはフォント、メインカラー、アイコンで雰囲気を決めて、必要になったらここを開いて微調整するのがおすすめです。
                </p>
              </div>
            )}
          </div>

          <div className={sectionClassName}>
            <div className="flex flex-col gap-3 min-[1180px]:flex-row min-[1180px]:items-start min-[1180px]:justify-between">
              <div className={sectionHeadClassName}>
                <h2 className="m-0 text-[17px] font-medium text-[var(--customizer-text-heading)]">
                  OBS 用 URL
                </h2>
                <p className={helperTextClassName}>
                  現在の設定に合わせて自動更新されます。OBS Browser Source
                  にはこの URL をそのまま貼ります。
                </p>
              </div>
            </div>
            {contrastWarnings.length > 0 ? (
              <div className="rounded-[18px] border border-[var(--customizer-warning-border)] bg-[var(--customizer-warning-bg)] p-4 text-[var(--customizer-warning-text)]">
                <p className="m-0 text-sm font-medium">
                  読みやすさチェックで {contrastWarnings.length}{" "}
                  件の注意があります。
                </p>
                <ul className="mt-3 mb-0 flex list-disc flex-col gap-2 pl-5 text-[13px] leading-[1.55] text-[var(--customizer-warning-text-soft)]">
                  {contrastWarnings.map((warning) => (
                    <li key={warning.id}>
                      {warning.label} のコントラスト比が {warning.ratio}:1
                      です。 目安の {warning.minimum}:1 を下回っています。
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-[10px]">
              <button
                type="button"
                className={`${primaryButtonClassName} min-h-[44px]`}
                onClick={onCopyUrl}
                disabled={!generatedUrl}
              >
                {copyLabel}
              </button>
              <button
                type="button"
                className={`${secondaryButtonClassName} min-h-[44px]`}
                onClick={onResetTheme}
              >
                デフォルトへ戻す
              </button>
            </div>
            <textarea
              ref={generatedUrlRef}
              aria-label="生成URL"
              className={`${inputClassName} min-h-24 resize-y p-[14px]`}
              value={generatedUrl}
              readOnly
              rows={4}
              placeholder="現在の設定に対応した共有用 URL がここに出ます。"
            />
            <p className={helperTextClassName} aria-live="polite">
              {copyLabel === "コピー済み"
                ? "URL をクリップボードにコピーしました。"
                : copyLabel === "手動コピー"
                  ? "自動コピーできないため、URL を選択しました。Ctrl+C でコピーしてください。"
                  : "変更は自動反映されます。"}
            </p>
          </div>
        </main>

        <aside
          className="self-start w-full"
          data-testid="customizer-preview-panel"
        >
          <div
            ref={previewPanelRef}
            className="flex flex-col gap-4 rounded-[20px] border border-[var(--customizer-border-soft)] p-4 min-[721px]:rounded-[24px] min-[721px]:p-5"
            style={{
              ...panelStyle,
              willChange: "transform",
            }}
          >
            <div className="flex flex-col gap-3 min-[960px]:flex-row min-[960px]:items-start min-[960px]:justify-between">
              <div>
                <p className="mb-[6px] text-xs font-medium uppercase tracking-[0.16em] text-[var(--customizer-text-accent)]">
                  Live Canvas
                </p>
                <h2 className="m-0 leading-[1.1] text-[var(--customizer-text-heading)]">
                  ライブプレビュー
                </h2>
              </div>
            </div>
            <div
              className="h-[clamp(320px,58vh,620px)] overflow-visible rounded-[24px] border border-[var(--customizer-border)] p-3 min-[721px]:p-4"
              style={stageStyle}
              data-testid="customizer-preview"
            >
              <div className="flex h-full w-full items-end">
                <OverlayScreen
                  channel={null}
                  customizeHref={customizeHref}
                  debugMode={true}
                  testMode={true}
                  styleConfig={previewConfig}
                  embeddedPreview={true}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
