// cypress/support/e2e.ts

import './commands';
import 'cypress-real-events';
import { beforeEach, cy } from 'cypress'; // Declare cy and beforeEach variables

// Load testing utilities
declare global {
  namespace Cypress {
    interface Chainable {
      // Load testing commands
      simulateLoad(options: LoadTestOptions): Chainable<void>;

      measurePerformance(label: string): Chainable<void>;

      waitForStableLoad(): Chainable<void>;

      checkMemoryUsage(): Chainable<void>;

      simulateConcurrentUsers(userCount: number): Chainable<void>;

      // Casino-specific commands
      navigateToGame(gameType: string): Chainable<void>;

      placeBet(amount: number): Chainable<void>;

      spinRoulette(): Chainable<void>;

      buyChips(amount: number): Chainable<void>;

      // Performance monitoring
      startPerformanceMonitoring(): Chainable<void>;

      stopPerformanceMonitoring(): Chainable<PerformanceMetrics>;
    }
  }
}

interface LoadTestOptions {
  users: number;
  duration: number;
  rampUp?: number;
  actions?: string[];
}

interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  memoryUsage?: number;
}

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions from the app
  // Log them for debugging
  console.error('Uncaught exception:', err);
  return false;
});

// Performance monitoring setup
beforeEach(() => {
  // Clear performance marks before each test
  cy.window().then((win) => {
    if (win.performance && win.performance.clearMarks) {
      win.performance.clearMarks();
      win.performance.clearMeasures();
    }
  });
});

// Load testing configuration
const loadTestConfig = {
  maxUsers: Number.parseInt(Cypress.env('LOAD_TEST_USERS') || '10'),
  testDuration: Number.parseInt(Cypress.env('LOAD_TEST_DURATION') || '60'),
  baseUrl: Cypress.env('APP_URL') || 'http://localhost:8081',
};

// Export for use in tests
export { loadTestConfig };
