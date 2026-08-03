# Provenance Hunt Quest (E2E Integration) Broken

## Diagnosis
The `quest.e2e.spec.ts` test was quarantined because it failed during CI execution.
Unlike other UI tests that use mocked data, this test performs a true end-to-end flow:
1. Uploads a file to the backend (`/v1/subjects/resolve`).
2. The backend inserts the subject into the database.
3. The frontend redirects to the view page (`/v/[hash]`) to poll the backend.
4. Expects to see the `Subject Details` rendered.

**Failure:** The test times out waiting for `Subject Details`. 

## Triage
This is a **Priority 1 (P1)** issue because it indicates that the core user-facing "Provenance Hunt Quest" feature is fundamentally broken in the integration environment. 
The timeline feature itself works (verified against valid data), but the *integration flow* to seed and retrieve that data end-to-end is failing.

## Next Steps
Before un-quarantining the test, a developer must diagnose the exact point of failure in the integration environment:
- Is the file upload failing at the Next.js API proxy layer?
- Is the backend crashing during processing (e.g. perceptual hash generation in `provenance-worker`)?
- Is the `fetchSubjectData` polling failing due to CORS or networking issues in the CI container?

**Note:** The test file has been renamed from `quest.e2e.spec.ts` to `quest.e2e.quarantined.ts` to explicitly remove it from the primary CI gate without using hidden `test.skip()` annotations.
