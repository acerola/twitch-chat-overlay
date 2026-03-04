import { BadgeIcon } from "./BadgeIcon";
import { FlowerIcon } from "./FlowerIcon";
import { AvatarBadgeIcon } from "./AvatarBadgeIcon";
import { SakuraLeafIcon } from "./SakuraLeafIcon";
import { getRoleBadges, isEmoteOnlyMessage, parseMessageWithEmotes } from "../overlay-utils";
import type { ChatMessage } from "../types/overlay";

export function ChatMessageItem({ message }: { message: ChatMessage }) {
  const parts = parseMessageWithEmotes(message.text, message.emotes);
  const roleBadges = getRoleBadges(message.badges);
  const emoteOnly = isEmoteOnlyMessage(parts);
  const emoteCount = parts.reduce((count, part) => (part.type === "emote" ? count + 1 : count), 0);
  const singleEmoteOnly = emoteOnly && emoteCount === 1;

  return (
    <div className="message-item" data-testid="message-item">
      <div className="avatar-rail" aria-hidden="true">
        <span className="avatar-badge-wrap">
          <span className="avatar-side-marker avatar-side-dot avatar-side-dot-1" />
          <span className="avatar-side-marker avatar-side-dot avatar-side-dot-2" />
          <SakuraLeafIcon className="avatar-side-marker avatar-side-leaf" />
          <span className="avatar-side-marker avatar-side-dot avatar-side-dot-3" />
          <span className="avatar-side-marker avatar-side-dot avatar-side-dot-4" />

          <span className="avatar-badge">
            <AvatarBadgeIcon className="avatar-mark" />
          </span>
        </span>
      </div>

      <div className="message-content">
        <div className="message-header">
          <span className="name-pill" title={message.username}>
            <span className="name-pill-text">{message.username}</span>
          </span>

          {roleBadges.length > 0 ? (
            <>
              <FlowerIcon className="name-role-flower" />
              <span className="role-list">
                <span className="role-pill">
                  {roleBadges.map((badge, index) => (
                    <BadgeIcon key={`${message.id}-${badge}-${index}`} badge={badge} />
                  ))}
                </span>
              </span>
            </>
          ) : null}
        </div>

        <div className={emoteOnly ? "message-text message-text-emote-only" : "message-text"}>
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
                className={emoteOnly ? (singleEmoteOnly ? "emote emote-single" : "emote emote-multi") : "emote"}
                loading="lazy"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
