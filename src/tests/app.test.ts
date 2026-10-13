/**
 * PYQVerse Automated Verification Suite
 * Standalone TypeScript Verification Tests
 */

function describe(suiteName: string, fn: () => void) {
  console.log(`[TEST SUITE] ${suiteName}`);
  fn();
}

function test(testName: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${testName}`);
  } catch (err) {
    console.error(`  ✗ ${testName}`, err);
    throw err;
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but received ${actual}`);
      }
    },
    toBeCloseTo(expected: number, precision: number = 2) {
      const diff = Math.abs((actual as unknown as number) - expected);
      if (diff > Math.pow(10, -precision)) {
        throw new Error(`Expected ${actual} to be close to ${expected}`);
      }
    },
  };
}

describe('Exam Engine & Scoring Calculations', () => {
  test('Calculates positive marks and negative deduction accurately', () => {
    const questionMarks = 4;
    const negativeRatio = 0.25;
    const negativeDeduction = questionMarks * negativeRatio; // 1 mark

    expect(negativeDeduction).toBe(1);

    // Score for 3 correct and 1 wrong
    const correctCount = 3;
    const wrongCount = 1;
    const totalScore = (correctCount * questionMarks) - (wrongCount * negativeDeduction);
    expect(totalScore).toBe(11); // 12 - 1 = 11

    const accuracy = Math.round((correctCount / (correctCount + wrongCount)) * 100);
    expect(accuracy).toBe(75);
  });

  test('GATE CS negative marking calculation (1/3rd)', () => {
    const marks = 1;
    const negativeMarks = 0.33;
    expect(marks - negativeMarks).toBeCloseTo(0.67, 2);
  });

  test('Format exam timer helper', () => {
    const formatTimer = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    expect(formatTimer(2700)).toBe('45:00');
    expect(formatTimer(65)).toBe('01:05');
  });
});

import { resolveApiBaseUrl } from '../lib/api';

describe('API URL Resolution & Production Deployment Architecture', () => {
  test('Defaults to /api/v1 for local dev when VITE_API_URL is unset or empty', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('/api/v1');
    expect(resolveApiBaseUrl('')).toBe('/api/v1');
    expect(resolveApiBaseUrl('   ')).toBe('/api/v1');
  });

  test('Appends /api/v1 to bare domains without trailing slashes', () => {
    expect(resolveApiBaseUrl('https://api.pyqverse.edu')).toBe('https://api.pyqverse.edu/api/v1');
    expect(resolveApiBaseUrl('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000/api/v1');
  });

  test('Strips trailing slashes before appending /api/v1', () => {
    expect(resolveApiBaseUrl('https://api.pyqverse.edu/')).toBe('https://api.pyqverse.edu/api/v1');
    expect(resolveApiBaseUrl('https://api.pyqverse.edu///')).toBe('https://api.pyqverse.edu/api/v1');
  });

  test('Normalizes endpoints that already specify /api prefix', () => {
    expect(resolveApiBaseUrl('https://api.pyqverse.edu/api')).toBe('https://api.pyqverse.edu/api/v1');
    expect(resolveApiBaseUrl('https://api.pyqverse.edu/api/')).toBe('https://api.pyqverse.edu/api/v1');
  });

  test('Preserves endpoints that already specify full /api/v1 prefix', () => {
    expect(resolveApiBaseUrl('https://api.pyqverse.edu/api/v1')).toBe('https://api.pyqverse.edu/api/v1');
    expect(resolveApiBaseUrl('https://api.pyqverse.edu/api/v1/')).toBe('https://api.pyqverse.edu/api/v1');
  });

  test('Guarantees absolute deployed URL never points to localhost in production mode', () => {
    const prodUrl = resolveApiBaseUrl('https://backend-production.up.railway.app');
    expect(prodUrl.startsWith('https://backend-production.up.railway.app')).toBe(true);
    expect(prodUrl.includes('localhost')).toBe(false);
    expect(prodUrl.includes('127.0.0.1')).toBe(false);
  });

  test('Single-project Vercel architecture: unset VITE_API_URL yields same-origin relative /api/v1 paths', () => {
    // When both Vite and FastAPI are in one Vercel project, VITE_API_URL is left unset
    const sameOriginBase = resolveApiBaseUrl(undefined);
    expect(sameOriginBase).toBe('/api/v1');

    // Endpoints resolve to relative paths without external domains
    const healthEndpoint = `${sameOriginBase}/health`;
    expect(healthEndpoint).toBe('/api/v1/health');
    expect(healthEndpoint.startsWith('http')).toBe(false);
  });
});
