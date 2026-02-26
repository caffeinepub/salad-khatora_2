# Specification

## Summary
**Goal:** Fix the Profile Setup Modal freezing/hanging indefinitely after the user enters a name and clicks "Get Started".

**Planned changes:**
- Investigate and fix the `createUserProfile` (or equivalent) mutation call in `ProfileSetupModal.tsx` that is not resolving or not clearing its loading state
- Ensure the "Get Started" button shows a loading spinner while the mutation is in-flight
- Ensure the modal closes automatically on successful profile save
- Display a visible error message inside the modal on failure and re-enable the button
- Ensure the button is never left permanently disabled after a submission attempt

**User-visible outcome:** Users can enter their name in the Profile Setup Modal and click "Get Started" without the modal freezing — it either closes on success or shows an error and allows retrying.
