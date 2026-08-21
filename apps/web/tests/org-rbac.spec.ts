import { test, expect } from '@playwright/test';
import { PrismaClient } from '@antiai/database';

// Test config
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
// Assuming the frontend runs at http://localhost:3000 during test

let ownerEmail = '';
let creatorEmail = '';
const password = 'Password123!';

let ownerToken = '';
let creatorToken = '';
let ownerBToken = '';

let orgAId = '';
let orgBId = '';

const prisma = new PrismaClient();

test.beforeAll(async ({ request }) => {
  const runId = Date.now();
  ownerEmail = `owner_${runId}@test.com`;
  creatorEmail = `creator_${runId}@test.com`;

  // 1. Create Owner User
  const ownerSignup = await request.post(`${API_URL}/auth/signup`, {
    data: { email: ownerEmail, password, handle: `owner_${runId}` }
  });
  expect(ownerSignup.ok()).toBeTruthy();

  await prisma.user.update({
    where: { email: ownerEmail },
    data: { isEmailVerified: true }
  });

  const ownerLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: ownerEmail, password }
  });
  const ownerData = await ownerLogin.json();
  ownerToken = ownerData.access_token || ownerData.token;

  // 2. Create Creator User
  const creatorSignup = await request.post(`${API_URL}/auth/signup`, {
    data: { email: creatorEmail, password, handle: `creator_${runId}` }
  });
  expect(creatorSignup.ok()).toBeTruthy();

  await prisma.user.update({
    where: { email: creatorEmail },
    data: { isEmailVerified: true }
  });

  const creatorLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: creatorEmail, password }
  });
  const creatorData = await creatorLogin.json();
  creatorToken = creatorData.access_token || creatorData.token;

  // 3. Create Org A (Owner creates)
  const createOrgA = await request.post(`${API_URL}/organizations`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: { name: `Org A ${runId}`, slug: `org-a-${runId}` }
  });
  expect(createOrgA.ok()).toBeTruthy();
  const orgA = await createOrgA.json();
  orgAId = orgA.id;

  // 4. Create Owner B and Org B (Owner B creates)
  const ownerBEmail = `ownerb_${runId}@test.com`;
  const ownerBSignup = await request.post(`${API_URL}/auth/signup`, {
    data: { email: ownerBEmail, password, handle: `ownerb_${runId}` }
  });
  expect(ownerBSignup.ok()).toBeTruthy();

  await prisma.user.update({
    where: { email: ownerBEmail },
    data: { isEmailVerified: true }
  });

  const ownerBLogin = await request.post(`${API_URL}/auth/login`, {
    data: { email: ownerBEmail, password }
  });
  const ownerBData = await ownerBLogin.json();
  ownerBToken = ownerBData.access_token || ownerBData.token;

  const createOrgB = await request.post(`${API_URL}/organizations`, {
    headers: { Authorization: `Bearer ${ownerBToken}` },
    data: { name: `Org B ${runId}`, slug: `org-b-${runId}` }
  });
  expect(createOrgB.ok()).toBeTruthy();
  const orgB = await createOrgB.json();
  orgBId = orgB.id;

  // 5. Add Creator to Org A as CREATOR
  // First invite, then accept.
  const inviteRes = await request.post(`${API_URL}/organizations/${orgAId}/invites`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    data: { email: creatorEmail, role: 'CREATOR' }
  });
  expect(inviteRes.ok()).toBeTruthy();
  const invite = await inviteRes.json();
  
  const acceptRes = await request.post(`${API_URL}/organizations/${orgAId}/invites/${invite.id}/accept`, {
    headers: { Authorization: `Bearer ${creatorToken}` }
  });
  expect(acceptRes.ok()).toBeTruthy();
});

test.describe('Org RBAC Real-Boundary Tests', () => {

  test('Test 1 (UX Hiding): Render as CREATOR, assert "Invite Member" button is not in the DOM', async ({ page }) => {
    // Inject local storage token for creator
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, creatorToken);

    // Go to team settings
    await page.goto(`/orgs/${orgAId}/settings/team`);

    // Ensure page loaded
    await expect(page.getByText('Team Management')).toBeVisible();

    // Verify Invite button is NOT visible
    await expect(page.getByRole('button', { name: /Invite Member/i })).not.toBeVisible();
  });

  test('Test 2 (Owner Path): Render as OWNER, click "Invite Member", assert success', async ({ page, request }) => {
    // Inject owner token
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, ownerToken);

    await page.goto(`/orgs/${orgAId}/settings/team`);

    // Ensure page loaded
    await expect(page.getByText('Team Management')).toBeVisible();

    // Click Invite
    await page.getByRole('button', { name: /Invite Member/i }).click();

    // Fill modal
    await page.getByPlaceholder(/colleague@example.com/i).fill(`new-invite-${Date.now()}@test.com`);
    await page.getByRole('button', { name: 'Send Invite' }).click();

    // Expect success toast or UI update
    await expect(page.getByText('Invite sent successfully')).toBeVisible();
  });

  test('Test 3 (Security API Bypass): CREATOR bypassing UI receives 403', async ({ request }) => {
    // Direct API call as creator to invite
    const bypassRes = await request.post(`${API_URL}/organizations/${orgAId}/invites`, {
      headers: { Authorization: `Bearer ${creatorToken}` },
      data: { email: `bypass-${Date.now()}@test.com`, role: 'ADMIN' }
    });

    // Verify backend blocked it
    expect(bypassRes.status()).toBe(403);
    const err = await bypassRes.json();
    expect(err.message).toMatch(/Requires one of roles: OWNER, ADMIN/i);
  });

  test('Test 4 (Cross-Org Security): OWNER of Org A blocked from Org B', async ({ page, request }) => {
    // 1. UX Guard check: Owner A tries to navigate to Org B settings
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('token', token); // Owner A token
    }, ownerToken);

    // Navigate to Org B team settings (Owner A is NOT in Org B)
    await page.goto(`/orgs/${orgBId}/settings/team`);

    // Layout should redirect to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Security Boundary check: Owner A tries direct API to Org B
    const bypassRes = await request.post(`${API_URL}/organizations/${orgBId}/invites`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { email: `hack-${Date.now()}@test.com`, role: 'ADMIN' }
    });

    expect(bypassRes.status()).toBe(403);
    const err = await bypassRes.json();
    expect(err.message).toMatch(/Not a member/i);
  });

});
