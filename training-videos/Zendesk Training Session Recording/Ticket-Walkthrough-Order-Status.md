# How to Handle a Ticket in Zendesk — Visual Walkthrough

**Scenario:** Customer (Johanna) asks for the **status of her order**.
**Source:** Capelli Zendesk Training Session Recording, ~10:38–23:55 (presenter: Marc).

> This is the *model* walkthrough. Every ticket follows the same backbone:
> **Check duplicates → Take it → Identify fulfillment (FBB/FBPA) → Set tags → Check status across BigCommerce / Inbox / SAP / UPS → Reply with the right macro → Set status (Solved / Pending / Open).**

---

## Step 1 — Open the ticket and read the request

![Zendesk ticket view](walkthrough/s1_zendesk_ticket.png)

The customer is asking about the status of her order. Note the three working areas:
- **Left panel** — the ticket fields/tags you'll fill (form, inquiry type, action, club, order #, priority).
- **Center** — the conversation + your reply box.
- **Right panel** — customer details and other tickets from this requester.

> *"Here there's a customer called Johanna. She is inquiring about the status of her order."*

---

## Step 2 — Check for duplicate tickets (and merge if needed)

![Duplicate search in Zendesk](walkthrough/s1b_dup_search.png)

Copy the **order number** and paste it into Zendesk **Search**. Also scan the **right-side panel** for other tickets from the same customer. If more than one exists for the same order, **merge them into a single ticket** and work it as one.

> *"First, we need to check if this customer texted us from any other email so we can merge them into one ticket… here we have only one ticket."*

Then click **Take it** to claim the ticket before you start.

> *"First of all, we click on 'take it' before we start to solve it."*

---

## Step 3 — Identify fulfillment type: FBB vs FBPA

![FBB Orders Excel lookup](walkthrough/s3_fbb_excel.png)

Open the **FBB Orders** Excel master list, press **Ctrl+F → "Find All" → search within Workbook**, and paste the order number.
- **Found in the list → FBB** (produced/fulfilled overseas).
- **Not found → FBPA** (produced/fulfilled in the USA).
- All **Shopify / cappellisport.com** orders are **FBPA**.

> *"FBB orders are produced and fulfilled from [overseas]… FBPA is produced and fulfilled from USA… we have a specific Excel file called FBB orders. If we find it here, it means the order is FBB."*

---

## Step 4 — Set the inquiry type tag

![Inquiry type dropdown](walkthrough/s4_inquiry_tag.png)

In the left field panel, set the **inquiry type** to match the request. Here it's an **Order Status Update**.

> *"Since the customer is asking about his order, it's an order status update… we simply click on it."*

---

## Step 5 — Check the order in BigCommerce

![BigCommerce order – Awaiting Fulfillment](walkthrough/s5_bc_order.png)

Paste the order number into **BigCommerce** search and open the order. You'll see the customer details, shipping address, line items, and **Status** — here, **"Awaiting Fulfillment."**

> *"I went to BigCommerce and pasted the order in the search box… here we have the status: awaiting fulfillment. Unfortunately the system is not very accurate, so we check on many platforms."*

**Identify the club** from the line items — the **first text on each item** is the club name (you can also confirm via the logo on the product).

---

## Step 6 — Check the email inbox (Outlook) for the shipment

![Outlook inbox shipment email](walkthrough/s6_inbox_shipment.png)

Go to the **inbox** and paste the order number. Shipments are emailed to the team as numbered shipments (e.g. *shipment 383*) with an attached Excel containing every order number and its **tracking number** and an **ETA**.

> *"We go to the inbox and paste the order number… we found an email that contains a shipment. Inside, we find the order and the tracking number."*

![Order → tracking number, highlighted](walkthrough/s6b_tracking_green.png)

Find the order's row and copy the **tracking number** (highlighted). Note the shipment's **ETA** from the email.

> *"That's the tracking number assigned to the order… each shipment has an expected time of arrival. The ETA for shipment 383 is [this week]."*

---

## Step 7 — Verify the tracking status in UPS

![UPS tracking – Label Created](walkthrough/s7_ups_status.png)

Paste the tracking number into **UPS**. Here it shows **"Label Created"** — meaning the order **hasn't physically shipped yet**; UPS will pick it up by the ETA date.

> *"Here we only have the label created, so the order hasn't been shipped yet… the shipment is expected to move by [ETA]."*

---

## Step 8 — Reply using the correct macro/template

![Zendesk reply with FB tracking template](walkthrough/s8_template_reply.png)

Apply the matching macro — here the **FB(B) Tracking** template — and fill **only** the variables: tracking number, order number, UPS tracking link, and the ETA date. (Templates are used as-is; you just fill the blanks.)

> *"In apply macro we have the template of FB tracking… I fill only the tracking number, the order, the link and the expected time of arrival."*

---

## Step 9 — Finish the tags (action, club, order #, priority)

![Capelli storefront – Seattle United item](walkthrough/s9_tags_club.png)

Set the remaining fields:
- **Action** → **ETA** (Expected Time of Arrival).
- **Club** → here **Seattle United** (identified from the item name/logo — pictured: the Seattle United jersey).
- **Order number** → pasted in.
- **Priority** → Normal.

> *"What's the action here? Expected time of arrival — the ETA… and the club is Seattle United… the priority is normal."*

---

## Step 10 — Set the ticket status and submit

![Zendesk submit – Solved](walkthrough/s10_solved.png)

Choose the right status:
- **Solved** — fully resolved, nothing pending (this case: tracking + ETA provided). ✅ used here.
- **Pending** — waiting on the **customer** (e.g. evidence picture, order number).
- **Open** — waiting on an **internal department** (Operations / supervisor / ROLO) **or** a replacement not yet shipped. *Open tickets must always carry an internal note.*

> *"There's nothing pending, nothing open, so we submit as the solved ticket."*

Finally, log the resolution + tracking info on the **daily recap**.

---

## The repeatable checklist (every ticket)

1. ☐ Read the request — what does the customer actually want?
2. ☐ **Check duplicates** (search order #, scan right panel) → merge if needed.
3. ☐ **Take it.**
4. ☐ **FBB or FBPA?** (FBB Orders Excel; Shopify = FBPA).
5. ☐ Set **inquiry type** tag.
6. ☐ Check status: **BigCommerce → Inbox → SAP (VA05) → UPS** as needed.
7. ☐ Identify the **club** (first text on item / logo).
8. ☐ Reply with the **correct macro**, fill only the variables.
9. ☐ Set **action / club / order # / priority**.
10. ☐ Set **status** (Solved / Pending / Open) — add an **internal note** if Open.
11. ☐ Update the **daily recap**.
