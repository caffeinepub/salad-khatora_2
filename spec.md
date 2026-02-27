# Specification

## Summary
**Goal:** Fix the checkout flow in the Salad Khatora POS so that cart items are preserved during checkout, a payment mode can be selected, a bill/receipt is generated after order confirmation, and a print option is available.

**Planned changes:**
- Fix the Checkout button in SalesPage.tsx to open a checkout/order summary dialog instead of immediately clearing the cart and processing
- The checkout dialog displays all cart items with name, quantity, and price, and is dismissible without data loss
- Add a Payment Mode selection step (Cash, Card, UPI/Online) inside the checkout dialog; order cannot be confirmed without a selection
- Store the selected payment mode with the sale order on the backend
- After successful order confirmation, display a bill/receipt view showing order ID, date/time, itemized list, discount, tax breakdown, grand total, and payment mode used
- Add a "Print Bill" button that triggers the browser print dialog scoped to bill content only, hiding all other UI via print CSS
- Clear the cart, customer selection, and discount code only after the bill dialog is dismissed or "New Sale" is clicked

**User-visible outcome:** Cashiers can review cart items, select a payment method, confirm the order, view a formatted bill, and print it — with the cart only clearing after the transaction is fully completed.
