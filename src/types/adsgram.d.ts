export type AdsgramShowResult = {
  done: boolean;
  description: string;
  state: "load" | "render" | "playing" | "destroy";
  error: boolean;
};

export type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (options: { blockId: string; debug?: boolean }) => AdsgramController;
    };
  }
}

export {};
