import "tsx/cjs";
import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MindPilot",
  slug: "MindPilot",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mindpilot",
  userInterfaceStyle: "automatic",

  ios: {
    icon: "./assets/expo.icon",
    bundleIdentifier: "com.aaochieng.mindpilot",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#1B293B",
      foregroundImage: "./assets/images/splash.png",
      backgroundImage: "./assets/images/splash.png",
      monochromeImage: "./assets/images/splash.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.aaochieng.mindpilot",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    ["./plugins/withPlugin.ts"],
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#1e293B",
        android: {
          image: "./assets/images/splash.png",
          imageWidth: 76,
        },
      },
    ],
    "expo-sqlite",
    [
      "expo-build-properties",
      {
        android: {
          enableMinifyInReleaseBuilds: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "317e2c75-482b-4c9c-9130-eff1d26b7aef",
    },
  },
  owner: "ochiengaaron",
});
