import type { BadgeKind } from "../types/overlay";
import type { IconType } from "react-icons";
import {
  FaBolt,
  FaBroadcastTower,
  FaCrown,
  FaGem,
  FaGlobe,
  FaGavel,
  FaHandshake,
  FaPaintBrush,
  FaShieldAlt,
  FaStar,
  FaUserShield,
} from "react-icons/fa";
import { GiBroadsword } from "react-icons/gi";

const ICON_BY_BADGE: Record<BadgeKind, IconType> = {
  broadcaster: FaBroadcastTower,
  staff: FaUserShield,
  admin: FaGavel,
  global_mod: FaGlobe,
  moderator: GiBroadsword,
  vip: FaCrown,
  partner: FaHandshake,
  artist: FaPaintBrush,
  founder: FaGem,
  subscriber: FaStar,
  turbo: FaBolt,
};

export function BadgeIcon({ badge }: { badge: BadgeKind }) {
  const Icon = ICON_BY_BADGE[badge] ?? FaShieldAlt;
  return (
    <Icon
      className="h-[13px] w-[13px] text-white/[0.95] drop-shadow-[0_1px_1px_rgba(0,0,0,0.24)]"
      aria-hidden="true"
      focusable="false"
    />
  );
}
