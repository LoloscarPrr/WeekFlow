const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const PRIVACY_DEFAULTS = [
  ['firebase_messaging_auto_init_enabled', 'false'],
  ['firebase_analytics_collection_enabled', 'false'],
];

function setMetaData(application, name, value) {
  const entries = application['meta-data'] ?? [];
  const existing = entries.find((entry) => entry.$?.['android:name'] === name);

  if (existing) {
    existing.$['android:value'] = value;
  } else {
    entries.push({
      $: {
        'android:name': name,
        'android:value': value,
      },
    });
  }

  application['meta-data'] = entries;
}

module.exports = function withPrivacyManifest(config) {
  return withAndroidManifest(config, (nextConfig) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      nextConfig.modResults,
    );

    for (const [name, value] of PRIVACY_DEFAULTS) {
      setMetaData(application, name, value);
    }

    return nextConfig;
  });
};
