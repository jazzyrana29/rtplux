import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { PostHogProvider } from "../contexts/PostHogProvider"
import "../global.css"

export default function RootLayout() {
  return (
    <PostHogProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1a1a2e",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Casino Platform" }} />
        <Stack.Screen name="games" options={{ title: "Games" }} />
      </Stack>
      <StatusBar style="light" />
    </PostHogProvider>
  )
}
