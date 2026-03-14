const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow loading 3D model files as assets
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;
