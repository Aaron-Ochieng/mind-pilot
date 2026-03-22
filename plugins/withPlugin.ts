import { ConfigPlugin } from "expo/config-plugins";
import withAndroidSplits from "./withAndroidSplits";
import withSigningConfig from "./withSigningConfig";

const withPlugin: ConfigPlugin = (config) => {
  config = withAndroidSplits(config);
  config = withSigningConfig(config);
  return config;
};

export default withPlugin;
