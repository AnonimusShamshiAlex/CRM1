export default function TelegramWebhookSettingsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Telegram Webhooks</h1>
      <input className="border rounded-xl p-3 w-full" placeholder="Bot token" />
      <input className="border rounded-xl p-3 w-full" placeholder="Chat ID" />
      <button className="px-4 py-2 rounded-xl border">Save webhook</button>
    </div>
  );
}