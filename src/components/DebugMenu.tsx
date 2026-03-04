import { useState } from "react";

interface BlankSpaceStats {
  samples: number;
  current: number;
  average: number;
  p95: number;
  max: number;
}

interface DebugMenuProps {
  onAddTextMessage: () => void;
  onAddLongTextMessage: () => void;
  onAddLongUsernameMessage: () => void;
  onAddEmoteSingleMessage: () => void;
  onAddEmoteMultiMessage: () => void;
  onAddEmoteMixedMessage: () => void;
  onAddRoleVipMessage: () => void;
  onAddRoleModeratorMessage: () => void;
  onAddRoleSubscriberMessage: () => void;
  onAddRoleBroadcasterMessage: () => void;
  onAddRoleMultiMessage: () => void;
  onAddRoleStaffMessage: () => void;
  onAddRoleAdminMessage: () => void;
  onAddRoleGlobalModMessage: () => void;
  onAddRolePartnerMessage: () => void;
  onAddRoleFounderMessage: () => void;
  onAddRoleArtistMessage: () => void;
  onAddRoleTurboMessage: () => void;
  onAlertCheer: () => void;
  onAlertSub: () => void;
  onAlertGift: () => void;
  onAlertRaid: () => void;
  onStartRandomBenchmark: () => void;
  onStopRandomBenchmark: () => void;
  onResetBlankStats: () => void;
  blankSpaceStats: BlankSpaceStats;
  benchmarkRunning: boolean;
  onClearAll: () => void;
}

export function DebugMenu({
  onAddTextMessage,
  onAddLongTextMessage,
  onAddLongUsernameMessage,
  onAddEmoteSingleMessage,
  onAddEmoteMultiMessage,
  onAddEmoteMixedMessage,
  onAddRoleVipMessage,
  onAddRoleModeratorMessage,
  onAddRoleSubscriberMessage,
  onAddRoleBroadcasterMessage,
  onAddRoleMultiMessage,
  onAddRoleStaffMessage,
  onAddRoleAdminMessage,
  onAddRoleGlobalModMessage,
  onAddRolePartnerMessage,
  onAddRoleFounderMessage,
  onAddRoleArtistMessage,
  onAddRoleTurboMessage,
  onAlertCheer,
  onAlertSub,
  onAlertGift,
  onAlertRaid,
  onStartRandomBenchmark,
  onStopRandomBenchmark,
  onResetBlankStats,
  blankSpaceStats,
  benchmarkRunning,
  onClearAll,
}: DebugMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="debug-menu" data-testid="debug-menu-root">
      <button className="debug-toggle" type="button" onClick={() => setOpen((prev) => !prev)}>
        {open ? "デバッグを閉じる" : "デバッグを開く"}
      </button>

      {open ? (
        <div className="debug-panel" data-testid="debug-panel">
          <p className="debug-title">オーバーレイ デバッグメニュー</p>
          <div className="debug-section">
            <p className="debug-section-title">メッセージ</p>
            <div className="debug-grid">
              <button type="button" onClick={onAddTextMessage}>
                テキスト追加
              </button>
              <button type="button" onClick={onAddLongTextMessage}>
                長文テキスト追加
              </button>
              <button type="button" onClick={onAddLongUsernameMessage}>
                長いユーザー名
              </button>
            </div>
          </div>

          <div className="debug-section">
            <p className="debug-section-title">エモート検証</p>
            <div className="debug-grid">
              <button type="button" onClick={onAddEmoteSingleMessage}>
                1エモートのみ
              </button>
              <button type="button" onClick={onAddEmoteMultiMessage}>
                2+エモートのみ
              </button>
              <button type="button" onClick={onAddEmoteMixedMessage}>
                エモート+テキスト
              </button>
            </div>
          </div>

          <div className="debug-section">
            <p className="debug-section-title">ロール検証</p>
            <div className="debug-grid">
              <button type="button" onClick={onAddRoleVipMessage}>
                VIPロール
              </button>
              <button type="button" onClick={onAddRoleModeratorMessage}>
                モデロール
              </button>
              <button type="button" onClick={onAddRoleSubscriberMessage}>
                サブロール
              </button>
              <button type="button" onClick={onAddRoleBroadcasterMessage}>
                配信者ロール
              </button>
              <button type="button" onClick={onAddRoleMultiMessage}>
                複合ロール
              </button>
              <button type="button" onClick={onAddRoleStaffMessage}>
                Staffロール
              </button>
              <button type="button" onClick={onAddRoleAdminMessage}>
                Adminロール
              </button>
              <button type="button" onClick={onAddRoleGlobalModMessage}>
                GlobalModロール
              </button>
              <button type="button" onClick={onAddRolePartnerMessage}>
                Partnerロール
              </button>
              <button type="button" onClick={onAddRoleFounderMessage}>
                Founderロール
              </button>
              <button type="button" onClick={onAddRoleArtistMessage}>
                Artistロール
              </button>
              <button type="button" onClick={onAddRoleTurboMessage}>
                Turboロール
              </button>
            </div>
          </div>

          <div className="debug-section">
            <p className="debug-section-title">アラート検証</p>
            <div className="debug-grid">
              <button type="button" onClick={onAlertCheer}>
                ビッツ通知
              </button>
              <button type="button" onClick={onAlertSub}>
                サブ通知
              </button>
              <button type="button" onClick={onAlertGift}>
                ギフト通知
              </button>
              <button type="button" onClick={onAlertRaid}>
                レイド通知
              </button>
            </div>
          </div>

          <div className="debug-section">
            <p className="debug-section-title">余白計測</p>
            <div className="debug-grid">
              <button type="button" onClick={onStartRandomBenchmark} disabled={benchmarkRunning}>
                {benchmarkRunning ? "計測中..." : "ランダム投入 120件"}
              </button>
              <button type="button" onClick={onStopRandomBenchmark} disabled={!benchmarkRunning}>
                計測停止
              </button>
              <button type="button" onClick={onResetBlankStats}>
                計測リセット
              </button>
            </div>
            <div className="debug-stats" data-testid="blank-stats">
              <span>サンプル: {blankSpaceStats.samples}</span>
              <span>現在: {blankSpaceStats.current.toFixed(1)}px</span>
              <span>平均: {blankSpaceStats.average.toFixed(1)}px</span>
              <span>P95: {blankSpaceStats.p95.toFixed(1)}px</span>
              <span>最大: {blankSpaceStats.max.toFixed(1)}px</span>
            </div>
          </div>

          <div className="debug-grid">
            <button type="button" onClick={onClearAll}>
              全消去
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
