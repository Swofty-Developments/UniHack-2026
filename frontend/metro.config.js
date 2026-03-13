const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow loading .html files as assets for WebView
config.resolver.assetExts.push('html', 'glb', 'gltf');

module.exports = config;
