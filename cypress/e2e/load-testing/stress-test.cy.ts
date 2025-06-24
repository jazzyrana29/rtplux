/// <reference types="cypress" />
import { beforeEach, describe, it } from 'mocha';

describe('Stress Testing', () => {
  const stressConfig = {
    maxUsers: Number.parseInt(Cypress.env('LOAD_TEST_USERS') || '5'),
    duration: Number.parseInt(Cypress.env('LOAD_TEST_DURATION') || '60'),
  };

  beforeEach(() => {
    cy.startPerformanceMonitoring();
  });

  it('should handle stress load on home page', () => {
    // Gradual ramp-up stress test
    const rampUpSteps = 3;
    const usersPerStep = Math.ceil(stressConfig.maxUsers / rampUpSteps);

    for (let step = 1; step <= rampUpSteps; step++) {
      const currentUsers = usersPerStep * step;

      cy.log(`Stress test step ${step}: ${currentUsers} users`);

      cy.simulateLoad({
        users: Math.min(currentUsers, 5), // Cap at 5 for browser stability
        duration: 10, // 10 seconds per step
        rampUp: 2,
        actions: ['visit', 'navigate'],
      });

      cy.wait(5000); // Recovery time between steps
      cy.checkMemoryUsage();
    }

    cy.stopPerformanceMonitoring().then((metrics) => {
      cy.task('logLoadMetrics', {
        test: 'stress-test-ramp-up',
        metrics,
        maxUsers: stressConfig.maxUsers,
        steps: rampUpSteps,
      });
    });
  });

  it('should recover from high load', () => {
    // Apply high load
    cy.simulateLoad({
      users: stressConfig.maxUsers,
      duration: 15,
      actions: ['visit'],
    });

    // Wait for recovery
    cy.wait(10000);

    // Test normal functionality after stress
    cy.visit('/');
    cy.waitForStableLoad();
    cy.get('body').should('be.visible');

    cy.stopPerformanceMonitoring().then((metrics) => {
      expect(metrics.loadTime).to.be.lessThan(20000); // Should recover within 20 seconds
      cy.task('logLoadMetrics', {
        test: 'stress-recovery',
        metrics,
      });
    });
  });

  it('should handle rapid successive requests', () => {
    const rapidRequests = 5;
    const responseTimesArray: number[] = [];

    for (let i = 0; i < rapidRequests; i++) {
      const startTime = Date.now();

      cy.visit('/');
      cy.get('body').should('be.visible');

      cy.then(() => {
        const endTime = Date.now();
        responseTimesArray.push(endTime - startTime);
      });

      cy.wait(500); // Short wait between requests
    }

    cy.then(() => {
      const avgResponseTime =
        responseTimesArray.reduce((a, b) => a + b, 0) /
        responseTimesArray.length;
      const maxResponseTime = Math.max(...responseTimesArray);

      expect(maxResponseTime).to.be.lessThan(30000); // Max 30 seconds

      cy.task('logLoadMetrics', {
        test: 'rapid-requests',
        averageResponseTime: avgResponseTime,
        maxResponseTime: maxResponseTime,
        responseTimesArray,
        requests: rapidRequests,
      });
    });
  });
});
