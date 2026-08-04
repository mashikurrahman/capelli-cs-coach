FBB / FBPA / REPLACEMENT ORDERS — CS FIELD GUIDE
Consolidated from the CS Customer Service Training Manual (3.11.25), the Order Holds/Changes & Cancelation Guidelines, the Zendesk Tags sheet, the Contacts Cheat Sheet, and the team Zendesk training recording. This explains the plumbing behind ticket handling: what the FBB master file is for, when an order is FBPA, how the replacement-order (RO) coupon code works, and which system to open for what.

## 1. First decision on every order: FBB or FBPA?
This one answer drives your ETA wording AND whether you can cancel/change the order yourself or must escalate. Check it before you reply.

How to check:
- Open the "FBB Orders — Master.xlsx" spreadsheet.
- Press Ctrl+F, choose "Find All", set the scope to "Within: Workbook", and paste the order number.
- FOUND in the sheet = FBB (Fulfilled By Bangladesh). The order is, or is heading into, overseas production.
- NOT FOUND = FBPA (Fulfilled By USA / domestic).
- Every Shopify / capellisport.com order is FBPA.
- Split = an order that is part FBPA and part FBB ("both"). Treat each part by its own fulfillment when you quote timing or act on it.

## 2. The FBB master file — what it gates
The FBB master file is the live list of orders locked into Bangladesh fulfillment. You check it to answer one question: can I still touch this order, or do I have to ask Operations?

Changes & cancellations:
- If the order is NOT in the FBB list AND not delivered in SAP, you can proceed (notify Operations on cancellations).
- If the order IS in the FBB list, do not act. Email Operations and get approval first, because the factory may already have it.

Who to email: Operations = Georges + Lucien, CC Jad. (Add Karl when an OBD is on a wave — see section 3.)

Real escalation email from the training session (to Georges + Lucien, CC Jad):
"Please advise if we are able to change size for the turquoise goalie shorts in order #1596912, placed on 7 Jun 2026. Order found in FBB master list. Not delivered in SAP."

## 3. FBPA & SAP — "is it already in production?"
FBPA orders are not gated by a list. They are gated by their state in SAP: the OBD (outbound delivery), whether it is on a wave, and whether that wave has a release date.

Look it up:
- SAP, transaction VA05: paste the web order number into "Customer Reference", then Execute.
- Read whether the order is delivered/produced. "Not delivered in SAP" means it is still safe to change or cancel.

You CAN cancel/change an FBPA order only if: there is no OBD, OR the OBD is not on a wave, OR the OBD is on a wave that has no release date.
You CANNOT self-serve if the OBD is on a wave WITH a release date — it is committed; escalate.

If the OBD is on a wave: Fulfillment Support (Online CSP) and the warehouse person in charge must remove it from the wave first. Always notify Jad on cancellations and CC Karl. Avoid holding FBPA orders that are already on waves.

## 4. Cancel & refund — the ROLO path
1. Confirm the order is not in the FBB list and not delivered in SAP (sections 2–3).
2. Cancel the order in BigCommerce.
3. Email ROLO to process the refund — CC the Operations manager, and always include the ticket number.
4. Set the ticket to Open — ROLO still has to issue the refund, so it is not resolved yet.

Refund amount: item price only, NEVER shipping. If a coupon code was used, refund the discounted amount the customer actually paid. Refunds take ~24h to process and 3–5 business days to appear (statement shows "Capelli Sport"). A shipping-cost refund for excessive delay is a goodwill gesture that needs internal approval.

## 5. Replacement Orders & your RO coupon code
A Replacement Order (RO) is placed in BigCommerce to the customer's SAME shipping address. The customer is NOT charged — the RO is paid for with YOUR personal replacements coupon code. That is why the RO number is sensitive.

Never:
- Share your personal RO coupon code with the customer.
- Share the RO# with the customer — it contains your discount code.
- Place an RO without an evidence photo (unless a supervisor approves).
- Place an RO if the order is past the 1-year replacement window.

Always:
- Replace in the same size and form as originally ordered. A different size = return for refund + a new order (a goodwill size swap is a manager exception, not the default).
- Double-check items and the shipping address before checkout.
- Record the RO# next to the original order number in the tags, set the ticket to Open, and add an internal note.

Do not confuse this with a customer-facing goodwill coupon (e.g. a 15% out-of-stock code) — that IS meant to be shared. Your RO coupon is not.

## 6. Which system do I open for what?
- BigCommerce: Team-shop / US orders — view order and status, place a replacement order, cancel, process refunds, see the coupon-code line.
- SAP (transaction VA05): confirm production/delivery, check OBD / wave / release date, holds. The source of truth for "is it made yet?".
- Shopify: capellisport.com orders (a separate, wider catalog). Edit customer name / email / address. All Shopify orders are FBPA.
- Outlook inbox: shipment emails — numbered shipments (e.g. "shipment 383") with an Excel listing every order's tracking number and the ETA.
- UPS: paste the tracking number. "Label Created" means it has not physically shipped yet; UPS will pick it up by the ETA.
- Zendesk: tags, macros (reply templates), internal notes, ticket status. Never reword a macro — fill only the variables.
- Authorize.net: refunds handled by a supervisor.

## 7. Zendesk tagging — the real combos
Every ticket sets Order Fulfillment, Inquiry Type, Action, Club, and Order #. Common pairings:
- "Where's my order?" within processing window: Fulfillment FBB/FBPA; Inquiry "Order Status Update"; Action "Processing Time".
- "Where's my order?" past the window: Fulfillment FBB/FBPA; Inquiry "Order Status Update"; Action "ETA".
- Change player number / name: Fulfillment FBB; Inquiry "Order Adjustment"; Action "Hold".
- Wrong / blank / defective item: Inquiry "Wrong Item/Size" or "Decoration Issue"; Action "Evidence Picture", then "Replacement".
- Wants to exchange (their own error): Fulfillment FBPA; Inquiry "General Inquiry"; Action "Return Policy" (we do not do exchanges).
- Ordering help / player link / sizing: Fulfillment N/A; Inquiry "General Inquiry"; Action "No Action".
- Out of stock: Inquiry "Item Out of Stock"; Action "Substitute Item" or "Cancel/Refund".
- Club-wide billing issue to escalate: Inquiry "General Inquiry"; Action "Internal Department".

## 8. Ticket status
- Solved: fully resolved from our side (tracking + ETA given, policy sent, or customer error explained).
- Pending: waiting on the CUSTOMER (e.g. an evidence photo).
- Open: waiting on an INTERNAL team, or a replacement/refund that is not done yet. Open always needs an internal note.

## 9. Who to contact
- Cancel / change, or an FBB / ops question: Georges + Lucien, CC Jad.
- OBD on a wave: additionally CC Karl.
- Refund after a cancel: ROLO (CC the manager, include the ticket number).
- Coupon/check approval and club-wide billing issues: Dan.
- Website / account / roster issues: Roy Issa, Sonia Aoun.

## Source-of-truth notes
The FBB master list and SAP are always the live source of truth — this guide tells you how to read them, not what today's data says. Uploaded training docs win on any exact number, address, or template wording. A few names/steps were read from the training video's auto-captions and may be slightly off — verify against the sheet if in doubt.
