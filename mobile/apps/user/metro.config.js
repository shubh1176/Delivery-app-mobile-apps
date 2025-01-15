// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Use polling instead of file system events
config.watchFolders = [__dirname];
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];
config.watcher = {
  watchman: false,
  useWatchman: false,
  pollingInterval: 1000
};

module.exports = config; 