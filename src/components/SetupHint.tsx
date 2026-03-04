export function SetupHint() {
  return (
    <div className="setup-hint">
      <p>チャンネル名が未設定、または形式が不正です。</p>
      <p>
        例: <code>/?channel=your_channel_name</code>
      </p>
      <p>
        デバッグ: <code>/?debug=1</code>
      </p>
      <p>
        または <code>.env</code> に <code>VITE_CHANNEL_NAME</code> / <code>VITE_DEBUG_MODE</code> を設定
      </p>
    </div>
  );
}
