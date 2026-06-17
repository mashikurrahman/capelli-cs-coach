/**
 * Visual guides ("Playbooks") derived from the Capelli Zendesk training video.
 *
 * Each guide is a screenshot-by-screenshot walkthrough of how the team actually
 * handles a ticket type, with the trainer's own words attached. Guides are
 * surfaced *contextually* inside the Ticket Coach (when an agent runs a matching
 * workflow) and browsable in the Guides hub.
 *
 * Screenshots live OUTSIDE /public (in content/guides/<id>/) and are served only
 * to authenticated users via /api/guides/asset — they contain real customer data.
 */

export interface GuideStep {
  n: number;
  title: string;
  /** Clean, imperative instruction for the agent. */
  instruction: string;
  /** Verbatim quote from the trainer (optional). */
  narration?: string;
  /** Image filename within the guide's folder (used as the video poster). */
  image: string;
  /** Short video clip filename within the guide's folder (preferred medium). */
  video?: string;
  /** Approximate timestamp in the source video. */
  timestamp?: string;
}

export interface Guide {
  id: string;
  title: string;
  /** One-line description of the scenario this guide covers. */
  scenario: string;
  /** Short tagline shown on cards. */
  summary: string;
  steps: GuideStep[];
  /** Workflow IDs this guide should appear on (inside the Ticket Coach runner). */
  workflowIds: string[];
}

const ORDER_STATUS_GUIDE: Guide = {
  id: 'order-status',
  title: 'Handle an Order-Status / ETA Ticket',
  scenario: 'A customer asks where their order is or when it will arrive.',
  summary: 'The model end-to-end ticket: duplicates → take it → FBB/FBPA → check BigCommerce, inbox, UPS → reply → set status.',
  workflowIds: ['order_status_eta', 'fbb_tracking', 'tracking_not_moving', 'processing_time'],
  steps: [
    {
      n: 1,
      title: 'Open the ticket and read the request',
      instruction: 'Read what the customer actually wants. Note the three areas: left = the tags/fields you fill, center = the conversation + your reply, right = customer details and their other tickets.',
      narration: 'Here there’s a customer called Johanna. She is inquiring about the status of her order.',
      image: '01-open-ticket.png',
      timestamp: '10:45',
    },
    {
      n: 2,
      title: 'Check for duplicates, then “Take it”',
      instruction: 'Paste the order number into Zendesk Search and scan the right panel for other tickets from the same customer. Merge any duplicates into one ticket, then click “Take it” to claim it.',
      narration: 'First we check if this customer texted us from any other email so we can merge them into one ticket… then we click on “take it” before we start to solve it.',
      image: '02-duplicate-search.png',
      timestamp: '11:20',
    },
    {
      n: 3,
      title: 'Identify fulfillment: FBB or FBPA',
      instruction: 'Open the FBB Orders Excel, Ctrl+F → “Find All” → search within Workbook, paste the order number. Found = FBB (Fulfilled By Bangladesh). Not found = FBPA (Fulfilled By USA). All Shopify / cappellisport.com orders are FBPA.',
      narration: 'We have a specific Excel file called FBB orders. If we find it here, it means the order is FBB.',
      image: '03-fbb-excel.png',
      timestamp: '14:05',
    },
    {
      n: 4,
      title: 'Set the inquiry-type tag',
      instruction: 'In the left field panel, set the inquiry type to match the request — here, “Order Status Update”.',
      narration: 'Since the customer is asking about his order, it’s an order status update… we simply click on it.',
      image: '04-inquiry-tag.png',
      timestamp: '14:38',
    },
    {
      n: 5,
      title: 'Check the order in BigCommerce',
      instruction: 'Paste the order number into BigCommerce and open the order. Review customer/shipping details and the Status (here: “Awaiting Fulfillment”). BigCommerce alone isn’t authoritative — keep checking.',
      narration: 'Here we have the status: awaiting fulfillment. Unfortunately the system is not very accurate, so we check on many platforms.',
      image: '05-bigcommerce.png',
      timestamp: '15:40',
    },
    {
      n: 6,
      title: 'Find the shipment in the email inbox',
      instruction: 'In Outlook, paste the order number to find the shipment email. Shipments arrive numbered (e.g. “shipment 383”) with an Excel listing every order and its tracking number, plus an ETA.',
      narration: 'We go to the inbox and paste the order number… we found an email that contains a shipment. Inside, we find the order and the tracking number.',
      image: '06-inbox-shipment.png',
      timestamp: '16:45',
    },
    {
      n: 7,
      title: 'Copy the tracking number + note the ETA',
      instruction: 'Locate the order’s row, copy its tracking number (highlighted), and note the shipment’s ETA from the email.',
      narration: 'That’s the tracking number assigned to the order… each shipment has an expected time of arrival.',
      image: '07-tracking-number.png',
      timestamp: '17:22',
    },
    {
      n: 8,
      title: 'Verify the status in UPS',
      instruction: 'Paste the tracking number into UPS. “Label Created” means it hasn’t physically shipped yet — UPS will pick it up by the ETA date.',
      narration: 'Here we only have the label created, so the order hasn’t been shipped yet.',
      image: '08-ups-status.png',
      timestamp: '18:30',
    },
    {
      n: 9,
      title: 'Reply with the correct macro',
      instruction: 'Apply the matching macro (here the FBB Tracking template) and fill ONLY the variables: tracking number, order number, UPS link, ETA. Never reword the template.',
      narration: 'In apply macro we have the template of FB tracking… I fill only the tracking number, the order, the link and the expected time of arrival.',
      image: '09-template-reply.png',
      timestamp: '19:35',
    },
    {
      n: 10,
      title: 'Finish the tags (action, club, order #, priority)',
      instruction: 'Set Action = ETA, Club = identified from the item name/logo (here “Seattle United”), paste the order number, Priority = Normal.',
      narration: 'What’s the action here? Expected time of arrival — the ETA… and the club is Seattle United… the priority is normal.',
      image: '10-club-identify.png',
      timestamp: '21:00',
    },
    {
      n: 11,
      title: 'Set the status and submit',
      instruction: 'Solved = fully resolved (tracking + ETA given). Pending = waiting on the customer. Open = waiting on an internal team or a replacement not yet shipped (Open always needs an internal note). Here: Solved. Then log it on the daily recap.',
      narration: 'There’s nothing pending, nothing open, so we submit as the solved ticket.',
      image: '11-solved.png',
      timestamp: '23:35',
    },
  ],
};

const PLAYER_NUMBER_GUIDE: Guide = {
  id: 'player-number-change',
  title: 'Handle a Player Number / Name Change',
  scenario: 'A customer wants to change the player number or name on a placed order.',
  summary: 'Needs coach confirmation: verify the current number, confirm the order isn’t in production, put it on hold (Operations), and set Pending.',
  workflowIds: ['order_change'],
  steps: [
    {
      n: 1,
      title: 'Read the request',
      instruction: 'The customer wants to change their player number (here: assigned 68, wants 16). This is an order adjustment — never an instant edit.',
      narration: 'The customer is requesting to change the number… his current number is now 16.',
      image: '01-read-request.png',
      timestamp: '31:15',
    },
    {
      n: 2,
      title: 'Check for duplicates',
      instruction: 'Copy the order number into Search and scan the right panel for other tickets from the same customer; merge any duplicates.',
      narration: 'We copy the order number, check any duplicates… also we take a look on our right side.',
      image: '02-check-duplicates.png',
      timestamp: '31:33',
    },
    {
      n: 3,
      title: 'Confirm the current number in BigCommerce',
      instruction: 'Open the order in BigCommerce and confirm the player number currently assigned to the line item.',
      narration: 'Let’s check on BC to see the number assigned… this player is 68.',
      image: '03-confirm-number-bc.png',
      timestamp: '32:26',
    },
    {
      n: 4,
      title: 'Apply the rule: coach confirmation required',
      instruction: 'You cannot change a player number from our side without confirmation from the customer’s coach. No confirmation = no adjustment.',
      narration: 'We can’t adjust any player number from our side before having a confirmation from his coach.',
      image: '04-coach-rule.png',
      timestamp: '33:06',
    },
    {
      n: 5,
      title: 'Verify the order isn’t in production',
      instruction: 'Check the email inbox (no tracking), the FBB master list (not found), and SAP (not delivered). If it’s already in production, no change is possible either way.',
      narration: 'We need to check the order is not under production — check the inbox, the FBB master list, and SAP.',
      image: '05-verify-production.png',
      timestamp: '34:25',
    },
    {
      n: 6,
      title: 'Put the order on hold + notify Operations',
      instruction: 'Since it isn’t in production, set the order on hold and email Operations so it isn’t fulfilled before the change is confirmed.',
      narration: 'I will put this order on hold and inform our production/operation team.',
      image: '06-hold-and-ops.png',
      timestamp: '35:43',
    },
    {
      n: 7,
      title: 'Reply: ask the customer to CC their coach',
      instruction: 'Tell the customer we need the coach to confirm the number change, and to CC their coach on the email so we can proceed.',
      narration: 'See your coach for confirmation… once the coach confirms, we proceed.',
      image: '07-reply-cc-coach.png',
      timestamp: '37:50',
    },
    {
      n: 8,
      title: 'Set Pending + send the Operations hold email',
      instruction: 'Set the ticket to Pending (waiting on the customer/coach) and send Operations the hold email with the ticket and order numbers.',
      narration: 'We set the ticket as pending since we’re waiting for confirmation, and send an email to operations to set the order on hold.',
      image: '08-pending-ops-email.png',
      timestamp: '39:06',
    },
  ],
};

const CANCELLATION_GUIDE: Guide = {
  id: 'cancellation-refund',
  title: 'Cancel an Order & Refund (via ROLO)',
  scenario: 'A customer wants to cancel an order (e.g. a duplicate) and get refunded.',
  summary: 'Confirm it isn’t in production (FBB list + SAP), cancel on BigCommerce, email ROLO for the refund, and set Open.',
  workflowIds: ['order_cancellation'],
  steps: [
    {
      n: 1,
      title: 'Read the request',
      instruction: 'The customer placed a duplicate order and wants one cancelled (“I do not need the second order”).',
      narration: 'The customer wants to cancel the order — they put a second order by mistake.',
      image: '01-read-request.png',
      timestamp: '52:52',
    },
    {
      n: 2,
      title: 'Check duplicates + the FBB master list',
      instruction: 'Search the order number for duplicates, then confirm it is NOT on the FBB master list (if it is, it may be in production).',
      narration: 'We make sure that the order number is not available on our master list for FBB.',
      image: '02-dup-and-fbb.png',
      timestamp: '53:09',
    },
    {
      n: 3,
      title: 'Confirm it isn’t delivered in SAP',
      instruction: 'Look the order up in SAP (VA05) and confirm it has not been produced/delivered.',
      narration: 'We should also make sure on SAP that the order is not delivered.',
      image: '03-sap-not-delivered.png',
      timestamp: '54:14',
    },
    {
      n: 4,
      title: 'Decide whether you can cancel',
      instruction: 'Not delivered and not in production → you can cancel. If it appears on the FBB master list, take advice from Operations first.',
      narration: 'Since the order is not delivered and not found on the FBB master list, we can proceed with the cancellation.',
      image: '04-decide-cancel.png',
      timestamp: '55:09',
    },
    {
      n: 5,
      title: 'Cancel on BigCommerce + email ROLO',
      instruction: 'Cancel the order on BigCommerce, then email ROLO to process the refund — always CC the Operations manager and include the ticket number.',
      narration: 'We send an email for ROLO to proceed with the refund… always we should put the ticket number on the email.',
      image: '05-cancel-and-rolo.png',
      timestamp: '55:43',
    },
    {
      n: 6,
      title: 'Reply to the customer',
      instruction: 'Tell the customer the order is cancelled per their request and the refund will go to the original payment method.',
      narration: 'Please be advised the order has been cancelled as per your request. A refund will be issued to the original payment method.',
      image: '06-reply-cancelled.png',
      timestamp: '57:03',
    },
    {
      n: 7,
      title: 'Set the ticket to Open',
      instruction: 'Submit as Open — ROLO still has to process the refund, so the ticket isn’t fully resolved yet.',
      narration: 'We submit the ticket as open since ROLO has to make the refund.',
      image: '07-set-open.png',
      timestamp: '58:12',
    },
  ],
};

const REPLACEMENT_GUIDE: Guide = {
  id: 'wrong-size-replacement',
  title: 'Wrong Size Received → Replacement Order',
  scenario: 'Capelli shipped a mismatched/wrong size and the customer needs the correct one.',
  summary: 'Confirm the order, create a replacement order on BigCommerce to the same address, tag it next to the original, and set Open until it ships.',
  workflowIds: ['replacement_order'],
  steps: [
    {
      n: 1,
      title: 'Read the request',
      instruction: 'The white short doesn’t match the size of the black short, though both were ordered in women’s small.',
      narration: 'The white short doesn’t match the size of the black short — he ordered both in women’s small.',
      image: '01-read-request.png',
      timestamp: '89:31',
    },
    {
      n: 2,
      title: 'Confirm both were ordered the same size',
      instruction: 'Open the order and confirm both items were ordered adult women’s small — so the mismatch is a Capelli error, not a customer error.',
      narration: 'We check on the order if they are really both adult women’s small.',
      image: '02-confirm-size.png',
      timestamp: '90:03',
    },
    {
      n: 3,
      title: 'Create a replacement order on BigCommerce',
      instruction: 'Create a replacement order for the white short — the action is a Replacement.',
      narration: 'We create a replacement order for the white short… the action is a replacement.',
      image: '03-create-replacement.png',
      timestamp: '91:00',
    },
    {
      n: 4,
      title: 'Checkout with the same address',
      instruction: 'Fill out the same shipping address the customer used on the original order, then place the replacement order.',
      narration: 'We fill out the same address the customer used, then place the order.',
      image: '04-checkout-address.png',
      timestamp: '92:00',
    },
    {
      n: 5,
      title: 'Tag the replacement next to the original',
      instruction: 'Record the replacement order number alongside the original order number in the tags.',
      narration: 'We fill out the replacement order next to the original order in the tags.',
      image: '05-tag-replacement.png',
      timestamp: '93:31',
    },
    {
      n: 6,
      title: 'Reply to the customer',
      instruction: 'Apologize and tell them the fulfillment center has been advised to send the replacement; they’ll get a tracking email once it ships.',
      narration: 'We deeply apologize for the issue. We have advised our fulfillment center to send out the replacement as soon as possible.',
      image: '06-reply-replacement.png',
      timestamp: '94:09',
    },
    {
      n: 7,
      title: 'Set Open + add an internal note',
      instruction: 'Submit as Open until the replacement ships. Add an internal note: original order number, club, today’s date, and your initials.',
      narration: 'We submit it as open until the replacement order has been shipped, and add an internal note.',
      image: '07-open-internal-note.png',
      timestamp: '94:45',
    },
  ],
};

const EXPEDITE_GUIDE: Guide = {
  id: 'expedited-shipping',
  title: 'Expedite Request (we don’t expedite)',
  scenario: 'A customer asks to speed up / rush their order.',
  summary: 'There is no expedite option. Confirm the order status, explain the 5-week processing time, and set Solved.',
  workflowIds: ['expedited_shipping'],
  steps: [
    { n: 1, title: 'Read the request', instruction: 'The customer is asking for an expedite option (often due to a late registration).', narration: 'I have a client asking about an expedite option for his order.', image: '01-read-request.png', timestamp: '23:59' },
    { n: 2, title: 'Apply the rule: no expedite', instruction: 'We don’t offer any expedite option. Orders placed from team stores need ~5 weeks to be fulfilled and shipped.', narration: 'We don’t have any expedite option. Orders placed from teams need five weeks to be fulfilled and shipped.', image: '02-no-expedite-rule.png', timestamp: '24:18' },
    { n: 3, title: 'Check for duplicates', instruction: 'Copy the order number into Search and scan the right panel; merge any duplicate tickets.', narration: 'We check if there is any duplicate ticket — copy the order number and paste it in the search box.', image: '03-check-duplicates.png', timestamp: '25:18' },
    { n: 4, title: 'Confirm FBB vs FBPA', instruction: 'Look the order up in the FBB Orders Excel — here it’s not found, so it’s FBPA.', narration: 'We search the order number on our Excel to see if it’s FBB or FBPA — this order is FBPA.', image: '04-fbb-fbpa.png', timestamp: '26:05' },
    { n: 5, title: 'Check BigCommerce, inbox & SAP', instruction: 'Confirm status across BigCommerce, the email inbox, and SAP (VA05). Here the order is new — awaiting fulfillment, not shipped.', narration: 'We check BC, the email inbox and SAP — the order is new, awaiting fulfillment, not shipped.', image: '05-check-systems.png', timestamp: '27:30' },
    { n: 6, title: 'Reply to the customer', instruction: 'Explain the order is awaiting fulfillment, we don’t offer expedite, and processing is ~5 weeks; they’ll get a tracking email once it ships.', narration: 'We tell the customer the order is awaiting fulfillment, we don’t offer expedite, and the processing time is five weeks.', image: '06-reply.png', timestamp: '28:50' },
    { n: 7, title: 'Set Solved', instruction: 'Everything is clarified and nothing is pending — submit as Solved.', narration: 'Everything is clarified, so we submit the ticket as solved.', image: '07-solved.png', timestamp: '30:30' },
  ],
};

const WEBSITE_GUIDE: Guide = {
  id: 'website-checkout',
  title: 'Can’t Access Cart / Complete Checkout',
  scenario: 'A customer can’t add to cart or complete their order on the site.',
  summary: 'Required kit items must stay in the cart. Check the customer’s emails — if they already ordered, confirm processing time and set Solved.',
  workflowIds: ['website_issue'],
  steps: [
    { n: 1, title: 'Read the request', instruction: 'The customer keeps adding the kit to the cart but can’t access the cart or complete the order.', narration: 'I’m trying to order kits for my boys and added them to my cart, but I can’t access my cart or complete my order.', image: '01-read-request.png', timestamp: '95:44' },
    { n: 2, title: 'Apply the rule: mandatory kit', instruction: 'Per the club agreement, required kit items must be purchased — removing a required item from the cart breaks checkout.', narration: 'Per our agreement with the club, the required kit items must be purchased — removing a required item breaks checkout.', image: '02-mandatory-kit-rule.png', timestamp: '96:10' },
    { n: 3, title: 'Check the customer’s emails', instruction: 'Always check the customer’s emails — here we see they placed an order yesterday, so the issue is already resolved.', narration: 'We always check the customer’s emails — here we see they placed an order, so the issue is resolved.', image: '03-check-emails.png', timestamp: '96:40' },
    { n: 4, title: 'Reply with processing time', instruction: 'Confirm the order is placed and awaiting fulfillment with a ~5-week processing time.', narration: 'We’re happy you placed an order; your order is awaiting fulfillment with a five-week processing time.', image: '04-processing-reply.png', timestamp: '97:50' },
    { n: 5, title: 'Set Solved', instruction: 'The order went through — submit as Solved.', narration: 'Issue resolved — submit as solved.', image: '05-solved.png', timestamp: '98:38' },
  ],
};

const ESCALATION_GUIDE: Guide = {
  id: 'complimentary-charged',
  title: 'Complimentary Item Charged → Escalate',
  scenario: 'A club’s complimentary/free item was charged on a mandatory-kit order.',
  summary: 'Known club-wide billing issue — escalate to Dan (internal department), tell the customer the right team is engaged, and set Open.',
  workflowIds: ['escalation'],
  steps: [
    { n: 1, title: 'Read the request', instruction: 'The club (SOCA) has a complimentary hoodie, but customers were charged for it on the mandatory-kit order.', narration: 'This club has a complimentary hoodie, but customers were charged for it when placing the mandatory kit order.', image: '01-read-request.png', timestamp: '99:08' },
    { n: 2, title: 'Forward the case to Dan', instruction: 'Many customers report the same issue — forward the case to Dan to advise how to resolve it.', narration: 'Many customers report the same issue, so we forward this case to Dan.', image: '02-forward-to-dan.png', timestamp: '99:39' },
    { n: 3, title: 'Set the tags', instruction: 'Tags: non-FBB club, general inquiry, internal department.', narration: 'Tags: non-FBB club, general inquiry, internal department.', image: '03-set-tags.png', timestamp: '100:02' },
    { n: 4, title: 'Reply + set Open', instruction: 'Tell the customer the appropriate department has been contacted and you’ll keep them updated; submit as Open with an internal note.', narration: 'We’ve contacted the appropriate department and will keep you updated; submit as open.', image: '04-reply-open.png', timestamp: '100:21' },
    { n: 5, title: 'Email Dan', instruction: 'Email Dan with the details. Once he replies (refund/cancel the hoodie), solve the ticket; until then it stays Open.', narration: 'We email Dan; once he replies we solve it — for now it stays open.', image: '05-email-dan.png', timestamp: '100:45' },
  ],
};

// Each step has a short clip named like its image (01-open-ticket.png → .mp4).
function attachVideos(g: Guide): Guide {
  return {
    ...g,
    steps: g.steps.map((s) => ({ ...s, video: s.video ?? s.image.replace(/\.png$/, '.mp4') })),
  };
}

export const GUIDES: Guide[] = [
  ORDER_STATUS_GUIDE,
  PLAYER_NUMBER_GUIDE,
  CANCELLATION_GUIDE,
  REPLACEMENT_GUIDE,
  EXPEDITE_GUIDE,
  WEBSITE_GUIDE,
  ESCALATION_GUIDE,
].map(attachVideos);

export function getGuide(id: string): Guide | undefined {
  return GUIDES.find((g) => g.id === id);
}

/** Find a guide that applies to a given workflow (shown inside the runner). */
export function getGuideForWorkflow(workflowId: string): Guide | undefined {
  return GUIDES.find((g) => g.workflowIds.includes(workflowId));
}
