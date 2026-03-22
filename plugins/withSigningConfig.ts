import { ConfigPlugin, withAppBuildGradle } from "expo/config-plugins";

const withSigningConfig: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    const signingConfigBlock = `
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}`;

    // Only inject once
    if (!config.modResults.contents.includes("signingConfigs.release")) {
      // Inject before buildTypes block
      config.modResults.contents = config.modResults.contents.replace(
        /^\s*android\s*\{/m,
        `android {${signingConfigBlock}`,
      );
    }

    // Replace release signingConfig in buildTypes
    config.modResults.contents = config.modResults.contents.replace(
      /signingConfig signingConfigs\.debug/g,
      "signingConfig signingConfigs.release",
    );

    return config;
  });
};

export default withSigningConfig;
