import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChatAlertItem } from "./components/ChatAlertItem";
import { ChatMessageItem } from "./components/ChatMessageItem";
import { DebugMenu } from "./components/DebugMenu";
import { SetupHint } from "./components/SetupHint";
import { buildFeedItems, parseEnvBoolean } from "./lib/overlay-runtime";
import { normalizeChannel } from "./overlay-utils";
import { useOverlayData } from "./hooks/useOverlayData";
import type { DebugMessageKind, OverlayAlert } from "./types/overlay";

const BASE_ROW_GAP_PX = 20;
const MIN_ROW_GAP_PX = 2;
const TOP_BLANK_TARGET_PX = 24;
const GAP_SET_EPSILON_PX = 0.25;
const CONTENT_FIT_BUFFER_PX = 1;
const BLANK_SAMPLE_CAPACITY = 360;
const RANDOM_BENCHMARK_COUNT = 120;
const RANDOM_BENCHMARK_INTERVAL_MS = 70;
const RANDOM_ALERT_PROBABILITY = 0.24;

const RANDOM_MESSAGE_KINDS: DebugMessageKind[] = [
  "text",
  "text_long",
  "username_long",
  "emote_single",
  "emote_multi",
  "emote_text",
  "role_vip",
  "role_moderator",
  "role_subscriber",
  "role_broadcaster",
  "role_multi",
  "role_staff",
  "role_admin",
  "role_global_mod",
  "role_partner",
  "role_founder",
  "role_artist",
  "role_turbo",
];

const RANDOM_ALERT_KINDS: OverlayAlert["kind"][] = ["cheer", "subscribe", "gift", "raid"];

interface BlankSpaceStats {
  samples: number;
  current: number;
  average: number;
  p95: number;
  max: number;
}

const EMPTY_BLANK_SPACE_STATS: BlankSpaceStats = {
  samples: 0,
  current: 0,
  average: 0,
  p95: 0,
  max: 0,
};

function summarizeBlankSpace(samples: number[]): BlankSpaceStats {
  if (samples.length === 0) {
    return EMPTY_BLANK_SPACE_STATS;
  }

  const current = samples[samples.length - 1] ?? 0;
  const sum = samples.reduce((total, value) => total + value, 0);
  const average = sum / samples.length;
  const sorted = [...samples].sort((a, b) => a - b);
  const p95Index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * 0.95));
  const p95 = sorted[p95Index] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;

  return {
    samples: samples.length,
    current,
    average,
    p95,
    max,
  };
}

function pickRandom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)] as T;
}

export function App() {
  const url = useMemo(() => new URL(window.location.href), []);
  const testMode = url.searchParams.get("test") === "1";
  const debugQueryValue = url.searchParams.get("debug");
  const envDebugMode = parseEnvBoolean(import.meta.env.VITE_DEBUG_MODE);
  const debugMode = debugQueryValue === "1" ? true : debugQueryValue === "0" ? false : envDebugMode;

  const channelFromQuery = normalizeChannel(url.searchParams.get("channel"));
  const channelFromEnv = normalizeChannel(import.meta.env.VITE_CHANNEL_NAME ?? null);
  const channel = channelFromQuery ?? channelFromEnv;

  const { messages, alerts, addAlert, addDebugMessage, clearAllOverlayData, trimFeedEntries } = useOverlayData({
    channel,
    testMode,
  });

  const chatListItems = useMemo(() => buildFeedItems(messages, alerts), [messages, alerts]);
  const messageStackRef = useRef<HTMLDivElement | null>(null);
  const [rowGapPx, setRowGapPx] = useState(BASE_ROW_GAP_PX);
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [blankSpaceStats, setBlankSpaceStats] = useState<BlankSpaceStats>(EMPTY_BLANK_SPACE_STATS);
  const blankSamplesRef = useRef<number[]>([]);
  const benchmarkIntervalRef = useRef<number | null>(null);
  const resetBlankStats = useCallback(() => {
    blankSamplesRef.current = [];
    setBlankSpaceStats(EMPTY_BLANK_SPACE_STATS);
  }, []);

  const pushBlankSample = useCallback((value: number) => {
    const capped = [...blankSamplesRef.current, value].slice(-BLANK_SAMPLE_CAPACITY);
    blankSamplesRef.current = capped;
    setBlankSpaceStats(summarizeBlankSpace(capped));
  }, []);

  const stopRandomBenchmark = useCallback(() => {
    if (benchmarkIntervalRef.current !== null) {
      window.clearInterval(benchmarkIntervalRef.current);
      benchmarkIntervalRef.current = null;
    }
    setBenchmarkRunning(false);
  }, []);

  const startRandomBenchmark = useCallback(() => {
    stopRandomBenchmark();
    clearAllOverlayData();
    resetBlankStats();

    let sent = 0;
    setBenchmarkRunning(true);
    benchmarkIntervalRef.current = window.setInterval(() => {
      const shouldAlert = Math.random() < RANDOM_ALERT_PROBABILITY;
      if (shouldAlert) {
        const kind = pickRandom(RANDOM_ALERT_KINDS);
        const seed = Math.floor(100 + Math.random() * 900);
        const text =
          kind === "cheer"
            ? `ランダム計測ユーザーが ${seed} ビッツ応援`
            : kind === "subscribe"
              ? `ランダム計測ユーザーがサブスクしました`
              : kind === "gift"
                ? `ランダム計測ユーザーが Viewer${seed} さんへギフトサブ`
                : `ランダム計測ユーザーが ${seed % 120} 人でレイド`;
        addAlert(text, kind);
      } else {
        const kind = pickRandom(RANDOM_MESSAGE_KINDS);
        addDebugMessage(kind);
      }

      sent += 1;
      if (sent >= RANDOM_BENCHMARK_COUNT) {
        stopRandomBenchmark();
      }
    }, RANDOM_BENCHMARK_INTERVAL_MS);
  }, [addAlert, addDebugMessage, clearAllOverlayData, resetBlankStats, stopRandomBenchmark]);

  const trimOverflowItems = useCallback(() => {
    const container = messageStackRef.current;
    if (!container || chatListItems.length === 0) {
      setRowGapPx((previous) => (Math.abs(previous - BASE_ROW_GAP_PX) > GAP_SET_EPSILON_PX ? BASE_ROW_GAP_PX : previous));
      return;
    }

    const containerStyle = window.getComputedStyle(container);
    const paddingTop = Number.parseFloat(containerStyle.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(containerStyle.paddingBottom) || 0;
    const maxContentHeight = Math.max(0, container.clientHeight - paddingTop - paddingBottom - CONTENT_FIT_BUFFER_PX);
    if (maxContentHeight <= 0) {
      return;
    }

    const rows = Array.from(container.querySelectorAll<HTMLElement>(".feed-entry"));
    if (rows.length <= 1) {
      setRowGapPx((previous) => (Math.abs(previous - BASE_ROW_GAP_PX) > GAP_SET_EPSILON_PX ? BASE_ROW_GAP_PX : previous));
      return;
    }

    const rowHeights = rows.map((row) => {
      const rowRect = row.getBoundingClientRect();
      const measuredHeight = rowRect.height > 0 ? rowRect.height : row.offsetHeight;
      return Math.max(1, measuredHeight);
    });
    const newestHeights = [...rowHeights].reverse();

    let cumulativeHeight = 0;
    let bestKeptCount = 1;
    let bestGap = BASE_ROW_GAP_PX;
    let bestUsedHeight = newestHeights[0] ?? 0;
    let bestSlack = Math.max(0, maxContentHeight - bestUsedHeight);

    for (let keptCount = 1; keptCount <= newestHeights.length; keptCount += 1) {
      const height = newestHeights[keptCount - 1];
      if (typeof height !== "number") {
        continue;
      }

      cumulativeHeight += height;
      if (keptCount === 1) {
        continue;
      }

      const maxGapThatFits = (maxContentHeight - cumulativeHeight) / (keptCount - 1);
      if (maxGapThatFits < MIN_ROW_GAP_PX - 0.01) {
        break;
      }

      const gap = Math.min(BASE_ROW_GAP_PX, maxGapThatFits);
      const usedHeight = cumulativeHeight + (keptCount - 1) * gap;
      const slack = Math.max(0, maxContentHeight - usedHeight);
      const shouldUseCandidate =
        keptCount > bestKeptCount || (keptCount === bestKeptCount && slack < bestSlack - GAP_SET_EPSILON_PX);

      if (shouldUseCandidate) {
        bestKeptCount = keptCount;
        bestGap = gap;
        bestUsedHeight = usedHeight;
        bestSlack = slack;
      }
    }

    const slack = Math.max(0, bestSlack);
    if (bestKeptCount > 1 && bestUsedHeight >= maxContentHeight * 0.72) {
      pushBlankSample(slack);
    }

    let nextGapPx = bestKeptCount > 1 ? bestGap : BASE_ROW_GAP_PX;
    if (nextGapPx < BASE_ROW_GAP_PX && slack > TOP_BLANK_TARGET_PX) {
      const adjustedGap = nextGapPx - (slack - TOP_BLANK_TARGET_PX) / Math.max(1, bestKeptCount - 1);
      nextGapPx = Math.max(MIN_ROW_GAP_PX, adjustedGap);
    }
    const roundedGap = Number(nextGapPx.toFixed(2));

    setRowGapPx((previous) => (Math.abs(previous - roundedGap) > GAP_SET_EPSILON_PX ? roundedGap : previous));

    const entriesToRemove: Array<{ type: "message" | "alert"; id: string }> = [];
    const removeCount = Math.max(0, rows.length - bestKeptCount);
    for (let index = 0; index < removeCount; index += 1) {
      const row = rows[index];
      if (!row) {
        continue;
      }

      const rowType = row.dataset.itemType;
      const rowId = row.dataset.itemId;
      if ((rowType === "message" || rowType === "alert") && rowId) {
        entriesToRemove.push({ type: rowType, id: rowId });
      }
    }

    if (entriesToRemove.length > 0) {
      trimFeedEntries(entriesToRemove);
    }
  }, [chatListItems, pushBlankSample, trimFeedEntries]);

  useLayoutEffect(() => {
    trimOverflowItems();
    const frameId = window.requestAnimationFrame(trimOverflowItems);
    const delayedId = window.setTimeout(trimOverflowItems, 120);
    const delayedId2 = window.setTimeout(trimOverflowItems, 360);
    const delayedId3 = window.setTimeout(trimOverflowItems, 900);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(delayedId);
      window.clearTimeout(delayedId2);
      window.clearTimeout(delayedId3);
    };
  }, [trimOverflowItems]);

  useEffect(() => {
    const onResize = () => {
      window.requestAnimationFrame(trimOverflowItems);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [trimOverflowItems]);

  useEffect(() => {
    const container = messageStackRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(trimOverflowItems);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [trimOverflowItems]);

  useEffect(() => {
    return () => {
      stopRandomBenchmark();
    };
  }, [stopRandomBenchmark]);

  useEffect(() => {
    const container = messageStackRef.current;
    if (!container) {
      return;
    }

    const onLoad = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        trimOverflowItems();
      }
    };

    // `load` does not bubble, capture is required for delegated handling.
    container.addEventListener("load", onLoad, true);
    return () => {
      container.removeEventListener("load", onLoad, true);
    };
  }, [trimOverflowItems]);

  if (!channel && !testMode && !debugMode) {
    return <SetupHint />;
  }

  const stackStyle = { "--feed-row-gap": `${rowGapPx}px` } as CSSProperties;

  return (
    <div className="overlay-root">
      {debugMode ? (
        <DebugMenu
          onAddTextMessage={() => addDebugMessage("text")}
          onAddLongTextMessage={() => addDebugMessage("text_long")}
          onAddLongUsernameMessage={() => addDebugMessage("username_long")}
          onAddEmoteSingleMessage={() => addDebugMessage("emote_single")}
          onAddEmoteMultiMessage={() => addDebugMessage("emote_multi")}
          onAddEmoteMixedMessage={() => addDebugMessage("emote_text")}
          onAddRoleVipMessage={() => addDebugMessage("role_vip")}
          onAddRoleModeratorMessage={() => addDebugMessage("role_moderator")}
          onAddRoleSubscriberMessage={() => addDebugMessage("role_subscriber")}
          onAddRoleBroadcasterMessage={() => addDebugMessage("role_broadcaster")}
          onAddRoleMultiMessage={() => addDebugMessage("role_multi")}
          onAddRoleStaffMessage={() => addDebugMessage("role_staff")}
          onAddRoleAdminMessage={() => addDebugMessage("role_admin")}
          onAddRoleGlobalModMessage={() => addDebugMessage("role_global_mod")}
          onAddRolePartnerMessage={() => addDebugMessage("role_partner")}
          onAddRoleFounderMessage={() => addDebugMessage("role_founder")}
          onAddRoleArtistMessage={() => addDebugMessage("role_artist")}
          onAddRoleTurboMessage={() => addDebugMessage("role_turbo")}
          onAlertCheer={() => addAlert("デバッグユーザーが 500 ビッツ応援", "cheer")}
          onAlertSub={() => addAlert("デバッグユーザーがサブスクしました", "subscribe")}
          onAlertGift={() => addAlert("デバッグユーザーが ViewerX さんへギフトサブ", "gift")}
          onAlertRaid={() => addAlert("デバッグユーザーが 77 人でレイド", "raid")}
          onStartRandomBenchmark={startRandomBenchmark}
          onStopRandomBenchmark={stopRandomBenchmark}
          onResetBlankStats={resetBlankStats}
          blankSpaceStats={blankSpaceStats}
          benchmarkRunning={benchmarkRunning}
          onClearAll={() => {
            stopRandomBenchmark();
            clearAllOverlayData();
          }}
        />
      ) : null}

      <div ref={messageStackRef} className="message-stack" style={stackStyle} aria-live="polite">
        {chatListItems.map((item) => {
          if (item.type === "alert") {
            return (
              <div key={item.id} className="feed-entry" data-item-type="alert" data-item-id={item.alert.id}>
                <ChatAlertItem alert={item.alert} />
              </div>
            );
          }

          return (
            <div key={item.id} className="feed-entry" data-item-type="message" data-item-id={item.message.id}>
              <ChatMessageItem message={item.message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
