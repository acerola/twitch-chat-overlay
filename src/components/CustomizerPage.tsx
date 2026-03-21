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
  normalizeAccentColor,
  tryDecodeOverlayStyleConfig,
  type OverlayColorOverrideKey,
  type OverlayStyleConfig,
} from "../lib/overlay-customization";
import {
  buildAuthUrl,
  clearToken,
  generateCodeChallenge,
  generateCodeVerifier,
  getStoredToken,
  isTokenExpired,
  storeOAuthState,
  storeVerifier,
} from "../lib/twitch-auth";
import { resolveChannel } from "../overlay-utils";

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
  const [channelName, setChannelName] = useState(() =>
    resolveChannel(
      new URL(window.location.href).searchParams.get("channel"),
      import.meta.env.VITE_CHANNEL_NAME ?? null,
    ) ?? "",
  );
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getStoredToken();
    return token !== null && !isTokenExpired(token);
  });
  const [copyLabel, setCopyLabel] = useState("コピー");
  const [importUrlInput, setImportUrlInput] = useState("");
  const [importStatus, setImportStatus] = useState("");

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
    () => buildOverlayUrl(appBaseUrl, draftConfig, channelName || null),
    [appBaseUrl, draftConfig, channelName],
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

  const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID;

  const onConnectTwitch = async () => {
    if (!clientId) return;

    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = crypto.randomUUID();

    storeVerifier(verifier);
    storeOAuthState(state);

    const redirectUri = new URL(appBaseUrl);
    redirectUri.search = "";
    redirectUri.searchParams.set("customize", "1");

    const authUrl = buildAuthUrl({
      clientId,
      redirectUri: redirectUri.toString(),
      codeChallenge: challenge,
      state,
    });

    window.location.assign(authUrl);
  };

  const onDisconnectTwitch = () => {
    clearToken();
    setIsAuthenticated(false);
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
    setCopyLabel("コピー");
  };

  const onImportUrl = () => {
    const nextUrl = importUrlInput.trim();
    if (!nextUrl) {
      setImportStatus("URL を入力してください。");
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(nextUrl);
    } catch {
      setImportStatus("有効な URL を貼り付けてください。");
      return;
    }

    const packedConfig = parsedUrl.searchParams.get("cfg");
    if (!packedConfig) {
      setImportStatus("cfg 付きの URL を貼り付けてください。");
      return;
    }

    const nextConfig = tryDecodeOverlayStyleConfig(packedConfig);
    if (!nextConfig) {
      setImportStatus("URL の設定を読み込めませんでした。");
      return;
    }

    setDraftConfig(nextConfig);
    setImportUrlInput("");
    setCopyLabel("コピー");
    setImportStatus("URL の設定を読み込みました。");
  };

  const onColorFieldChange = (key: ColorFieldKey, rawColor: string) => {
    const nextColor = normalizeAccentColor(rawColor);
    if (!nextColor) {
      return;
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
              </div>
              <div className="flex flex-wrap gap-[10px]">
                <button
                  type="button"
                  className={`${secondaryButtonClassName} min-h-[44px]`}
                  onClick={onResetColorOverrides}
                >
                  個別色を解除
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-[10px] min-[1180px]:grid-cols-2">
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
          </div>

          <div className={sectionClassName}>
            <div className={sectionHeadClassName}>
              <h2 className="m-0 text-[17px] font-medium text-[var(--customizer-text-heading)]">
                チャンネル &amp; Twitch 接続
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-medium text-[var(--customizer-text)]"
                htmlFor="customizer-channel-name"
              >
                チャンネル名
              </label>
              <input
                id="customizer-channel-name"
                aria-label="チャンネル名"
                className={inputClassName}
                type="text"
                inputMode="text"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={channelName}
                placeholder="例: your_twitch_channel"
                onChange={(event) => setChannelName(event.target.value.trim().toLowerCase())}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className={helperTextClassName}>
                {isAuthenticated
                  ? "Twitch に接続済みです。"
                  : "Twitch に未接続です。"}
              </p>
              <div className="flex flex-wrap gap-[10px]">
                {clientId ? (
                  isAuthenticated ? (
                    <button
                      type="button"
                      className={`${secondaryButtonClassName} min-h-[44px]`}
                      onClick={onDisconnectTwitch}
                    >
                      切断
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${primaryButtonClassName} min-h-[44px]`}
                      onClick={onConnectTwitch}
                    >
                      Twitch に接続
                    </button>
                  )
                ) : (
                  <p className={helperTextClassName}>
                    Power-ups を使うには VITE_TWITCH_CLIENT_ID の設定が必要です
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={sectionClassName}>
            <div className="flex flex-col gap-3 min-[1180px]:flex-row min-[1180px]:items-start min-[1180px]:justify-between">
              <div className={sectionHeadClassName}>
                <h2 className="m-0 text-[17px] font-medium text-[var(--customizer-text-heading)]">
                  OBS 用 URL
                </h2>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label
                className="text-sm font-medium text-[var(--customizer-text)]"
                htmlFor="customizer-import-url"
              >
                URL から読み込み
              </label>
              <textarea
                id="customizer-import-url"
                aria-label="読み込み用URL"
                className={`${inputClassName} min-h-20 resize-y p-[14px]`}
                value={importUrlInput}
                onChange={(event) => {
                  setImportUrlInput(event.target.value);
                  setImportStatus("");
                }}
                rows={3}
                placeholder="例: https://example.com/twitch-chat-overlay/?cfg=..."
              />
              <div className="flex flex-wrap gap-[10px]">
                <button
                  type="button"
                  className={`${secondaryButtonClassName} min-h-[44px]`}
                  onClick={onImportUrl}
                  disabled={!importUrlInput.trim()}
                >
                  URL を読み込む
                </button>
              </div>
              <p className={helperTextClassName} aria-live="polite">
                {importStatus}
              </p>
            </div>
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
                  : ""}
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
