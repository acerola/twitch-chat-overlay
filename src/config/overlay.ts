import type { ChatMessage, DebugChatFixture, DebugMessageKind, OverlayAlert } from "../types/overlay";

export const MAX_MESSAGES = 80;
export const MAX_ALERTS = 20;
export const ALERT_TTL_MS = 4_000;
export const ALERT_AUTO_EXPIRE = false;
export const BOT_USERNAMES = new Set(["nightbot", "streamelements", "streamlabs"]);

export const TEST_MESSAGES: ChatMessage[] = [
  {
    id: "test-1",
    username: "みら",
    text: "これはサブスク視聴者のテストメッセージです",
    color: "#fbc7d5",
    badges: { subscriber: "12" },
    emotes: {},
    timestamp: Date.now() - 3000,
  },
  {
    id: "test-2",
    username: "モデレーター",
    text: "Kappa Keepo",
    color: "#fbc7d5",
    badges: { moderator: "1" },
    emotes: {
      "25": ["0-4"],
      "1902": ["6-10"],
    },
    timestamp: Date.now() - 2000,
  },
  {
    id: "test-3",
    username: "初見さん",
    text: "はじめまして！",
    color: "#fbc7d5",
    badges: { vip: "1" },
    emotes: {},
    timestamp: Date.now() - 1000,
  },
];

export const TEST_ALERTS: OverlayAlert[] = [
  { id: "alert-1", text: "CORA さんがサブスクしました", kind: "subscribe", timestamp: Date.now() - 1000 },
  { id: "alert-2", text: "TRUSTEE さんが 30 ビッツ応援", kind: "cheer", timestamp: Date.now() - 500 },
];

export const DEBUG_CHAT_FIXTURES: Record<DebugMessageKind, DebugChatFixture> = {
  text: {
    username: "デバッグユーザー",
    text: "レイアウト確認用のデバッグメッセージです",
    color: "#fbc7d5",
    badges: {},
    emotes: {},
  },
  text_long: {
    username: "長文テスト",
    text: "これは長文表示の確認用テキストです。改行はない1行メッセージとして、名前とロール表示のあとにどこまで自然に折り返されるかを確認します。",
    color: "#fbc7d5",
    badges: {},
    emotes: {},
  },
  username_long: {
    username: "超長いユーザー名テスト",
    text: "長いユーザー名の省略表示を確認するためのメッセージです",
    color: "#fbc7d5",
    badges: {},
    emotes: {},
  },
  emote_single: {
    username: "エモート単体",
    text: "Kappa",
    color: "#ffe8f0",
    badges: {},
    emotes: {
      "25": ["0-4"],
    },
  },
  emote_multi: {
    username: "エモート複数",
    text: "Kappa Keepo",
    color: "#ffe8f0",
    badges: {},
    emotes: {
      "25": ["0-4"],
      "1902": ["6-10"],
    },
  },
  emote_text: {
    username: "エモート混在",
    text: "Hi Kappa wow Keepo",
    color: "#ffe8f0",
    badges: {},
    emotes: {
      "25": ["3-7"],
      "1902": ["13-17"],
    },
  },
  role_vip: {
    username: "デバッグVIP",
    text: "VIP ロール表示確認",
    color: "#ffe8f0",
    badges: { vip: "1" },
    emotes: {},
  },
  role_moderator: {
    username: "デバッグモデ",
    text: "モデレーター ロール表示確認",
    color: "#ffe8f0",
    badges: { moderator: "1" },
    emotes: {},
  },
  role_subscriber: {
    username: "デバッグサブ",
    text: "サブスク ロール表示確認",
    color: "#ffe8f0",
    badges: { subscriber: "12" },
    emotes: {},
  },
  role_broadcaster: {
    username: "デバッグ配信者",
    text: "配信者 ロール表示確認",
    color: "#ffe8f0",
    badges: { broadcaster: "1" },
    emotes: {},
  },
  role_multi: {
    username: "デバッグ複合",
    text: "複合ロール表示確認",
    color: "#ffe8f0",
    badges: { moderator: "1", subscriber: "18" },
    emotes: {},
  },
  role_staff: {
    username: "デバッグStaff",
    text: "Staff ロール表示確認",
    color: "#ffe8f0",
    badges: { staff: "1" },
    emotes: {},
  },
  role_admin: {
    username: "デバッグAdmin",
    text: "Admin ロール表示確認",
    color: "#ffe8f0",
    badges: { admin: "1" },
    emotes: {},
  },
  role_global_mod: {
    username: "デバッグGlobal",
    text: "Global Mod ロール表示確認",
    color: "#ffe8f0",
    badges: { global_mod: "1" },
    emotes: {},
  },
  role_partner: {
    username: "デバッグPartner",
    text: "Partner ロール表示確認",
    color: "#ffe8f0",
    badges: { partner: "1" },
    emotes: {},
  },
  role_founder: {
    username: "デバッグFounder",
    text: "Founder ロール表示確認",
    color: "#ffe8f0",
    badges: { founder: "0" },
    emotes: {},
  },
  role_artist: {
    username: "デバッグArtist",
    text: "Artist ロール表示確認",
    color: "#ffe8f0",
    badges: { artist: "1" },
    emotes: {},
  },
  role_turbo: {
    username: "デバッグTurbo",
    text: "Turbo ロール表示確認",
    color: "#ffe8f0",
    badges: { turbo: "1" },
    emotes: {},
  },
  powerup_gigantified: {
    username: "PowerUpUser",
    text: "LUL",
    color: "#ff9900",
    badges: {},
    emotes: { "425618": ["0-2"] },
    powerUp: "gigantified_emote",
  },
  powerup_effect: {
    username: "EffectUser",
    text: "すごい配信！",
    color: "#00ccff",
    badges: {},
    emotes: {},
    powerUp: "message_effect",
  },
};
