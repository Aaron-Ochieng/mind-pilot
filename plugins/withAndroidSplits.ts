import { ConfigPlugin, withAppBuildGradle } from "expo/config-plugins";

const withAndroidSplits: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("splits")) {
      config.modResults.contents = config.modResults.contents.replace(
        /android\s?{/,
        `android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a", "x86"
            universalApk false
        }
    }`,
      );
    }

    return config;
  });
};

export default withAndroidSplits;
