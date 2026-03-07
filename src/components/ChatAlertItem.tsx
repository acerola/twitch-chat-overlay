import { AlertKindIcon } from "./AlertKindIcon";
import type { OverlayAlert } from "../types/overlay";

export function ChatAlertItem({ alert }: { alert: OverlayAlert }) {
  return (
    <div className="message-alert-item flex w-full items-center justify-center bg-transparent py-[3px] animate-[chat-enter_760ms_ease-in-out_both]">
      <div
        className="alert-item inline-flex min-h-8 w-full max-w-full items-center justify-center gap-2 py-[2px] text-center text-[clamp(14px,1.25vw,18px)] leading-[1.2] font-medium tracking-[0.02em] text-[var(--alert-text-color)]"
        data-testid="alert-item"
      >
        <AlertKindIcon
          kind={alert.kind}
          className="h-[15px] w-[15px] shrink-0 translate-y-[-0.25px] fill-current stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8] text-[var(--flower-color)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        />
        <span>{alert.text}</span>
      </div>
    </div>
  );
}
