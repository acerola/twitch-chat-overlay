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

const DEBUG_BUTTON_CLASSNAME =
  "cursor-pointer rounded-lg border border-white/20 bg-white/8 px-[8px] py-[7px] text-[11px] font-medium text-[#fffefe] transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-[0.48]";

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
    <div
      className="debug-menu absolute right-3 top-3 z-20 flex flex-col items-end gap-2 [text-shadow:none]"
      data-testid="debug-menu-root"
    >
      <button
        className="debug-toggle cursor-pointer rounded-full border-2 border-white/95 bg-[rgba(255,169,181,0.92)] px-[14px] py-[7px] text-xs font-medium text-[#fff5f9] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? "デバッグを閉じる" : "デバッグを開く"}
      </button>

      {open ? (
        <div
          className="debug-panel flex max-h-[min(82vh,760px)] w-[min(92vw,320px)] flex-col gap-2 overflow-auto rounded-[10px] border border-white/15 bg-[rgba(20,12,9,0.9)] p-[10px]"
          data-testid="debug-panel"
        >
          <p className="debug-title m-0 text-xs font-medium text-[#ffdbe6]">オーバーレイ デバッグメニュー</p>
          <div className="debug-section flex flex-col gap-[6px]">
            <p className="debug-section-title m-0 text-[11px] font-medium text-[#ffe9ef]">メッセージ</p>
            <div className="debug-grid grid grid-cols-2 gap-[6px]">
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddTextMessage}>
                テキスト追加
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddLongTextMessage}>
                長文テキスト追加
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddLongUsernameMessage}>
                長いユーザー名
              </button>
            </div>
          </div>

          <div className="debug-section flex flex-col gap-[6px]">
            <p className="debug-section-title m-0 text-[11px] font-medium text-[#ffe9ef]">エモート検証</p>
            <div className="debug-grid grid grid-cols-2 gap-[6px]">
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddEmoteSingleMessage}>
                1エモートのみ
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddEmoteMultiMessage}>
                2+エモートのみ
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddEmoteMixedMessage}>
                エモート+テキスト
              </button>
            </div>
          </div>

          <div className="debug-section flex flex-col gap-[6px]">
            <p className="debug-section-title m-0 text-[11px] font-medium text-[#ffe9ef]">ロール検証</p>
            <div className="debug-grid grid grid-cols-2 gap-[6px]">
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleVipMessage}>
                VIPロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleModeratorMessage}>
                モデロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleSubscriberMessage}>
                サブロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleBroadcasterMessage}>
                配信者ロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleMultiMessage}>
                複合ロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleStaffMessage}>
                Staffロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleAdminMessage}>
                Adminロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleGlobalModMessage}>
                GlobalModロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRolePartnerMessage}>
                Partnerロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleFounderMessage}>
                Founderロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleArtistMessage}>
                Artistロール
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAddRoleTurboMessage}>
                Turboロール
              </button>
            </div>
          </div>

          <div className="debug-section flex flex-col gap-[6px]">
            <p className="debug-section-title m-0 text-[11px] font-medium text-[#ffe9ef]">アラート検証</p>
            <div className="debug-grid grid grid-cols-2 gap-[6px]">
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAlertCheer}>
                ビッツ通知
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAlertSub}>
                サブ通知
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAlertGift}>
                ギフト通知
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onAlertRaid}>
                レイド通知
              </button>
            </div>
          </div>

          <div className="debug-section flex flex-col gap-[6px]">
            <p className="debug-section-title m-0 text-[11px] font-medium text-[#ffe9ef]">余白計測</p>
            <div className="debug-grid grid grid-cols-2 gap-[6px]">
              <button
                className={DEBUG_BUTTON_CLASSNAME}
                type="button"
                onClick={onStartRandomBenchmark}
                disabled={benchmarkRunning}
              >
                {benchmarkRunning ? "計測中..." : "ランダム投入 120件"}
              </button>
              <button
                className={DEBUG_BUTTON_CLASSNAME}
                type="button"
                onClick={onStopRandomBenchmark}
                disabled={!benchmarkRunning}
              >
                計測停止
              </button>
              <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onResetBlankStats}>
                計測リセット
              </button>
            </div>
            <div
              className="debug-stats grid grid-cols-2 gap-y-1 gap-x-2 rounded-lg border border-white/16 bg-white/5 px-[8px] py-[7px] text-[10px] leading-[1.35] font-medium text-[#ffe9ef]"
              data-testid="blank-stats"
            >
              <span className="whitespace-nowrap">サンプル: {blankSpaceStats.samples}</span>
              <span className="whitespace-nowrap">現在: {blankSpaceStats.current.toFixed(1)}px</span>
              <span className="whitespace-nowrap">平均: {blankSpaceStats.average.toFixed(1)}px</span>
              <span className="whitespace-nowrap">P95: {blankSpaceStats.p95.toFixed(1)}px</span>
              <span className="whitespace-nowrap">最大: {blankSpaceStats.max.toFixed(1)}px</span>
            </div>
          </div>

          <div className="debug-grid grid grid-cols-2 gap-[6px]">
            <button className={DEBUG_BUTTON_CLASSNAME} type="button" onClick={onClearAll}>
              全消去
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
