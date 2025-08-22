declare module 'onesignal-cordova-plugin' {
  interface OneSignal {
    init(appId: string): Promise<void>;
    login(externalId: string): Promise<void>;
    User: {
      addTag(key: string, value: string): Promise<void>;
    };
    Notifications: {
      requestPermission(userPrompt: boolean): Promise<boolean>;
      addForegroundWillDisplayListener(
        callback: (event: {
          getNotification: () => {
            additionalData: any;
            display: () => void;
            preventDefault: () => void;
          };
          preventDefault: () => void;
        }) => void
      ): void;
      addNotificationOpenedListener(
        callback: (event: { notification: { additionalData: any } }) => void
      ): void;
    };
  }
  const OneSignal: OneSignal;
  export default OneSignal;
}