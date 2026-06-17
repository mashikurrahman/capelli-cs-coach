/**
 * Labelled scenarios mined from the Capelli Zendesk training video (14 worked
 * tickets). This is the seed dataset for "training the app on the video":
 *  - documents the *correct* handling per real complaint,
 *  - feeds matcher evaluation (top-1 / top-3 accuracy),
 *  - powers Training Mode practice + the QA rubric,
 *  - grounds the intelligent matcher's operating rules.
 *
 * Future training videos append more records here. `workflowId` must be a real
 * id from DEFAULT_WORKFLOWS.
 */

export type Fault = 'customer' | 'capelli' | 'none';
export type Fulfillment = 'FBB' | 'FBPA' | 'unknown';
export type TicketStatus = 'solved' | 'pending' | 'open';

export interface VideoScenario {
  id: string;
  /** Real customer phrasing (lightly cleaned from the transcript). */
  complaint: string;
  /** The workflow the trainer routed this to (id from DEFAULT_WORKFLOWS). */
  workflowId: string;
  inquiryType: string;
  action: string;
  fault: Fault;
  fulfillment: Fulfillment;
  status: TicketStatus;
  /** Internal team to involve, if any. */
  escalateTo?: 'Operations' | 'ROLO' | 'Dan';
  /** Whether the agent must request an evidence picture before acting. */
  requiresEvidencePicture?: boolean;
  /** The key teaching point. */
  note: string;
  /** Approx. timestamp in the source video. */
  timestamp?: string;
}

export const VIDEO_SCENARIOS: VideoScenario[] = [
  {
    id: 'order-status',
    complaint: "I'm inquiring about the status of my order — when will it arrive?",
    workflowId: 'order_status_eta',
    inquiryType: 'Order Status Update', action: 'ETA', fault: 'none', fulfillment: 'FBB', status: 'solved',
    note: 'Check BigCommerce → inbox shipment → UPS; reply with tracking + ETA.', timestamp: '10:38',
  },
  {
    id: 'wrong-item-color',
    complaint: 'My order arrived but you put a red short-sleeve jersey instead of the pink one I ordered.',
    workflowId: 'wrong_item_received',
    inquiryType: 'Wrong Item', action: 'Replacement', fault: 'capelli', fulfillment: 'FBB', status: 'pending',
    requiresEvidencePicture: true,
    note: 'Capelli error — request an evidence picture of the wrong item before acting.', timestamp: '06:30',
  },
  {
    id: 'expedite-late-registration',
    complaint: 'I registered late — can you expedite my order so it arrives sooner?',
    workflowId: 'expedited_shipping',
    inquiryType: 'Order Status Update', action: 'Processing Time', fault: 'none', fulfillment: 'FBPA', status: 'solved',
    note: 'No expedite option. Standard processing is 5 weeks; explain and confirm awaiting fulfillment.', timestamp: '23:59',
  },
  {
    id: 'player-number-change',
    complaint: 'I just ordered the package; the number assigned is 68 but it should be 16. Can you change it?',
    workflowId: 'order_change',
    inquiryType: 'Order Adjustment', action: 'On Hold', fault: 'none', fulfillment: 'FBB', status: 'pending',
    escalateTo: 'Operations',
    note: 'Cannot change number without coach confirmation. Verify not in production, put order on hold (email Ops), ask customer to CC coach.', timestamp: '31:15',
  },
  {
    id: 'duplicate-order-cancel',
    complaint: 'I placed this order twice by mistake — please cancel one, I do not need the second order.',
    workflowId: 'order_cancellation',
    inquiryType: 'Cancellation', action: 'Cancel / Refund', fault: 'customer', fulfillment: 'FBPA', status: 'open',
    escalateTo: 'ROLO',
    note: 'Confirm not in FBB list and not delivered in SAP. Cancel on BC, email ROLO for refund (CC manager + ticket #).', timestamp: '52:00',
  },
  {
    id: 'plain-white-shirt',
    complaint: 'There is no logo or design on the jersey — just a plain white shirt. I want my money back or the correct shirt.',
    workflowId: 'wrong_item_received',
    inquiryType: 'Wrong Item', action: 'Evidence', fault: 'capelli', fulfillment: 'FBPA', status: 'pending',
    requiresEvidencePicture: true,
    note: 'Shopify order = FBPA. Request an evidence picture of the wrong/blank item.', timestamp: '59:12',
  },
  {
    id: 'backpack-missing-number',
    complaint: 'Our backpack does not have the number on it that we paid for — the missing number is 15.',
    workflowId: 'missing_item',
    inquiryType: 'Missing Number', action: 'None', fault: 'customer', fulfillment: 'FBB', status: 'solved',
    note: 'Customer selected "No" for adding the player number at checkout = customer error. No action; they can reorder + return.', timestamp: '61:43',
  },
  {
    id: 'youth-instead-adult',
    complaint: 'I ordered the youth shirt instead of the men’s. I want to exchange it.',
    workflowId: 'return_exchange',
    inquiryType: 'Return', action: 'Return Policy', fault: 'customer', fulfillment: 'FBPA', status: 'solved',
    note: 'No exchanges — send the return policy; customer returns for a refund.', timestamp: '65:30',
  },
  {
    id: 'add-items',
    complaint: 'Can you add additional items to my existing order? I forgot to add them.',
    workflowId: 'add_items',
    inquiryType: 'Add Items', action: 'None', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'We cannot add to an existing order — send the template explaining they must place a new order.', timestamp: '67:27',
  },
  {
    id: 'size-chart',
    complaint: 'Your sizing chart is not accurate — it does not say if it’s soft sizing. Which size should I order?',
    workflowId: 'size_help',
    inquiryType: 'Size Help', action: 'Size Chart', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'Provide the size chart; the team store is found via the club password/app.', timestamp: '71:26',
  },
  {
    id: 'wrong-size-replacement',
    complaint: 'The white short does not match the size of the black short — I ordered both in women’s small.',
    workflowId: 'replacement_order',
    inquiryType: 'Wrong Size', action: 'Replacement', fault: 'capelli', fulfillment: 'FBPA', status: 'open',
    note: 'Create a replacement order on BC, same address; note replacement # next to original in tags; Open + internal note until shipped.', timestamp: '88:00',
  },
  {
    id: 'cannot-checkout',
    complaint: 'I keep adding the kit to my cart but I can’t access my cart or complete my order.',
    workflowId: 'website_issue',
    inquiryType: 'Website', action: 'Processing Time', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'Mandatory-kit items must stay in the cart — removing a required item breaks checkout. If they later ordered, confirm processing time.', timestamp: '95:44',
  },
  {
    id: 'complimentary-hoodie-charged',
    complaint: 'We placed our mandatory kit order but were charged for the complimentary hoodie. Please refund it.',
    workflowId: 'escalation',
    inquiryType: 'General Inquiry', action: 'Internal Department', fault: 'capelli', fulfillment: 'FBB', status: 'open',
    escalateTo: 'Dan',
    note: 'Known club-wide issue — escalate to Dan; reply that the right department is engaged; Open + internal note.', timestamp: '99:08',
  },
  {
    id: 'number-falling-off',
    complaint: 'My son wore his jersey three times and the number is already falling off. Can this be fixed?',
    workflowId: 'damaged_defective',
    inquiryType: 'Decoration Issue', action: 'Evidence', fault: 'capelli', fulfillment: 'FBB', status: 'pending',
    requiresEvidencePicture: true,
    note: 'Decoration/defective — request an evidence picture of the defective item.', timestamp: '106:30',
  },
  {
    id: 'partial-shipment',
    complaint: 'Other girls on my daughter’s team got their jerseys, but ours is held up — can you see which pieces of our order are available and which we’re still waiting on?',
    workflowId: 'partial_shipment',
    inquiryType: 'Order Status Update', action: 'ETA', fault: 'none', fulfillment: 'FBB', status: 'solved',
    note: 'Order held up because an additional piece was added. Find the tracking + ETA in the inbox and reply with the FBB tracking template.', timestamp: '67:27',
  },
  {
    id: 'player-link-club-managed',
    complaint: 'I received the link from another mom for her son, but I need my own player link for my son to order.',
    workflowId: 'player_link',
    inquiryType: 'General Inquiry', action: 'Refer to Club', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'Player links are managed by the club — we cannot create them from outside. Direct the customer to their club administrator.', timestamp: '46:07',
  },
  {
    id: 'team-store-access',
    complaint: 'I can’t get into the team store for Rush Maryland — what’s the password / how do I access it?',
    workflowId: 'team_store_password',
    inquiryType: 'General Inquiry', action: 'Refer to Club', fault: 'none', fulfillment: 'unknown', status: 'solved',
    note: 'Team-store access is club-managed; never share club passwords with customers — direct them to their club administrator.', timestamp: '71:26',
  },
];
