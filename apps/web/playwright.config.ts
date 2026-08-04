import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../api && npx nest start',
      url: 'http://localhost:4000/v1/subjects/resolve',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        GOOGLE_CLIENT_ID: 'mock-client-id',
        GOOGLE_CLIENT_SECRET: 'mock-client-secret',
        PORT: '4000',
        DATABASE_URL: 'postgresql://postgres:3190@localhost:5432/antiai?schema=public'
      },
    },
    {
      command: process.env.CI ? 'npx next start' : 'npx next dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    }
  ],
});
