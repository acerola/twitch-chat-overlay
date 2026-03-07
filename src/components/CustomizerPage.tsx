import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AvatarBadgeIcon } from "./AvatarBadgeIcon";
import {
  AVATAR_PRESET_OPTIONS,
  buildOverlayPreviewUrl,
  buildOverlayUrl,
  createOverlayPreviewStyleSyncMessage,
  createOverlayStyleVars,
  DEFAULT_OVERLAY_STYLE_CONFIG,
  FONT_PRESET_OPTIONS,
  formatAccentColor,
  normalizeAccentColor,
  type OverlayStyleConfig,
} from "../lib/overlay-customization";

interface CustomizerPageProps {
  appBaseUrl: string;
  initialConfig: OverlayStyleConfig;
}

const pageStyle = {
  background: `
    radial-gradient(circle at top left, rgba(255, 169, 181, 0.22), transparent 36%),
    radial-gradient(circle at bottom right, rgba(255, 201, 212, 0.18), transparent 32%),
    linear-gradient(160deg, #120c0d 0%, #1f1416 48%, #130d0e 100%)
  `,
} satisfies CSSProperties;

const panelStyle = {
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))",
  backdropFilter: "blur(18px)",
  boxShadow: "0 18px 52px rgba(0, 0, 0, 0.28)",
} satisfies CSSProperties;

const stageStyle = {
  background: `
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    linear-gradient(135deg, rgba(15, 11, 12, 0.96), rgba(40, 29, 31, 0.94))
  `,
} satisfies CSSProperties;

const stageOrbStyle = {
  background: "rgba(255, 255, 255, 0.04)",
  filter: "blur(42px)",
} satisfies CSSProperties;

const sectionClassName = "flex flex-col gap-3";
const sectionHeadClassName = "flex flex-col gap-1";
const helperTextClassName =
  "m-0 text-[13px] leading-[1.55] text-[rgba(255,245,248,0.72)]";
const choiceBaseClassName =
  "cursor-pointer rounded-[18px] border border-white/12 bg-white/[0.04] text-left text-inherit transition-[border-color,transform,background] duration-150 ease-in-out hover:-translate-y-px hover:border-[rgba(255,214,226,0.58)] hover:bg-white/[0.08]";
const selectedChoiceClassName =
  "border-[rgba(255,214,226,0.58)] bg-white/[0.08] -translate-y-px";
const secondaryButtonClassName =
  "cursor-pointer rounded-full border border-white/[0.18] bg-white/[0.08] px-4 py-[10px] text-[13px] font-medium text-[#fff7fa] disabled:cursor-not-allowed disabled:opacity-48";
const inputClassName =
  "w-full rounded-2xl border border-white/[0.16] bg-white/[0.06] px-[14px] py-[13px] text-[#fffdfd] outline-none focus:outline-2 focus:outline-offset-2 focus:outline-[rgba(255,214,226,0.32)]";

function getChoiceClassName(selected: boolean): string {
  return `${choiceBaseClassName} flex flex-col gap-[6px] p-[14px]${selected ? ` ${selectedChoiceClassName}` : ""}`;
}

function getAvatarChoiceClassName(selected: boolean): string {
  return `${choiceBaseClassName} grid justify-items-start gap-2 px-3 py-[14px]${selected ? ` ${selectedChoiceClassName}` : ""}`;
}

export function CustomizerPage({
  appBaseUrl,
  initialConfig,
}: CustomizerPageProps) {
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [draftConfig, setDraftConfig] =
    useState<OverlayStyleConfig>(initialConfig);
  const [generatedUrl, setGeneratedUrl] = useState(() =>
    buildOverlayUrl(appBaseUrl, initialConfig),
  );
  const [copyLabel, setCopyLabel] = useState("コピー");

  const previewConfig = useDeferredValue(draftConfig);
  const previewUrl = useMemo(
    () => buildOverlayPreviewUrl(appBaseUrl, initialConfig),
    [appBaseUrl, initialConfig],
  );
  const previewOrigin = useMemo(() => new URL(previewUrl).origin, [previewUrl]);
  const avatarPreviewStyle = useMemo(
    () => createOverlayStyleVars(draftConfig) as CSSProperties,
    [draftConfig],
  );

  useEffect(() => {
    previewFrameRef.current?.contentWindow?.postMessage(
      createOverlayPreviewStyleSyncMessage(previewConfig),
      previewOrigin,
    );
  }, [previewConfig, previewOrigin]);

  const onGenerateUrl = () => {
    setGeneratedUrl(buildOverlayUrl(appBaseUrl, draftConfig));
    setCopyLabel("コピー");
  };

  const onCopyUrl = async () => {
    if (!generatedUrl || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopyLabel("コピー済み");
    } catch {
      setCopyLabel("失敗");
    }
  };

  const onResetTheme = () => {
    setDraftConfig(DEFAULT_OVERLAY_STYLE_CONFIG);
    setCopyLabel("コピー");
  };

  return (
    <div
      className="min-h-screen overflow-auto p-[14px] text-[#fff8fb] min-[721px]:p-6"
      style={pageStyle}
      data-testid="customizer-page"
    >
      <div className="mx-auto grid w-[min(1320px,100%)] grid-cols-1 items-start gap-[22px] min-[1081px]:grid-cols-[minmax(320px,430px)_minmax(0,1fr)]">
        <section
          className="flex flex-col gap-5 rounded-[20px] border border-white/12 p-4 min-[721px]:rounded-[24px] min-[721px]:p-6"
          style={panelStyle}
        >
          <div>
            <p className="mb-[6px] text-xs font-medium uppercase tracking-[0.16em] text-[#ffd4e0]">
              Overlay Customizer
            </p>
            <h1 className="m-0 text-[clamp(30px,4vw,42px)] leading-[1.1] text-[#fff6f8]">
              オーバーレイを整える
            </h1>
            <p className={helperTextClassName}>
              チャンネル名とデバッグ設定は `.env` 前提です。見た目設定だけを URL
              にまとめて持たせます。 右側のプレビューを見ながら整えて、最後に
              OBS 用 URL を生成します。
            </p>
          </div>

          <div className={sectionClassName}>
            <div className={sectionHeadClassName}>
              <h2 className="m-0 text-[17px] font-medium text-[#fff6f8]">
                フォント
              </h2>
              <p className={helperTextClassName}>
                丸文字系を中心に、配信で読みやすい 4 種だけに絞ります。
              </p>
            </div>
            <div className="grid grid-cols-1 gap-[10px] min-[721px]:grid-cols-2">
              {FONT_PRESET_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={getChoiceClassName(draftConfig.f === option.id)}
                  onClick={() =>
                    setDraftConfig((current) => ({ ...current, f: option.id }))
                  }
                >
                  <span className="text-sm font-medium text-[#fff7fa]">
                    {option.label}
                  </span>
                  <span
                    className="text-lg leading-[1.35] text-[rgba(255,241,246,0.84)]"
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
              <h2 className="m-0 text-[17px] font-medium text-[#fff6f8]">
                メインカラー
              </h2>
              <p className={helperTextClassName}>
                花・ネームピル・バッジ配色はこの 1 色から自動で組み立てます。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                aria-label="メインカラー"
                className="h-12 w-[68px] cursor-pointer rounded-[14px] border-none bg-transparent"
                type="color"
                value={formatAccentColor(draftConfig.c)}
                onChange={(event) => {
                  const nextColor = normalizeAccentColor(event.target.value);
                  if (!nextColor) {
                    return;
                  }

                  setDraftConfig((current) => ({ ...current, c: nextColor }));
                }}
              />
              <div className="inline-flex items-center gap-[10px] rounded-2xl bg-white/[0.06] px-[14px] py-3 text-[#fff7fa]">
                <span
                  className="h-[18px] w-[18px] rounded-full border border-white/[0.36] shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                  style={{ backgroundColor: formatAccentColor(draftConfig.c) }}
                />
                <code className="text-[13px]">
                  {formatAccentColor(draftConfig.c)}
                </code>
              </div>
            </div>
          </div>

          <div className={sectionClassName}>
            <div className={sectionHeadClassName}>
              <h2 className="m-0 text-[17px] font-medium text-[#fff6f8]">
                プロフィールアイコン
              </h2>
              <p className={helperTextClassName}>
                アップロードは使わず、共有しやすいプリセットだけで完結させます。
              </p>
            </div>
            <div className="grid grid-cols-1 gap-[10px] min-[721px]:grid-cols-2">
              {AVATAR_PRESET_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={getAvatarChoiceClassName(
                    draftConfig.a === option.id,
                  )}
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
                  <span className="text-sm font-medium text-[#fff7fa]">
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
            <div className={sectionHeadClassName}>
              <h2 className="m-0 text-[17px] font-medium text-[#fff6f8]">
                OBS 用 URL
              </h2>
              <p className={helperTextClassName}>
                保存はしないので、ここで生成した URL をそのまま OBS Browser
                Source に貼ります。
              </p>
            </div>
            <div className="flex flex-wrap gap-[10px]">
              <button
                type="button"
                className="cursor-pointer rounded-full border border-white/[0.18] bg-[rgba(255,169,181,0.94)] px-4 py-[10px] text-[13px] font-medium text-[#fff7fa] disabled:cursor-not-allowed disabled:opacity-48"
                onClick={onGenerateUrl}
              >
                URL を生成
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={onCopyUrl}
                disabled={!generatedUrl}
              >
                {copyLabel}
              </button>
              <button
                type="button"
                className={secondaryButtonClassName}
                onClick={onResetTheme}
              >
                デフォルトへ戻す
              </button>
            </div>
            <textarea
              aria-label="生成URL"
              className={`${inputClassName} min-h-24 resize-y p-[14px]`}
              value={generatedUrl}
              readOnly
              rows={4}
              placeholder="「URL を生成」を押すと、共有用 URL がここに出ます。"
            />
          </div>
        </section>

        <section
          className="flex flex-col gap-4 rounded-[20px] border border-white/12 p-4 min-[721px]:rounded-[24px] min-[721px]:p-5 min-[1081px]:min-h-[760px]"
          style={panelStyle}
        >
          <div className="flex flex-col gap-3 min-[721px]:flex-row min-[721px]:items-start min-[721px]:justify-between">
            <div>
              <p className="mb-[6px] text-xs font-medium uppercase tracking-[0.16em] text-[#ffd4e0]">
                Live Preview
              </p>
              <h2 className="m-0 leading-[1.1] text-[#fff6f8]">
                最終表示に近いプレビュー
              </h2>
            </div>
          </div>
          <div
            className="relative flex-1 overflow-hidden rounded-[24px] border border-white/8 min-h-[420px] min-[721px]:min-h-[520px] min-[1081px]:min-h-[620px]"
            style={stageStyle}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[30px] left-[30px] h-[180px] w-[180px] rounded-full"
              style={stageOrbStyle}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[26px] top-[26px] h-[220px] w-[220px] rounded-full"
              style={stageOrbStyle}
            />
            <div
              className="pointer-events-none absolute -bottom-[10%] -left-[10%] h-[300px] w-[300px] rounded-full opacity-[0.22] blur-[72px]"
              style={{ backgroundColor: formatAccentColor(draftConfig.c) }}
            />
            <iframe
              ref={previewFrameRef}
              title="オーバーレイプレビュー"
              className="relative h-full w-full min-h-[420px] border-0 bg-transparent min-[721px]:min-h-[520px] min-[1081px]:min-h-[620px]"
              src={previewUrl}
              onLoad={() => {
                previewFrameRef.current?.contentWindow?.postMessage(
                  createOverlayPreviewStyleSyncMessage(previewConfig),
                  previewOrigin,
                );
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
