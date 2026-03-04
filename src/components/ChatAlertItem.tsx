import { AlertKindIcon } from "./AlertKindIcon";
import type { OverlayAlert } from "../types/overlay";

export function ChatAlertItem({ alert }: { alert: OverlayAlert }) {
  return (
    <div className="message-alert-item">
      <div className="alert-item" data-testid="alert-item">
        <AlertKindIcon kind={alert.kind} className="flower-dot" />
        <span>{alert.text}</span>
      </div>
    </div>
  );
}
