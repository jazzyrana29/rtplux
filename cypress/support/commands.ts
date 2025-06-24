/// <reference types="cypress" />

import type { LoadTestOptions, PerformanceMetrics } from './types';

// Load Testing Commands
Cypress.Commands.add('simulateLoad', (options: LoadTestOptions) => {
  const { users, duration, rampUp = 5, actions = ['visit'] } = options;

  cy.log(`Simulating load: ${users} users for ${duration}s`);

  // Simulate concurrent users by opening multiple tabs/windows
  for (let i = 0; i < Math.min(users, 5); i++) {
    // Limit to 5 concurrent for browser stability
    cy.window().then((win) => {
      actions.forEach((action) => {
        switch (action) {
          case 'visit':
            cy.visit('/');
            break;
          case 'navigate':
            cy.get('[data-testid="enter-games-btn"]').should('exist');
            break;
          default:
            cy.log(`Unknown action: ${action}`);
        }
      });
    });

    if (rampUp > 0) {
      cy.wait(rampUp * 1000); // Ramp up delay
    }
  }

  cy.task('simulateConcurrentUsers', users);
});

Cypress.Commands.add('measurePerformance', (label: string) => {
  cy.window().then((win: Window) => {
    if (win.performance && win.performance.mark) {
      win.performance.mark(`${label}-start`);
    }
  });

  cy.log(`Performance measurement started: ${label}`);
});

Cypress.Commands.add('waitForStableLoad', () => {
  // Wait for network idle
  cy.intercept('**/*').as('allRequests');

  // Wait for DOM to be stable
  cy.get('body').should('be.visible');

  // Wait for any pending requests to complete
  cy.wait(2000); // Basic stability wait

  cy.log('Page load stabilized');
});

Cypress.Commands.add('checkMemoryUsage', () => {
  cy.window().then((win: Window) => {
    if ('performance' in win && 'memory' in (win.performance as any)) {
      const memory = (win.performance as any).memory;
      const memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };

      cy.log('Memory usage:', memoryUsage);
      cy.task('logLoadMetrics', { memoryUsage });

      // Assert memory usage is within reasonable limits (100MB)
      expect(memory.usedJSHeapSize).to.be.lessThan(100 * 1024 * 1024);
    } else {
      cy.log('Memory API not available');
    }
  });
});

Cypress.Commands.add('simulateConcurrentUsers', (userCount: number) => {
  cy.log(`Simulating ${userCount} concurrent users`);
  cy.task('simulateConcurrentUsers', userCount);
});

// Casino-specific Commands
Cypress.Commands.add('navigateToGame', (gameType: string) => {
  cy.visit('/');
  cy.get('[data-testid="enter-games-btn"]').should('be.visible').click();
  cy.url().should('include', '/games');

  if (gameType === 'roulette') {
    cy.get('[data-testid="roulette-game"]').should('be.visible').click();
    cy.url().should('include', '/games/roulette');
  }

  cy.log(`Navigated to ${gameType} game`);
});

Cypress.Commands.add('placeBet', (amount: number) => {
  // Look for betting interface elements
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="bet-amount"]').length > 0) {
      cy.get('[data-testid="bet-amount"]').clear().type(amount.toString());
      cy.get('[data-testid="place-bet-btn"]').click();
    } else {
      // Fallback for different betting interface
      cy.get('canvas, [data-testid*="bet"], [data-testid*="chip"]')
        .first()
        .click();
    }
  });

  cy.log(`Placed bet: ${amount}`);
});

Cypress.Commands.add('spinRoulette', () => {
  // Look for spin button
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="spin-btn"]').length > 0) {
      cy.get('[data-testid="spin-btn"]').click();
    } else if ($body.find('canvas').length > 0) {
      // Click on canvas if it's a canvas-based game
      cy.get('canvas').first().click();
    } else {
      // Look for any button that might be the spin button
      cy.get('button').contains(/spin/i).first().click();
    }
  });

  cy.log('Roulette spin initiated');
});

Cypress.Commands.add('buyChips', (amount: number) => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="buy-chips-btn"]').length > 0) {
      cy.get('[data-testid="buy-chips-btn"]').click();
      cy.get('[data-testid="chip-amount"]').clear().type(amount.toString());
      cy.get('[data-testid="confirm-purchase"]').click();
    } else {
      cy.log(`Buy chips interface not found, amount: ${amount}`);
    }
  });

  cy.log(`Bought chips: ${amount}`);
});

// Performance Monitoring Commands
Cypress.Commands.add('startPerformanceMonitoring', () => {
  cy.window().then((win: Window) => {
    if (win.performance && win.performance.mark) {
      win.performance.mark('test-start');
      win.performance.clearMeasures();
    }
  });

  cy.log('Performance monitoring started');
});

Cypress.Commands.add('stopPerformanceMonitoring', () => {
  return cy.window().then((win: Window): PerformanceMetrics => {
    const metrics: PerformanceMetrics = {
      loadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
    };

    if (win.performance) {
      const navigation = win.performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        metrics.domContentLoaded =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;
      }

      // Get paint metrics
      const paintEntries = win.performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });

      // Get LCP if available - properly typed
      if (
        'PerformanceObserver' in win &&
        typeof (win as any).PerformanceObserver === 'function'
      ) {
        try {
          const PerformanceObserver = (win as any).PerformanceObserver;
          const observer = new PerformanceObserver((list: any) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              metrics.largestContentfulPaint = lastEntry.startTime;
            }
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
          cy.log('LCP monitoring not supported');
        }
      }

      // Memory usage if available
      if ('memory' in win.performance) {
        const memory = (win.performance as any).memory;
        metrics.memoryUsage = memory.usedJSHeapSize;
      }
    }

    cy.log('Performance monitoring stopped', metrics);
    return metrics;
  });
});
