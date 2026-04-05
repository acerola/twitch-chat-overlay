import { BadgeIcon } from "./BadgeIcon";
import { DividerIcon } from "./DividerIcon";
import { AvatarBadgeIcon } from "./AvatarBadgeIcon";
import { SideMarkerIcon } from "./SideMarkerIcon";
import { DEFAULT_OVERLAY_STYLE_CONFIG, type AvatarPresetId } from "../lib/overlay-customization";
import { getRoleBadges, isEmoteOnlyMessage, parseMessageWithEmotes } from "../overlay-utils";
import type { ChatMessage } from "../types/overlay";

const sideMarkerClassName =
  "absolute z-[3] animate-[side-marker-in_260ms_cubic-bezier(0.22,0.8,0.2,1)_both]";
const sideDotClassName = `${sideMarkerClassName} rounded-full bg-[var(--side-dot-color)] shadow-[0_0_0_1px_var(--side-dot-ring)]`;
const messageTextBaseClassName =
  "message-text overflow-hidden text-[clamp(17px,1.55vw,22px)] leading-[1.28] font-medium tracking-[0.002em] text-[var(--message-color)] [overflow-wrap:anywhere] [display:-webkit-box] [-webkit-line-clamp:3] [line-clamp:3] [-webkit-box-orient:vertical] [max-height:calc(1.28em*3)] text-ellipsis";

function getEmoteClassName(emoteOnly: boolean, singleEmoteOnly: boolean, gigantified: boolean): string {
  if (gigantified) {
    return "emote emote-gigantified mx-[2px] h-[clamp(200px,36vh,350px)] translate-y-0 align-text-bottom animate-[gigantified-in_500ms_cubic-bezier(0.22,0.8,0.2,1)_both]";
  }

  if (!emoteOnly) {
    return "emote mx-[2px] h-[clamp(24px,2.1vw,30px)] translate-y-[2px] align-text-bottom";
  }

  return singleEmoteOnly
    ? "emote emote-single mx-[2px] h-[clamp(52px,5.4vw,78px)] translate-y-0 align-text-bottom"
    : "emote emote-multi mx-[2px] h-[clamp(34px,3.2vw,48px)] translate-y-0 align-text-bottom";
}

export function ChatMessageItem({
  message,
  avatarPreset = DEFAULT_OVERLAY_STYLE_CONFIG.a,
}: {
  message: ChatMessage;
  avatarPreset?: AvatarPresetId;
}) {
  const parts = parseMessageWithEmotes(message.text, message.emotes);
  const roleBadges = getRoleBadges(message.badges);
  const emoteOnly = isEmoteOnlyMessage(parts);
  const emoteCount = parts.reduce((count, part) => (part.type === "emote" ? count + 1 : count), 0);
  const singleEmoteOnly = emoteOnly && emoteCount === 1;
  const gigantified = message.powerUp === "gigantified_emote";

  return (
    <div
      className="message-item grid max-w-full grid-cols-[var(--avatar-column-width)_1fr] items-start gap-2 border-none bg-transparent px-[10px] pb-[10px] pt-2"
      data-testid="message-item"
    >
      <div className="avatar-rail relative flex h-full min-h-0 self-stretch justify-start pt-[2px]" aria-hidden="true">
        <span className="avatar-badge-wrap relative inline-flex h-[calc(var(--avatar-badge-y)+var(--avatar-badge-size))] w-[calc(var(--avatar-badge-x)+var(--avatar-badge-size))]">
          <span
            className={`${sideDotClassName} left-[var(--avatar-side-dot-1-x)] top-[var(--avatar-side-dot-1-y)] h-[var(--avatar-side-dot-size-sm)] w-[var(--avatar-side-dot-size-sm)]`}
            style={{ animationDelay: "25ms" }}
          />
          <span
            className={`${sideDotClassName} left-[var(--avatar-side-dot-2-x)] top-[var(--avatar-side-dot-2-y)] h-[var(--avatar-side-dot-size-sm)] w-[var(--avatar-side-dot-size-sm)]`}
            style={{ animationDelay: "70ms" }}
          />
          <SideMarkerIcon
            preset={avatarPreset}
            className={`${sideMarkerClassName} left-[var(--avatar-side-leaf-x)] top-[var(--avatar-side-leaf-y)] h-[var(--avatar-side-leaf-size)] w-[var(--avatar-side-leaf-size)] origin-[58%_46%] rotate-[-38deg] scale-x-[0.92] text-[var(--flower-color)] [fill:currentColor]`}
            style={{ animationDelay: "115ms" }}
          />
          <span
            className={`${sideDotClassName} left-[var(--avatar-side-dot-3-x)] top-[var(--avatar-side-dot-3-y)] h-[var(--avatar-side-dot-size-sm)] w-[var(--avatar-side-dot-size-sm)]`}
            style={{ animationDelay: "160ms" }}
          />
          <span
            className={`${sideDotClassName} left-[var(--avatar-side-dot-4-x)] top-[var(--avatar-side-dot-4-y)] h-[var(--avatar-side-dot-size-sm)] w-[var(--avatar-side-dot-size-sm)]`}
            style={{ animationDelay: "205ms" }}
          />

          <span className="avatar-badge relative ml-[var(--avatar-badge-x)] mt-[var(--avatar-badge-y)] inline-flex h-[var(--avatar-badge-size)] w-[var(--avatar-badge-size)] items-center justify-center rounded-full bg-transparent shadow-[0_2px_7px_rgba(0,0,0,0.16)]">
            <AvatarBadgeIcon className="avatar-mark block h-[var(--avatar-badge-size)] w-[var(--avatar-badge-size)] overflow-visible" preset={avatarPreset} />
          </span>
        </span>
      </div>

      <div className="message-content flex max-w-[min(64vw,340px)] flex-col gap-[7px] [will-change:opacity] animate-[chat-enter_760ms_ease-in-out_both]">
        <div className="message-header inline-flex min-h-[30px] flex-wrap items-center gap-[7px]">
          <span
            className="name-pill inline-flex min-w-0 max-w-[min(58vw,168px)] items-center rounded-full bg-[var(--name-background-color)] px-[13px] pb-[5px] pt-1 text-[clamp(14px,1.35vw,17px)] font-medium text-[var(--name-color)] [text-shadow:none]"
            title={message.username}
          >
            <span className="name-pill-text block min-w-0 truncate whitespace-nowrap">{message.username}</span>
          </span>

          {roleBadges.length > 0 ? (
            <>
              <DividerIcon preset={avatarPreset} className="name-role-flower h-[13px] w-[13px] shrink-0 translate-y-[0.5px] text-[var(--flower-color)] [fill:currentColor]" />
              <span className="role-list inline-flex flex-wrap items-center gap-[5px]">
                <span className="role-pill inline-flex items-center gap-[6px] rounded-full border-[1.5px] border-[var(--role-pill-border-color)] bg-[var(--role-pill-background-color)] px-2 py-[2px]">
                  {roleBadges.map((badge, index) => (
                    <BadgeIcon key={`${message.id}-${badge}-${index}`} badge={badge} />
                  ))}
                </span>
              </span>
            </>
          ) : null}
        </div>

        <div
          className={
            emoteOnly || gigantified
              ? `${messageTextBaseClassName} message-text-emote-only flex flex-wrap items-center gap-[5px] overflow-visible [-webkit-line-clamp:unset] [line-clamp:unset] [max-height:none]`
              : messageTextBaseClassName
          }
        >
          {parts.map((part, index) => {
            if (part.type === "text") {
              if (emoteOnly) {
                return null;
              }
              return <span key={`${message.id}-text-${index}`}>{part.value}</span>;
            }

            return (
              <img
                key={`${message.id}-emote-${part.emoteId}-${index}`}
                src={`https://static-cdn.jtvnw.net/emoticons/v2/${part.emoteId}/default/dark/3.0`}
                alt={part.alt}
                className={getEmoteClassName(emoteOnly, singleEmoteOnly, gigantified)}
                loading="lazy"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
