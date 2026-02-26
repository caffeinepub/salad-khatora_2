# Specification

## Summary
**Goal:** Fix the Admin Settings page to show a "Claim Admin" button when the admin role is vacant, instead of only showing "You do not have admin access."

**Planned changes:**
- Update `AdminSettingsPage.tsx` to implement three-state conditional rendering:
  1. If the current user IS the admin — show the full admin panel (reassign, vacate) as before
  2. If the current user is NOT the admin and the admin role IS vacant (empty/null principal from `useAdminPrincipal`) — show a "Claim Admin (if vacant)" button with explanatory text
  3. If the current user is NOT the admin and an admin IS already assigned — show only the "You do not have admin access" message
- Wire the "Claim Admin" button to call `useClaimAdminIfVacant`
- Show a success toast on successful claim or an error message on failure

**User-visible outcome:** A non-admin user visiting the Admin Settings page will now see a "Claim Admin" button when the admin role is vacant, allowing them to claim admin access directly from the page.
