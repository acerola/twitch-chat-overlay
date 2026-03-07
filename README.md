# Twitch Chat Overlay

A browser-based overlay for Twitch chat. Displays chat messages and alerts in a unified timeline feed.

## Features

- **No Twitch authentication required** — connect using only a channel name
- **Unified feed** — chat messages and alerts displayed chronologically in the same list
- **Japanese UI text** — including debug menu labels
- **Fixed-size container** with variable row heights
- **Automatic overflow trimming** — old messages are removed with exit animations
- **Debug menu** for manual injection testing
- Built with **Vite + React 19 + TypeScript + tmi.js**

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Example `.env`:

```env
VITE_CHANNEL_NAME=your_channel_name
VITE_DEBUG_MODE=0
```

- `VITE_CHANNEL_NAME`: Twitch channel name (required for production)
- `VITE_DEBUG_MODE`: `1` to enable debug UI, `0` to disable

### 3) Start development server

```bash
npm run dev
```

Open `http://localhost:5173` to view.

## URL Parameters

| Parameter | Description |
|-----------|-------------|
| `?channel=xxx` | Override channel name (takes priority over `.env`) |
| `?debug=1` / `?debug=0` | Force debug UI on/off |
| `?test=1` | Display fixture data without Twitch connection |

Example:

```text
http://localhost:5173/?channel=your_channel&debug=1
```

## Debug Menu

When debug mode is enabled, a "Open Debug" button appears in the top-right corner (collapsed by default).

### Available Test Options

**Message Types:**
- Standard text message
- Long text message
- Long username

**Emote Testing:**
- Single emote only
- Multiple emotes only
- Emotes mixed with text

**Role Badges:**
- VIP
- Moderator
- Subscriber
- Broadcaster
- Combined roles (Mod + Subscriber)
- Staff / Admin / Global Mod
- Partner / Founder / Artist / Turbo

**Alerts:**
- Bits cheer
- Subscription
- Gift sub
- Raid notification

**Actions:**
- Clear all messages

Use cases: UI verification, row height testing, overflow behavior, animation confirmation.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | TypeScript compile + Vite build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest tests once |
| `npm run test:watch` | Run Vitest in watch mode |

## Testing

```bash
npm run test
```

Tests cover:
- Debug menu functionality
- Chat and alert injection
- Overflow trimming with variable-height rows
- Feed generation and deletion utilities

## GitHub Pages Deployment

This is a frontend-only project — no server or database required. Deployed automatically via GitHub Actions.

### Steps

1. Go to **Settings → Pages → Source** → select **GitHub Actions**
2. Set repository variables in **Settings → Secrets and variables → Actions → Variables**:
   - `VITE_CHANNEL_NAME` — default Twitch channel name
   - `VITE_DEBUG_MODE` — `0` for production, `1` to enable debug UI
3. Go to **Actions → Deploy to GitHub Pages → Run workflow** to trigger a deploy manually

Live URL: `https://<username>.github.io/twitch-chat-overlay/`

## OBS Integration

1. Add a **Browser Source** in OBS
2. Set the URL to your deployed site
3. Adjust width/height to match your stream layout
4. Background is transparent by default

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Channel name is missing or invalid" | Check `.env` has `VITE_CHANNEL_NAME` set, or use `?channel=...` parameter. Use `debug=1` to test UI without connecting. |
| Debug menu not visible | Ensure `VITE_DEBUG_MODE=1` or use `?debug=1` |
| No chat messages appearing | Verify channel name spelling, check if stream is live with active chat, use `?test=1` to verify UI independently |

## Project Structure

```text
src/
  components/     # Chat rows, alert rows, debug UI, icons
  hooks/          # Twitch connection and state management
  config/         # Constants, debug fixtures
  lib/            # Feed construction and shared logic
  types/          # TypeScript type definitions
  test/           # Test setup
  App.tsx         # Main application component
  styles.css      # Overlay styles
```

## Supported Badge Types

- Broadcaster
- Moderator
- VIP
- Subscriber
- Founder
- Staff / Admin / Global Mod
- Partner / Artist / Turbo

## Supported Alert Types

- Bits (cheer)
- Subscription
- Gift subscription
- Raid
