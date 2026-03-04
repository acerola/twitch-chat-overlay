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
  return <Icon className="role-icon" aria-hidden="true" focusable="false" />;
}
