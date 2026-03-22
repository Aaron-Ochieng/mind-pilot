import { ConfigPlugin, withAppBuildGradle } from "expo/config-plugins";

const withSigningConfig: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // If signingConfigs already exists → inject release inside it
    if (contents.includes("signingConfigs {")) {
      contents = contents.replace(
        /signingConfigs\s?{/,
        `signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }`,
      );
    } else {
      // If not → create it safely
      contents = contents.replace(
        /android\s?{/,
        `android {
        signingConfigs {
            release {
                if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                    storeFile file(MYAPP_UPLOAD_STORE_FILE)
                    storePassword MYAPP_UPLOAD_STORE_PASSWORD
                    keyAlias MYAPP_UPLOAD_KEY_ALIAS
                    keyPassword MYAPP_UPLOAD_KEY_PASSWORD
                }
            }
        }`,
      );
    }

    // Fix buildTypes to use release signing
    contents = contents.replace(
      /signingConfig signingConfigs\.debug/g,
      "signingConfig signingConfigs.release",
    );

    config.modResults.contents = contents;
    return config;
  });
};

export default withSigningConfig;
