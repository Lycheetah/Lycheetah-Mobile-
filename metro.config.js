const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

// Optional native packages — redirect to dev stubs when not installed.
// Metro auto-bypasses once you run: npx expo install <package>
const OPTIONAL_PACKAGES = [
  'react-native-purchases',
  'react-native-google-mobile-ads',
  'expo-image-manipulator',
  'react-native-view-shot',
  'expo-sharing',
];

const stubOverrides = {};
for (const pkg of OPTIONAL_PACKAGES) {
  if (!fs.existsSync(path.join(__dirname, 'node_modules', pkg))) {
    stubOverrides[pkg] = path.resolve(__dirname, `lib/stubs/${pkg}.js`);
  }
}

if (Object.keys(stubOverrides).length > 0) {
  const originalResolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (stubOverrides[moduleName]) {
      return { filePath: stubOverrides[moduleName], type: 'sourceFile' };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
