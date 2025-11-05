import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAction } from '../dist/edge-alerts-ack/normalize-action.js';
import { buildAlertMessage, DEFAULT_TONE } from '../dist/edge-alerts-dispatch/messages.js';

const baseAlert = {
  market: 'Team A vs Team B',
  sportsbook: 'SharpBook',
  edgeValue: 0.12,
};

test('normalizeAction defaults to acknowledged', () => {
  assert.equal(normalizeAction(), 'acknowledged');
  assert.equal(normalizeAction(''), 'acknowledged');
  assert.equal(normalizeAction('   '), 'acknowledged');
});

test('normalizeAction trims whitespace', () => {
  assert.equal(normalizeAction('  snoozed  '), 'snoozed');
});

test('normalizeAction keeps original action', () => {
  assert.equal(normalizeAction('resolved'), 'resolved');
});

test('buildAlertMessage uses default concise tone', () => {
  const message = buildAlertMessage(baseAlert, DEFAULT_TONE);
  assert.equal(message, 'Team A vs Team B @ SharpBook: 12.0% edge');
});

test('buildAlertMessage formats engaging tone', () => {
  const message = buildAlertMessage(baseAlert, 'engaging');
  assert.equal(
    message,
    '🚨 Team A vs Team B: SharpBook is hanging value (12.0% edge). Jump before it moves!'
  );
});

test('buildAlertMessage formats analytical tone with trigger threshold', () => {
  const message = buildAlertMessage({ ...baseAlert, triggerThreshold: 0.15 }, 'analytical');
  assert.equal(
    message,
    'Team A vs Team B @ SharpBook => 12.0% edge; trigger 15% | origin model'
  );
});
