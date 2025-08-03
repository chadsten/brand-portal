// Jest setup file
require('@testing-library/jest-dom');

// @ts-ignore
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
	process.env.TEST_DATABASE_URL ||
	"postgresql://test:test@localhost:5432/brand_portal_test";
process.env.REDIS_URL =
	process.env.TEST_REDIS_URL || "redis://localhost:6379/1";

// Mock environment variables for testing
process.env.AUTH_SECRET = "test-secret";
process.env.GOOGLE_CLIENT_ID = "test-google-id";
process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
process.env.AZURE_AD_TENANT_ID = "test-tenant-id";
process.env.AWS_ACCESS_KEY_ID = "test-access-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret-key";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_S3_BUCKET = "test-bucket";
process.env.SMTP_HOST = "test-smtp";
process.env.SMTP_PORT = "587";
process.env.SMTP_USER = "test-user";
process.env.SMTP_PASS = "test-pass";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    has: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
