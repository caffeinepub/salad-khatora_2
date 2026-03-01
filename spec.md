# Specification

## Summary
**Goal:** Fix the "Actor not available" error that occurs when submitting the Add Customer form on the Customers page.

**Planned changes:**
- Guard the Add Customer form submission so it is disabled while the backend actor is still initializing.
- Ensure the create customer mutation is only invoked after the actor is fully ready.
- Display a user-friendly error message if the actor fails to initialize instead of crashing silently.
- Ensure a successful customer creation updates the customer list without a page reload.

**User-visible outcome:** Users can open the Add Customer dialog and submit the form without encountering an "Actor not available" error. The submit button is disabled during actor initialization, and any initialization failure shows a clear error message.
