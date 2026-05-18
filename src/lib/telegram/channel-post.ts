import { schema } from "@/lib/db";
import { callTelegramApi } from "@/lib/telegram/bot-api";
import {
  miniAppVideoUrl,
  publicThumbnailForTelegram,
  telegramStartAppLink,
} from "@/lib/telegram/mini-app-link";

type VideoRow = typeof schema.videos.$inferSelect;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getPostChatId(): string {
  const chatId =
    process.env.TELEGRAM_POST_CHAT_ID?.trim() ||
    process.env.TELEGRAM_CHANNEL_ID?.trim();
  if (!chatId) {
    throw new Error(
      "Set TELEGRAM_POST_CHAT_ID (e.g. @YourChannel or -1001234567890)"
    );
  }
  return chatId;
}

export async function postVideoToTelegramChannel(video: VideoRow) {
  const chatId = getPostChatId();
  const appUrl = miniAppVideoUrl(video.id);
  const photo = publicThumbnailForTelegram(video.thumbnailUrl);

  const lines = [`<b>${escapeHtml(video.title)}</b>`];
  if (video.description?.trim()) {
    lines.push(escapeHtml(video.description.trim()));
  }
  if (video.isLocked) {
    lines.push(`🔒 Unlock: ${video.tokenCost} tokens`);
  } else {
    lines.push("✅ Free to open");
  }
  const tme = telegramStartAppLink(video.id);
  if (tme) {
    lines.push(`<a href="${tme}">Open in Telegram</a>`);
  }

  const caption = lines.join("\n\n").slice(0, 1024);

  const buttons: Array<Record<string, unknown>> = [
    {
      text: "📺 Open in TeleTube",
      web_app: { url: appUrl },
    },
  ];
  if (tme) {
    buttons.push({
      text: "Open app",
      url: tme,
    });
  }

  const reply_markup = {
    inline_keyboard: [buttons],
  };

  const result = await callTelegramApi<{ message_id: number }>("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: "HTML",
    reply_markup,
  });

  return {
    messageId: result.message_id,
    appUrl,
    chatId,
  };
}
