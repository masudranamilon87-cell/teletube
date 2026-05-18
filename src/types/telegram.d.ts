interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    start_param?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string | undefined>;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
  };
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  openLink?: (url: string) => void;
}

interface Window {
  Telegram?: { WebApp: TelegramWebApp };
}
