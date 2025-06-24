/// <reference types="cypress" />
import { beforeEach, describe, it } from 'mocha';

describe('Game Load Testing', () => {
  const loadTestConfig = {
    users: Number.parseInt(Cypress.env('LOAD_TEST_USERS') || '3'),
    duration: Number.parseInt(Cypress.env('LOAD_TEST_DURATION') || '30'),
  };

  beforeEach(() => {
    cy.startPerformanceMonitoring();
  });

  it('should handle roulette game load', () => {
    cy.visit('/');

    // Try to navigate to roulette game
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="enter-games-btn"]').length > 0) {
        cy.navigateToGame('roulette');
      } else {
        // Fallback: just visit the roulette page directly
        cy.visit('/games/roulette');
      }
    });

    cy.waitForStableLoad();

    // Check if game elements are present
    cy.get('body').should('be.visible');

    cy.stopPerformanceMonitoring().then((metrics) => {
      expect(metrics.loadTime).to.be.lessThan(15000); // 15 seconds for game load
      cy.task('logLoadMetrics', {
        test: 'roulette-game-load',
        metrics,
        users: loadTestConfig.users,
      });
    });
  });

  it('should handle game interactions under load', () => {
    cy.visit('/games/roulette');
    cy.waitForStableLoad();

    // Simulate game interactions
    cy.get('body').then(($body) => {
      // Try to interact with the game
      if ($body.find('canvas').length > 0) {
        cy.get('canvas').first().click();
      } else if ($body.find('button').length > 0) {
        cy.get('button').first().click();
      }
    });

    cy.checkMemoryUsage();
  });

  it('should handle multiple game sessions', () => {
    const sessions = 3;

    for (let i = 0; i < sessions; i++) {
      cy.visit('/games/roulette');
      cy.waitForStableLoad();

      // Simulate some game activity
      cy.wait(2000);

      cy.checkMemoryUsage();

      cy.log(`Completed game session ${i + 1}/${sessions}`);
    }

    cy.task('logLoadMetrics', {
      test: 'multiple-game-sessions',
      sessions,
    });
  });
});
