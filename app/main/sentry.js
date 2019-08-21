try {
    if (
      typeof process !== 'undefined' && 
      process && 
      process.env && 
      process.env.NODE_ENV && 
      process.env.NODE_ENV === 'development'
    ) {
      // dev mode
      // ignore sentry logging
    } else {
        const { init } = require('@sentry/electron/dist/renderer');
        init({dsn: 'https://cbea024b06984b9ebb56cffce53e4d2f@sentry.io/1483893'});
    }
}
catch (e) {
    console.warn('Cannot initialize Sentry for renderer process.', e);
}
