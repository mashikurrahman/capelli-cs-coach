/**
 * Capelli Sports official customer-service email templates.
 *
 * Source of truth: "Customer Service Templates by Common Scenarios" (verbatim).
 * Wording is preserved EXACTLY. The only change from the source is that the
 * fill-in blanks (_____, XXXX, $______, (Item), 000000…) have been turned into
 * named [Placeholder] tokens so the UI can render labelled input boxes.
 * DO NOT reword these templates — only add/adjust placeholder tokens.
 *
 * `placeholders` are derived automatically from [Tokens] at seed time.
 */

export interface EmailTemplateDef {
  key: string;
  name: string;
  category: string;
  keywords: string[];
  subject?: string;
  body: string;
}

export const EMAIL_CATEGORIES = [
  'Returns & Exchanges',
  'Cancellations & Refunds',
  'Shipping & Tracking',
  'Processing Time',
  'Out of Stock',
  'Damaged / Defective / Replacement',
  'Ordering Help',
  'Account & Login',
  'Links & Access',
  'Discounts & Promotions',
  'General / Policy',
] as const;

/**
 * Complaint-type buckets — how an agent thinks about a ticket ("wrong item",
 * "where's my order?"). Templates are browsed by these. A single email can serve
 * several complaints (e.g. the evidence-picture request covers wrong item,
 * decoration issue, and damaged), so a template lists all the complaints it fits.
 * Order here is the order shown in the UI.
 */
export const COMPLAINT_CATEGORIES = [
  'Wrong Item',
  'Missing Item',
  'Decoration Issue',
  'Damaged / Defective',
  'Delivery & Tracking',
  'Processing Time / ETA',
  'Out of Stock',
  'Return / Exchange',
  'Cancellation / Refund',
  'Ordering & Sizing Help',
  'Account & Login',
  'Links & Access',
  'Discounts & Promotions',
  'General / Policy',
] as const;

export type ComplaintCategory = typeof COMPLAINT_CATEGORIES[number];

/** template key → the complaint buckets it should appear under. */
export const TEMPLATE_COMPLAINTS: Record<string, ComplaintCategory[]> = {
  // Returns & cancellations
  return_exchange_policy: ['Return / Exchange'],
  cancel_order_bc: ['Cancellation / Refund'],
  cancel_item_bc: ['Cancellation / Refund'],
  refund_shipping_bc: ['Cancellation / Refund'],
  cancel_order_shopify: ['Cancellation / Refund'],
  cancel_item_shopify: ['Cancellation / Refund'],
  // Shipping / delivery / missing
  order_shipped: ['Delivery & Tracking'],
  order_partially_shipped: ['Missing Item', 'Delivery & Tracking'],
  remaining_items_shipped: ['Missing Item', 'Delivery & Tracking'],
  mixed_order_single: ['Missing Item', 'Delivery & Tracking'],
  mixed_order_multiple: ['Missing Item', 'Delivery & Tracking'],
  inform_ship_date: ['Delivery & Tracking', 'Processing Time / ETA'],
  confirm_shipping_address: ['Delivery & Tracking'],
  // Replacements (serve wrong / decoration / damaged) + shipped notice
  replacement_shipped: ['Wrong Item', 'Decoration Issue', 'Damaged / Defective', 'Delivery & Tracking'],
  fbb_tracking_shipped: ['Delivery & Tracking', 'Wrong Item', 'Decoration Issue', 'Damaged / Defective'],
  defective_request_evidence: ['Wrong Item', 'Decoration Issue', 'Damaged / Defective'],
  replacement_notification: ['Wrong Item', 'Decoration Issue', 'Damaged / Defective'],
  // Processing time / ETA
  processing_majority: ['Processing Time / ETA', 'Delivery & Tracking'],
  processing_cscom: ['Processing Time / ETA'],
  processing_referee: ['Processing Time / ETA'],
  processing_real_coast: ['Processing Time / ETA'],
  expedited_shipping: ['Processing Time / ETA'],
  eta_followup: ['Processing Time / ETA', 'Delivery & Tracking'],
  // Out of stock
  oos_basic: ['Out of Stock'],
  oos_cancel_or_wait: ['Out of Stock'],
  oos_alt_size: ['Out of Stock'],
  oos_alt_color: ['Out of Stock'],
  oos_two_options: ['Out of Stock'],
  oos_alt_size_shipped: ['Out of Stock'],
  oos_replenish_to_order: ['Out of Stock'],
  item_replenished: ['Out of Stock'],
  item_not_available: ['Out of Stock'],
  zero_pick: ['Out of Stock'],
  // Ordering & sizing help
  add_items_existing_order: ['Ordering & Sizing Help'],
  size_help_child: ['Ordering & Sizing Help'],
  individual_item: ['Ordering & Sizing Help'],
  individual_item_exempt: ['Ordering & Sizing Help'],
  order_two_players: ['Ordering & Sizing Help'],
  place_order_phone: ['Ordering & Sizing Help'],
  apply_patches: ['Decoration Issue', 'Ordering & Sizing Help'],
  tax_shipping_rates: ['Ordering & Sizing Help'],
  // Account & login
  create_account_individual: ['Account & Login'],
  create_account_link_guest: ['Account & Login'],
  // Links & access
  player_link_in_db: ['Links & Access'],
  player_link_not_in_db: ['Links & Access'],
  club_link: ['Links & Access'],
  international_shipping: ['Links & Access', 'Ordering & Sizing Help'],
  european_clubs: ['Links & Access'],
  // Discounts & promotions
  military_request_proof: ['Discounts & Promotions'],
  military_advise: ['Discounts & Promotions'],
  military_refund: ['Discounts & Promotions', 'Cancellation / Refund'],
  gift_certificate: ['Discounts & Promotions'],
  no_discount_code: ['Discounts & Promotions'],
  // General / policy
  job_opportunity: ['General / Policy'],
  store_hours: ['General / Policy'],
  closing_ticket_followups: ['General / Policy'],
};

/** Complaints for a template key (falls back to General / Policy if unmapped). */
export function complaintsFor(key: string): ComplaintCategory[] {
  return TEMPLATE_COMPLAINTS[key] ?? ['General / Policy'];
}

export const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  // ─── Returns & Exchanges ───────────────────────────────────────────────
  {
    key: 'return_exchange_policy',
    name: 'Return & Exchange Policy',
    category: 'Returns & Exchanges',
    keywords: ['return', 'exchange', 'refund', 'send back', 'wrong size', 'policy'],
    subject: 'Your Return Request',
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please note that we don't do exchanges. Please see our return policy below.

To receive a refund, the item has to be returned back to us within 30 days of receiving your order. Please allow up to two weeks from the time we receive your package for your return and refund to be processed and completed.

Credits will be made to the original form of payment on the order.

Teams.us.capellisport.com is not responsible for refunding shipping costs

The item you are returning must be unworn, unwashed and must still have the price tags.

Personalized products (player's name or number) are not returnable or exchangeable.

Please note that items from the mandatory package are not eligible for return on their own. However, if you place a new order with the correct sizes, we'll be happy to refund the returned items once we receive them.

The information below is required to process your return and needs to be included in your return package. If you ordered more than one item, please highlight or circle the item you are returning on the invoice.

Your name:
Your address:
Your order #:
Reason for return:

Please ship all returns to:
Capelli Sport Returns
901 Sathers Drive
Pittston, PA 18640

You may place your new order for the size needed at any time. At this time, we will go ahead and mark this ticket as solved.

Should you need further assistance, please feel free to reach back out to us.`,
  },

  // ─── Cancellations & Refunds ───────────────────────────────────────────
  {
    key: 'cancel_order_bc',
    name: 'Order Cancelled on BigCommerce',
    category: 'Cancellations & Refunds',
    keywords: ['cancel', 'cancelled order', 'refund', 'bigcommerce', 'bc'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We have processed a refund of $[Refund Amount] back to the card you used on your order number #[Order Number].

Please allow 3 to 5 business days for the money to show back into your account under the CAPELLI SPORT.

We thank you for your patience, understanding, and business.

Have a great day!

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'cancel_item_bc',
    name: 'Item(s) Cancelled on BigCommerce',
    category: 'Cancellations & Refunds',
    keywords: ['cancel item', 'partial cancel', 'refund', 'bigcommerce', 'bc'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We've refunded $[Refund Amount] back to the card used to place your order #[Order Number]. Kindly allow 3 to 5 business days for the money to show in your account under the name CAPELLI SPORT.

[Item]

We thank you for your patience, understanding, and business.
You will receive an email with the tracking information as soon as your order has been shipped.

Have a great day!`,
  },
  {
    key: 'refund_shipping_bc',
    name: 'Shipping Cost Refunded on BigCommerce',
    category: 'Cancellations & Refunds',
    keywords: ['refund shipping', 'shipping cost', 'bigcommerce', 'bc'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We've refunded $[Refund Amount] for the shipping back to the card used to place your order #[Order Number]. Kindly allow 3 to 5 business days for the money to show in your account under the name CAPELLI SPORT.

We thank you for your patience, understanding, and business.
You will receive an email with the tracking information as soon as your order has been shipped.

Have a great day!`,
  },
  {
    key: 'cancel_order_shopify',
    name: 'Order Cancelled on Shopify',
    category: 'Cancellations & Refunds',
    keywords: ['cancel', 'cancelled order', 'refund', 'shopify'],
    body: `Good Morning,

Thank you for contacting Capelli Sport Customer Service.

As per your request, we have gone ahead and cancelled your O#[Order Number].

We've refunded $[Refund Amount] back to the card used to place your order.

Kindly allow up to two weeks for the refunded amount to reflect in your account under the name CAPELLI SPORT.

You may place your new order at any time.

We appreciate your business and patience.

If you have any additional questions, please feel free to respond to this email.`,
  },
  {
    key: 'cancel_item_shopify',
    name: 'Item Cancelled on Shopify',
    category: 'Cancellations & Refunds',
    keywords: ['cancel item', 'refund', 'shopify'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

we have gone ahead and cancelled your [Item] from Your O#[Order Number].

We've refunded $[Refund Amount] back to the Card used to place your order.

Kindly allow up to two weeks for the refunded amount to reflect in your account under the name CAPELLI SPORT.

We appreciate your business and patience.

You will receive an email with the USPS tracking information as soon as your order ships.

If you have any additional questions, please feel free to respond to this email.`,
  },

  // ─── Shipping & Tracking ───────────────────────────────────────────────
  {
    key: 'replacement_shipped',
    name: 'Replacement Order Shipped',
    category: 'Shipping & Tracking',
    keywords: ['replacement', 'shipped', 'tracking'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We have good news! Your replacement order has shipped. Your tracking number is [Tracking Number]

Please kindly allow some time for the tracking history to update.

Your business is greatly appreciated!

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'order_shipped',
    name: 'Order Shipped',
    category: 'Shipping & Tracking',
    keywords: ['shipped', 'tracking', 'order shipped'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We deeply apologize for the delay!

We have good news! Your order has been shipped! Your tracking number is [Tracking Number].

Please allow some time for the tracking history to update.

Your business is greatly appreciated!

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'order_partially_shipped',
    name: 'Order Partially Shipped',
    category: 'Shipping & Tracking',
    keywords: ['partial', 'partially shipped', 'tracking'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We deeply apologize for the delay!

We have good news! Your Order has partially shipped! Your tracking number is [Tracking Number].

Please allow some time for the tracking history to update.

Your business is greatly appreciated!

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'remaining_items_shipped',
    name: 'Remaining Items Shipped',
    category: 'Shipping & Tracking',
    keywords: ['remaining items', 'shipped', 'tracking'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We deeply apologize for the delay!

We have good news! Your remaining items has been shipped! Your tracking number is [Tracking Number].

Please allow some time for the tracking history to update.

Your business is greatly appreciated!

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'fbb_tracking_shipped',
    name: 'Order / Replacement Shipped (FBB Tracking)',
    category: 'Shipping & Tracking',
    keywords: ['fbb', 'ups', 'tracking', 'transit'],
    body: `Good afternoon/Good morning,

We are pleased to inform you that your order #[Order Number] / replacement has departed from our warehouse and is currently in transit to UPS for final delivery.

Your UPS tracking number is: [Tracking Number]

You may use this tracking number to monitor the progress of your shipment via [UPS Tracking Link], once the package has been received and scanned by UPS.

Please note that while your tracking number has been generated, it may not display movement until UPS takes possession of the package and completes the initial scan.

UPS is expected to receive the package by [Date or Timeframe].

If the tracking information has not updated within 2–3 business days after the expected delivery to UPS, please do not hesitate to contact us for assistance.

We sincerely appreciate your understanding as your order moves through this stage of transit.

Should you have any questions or require further assistance, please feel free to reach back out to us.

We thank you for your business!`,
  },
  {
    key: 'inform_ship_date',
    name: 'Informing Customer of Item / Order Ship Date',
    category: 'Shipping & Tracking',
    keywords: ['ship date', 'delay', 'when ship', 'expected'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We sincerely apologize for the extended delay and any inconvenience this may have caused.

We understand your disappointment. Your order / item is expected to be shipped [Ship Date].

Once your order has been shipped, you will receive an email with the USPS tracking number.

We truly appreciate your business and patience.

Should you need further assistance, you can reply back to this email to reopen this ticket at any time.`,
  },
  {
    key: 'mixed_order_single',
    name: 'Mixed Order — Single Order',
    category: 'Shipping & Tracking',
    keywords: ['mixed order', 'two shipments', 'separate shipments'],
    body: `Good morning/Afternoon,

Thank you for ordering from Capelli Sport!

We wanted to let you know that your order #[Order Number] will be arriving in two separate shipments.

You will receive two emails with tracking info — one for each package — as soon as each shipment is on its way. The first part of your order will ship out shortly, and the second part will follow in the next shipment.

If you have any questions in the meantime, feel free to reach out — we're happy to help!`,
  },
  {
    key: 'mixed_order_multiple',
    name: 'Mixed Order — Multiple Orders',
    category: 'Shipping & Tracking',
    keywords: ['mixed order', 'multiple orders', 'two shipments'],
    body: `Good morning/Afternoon,

Thank you for ordering from Capelli Sport!

We wanted to let you know that each of your orders ([Order Numbers]) will be shipped in two separate shipments. You will receive two emails with two tracking info per order — one for each package — as soon as each shipment is on its way.

The first part of each order will ship out shortly, and the second part will follow in the next shipment.

If you have any questions in the meantime, feel free to reach out — we're happy to help!`,
  },
  {
    key: 'confirm_shipping_address',
    name: 'Confirm Shipping Address (Returned to Sender)',
    category: 'Shipping & Tracking',
    keywords: ['returned to sender', 'address', 'insufficient address', 'reship'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We are reaching out to you in regards to your order number [Order Number].

Our fulfillment center has advised that your order was returned back to us due to ([Return Reason]).

The address we currently have on file is:
[Customer Address]

Please advise if this is the correct shipping address, so we may reship your order.`,
  },

  // ─── Processing Time ───────────────────────────────────────────────────
  {
    key: 'processing_majority',
    name: 'Processing Time — Majority of Orders',
    category: 'Processing Time',
    keywords: ['processing time', 'awaiting fulfillment', 'how long', '5 weeks'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Kindly note that your order number [Order Number] placed on [Order Date] is currently "Awaiting Fulfillment".

Please note that we do not offer expedited shipping. Our fulfillment center currently recommends a processing time of 5 weeks and work on orders in the order they are received.

Kindly allow 1–3 business days for standard shipping. You will receive an email with the tracking number as soon as your order has been shipped.

We thank you for your business and patience and understanding.

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'processing_cscom',
    name: 'Processing Time — CS.COM',
    category: 'Processing Time',
    keywords: ['processing time', 'cs.com', 'awaiting fulfillment'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Kindly note that your order number [Order Number] placed on [Order Date] is currently "Awaiting Fulfillment".

Please note that we do not offer expedited shipping. Our fulfillment center currently recommends a processing time of 3 – 4 business days and processes orders in the order they are received.

Kindly allow 1-3 business days for shipping via USPS standard shipping. You will receive an E-Mail with the USPS tracking number as soon as your order has been shipped.

We thank you for your business and patience and understanding.

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'processing_referee',
    name: 'Processing Time — Referee Clubs',
    category: 'Processing Time',
    keywords: ['processing time', 'referee', 'awaiting fulfillment'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Kindly note that your order number [Order Number] placed on [Order Date] is currently "Awaiting Fulfillment".

Please note that we do not offer expedited shipping. Our fulfillment center currently recommends a processing time of 5–10 business days and processes orders in the order they are received.

Kindly allow 1–3 business days for standard shipping. You will receive an email with the tracking number as soon as your order has been shipped.

We thank you for your business and patience and understanding.

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'processing_real_coast',
    name: 'Processing Time — Real Coast FA',
    category: 'Processing Time',
    keywords: ['processing time', 'real coast', 'awaiting fulfillment'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Kindly note that your order number [Order Number] placed on [Order Date] is currently "Awaiting Fulfillment".

Please note that we do not offer expedited shipping. Our fulfillment center currently recommends a processing time of 2 Weeks and processes orders in the order they are received.

Kindly allow 1–3 business days for standard shipping. You will receive an email with the tracking number as soon as your order has been shipped.

We thank you for your business and patience and understanding.

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'expedited_shipping',
    name: 'Customer Needing Expedited Shipping',
    category: 'Processing Time',
    keywords: ['expedited', 'rush', 'faster shipping', 'urgent'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please note that we do not offer expedited shipping. Our fulfillment center currently recommends a processing time of [Processing Time]. We process orders sequentially to ensure accuracy and quality control.

Kindly allow 1-3 business days for shipping via USPS standard shipping. You will receive an E-Mail with the USPS tracking number as soon as your order has been shipped.

Should you require further assistance, please feel free to reach back out to us.`,
  },
  {
    key: 'eta_followup',
    name: 'ETA — Checking with Fulfillment',
    category: 'Processing Time',
    keywords: ['eta', 'update', 'when', 'delay', 'status'],
    body: `Good Morning,

Thank you for contacting Capelli Sport Customer Service.

We understand your concern, and we apologize for the delay.

We are currently checking with our fulfillment center and will provide you with an update on your order number [Order Number] within the next 2-3 business days.

Your patience and understanding is greatly appreciated.`,
  },

  // ─── Out of Stock ──────────────────────────────────────────────────────
  {
    key: 'oos_basic',
    name: 'Item Out of Stock',
    category: 'Out of Stock',
    keywords: ['out of stock', 'oos', 'unavailable'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We are reaching out to you in regards to the [Item] from your order number [Order Number]. Unfortunately, the [Item] is currently out of stock. We do apologize for the inconvenience and thank you greatly for your continued patience, understanding, and business.

Kindly advise as soon as possible if you would like for us to cancel this item and process a refund, or if you would like to wait until the item is able to be shipped [Timeframe].`,
  },
  {
    key: 'oos_cancel_or_wait',
    name: 'Out of Stock — Cancel or Wait',
    category: 'Out of Stock',
    keywords: ['out of stock', 'cancel or wait', 'refund'],
    body: `Good morning/ Afternoon,

We are reaching out from Capelli Sport Customer Service.

We are reaching out to you regarding the [Item] from your order number [Order Number]. Unfortunately, the item is currently out of stock. We do apologize for the inconvenience and thank you greatly for your continued patience, understanding, and business.

Kindly advise as soon as possible if you would like for us to cancel this item and process a refund, or if you would like to wait until the item is able to be shipped [Timeframe].`,
  },
  {
    key: 'oos_alt_size',
    name: 'Out of Stock — Offer Alternative Size',
    category: 'Out of Stock',
    keywords: ['out of stock', 'alternative size', 'different size'],
    body: `Good morning/ Afternoon,

We are reaching out from Capelli Sport Customer Service.

We regret to inform you that the item with size [Size] from your order [Order Number] is currently out of stock, and unfortunately, we do not have an estimated date for its replenishment.

[Item]

To address this issue promptly, we can offer the same item in an alternative Size [Alternative Size].

Please let us know if you would like us to proceed with shipping the alternative item, so we can assist you promptly!`,
  },
  {
    key: 'oos_alt_color',
    name: 'Out of Stock — Offer Alternative Color',
    category: 'Out of Stock',
    keywords: ['out of stock', 'alternative color', 'different color'],
    body: `Good morning/ Afternoon,

We are reaching out from Capelli Sport Customer Service.

We regret to inform you that the item with Color [Color] from your order [Order Number] is currently out of stock, and unfortunately, we do not have an estimated date for its replenishment.

[Item]

To address this issue promptly, we can offer the same item and size but in an alternative Color [Alternative Color].

Please let us know if you would like us to proceed with shipping the alternative item, so we can assist you promptly!`,
  },
  {
    key: 'oos_two_options',
    name: 'Out of Stock — Offer Two Options',
    category: 'Out of Stock',
    keywords: ['out of stock', 'two options', 'alternative or refund'],
    body: `Good morning/ Afternoon,

We are reaching out from Capelli Sport Customer Service.

We regret to inform you that the item with size [Size] from your order [Order Number] is currently out of stock, and unfortunately, we do not have an estimated date for its replenishment.

[Item]

To assist you further, we have two options available, and we kindly request your response to proceed with fulfilling your order:

Option 1: We can offer the same item but in Alternative size [Alternative Size] / same size but with alternative item [Alternative Item].
Option 2: We can cancel your item and issue a refund.

Please let us know how you would like to proceed.

Thank you for your understanding, and we look forward to your response`,
  },
  {
    key: 'oos_alt_size_shipped',
    name: 'Out of Stock — Alternative Size Shipped',
    category: 'Out of Stock',
    keywords: ['out of stock', 'alternative size shipped', 'immediate shipment'],
    body: `Good morning/ Afternoon,

We are reaching out from Capelli Sport Customer Service.

We regret to inform you that the item with size [Size] from your order [Order Number] is currently out of stock, and unfortunately, we do not have an estimated date for its replenishment.

[Item]

We have shipped the same item in an alternative size, [Alternative Size], for immediate shipment.

We apologize for any inconvenience this may have caused. We value your business and hope to find a satisfactory solution for you.`,
  },
  {
    key: 'oos_replenish_to_order',
    name: 'Replenish Out of Stock Item to Place Order',
    category: 'Out of Stock',
    keywords: ['out of stock', 'replenish', 'restock', 'place order'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We sincerely apologize for the inconvenience.

Please note that we have contacted the appropriate department regarding the availability of the [Item] which is currently out of stock in size [Size].

We apologize for the difficulty this may have caused. Once the item is restocked, we will provide you with an update.

We thank you for your business, patience and understanding.`,
  },
  {
    key: 'item_replenished',
    name: 'Item Has Been Replenished',
    category: 'Out of Stock',
    keywords: ['replenished', 'back in stock', 'restocked'],
    body: `Good morning/ Afternoon,

We have good news for you! The [Item] in [Size, Color] has been replenished.

You may place your order at any time.

We thank you for your business and patience.

Should you require further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'item_not_available',
    name: 'Item Not Available (No Restock)',
    category: 'Out of Stock',
    keywords: ['not available', 'discontinued', 'will not be replenished'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please be advised that we currently do not have any more stock of this [Item] available, and it will not be replenished.

We recommend exploring our other available products, which may offer similar features or styles that you'll love.

Once again, we apologize for any inconvenience this may cause and appreciate your understanding.

If you have any further questions or need assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'zero_pick',
    name: 'Zero Pick (Out of Stock + Refund / Coupon)',
    category: 'Out of Stock',
    keywords: ['zero pick', 'out of stock', 'coupon', 'refund'],
    body: `Good morning/Afternoon,

Thank you for ordering from Capelli Sport.

Unfortunately, the [Item] is currently out of stock. We apologize for any inconvenience and frustration.

As a token of our appreciation, we have issued you a one-time use coupon code for a 15% discount on https://capellisport.com/
Code: [Coupon Code] (Coupon Expires [Expiration Date])

We have gone ahead and cancelled the item and refunded you.
We have processed a refund of $[Refund Amount] + tax, back to the card you used on your order number #[Order Number].
Please allow 3 to 5 business days for the money to show back into your account under the name Capelli Sport.

OR

We have gone ahead and cancelled the item from your order and refunded you via coupon code for the same value.
Please use code [Coupon Code] to order any item at your convenience.

If you have any additional questions, please reach out by responding to this email.
Have a great day!`,
  },

  // ─── Damaged / Defective / Replacement ─────────────────────────────────
  {
    key: 'defective_request_evidence',
    name: 'Defective / Wrong Product (Request Evidence Picture)',
    category: 'Damaged / Defective / Replacement',
    keywords: ['defective', 'damaged', 'wrong product', 'evidence', 'picture', 'photo'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We are sorry to hear that the [Product Name] is defective. Our products undergo a strict line of quality checks before they are shipped, and we greatly regret that your product slipped past our quality measures. We understand your disappointment, and we do apologize for the inconvenience this may have caused.

For our records and to better assist you, kindly submit clear pictures of the defective item / Showing the size tag.`,
  },
  {
    key: 'replacement_notification',
    name: 'Replacement Being Sent',
    category: 'Damaged / Defective / Replacement',
    keywords: ['replacement', 'reship', 'send out replacement'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

we do apologize for the inconvenience this may have caused.

We have advised our fulfillment center to send out a replacement as soon as possible.

We will ship:
[Items to Ship]

To the below Address:
[Shipping Address]

Once your order has been shipped, you will receive an email with the tracking number

We appreciate your business and patience.`,
  },

  // ─── Ordering Help ─────────────────────────────────────────────────────
  {
    key: 'add_items_existing_order',
    name: 'Customer Trying to Add Items to Existing Order',
    category: 'Ordering Help',
    keywords: ['add item', 'add to order', 'existing order', 'courtesy'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Unfortunately, we are unable to add items to existing orders. We apologize for any difficulty.

However, as a one-time courtesy, please kindly respond to this E-Mail with your new order number included the [Product Name] so that we may refund your shipping.

Your business is greatly appreciated!`,
  },
  {
    key: 'size_help_child',
    name: 'Customer Asking What Size to Order for Their Child',
    category: 'Ordering Help',
    keywords: ['size', 'size chart', 'what size', 'child', 'fit'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

To access the size chart, simply click on the picture of the item you are interested in. Once you've clicked on the image, scroll down to find the size chart, which will be the last picture in the gallery.

Kindly refer to the example below:

Thank you for your understanding and continued support. Your satisfaction is important to us, and we appreciate your business.

Should you need further assistance, please feel free to reach back out to us.`,
  },
  {
    key: 'individual_item',
    name: 'Individual Item Ordering',
    category: 'Ordering Help',
    keywords: ['individual item', 'add individual', 'order individual', 'enable adding'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Unfortunately, our system does not currently support the ability to place a new order directly from a previous order.

Please note that in order to place an order for individual items, you must be signed in to https://teams.us.capellisport.com using the same email [Customer Email] you used for your previous order, and you should use a PC or Mac when placing your order.

Once logged in, select your club from the main menu and use your club password to log in. Next, choose the required kit for your child from the left-hand side menu, then choose a player name and team from the drop-down menus.

At the bottom of the page, please select the "Enable Adding Individual Products" button. This will enable the "Add This to Cart" button under each product, allowing you to order additional items that are needed.

You may place your order at any time.

We thank you for your business!
Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'individual_item_exempt',
    name: 'Individual Item (After Adding Email to Exempt List)',
    category: 'Ordering Help',
    keywords: ['individual item', 'exemption', 'exempt list'],
    body: `Good morning/ Afternoon,

Thank you for your patience!

Unfortunately, our system does not currently support the ability to place a new order directly from a previous order.

Kindly note that your email [Customer Email] has been added to the exemption list.

Please allow some time for the system to update, and make sure to use a PC or Mac when placing your order.

To place an order for individual items, please follow these steps:
1. Sign in to your Capelli Sport account using the email [Customer Email].
2. Choose your club from the main menu and log in with your club password.
3. Select the kit for your child from the left-hand side menu.
4. Make sure to fill the quantities.
5. At the bottom of the page, click on the "Enable Adding Individual Products" button.
6. This will activate the "Add This to Cart" button under each product, allowing you to order additional items.

We thank you for your business!
Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'order_two_players',
    name: 'Order for 2 Players',
    category: 'Ordering Help',
    keywords: ['two players', '2 players', 'multiple players', 'two kits'],
    body: `Good morning,

Thank you for contacting Capelli Sport Customer Service.

After logging in to your account, please select the kit needed from the menu on the left then you can choose the required kit for the first player and select a Team and Player Name from the drop-down menus.

Please note that after adding the kit needed for the player, please select the proceed to cart button at the bottom of the page, this will not take you to check out, this will only add the items to cart.

To add another kit, kindly select the other kit needed from the menu on the left, change the name and team from the drop-down lists and add the items needed. You can access the cart from the top of the page to check out.

We hope that this information is helpful!

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'place_order_phone',
    name: 'Place Order Directly from Phone',
    category: 'Ordering Help',
    keywords: ['phone', 'mobile', 'cart button', 'checkout on phone'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We have tested placing an order on a mobile device through your team shop.

If the phone is held vertically, the cart option at the top of the page does not display the CART button. If you turn your phone horizontally and scroll to the top, you should see CART and the number of items in your cart at the top right of the page. Pressing CART will take you to your cart to start the checkout process.

If you are still unable to process the order, please reply with your phone number, and we will be happy to give you a call to assist with placing the order.

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'apply_patches',
    name: 'Apply Patches on Jersey',
    category: 'Ordering Help',
    keywords: ['patch', 'patches', 'iron', 'heat press', 'apply patch'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please note that applying the patches can be tricky. Using a standard iron at home is not recommended. If you do not have access to an industrial heat press or a location with one, you should test the patch, wash it, and see how it adheres.

These patches should be applied at 315–320°F (highest setting) for 10–15 seconds with medium pressure, just to set the patch. Then, the garment should be carefully turned inside out and pressed again for 20–25 seconds so that the heat reaches the patch from the back side.

The patches can be ironed on at home. Simply put a piece of plastic or cloth between the logo and the iron.

We thank you for your business!
Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'tax_shipping_rates',
    name: 'Tax & Shipping Rates on Order',
    category: 'Ordering Help',
    keywords: ['tax', 'shipping cost', 'shipping rate', 'how much shipping'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please note that the tax is calculated automatically by our ordering application.
The shipping cost for orders is based on the order subtotal, as follows:

Orders Value Total — New Shipping Rate
Up to $50 — $7.99
$50.01-$75.00 — $8.99
$75.01-$100.00 — $9.99
$100.01-$150.00 — $11.99
$150.01-$200.00 — $13.99
$200.01-$250.00 — $14.99
$250.01-$350.00 — $18.99
$350.01-$500.00 — $22.99
$500.01-$1,000.00 — $35.00
$1000.01 & up — $50.00

Should you need further assistance, feel free to reach back out to us.`,
  },

  // ─── Account & Login ───────────────────────────────────────────────────
  {
    key: 'create_account_individual',
    name: 'Create Account to Place Individual Item',
    category: 'Account & Login',
    keywords: ['create account', 'no account', 'individual item', 'guest'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

According to our records, a new account for this website has not yet been created. Since an account does not exist, you will not be able to view your order status or place individual items.

We see that your order number [Order Number], placed on [Order Date], was checked out as a guest because an account was not created at that time.

Please create an account at your earliest convenience by visiting: https://teams.us.capellisport.com/login.php?action=create_account

Once your account has been created, we will be happy to link your order to it so that you can place a new order for individual items.

Kindly reply to this email to confirm that your account has been created, so we may further assist you.`,
  },
  {
    key: 'create_account_link_guest',
    name: 'Create Account to Link Order (Guest Order)',
    category: 'Account & Login',
    keywords: ['create account', 'guest order', 'link order'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

According to our records, an account for this website has not yet been created.

Please create an account at your earliest convenience by visiting: https://teams.us.capellisport.com/login.php?action=create_account

Once your account has been created, we will be able to link your order to it.

Kindly reply to this email to confirm that your account has been created, so we may further assist you.`,
  },

  // ─── Links & Access ────────────────────────────────────────────────────
  {
    key: 'player_link_in_db',
    name: 'Player Link (Link in Database)',
    category: 'Links & Access',
    keywords: ['player link', 'roster', 'child link'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please note that we have included the player link below for your convenience.

[Child Name] #: [Player Link]

You may place your order at any time.

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'player_link_not_in_db',
    name: 'Player Link (Not in Database — Roster Info)',
    category: 'Links & Access',
    keywords: ['player link', 'not in database', 'roster', 'coach', 'club admin'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please contact your coach or club admin to ensure that your child's name and email are added to the correct player roster, so we can place your order directly with the correct player number.

you may place your order at any time.

Should you need further assistance, you can reply back to this email to reopen this ticket at any time.`,
  },
  {
    key: 'club_link',
    name: 'Customer Asking for Club Link',
    category: 'Links & Access',
    keywords: ['club link', 'team shop', 'store link'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please note that we have included the link to [Club Name] club team shop below for your convenience.

[Club Link]

Your business is greatly appreciated!

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'international_shipping',
    name: 'International Shipping',
    category: 'Links & Access',
    keywords: ['international', 'shipping abroad', 'paypal', 'customs', 'duty'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Kindly place your order [Order Details] through the link below.
[Club Link]

You may add the address and the country in which you reside once you proceed to check-out. Please note that you are responsible for any custom duty fees associated with this purchase and that you must have a PayPal account to complete your order.

Should you require further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'european_clubs',
    name: 'European Clubs',
    category: 'Links & Access',
    keywords: ['european', 'europe', 'eu', 'fanshop'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please find the link below for the European clubs:
https://capellisport.eu/product-category/fanshop/

For any order inquiries, please contact the EU Customer Service team at customerservice@capellisport.co.uk.`,
  },

  // ─── Discounts & Promotions ────────────────────────────────────────────
  {
    key: 'military_request_proof',
    name: 'Military Discount — Request Proof',
    category: 'Discounts & Promotions',
    keywords: ['military', 'veteran', 'discount', 'proof'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please reply to this email with a photo of your military health/insurance card, Veterans ID Card, or the Veterans designation on your driver's license.

Once received, we will get back to you regarding the next steps.`,
  },
  {
    key: 'military_advise',
    name: 'Military Discount — Advise',
    category: 'Discounts & Promotions',
    keywords: ['military', 'veteran', 'discount', '10%'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Kindly note that the military discount is 10% off on your first order.

Please allow 3 to 5 business days for the funds to appear back in your account.

Thank you for your business!`,
  },
  {
    key: 'military_refund',
    name: 'Military Discount — Refund Issued',
    category: 'Discounts & Promotions',
    keywords: ['military', 'veteran', 'discount', 'refund'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

We have processed a refund of $[Refund Amount] for the military discount, back to the card you used on your order number [Order Number].

Please allow 3 to 5 business days for the money to show back into your account.

Please note that the refund will appear as "CAPELLI SPORT" on your statement.

Should you need further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'gift_certificate',
    name: 'Gift Certificate',
    category: 'Discounts & Promotions',
    keywords: ['gift certificate', 'gift card', 'redeem', 'code'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please note that you can redeem your $[Gift Amount] gift certificate – [Gift Code] – for club items at teams.capellisport.com. In addition, this gift certificate can also be used to purchase Capelli Sport equipment and fitness products through the following links below -
https://teams.capellisport.com/CSEQP
https://teams.capellisport.com/CSFIT/

Should you require further assistance, please don't hesitate to contact us.`,
  },
  {
    key: 'no_discount_code',
    name: 'No Discount Code / Newsletter Sign-up',
    category: 'Discounts & Promotions',
    keywords: ['discount code', 'promo', 'coupon', 'newsletter', 'no discount'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Unfortunately, we are not offering any discounts or promotions at the moment. We greatly appreciate your understanding and business.

However, if you sign up for our newsletter, you'll be the first to know about any upcoming promotions and discounts for your club.

Your patience and understanding are greatly appreciated.`,
  },

  // ─── General / Policy ──────────────────────────────────────────────────
  {
    key: 'job_opportunity',
    name: 'Job Opportunity Inquiry',
    category: 'General / Policy',
    keywords: ['job', 'career', 'hiring', 'resume', 'opportunity'],
    body: `Good morning/ Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Please send your resume to opportunities@capellisport.com for consideration.

Best of luck.`,
  },
  {
    key: 'store_hours',
    name: 'Store Hours (Outlet)',
    category: 'General / Policy',
    keywords: ['store hours', 'open', 'outlet', 'store time'],
    body: `Good morning/Afternoon,

Thank you for contacting Capelli Sport Customer Service.

Kindly note that the store is open Thursday- Friday: 10am-7pm and Saturday: 9am-5pm.

Since this is an outlet store, we cannot guarantee that items and sizes needed will be available.

We thank you for your business and patience.

Should you require further assistance, please feel free to reach back out to us.`,
  },
  {
    key: 'closing_ticket_followups',
    name: 'Closing a Ticket After Multiple Follow-ups',
    category: 'General / Policy',
    keywords: ['closing ticket', 'no response', 'follow up', 'multiple attempts'],
    body: `Good morning,

We are reaching out to you in regards to your email. We have contacted you on multiple occasions without a response. We will now go ahead and close this ticket.

Should you require further assistance, please feel free to reply to this E-Mail to reopen the ticket so that we may assist you promptly.

Please note that if we do not receive a response, this item will be cancelled from your order.`,
  },
];
