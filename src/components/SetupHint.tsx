import type { CSSProperties } from "react";

interface SetupHintProps {
  customizeHref: string;
  style?: CSSProperties;
}

export function SetupHint({ customizeHref, style }: SetupHintProps) {
  const themedStyle = {
    ...style,
    fontFamily: "var(--overlay-font-family)",
  } satisfies CSSProperties;

  return (
    <div
      className="setup-hint flex h-screen w-full flex-col items-center justify-center gap-[10px] bg-transparent text-[22px] font-medium text-white"
      style={themedStyle}
      data-testid="setup-hint"
    >
      <p className="m-0">チャンネル名が未設定、または形式が不正です。</p>
      <p className="m-0">
        <code className="rounded-lg bg-black/30 px-2 py-[3px] text-base">.env</code> に{" "}
        <code className="rounded-lg bg-black/30 px-2 py-[3px] text-base">VITE_CHANNEL_NAME</code> を設定してください。
      </p>
      <p className="m-0">
        デバッグ表示は <code className="rounded-lg bg-black/30 px-2 py-[3px] text-base">VITE_DEBUG_MODE</code> で切り替えます。
      </p>
      <p className="m-0">
        カスタマイズ:{" "}
        <a className="text-[#fff7fb] underline underline-offset-4" href={customizeHref}>
          カスタマイズページを開く
        </a>
      </p>
    </div>
  );
}
