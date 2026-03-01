# Specification

## Summary
**Goal:** Audit and fix all existing issues across the Salad Khatora POS frontend and backend to ensure every page, component, and data hook works correctly and consistently.

**Planned changes:**
- Fix SalesPage layout: correct cart, menu grid, checkout button, and discount/customer selector spacing, typography, and color token usage
- Fix SalesReportsPage: correct daily/weekly toggle, stat cards, and report table styling and data display
- Fix BillReceiptView: ensure all bill fields render correctly and window.print() produces a clean receipt without overflow
- Fix CheckoutDialog: correct pricing breakdown display, payment method selector active states, and confirm button functionality
- Fix sidebar navigation in Layout.tsx: ensure all nav links are present, grouped, styled, and active route is highlighted; fix mobile hamburger toggle
- Audit and enforce global design token consistency (OKLCH CSS custom properties, DM Sans/Plus Jakarta Sans fonts, dark mode) across all pages
- Fix backend main.mo: resolve logic errors, missing authorization checks, inconsistent state mutations, and type mismatches; ensure audit log entries are recorded for all mutations
- Fix useQueries.ts: correct broken query/mutation hooks, query key arrays, fetcher functions, mutation invalidations, and error handling
- Fix ProfileSetupModal.tsx: implement a functional profile setup modal or cleanly remove it and its imports
- Fix LoginPage.tsx: implement a functional Internet Identity login page with dashboard redirect, or cleanly remove it and its routes

**User-visible outcome:** All pages and features of the POS app render correctly in both light and dark mode, navigation works on desktop and mobile, checkout and billing flows complete without errors, and backend operations are consistent and secure.
