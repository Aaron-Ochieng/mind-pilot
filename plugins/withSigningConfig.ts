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
            storeFile file(System.getenv("MYAPP_UPLOAD_STORE_FILE"))
            storePassword System.getenv("MYAPP_UPLOAD_STORE_PASSWORD")
            keyAlias System.getenv("MYAPP_UPLOAD_KEY_ALIAS")
            keyPassword System.getenv("MYAPP_UPLOAD_KEY_PASSWORD")
        }`,
      );
    } else {
      // If not → create it safely
      contents = contents.replace(
        /android\s?{/,
        `android {
        signingConfigs {
            release {
                storeFile file(System.getenv("MYAPP_UPLOAD_STORE_FILE"))
                storePassword System.getenv("MYAPP_UPLOAD_STORE_PASSWORD")
                keyAlias System.getenv("MYAPP_UPLOAD_KEY_ALIAS")
                keyPassword System.getenv("MYAPP_UPLOAD_KEY_PASSWORD")
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
