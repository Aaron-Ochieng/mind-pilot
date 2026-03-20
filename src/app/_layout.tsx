import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { useFonts } from "@expo-google-fonts/jetbrains-mono/useFonts";
import { Stack } from "expo-router";
import { Sun } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import "../global.css";
import { SQLiteProvider } from "expo-sqlite";
import { DATABASE_NAME, migrateDbIfNeeded } from "@/db/database";
import { Suspense } from "react";
import SyncOnStart from "@/components/sync-on-start";

export default function RootLayout() {
  let [fontsLoaded] = useFonts({ JetBrainsMono_400Regular });
  if (!fontsLoaded) return null;
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-slate-900">
          <Text className="text-white text-lg">Loading...</Text>
        </View>
      }
    >
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDbIfNeeded}
        useSuspense
      >
        <SyncOnStart />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerShown: false,
            title: "",
            headerStyle: {
              backgroundColor: "#eff6ff",
            },
            headerRight: () => (
              <Pressable className="mr-4">
                <Sun color="gray" />
              </Pressable>
            ),
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="memory" />
          <Stack.Screen name="loop" />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
