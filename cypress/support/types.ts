/// <reference types="cypress" />

// Load testing utilities
export interface LoadTestOptions {
  users: number;
  duration: number;
  rampUp?: number;
  actions?: string[];
}

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  memoryUsage?: number;
}

// Declare the commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      simulateLoad(options: LoadTestOptions): Chainable<Subject>;

      measurePerformance(label: string): Chainable<Subject>;

      waitForStableLoad(): Chainable<Subject>;

      checkMemoryUsage(): Chainable<Subject>;

      simulateConcurrentUsers(userCount: number): Chainable<Subject>;

      navigateToGame(gameType: string): Chainable<Subject>;

      placeBet(amount: number): Chainable<Subject>;

      spinRoulette(): Chainable<Subject>;

      buyChips(amount: number): Chainable<Subject>;

      startPerformanceMonitoring(): Chainable<Subject>;

      stopPerformanceMonitoring(): Chainable<PerformanceMetrics>;
    }
  }
}
