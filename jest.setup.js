import jest from "jest"
import "react-native-gesture-handler/jestSetup"

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock")
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock Sentry
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

// Mock PostHog
jest.mock("posthog-react-native", () => ({
  PostHog: {
    setup: jest.fn(),
    capture: jest.fn(),
    identify: jest.fn(),
  },
}))
