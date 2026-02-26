# Specification

## Summary
**Goal:** Add Discounts & Coupons, Tax Configuration, and Sales Reports features to the Salad Khatora POS system, along with a reorganized Sales navigation dropdown.

**Planned changes:**
- Add `DiscountCode` type and CRUD operations to the backend, including `applyDiscountCode` validation logic (active, not expired, within max uses, minimum order enforced)
- Add `TaxConfig` type and CRUD operations to the backend, including `calculateTax` query returning per-config breakdowns and total
- Add `getSalesReport` query to the backend supporting daily and weekly periods, returning total orders, revenue, average order value, and top 10 selling items
- Update `createSaleOrder` to accept an optional discount code, apply active taxes automatically, and persist discount/tax fields on the order record
- Add a `migration.mo` that carries over all prior stable state and initialises empty discount/tax collections
- Add 15 React Query hooks for all new backend operations (discount codes, tax configs, sales report, calculate tax, apply discount)
- Build a Discounts & Coupons page at `/discounts` with a table, add/edit/delete modal, and inline active toggle
- Build a Sales Reports page at `/sales-reports` with daily/weekly date pickers, a report card, top-selling items table, and client-side CSV download
- Build a Tax Configuration page at `/tax-config` with a table, add/edit/delete modal, inline active toggle, and a live tax preview panel
- Update the New Order form on the Sales page to support promo code application, show a tax breakdown, and display a detailed order total (subtotal → discount → tax lines → grand total)
- Update expanded order details in Sales History to show discount amount, tax breakdown, and grand total
- Reorganize the sidebar/header navigation so Sales becomes a collapsible dropdown containing: Sales, Discounts & Coupons, Sales Reports, and Tax Configuration
- Register the three new routes (`/discounts`, `/sales-reports`, `/tax-config`) in `App.tsx`

**User-visible outcome:** Admins can create and manage promo/discount codes and tax configurations, view daily/weekly sales reports with CSV export, apply promo codes and see tax breakdowns when creating orders, and navigate all sales-related pages from a unified collapsible "Sales" dropdown in the sidebar.
