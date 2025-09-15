declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'none';
      APP_MODE: 'default' | 'pro' | 'simple';
    }
  }
}

export {};

