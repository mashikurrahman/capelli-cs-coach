/**
 * Labelled scenarios mined from a batch of ~70 real Capelli Zendesk tickets
 * (customer complaint + experienced-agent handling). This is the second training
 * dataset, complementing the video-derived VIDEO_SCENARIOS.
 *
 * PRIVACY: every record here is PII-scrubbed. Customer names, emails, phone
 * numbers, addresses, order/RO numbers, coupon codes and club passwords from the
 * source tickets are NOT stored — only the *pattern* of the complaint and the
 * correct handling. Safe to feed the matcher, decision hints and QA rubric.
 *
 * Reuses the VideoScenario shape so it merges cleanly into decision-hints.
 * `workflowId` must be a real id from DEFAULT_WORKFLOWS.
 */
import type { VideoScenario } from '@/lib/training/video-scenarios';

export const AGENT_SCENARIOS: VideoScenario[] = [
  // ── Label Created / tracking not updating (the highest-volume ticket) ──────
  {
    id: 'label-created-stuck',
    complaint: 'I got an email saying my order shipped, but UPS only shows "Label Created" and the package has not been picked up for days.',
    workflowId: 'tracking_not_moving',
    inquiryType: 'Order Status Update', action: 'Tracking', fault: 'none', fulfillment: 'unknown', status: 'pending',
    note: 'A shipping label is generated before the package physically ships; UPS will not show movement until it is scanned. Reassure that UPS is expected to receive it by end of week, and to reach back if no update in 2–3 business days. Do NOT promise a hard delivery date.',
  },
  {
    id: 'label-created-tournament',
    complaint: 'Tracking has shown a label created for two weeks and we need the uniforms for a tournament this weekend.',
    workflowId: 'tracking_not_moving',
    inquiryType: 'Order Status Update', action: 'Tracking', fault: 'none', fulfillment: 'unknown', status: 'pending',
    note: 'Same label-created reassurance, but acknowledge the deadline empathetically. We do not offer expedited shipping — do not promise it will arrive by the event.',
  },
  {
    id: 'shipped-no-tracking-info',
    complaint: 'Why does it say the order shipped but the tracking number has no information at all? Has it shipped or not?',
    workflowId: 'tracking_not_moving',
    inquiryType: 'Order Status Update', action: 'Tracking', fault: 'none', fulfillment: 'unknown', status: 'pending',
    note: 'Order has departed the warehouse to UPS for final delivery; tracking will not update until UPS scans it. Provide the UPS link and the "not updated in 2–3 days, contact us" fallback.',
  },

  // ── Defective decoration / quality (peeling numbers, logos, dots) ──────────
  {
    id: 'number-peeling-replacement',
    complaint: "My son's jersey number is peeling off after only a couple of wears, washed on cold and air dried.",
    workflowId: 'damaged_defective',
    inquiryType: 'Decoration Issue', action: 'Evidence + Replacement', fault: 'capelli', fulfillment: 'unknown', status: 'pending',
    requiresEvidencePicture: true,
    note: 'Standard opener: products undergo strict quality checks and we regret it slipped past. Request a clear picture, then advise fulfillment to send a replacement in the SAME size originally ordered.',
  },
  {
    id: 'windbreaker-dots-damaged',
    complaint: 'I received a windbreaker and wore it once; the reflective dots on the shoulder are already damaged.',
    workflowId: 'damaged_defective',
    inquiryType: 'Decoration Issue', action: 'Evidence + Replacement', fault: 'capelli', fulfillment: 'unknown', status: 'pending',
    requiresEvidencePicture: true,
    note: 'Defective non-decoration item also qualifies. Request a picture, then replacement in the same size/form.',
  },
  {
    id: 'bag-ripping-seam',
    complaint: 'We bought my son a backpack and it is already ripping at the seam after a few months; he needs it to last the season.',
    workflowId: 'damaged_defective',
    inquiryType: 'Product Defect', action: 'Evidence + Replacement', fault: 'capelli', fulfillment: 'unknown', status: 'pending',
    requiresEvidencePicture: true,
    escalateTo: 'Dan',
    note: 'Bag/equipment defect. Request pictures; replacement may need internal (DM) approval before the RO is created.',
  },
  {
    id: 'repeat-wrong-decoration',
    complaint: 'You sent the replacement and the design is wrong again — exactly the same defect as before. This is the second time.',
    workflowId: 'damaged_defective',
    inquiryType: 'Decoration Issue', action: 'Escalate', fault: 'capelli', fulfillment: 'unknown', status: 'open',
    escalateTo: 'Dan',
    note: 'A repeat-defect replacement is a red flag — do NOT re-issue the same RO blindly. Escalate to a manager and confirm the corrected artwork before reshipping.',
  },

  // ── Wrong item received ────────────────────────────────────────────────────
  {
    id: 'wrong-size-shipped',
    complaint: 'I ordered a large jersey but you sent me a medium. My order clearly says large — please fix this.',
    workflowId: 'wrong_item_received',
    inquiryType: 'Wrong Item', action: 'Evidence + Replacement', fault: 'capelli', fulfillment: 'unknown', status: 'pending',
    requiresEvidencePicture: true,
    note: 'When WE shipped the wrong size (vs customer ordering wrong), it is our fault. Request a picture of the wrong item, then replace with the correct (ordered) item.',
  },
  {
    id: 'wrong-color-design-shipped',
    complaint: 'I ordered 3 red goalkeeper training shirts and received 3 blue field-player shirts instead.',
    workflowId: 'wrong_item_received',
    inquiryType: 'Wrong Item', action: 'Evidence + Replacement', fault: 'capelli', fulfillment: 'unknown', status: 'pending',
    requiresEvidencePicture: true,
    note: 'Wrong product shipped — request a picture, then replacement of the correct item.',
  },
  {
    id: 'wrong-club-sponsor-logos',
    complaint: 'We received our team kits but the sponsor logos belong to a different club, not ours.',
    workflowId: 'wrong_item_received',
    inquiryType: 'Wrong Item', action: 'Evidence + Escalate', fault: 'capelli', fulfillment: 'unknown', status: 'open',
    escalateTo: 'Dan',
    requiresEvidencePicture: true,
    note: 'Wrong-club decoration is a production error affecting a whole team. Request a clear photo of ALL affected items in one shot, escalate to DM/operations — do not just reship, since the wrong artwork can repeat.',
  },

  // ── Missing item from order ────────────────────────────────────────────────
  {
    id: 'missing-one-item',
    complaint: 'I received my order today but one pair of socks (one item) is missing from it.',
    workflowId: 'missing_item',
    inquiryType: 'Missing Item', action: 'Replacement', fault: 'capelli', fulfillment: 'unknown', status: 'pending',
    note: 'Confirm the exact missing item against the order, then advise fulfillment to ship the missing item to the order address.',
  },
  {
    id: 'missing-hat-from-order',
    complaint: 'I ordered 5 things and only received 4 — the white hat was not in the package. Can you send it?',
    workflowId: 'missing_item',
    inquiryType: 'Missing Item', action: 'Replacement', fault: 'capelli', fulfillment: 'unknown', status: 'pending',
    note: 'Confirm the missing line item and ship it. If the customer later tires of waiting and asks for a refund instead, route to refund_request.',
  },

  // ── Size change / cancel (timing-gated) ────────────────────────────────────
  {
    id: 'size-change-after-processing',
    complaint: 'I just ordered the mandatory kit and want to change all the sizes from medium to small.',
    workflowId: 'order_change',
    inquiryType: 'Order Adjustment', action: 'Conditional', fault: 'none', fulfillment: 'unknown', status: 'pending',
    note: 'If already processing/prepared for shipment: cannot change once it has entered the processing stage. If not yet in production: put on hold and confirm the corrected size before releasing.',
  },
  {
    id: 'too-late-to-change-socks',
    complaint: 'Is it too late to change my sock size to XL? I think the Large will be too small.',
    workflowId: 'order_change',
    inquiryType: 'Order Adjustment', action: 'Conditional', fault: 'none', fulfillment: 'unknown', status: 'pending',
    note: 'Check production status first. Contact the appropriate department; if in processing, advise the change cannot be made.',
  },
  {
    id: 'cancel-entered-by-mistake',
    complaint: 'I entered this order by mistake. Please cancel it.',
    workflowId: 'order_cancellation',
    inquiryType: 'Cancellation', action: 'Cancel + Refund', fault: 'customer', fulfillment: 'unknown', status: 'open',
    escalateTo: 'ROLO',
    note: 'If not yet fulfilled/delivered, cancel on BigCommerce and process refund (24h to process, 3–5 business days to appear). If already processing/shipping, it cannot be cancelled.',
  },
  {
    id: 'cancel-duplicate-credit',
    complaint: 'My son placed an order without our credit being applied; we want to cancel it.',
    workflowId: 'order_cancellation',
    inquiryType: 'Cancellation', action: 'Cancel + Refund', fault: 'customer', fulfillment: 'unknown', status: 'open',
    escalateTo: 'ROLO',
    note: 'Confirm details (e.g., coupon/credit), confirm not fulfilled, then cancel + refund.',
  },

  // ── No exchanges / returns ─────────────────────────────────────────────────
  {
    id: 'too-small-want-exchange',
    complaint: 'The shirt and shorts we received are too small for my daughter — can I exchange them for a larger size?',
    workflowId: 'return_exchange',
    inquiryType: 'Return', action: 'Return Policy', fault: 'customer', fulfillment: 'unknown', status: 'solved',
    note: 'No exchanges. Send the return policy: 30 days, unworn/unwashed with tags, personalized items non-returnable, mandatory-kit items not returnable on their own (but refunded once a new correct-size order is placed). Returns to Capelli Sport Returns, Pittston PA.',
  },
  {
    id: 'kit-too-large-return',
    complaint: 'We just received the order but the size is too large. How do we return and exchange for a smaller size?',
    workflowId: 'return_exchange',
    inquiryType: 'Return', action: 'Return Policy', fault: 'customer', fulfillment: 'unknown', status: 'solved',
    note: 'No exchanges — return for refund and place a new order in the desired size.',
  },

  // ── Replacement size pushback (firm policy) ────────────────────────────────
  {
    id: 'replacement-different-size-request',
    complaint: 'For my approved replacement, can you send a different (bigger) size instead? The original is too big.',
    workflowId: 'replacement_order',
    inquiryType: 'Replacement', action: 'Same Size Only', fault: 'capelli', fulfillment: 'unknown', status: 'open',
    note: 'Per policy, replacements are made ONLY in the same size (and same form) as originally ordered. Politely hold the line; a size change requires a return + new order. Goodwill size swaps are a manager exception, not the default.',
  },

  // ── Refund status / shipping refund / lost order ───────────────────────────
  {
    id: 'refund-status-followup',
    complaint: 'I received a return/refund email weeks ago but still have not seen the refund on my credit card. When will it process?',
    workflowId: 'refund_request',
    inquiryType: 'Refund Status', action: 'Check + Advise', fault: 'none', fulfillment: 'unknown', status: 'open',
    escalateTo: 'ROLO',
    note: 'Refunds take ~24h to process and 3–5 business days to appear, under "Capelli Sport". If overdue, check with the refunds team before promising a date.',
  },
  {
    id: 'shipping-refund-goodwill',
    complaint: 'My order is far past the promised time. If you understand the delay, please at least refund the shipping cost.',
    workflowId: 'refund_request',
    inquiryType: 'Goodwill', action: 'Shipping Refund', fault: 'capelli', fulfillment: 'unknown', status: 'open',
    escalateTo: 'Dan',
    note: 'Shipping-cost refund for excessive delay is a goodwill gesture requiring internal approval. Once approved, advise 24h to process. Own the follow-up — do not loop holding replies.',
  },
  {
    id: 'never-received-season-over',
    complaint: 'It has been about 9 weeks, my order never arrived and the season is over. I want a full refund.',
    workflowId: 'lost_shipment',
    inquiryType: 'Lost / Not Received', action: 'Escalate Refund', fault: 'capelli', fulfillment: 'unknown', status: 'open',
    escalateTo: 'Dan',
    note: 'Severely overdue / never delivered. Do NOT default to reship when the need has passed (season over). Acknowledge the missed prior requests, escalate for a refund/credit decision, and take ownership of the reply rather than re-sending generic holds.',
  },
  {
    id: 'usps-claim-not-received',
    complaint: 'I never received my order; USPS opened an investigation and told me to contact you to resend it.',
    workflowId: 'lost_shipment',
    inquiryType: 'Lost / Not Received', action: 'Escalate', fault: 'none', fulfillment: 'unknown', status: 'open',
    note: 'Confirm the carrier claim, escalate to the appropriate department for reship or refund per policy.',
  },

  // ── Availability / out of stock / restock ──────────────────────────────────
  {
    id: 'item-out-of-stock-restock',
    complaint: 'One of the jerseys I need is out of stock — when will this size be back and available to purchase?',
    workflowId: 'out_of_stock',
    inquiryType: 'Availability', action: 'Replenish', fault: 'none', fulfillment: 'unknown', status: 'pending',
    note: 'Email Planning (RN/RI) to replenish the specific SKU/size; advise the customer once restocked. Do not promise a firm restock date.',
  },
  {
    id: 'preorder-timeline-confusion',
    complaint: 'The item said 3–7 days when I ordered but now I am told it is a pre-order taking 3–6 weeks — that is not what was advertised.',
    workflowId: 'out_of_stock',
    inquiryType: 'Availability', action: 'Explain Timeline', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'Distinguish timelines: stock items 3–7 business days, pre-order 3–6 weeks, mandatory/team kits 5 weeks. Acknowledge the confusion; do not offer expedite.',
  },

  // ── Player number / roster is club-controlled ──────────────────────────────
  {
    id: 'player-number-shows-old',
    complaint: "My son's number changed but the ordering site still shows the old number and I can't change it before paying.",
    workflowId: 'player_link',
    inquiryType: 'Roster', action: 'Refer to Club', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'Player numbers/roster are entered by the club admin, not Capelli. Direct the customer (and ideally CC the club) to have the club update the roster; we cannot change it on our side.',
  },
  {
    id: 'which-team-package',
    complaint: "I don't know my child's jersey number or which team package to pick — where do I find it?",
    workflowId: 'player_link',
    inquiryType: 'Roster', action: 'Refer to Club', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'Ask for player name + club to point them to the right mandatory package, but roster details are club-managed.',
  },

  // ── Add items / individual items / smaller items ───────────────────────────
  {
    id: 'order-smaller-items-only',
    complaint: "I need to order a few smaller items for my son but I don't want to buy the entire mandatory kit.",
    workflowId: 'individual_item_ordering',
    inquiryType: 'Add Items', action: 'Individual Ordering', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: '24h after the full mandatory kit is purchased, log in, choose the kit/player, then "Enable Adding Individual Products" to order single items. Cannot add to an existing order.',
  },
  {
    id: 'add-to-existing-order',
    complaint: 'Can you add an item (or a number) to my existing order? I forgot it.',
    workflowId: 'add_items',
    inquiryType: 'Add Items', action: 'New Order', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'Cannot add to an existing order. Place a new order; as a one-time courtesy advise the new order number so shipping can be refunded.',
  },

  // ── Expedite / deadline ────────────────────────────────────────────────────
  {
    id: 'need-before-game-expedite',
    complaint: 'I ordered for an event coming up and need it sooner — can you expedite or rush the shipping?',
    workflowId: 'expedited_shipping',
    inquiryType: 'Order Status Update', action: 'No Expedite', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'We do not offer expedited shipping; orders are worked in the order received. Quote the correct processing timeline and confirm awaiting fulfillment.',
  },

  // ── Stock-jersey availability inquiry (Shopify/FBPA replica) ────────────────
  {
    id: 'replica-jersey-availability',
    complaint: 'Will you have the third/alternate replica jersey available for sale, and can I add it to my existing order before it ships?',
    workflowId: 'out_of_stock',
    inquiryType: 'Availability', action: 'Explain', fault: 'none', fulfillment: 'FBPA', status: 'solved',
    note: 'Only items currently on the website are available; some sizes are out of stock due to demand. Cannot add to an existing order — a new order is required.',
  },

  // ── Escalation: complaint / manager / review ───────────────────────────────
  {
    id: 'manager-and-review',
    complaint: 'This is unacceptable. I want a phone number for a manager and I will be leaving a review.',
    workflowId: 'escalation',
    inquiryType: 'Complaint', action: 'Escalate', fault: 'capelli', fulfillment: 'unknown', status: 'open',
    escalateTo: 'Dan',
    note: 'Phone support is not offered; only email. For strong complaints/Trustpilot reviews, escalate to a manager — goodwill (replacement/coupon/refund) may be approved as an exception. Acknowledge the specific failure rather than repeating a generic apology.',
  },
];
