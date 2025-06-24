/// <reference types="cypress" />

import './commands';
import './types';
import 'cypress-real-events';

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
  cy.window().then((win: Window) => {
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
