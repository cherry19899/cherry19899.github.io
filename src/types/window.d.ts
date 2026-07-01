export {};

declare global {
  interface Window {
    __wpToast: (msg: string, type?: string) => void;
    __pwaInstallPrompt: { prompt: () => void } | null;
    __queueOfflineNotif: (n: { title: string; body: string }) => Promise<void>;
  }
}
