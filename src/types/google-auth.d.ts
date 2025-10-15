// Google Identity Services types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export {};