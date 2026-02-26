# Specification

## Summary
**Goal:** Build Phase 1 of Salad Khatora — an admin-only inventory management app with authentication, ingredient CRUD, and a dashboard with key stats and low-stock alerts.

**Planned changes:**
- Admin email/password authentication with session management; all non-auth endpoints protected
- Login page with email/password form, error handling, and redirect to dashboard on success
- Inventory data model (name, quantity, unit, cost price, supplier, low-stock threshold) with auto-calculated total value; full CRUD backend functions
- Inventory Management page with a table showing all ingredient fields, Add/Edit/Delete support, confirmation on delete, and visual highlighting for low-stock rows
- Dashboard page (default post-login) with stat cards for total ingredient count, total inventory value, and low-stock item count; low-stock alerts section listing affected ingredients
- White and green theme, sidebar/top navigation between Dashboard and Inventory pages, fully responsive/mobile-friendly layout, logo displayed in navigation header

**User-visible outcome:** An admin can log in, view a dashboard with inventory stats and low-stock alerts, and manage ingredients (add, edit, delete) with automatic total value calculation and low-stock visual indicators.
