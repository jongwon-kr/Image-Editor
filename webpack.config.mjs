// webpack.config.js
export default async (env = {}) => {
  const mode = env.mode || 'default';

  let configModule;
  switch (mode) {
    case 'pro':
      configModule = await import('./webpack.pro.config.mjs');
      break;
    case 'simple':
      configModule = await import('./webpack.simple.config.mjs');
      break;
    case 'default':
    default:
      configModule = await import('./webpack.default.config.mjs');
      break;
  }

  return configModule.default;
};
