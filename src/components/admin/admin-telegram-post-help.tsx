/** How channel posts relate to the bot profile and mini app */
export function AdminTelegramPostHelp() {
  return (
    <div className="rounded-2xl border border-[var(--tg-link)]/25 bg-[var(--tg-link)]/5 p-4 text-xs leading-relaxed text-[var(--tg-hint)]">
      <p className="font-semibold text-[var(--tg-text)]">Telegram posts — where users see them</p>
      <ul className="mt-2 list-inside list-disc space-y-1.5">
        <li>
          <strong className="text-[var(--tg-text)]">Post to channel</strong> sends to your{" "}
          <strong className="text-[var(--tg-text)]">channel</strong> (set{" "}
          <code className="text-[10px]">TELEGRAM_POST_CHAT_ID</code> in .env), not inside
          private bot chat with each user.
        </li>
        <li>
          Link that channel to the bot: BotFather → your bot →{" "}
          <strong className="text-[var(--tg-text)]">Channel</strong> → add the same channel.
          Then users open the bot and see the channel tab with your posts.
        </li>
        <li>
          Each post has an <strong className="text-[var(--tg-text)]">Open in TeleTube</strong>{" "}
          button — tap opens the mini app on that video page.
        </li>
        <li>
          The bot <strong className="text-[var(--tg-text)]">Menu / Open</strong> button (BotFather
          Web App URL) opens the mini app home — all published videos are already listed there.
        </li>
      </ul>
      <p className="mt-2 text-[10px]">
        Bot must be <strong>admin</strong> in the channel with permission to post messages.
      </p>
    </div>
  );
}
