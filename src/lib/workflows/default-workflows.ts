// Default Capelli Sports CS Workflows
// These are pre-built based on the spec. Once training documents are uploaded,
// the AI will use the uploaded materials as the source of truth and may override.

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  category: string;
  triggerPhrases: string[];
  whenToUse: string[];
  doNotUseWhen: string[];
  requiredInfo: string[];
  systemChecks: string[];
  steps: { stepNumber: number; title: string; description: string; agentAction?: string; warning?: string; isRequired: boolean }[];
  customerEmailTemplate: string;
  internalNoteTemplate: string;
  preSendChecklist: { key: string; label: string; isRequired: boolean; warning?: string }[];
  zendeskTags: { tagName: string; tagCategory: string; isRequired: boolean }[];
  ticketStatus: string;
  ticketPriority: string;
  escalationRules: { triggerReason: string; escalateTo?: string; details: string }[];
  commonMistakes: string[];
  doRules: string[];
  dontRules: string[];
  sourceNote: string;
  sortOrder: number;
}

export const DEFAULT_WORKFLOWS: WorkflowDefinition[] = [
  // ─── 1. Return / Exchange ─────────────────────────────────────────────────
  {
    workflowId: 'return_exchange',
    name: 'Return / Exchange Workflow',
    category: 'RETURN_EXCHANGE',
    triggerPhrases: ['return', 'exchange', 'send back', 'refund', 'wrong size', 'want a different', 'size swap'],
    whenToUse: [
      'Customer wants to return an item',
      'Customer asks about exchange for different size or color',
      'Customer received correct item but wants a different one',
    ],
    doNotUseWhen: [
      'Item is customized/personalized with name, number, or logo — use Customized Item Return Workflow instead',
      'Item is damaged or defective — use Damaged/Defective Workflow',
      'Capelli shipped the wrong item — use Wrong Item Received Workflow',
    ],
    requiredInfo: [
      'Order number',
      'Item name and size',
      'Reason for return',
      'Date of receipt',
      'Whether item is worn or washed',
      'Whether original tags are still attached',
      'Whether item is customized',
    ],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE', 'SHOPIFY'],
    steps: [
      { stepNumber: 1, title: 'Verify eligibility', description: 'Check that the return is within 30 days of receipt, item is unworn/unwashed, and original tags are still attached.', agentAction: 'Confirm date received against return window. Ask if item is unworn and tags are attached.', isRequired: true },
      { stepNumber: 2, title: 'Confirm no customization', description: 'Ensure the item is not customized (no player name, number, or custom logo).', warning: 'Customized items cannot be returned unless Capelli made an error.', isRequired: true },
      { stepNumber: 3, title: 'Explain no direct exchange', description: 'Capelli does not offer direct exchanges. The process is: return for refund, then place a new order.', agentAction: 'Inform customer that they need to return the item first. Refund will process after receipt. They can then place a new order.', isRequired: true },
      { stepNumber: 4, title: 'Provide return address', description: 'Share the official return address from the training material.', agentAction: 'Include [Return Address] in the email.', isRequired: true },
      { stepNumber: 5, title: 'Clarify shipping cost', description: 'Confirm that the customer is responsible for return shipping unless Capelli made an error.', isRequired: true },
      { stepNumber: 6, title: 'Explain refund timeline', description: 'Tell the customer how long refund will take after receipt.', agentAction: 'Include [Refund Timeline] placeholder in email.', isRequired: true },
      { stepNumber: 7, title: 'Set ticket to Pending', description: 'Set ticket status to Pending while awaiting return.', agentAction: 'Change ticket status to Pending.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Return Request — [Order Number]

Hi [Customer Name],

Thank you for reaching out to Capelli Sports. I'm happy to help you with your return.

To process your return, please ensure the following:
• The item is unworn and unwashed
• All original tags are still attached
• The return is within 30 days of receipt

Please note that Capelli Sports does not offer direct exchanges. To receive a different size or item, you would need to return the original item for a refund and then place a new order.

Return Address:
[Return Address]

Please ship the item back using a trackable shipping method. You will be responsible for return shipping costs. Once we receive the item, your refund of [Refund Amount] will be processed within [Refund Timeline].

If you have any questions, please don't hesitate to reach out.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Return request received.
Order #: [Order Number]
Item: [Item Name/Size]
Reason: [Reason for return]
Eligibility check: Within 30 days: [YES/NO] | Unworn: [YES/NO] | Tags attached: [YES/NO] | Customized: [YES/NO]
Action: Provided return instructions and address. No direct exchange explained.
Status: Pending (awaiting return shipment)
Follow-up: Check in [X] days if no tracking received.`,
    preSendChecklist: [
      { key: 'within_30_days', label: 'Confirmed return is within 30 days of receipt', isRequired: true, warning: 'Cannot process return outside 30-day window without supervisor approval.' },
      { key: 'unworn_unwashed', label: 'Confirmed item is unworn and unwashed', isRequired: true },
      { key: 'tags_attached', label: 'Confirmed original tags are still attached', isRequired: true },
      { key: 'not_customized', label: 'Confirmed item is NOT customized/personalized', isRequired: true, warning: 'Customized items have a different return process.' },
      { key: 'no_direct_exchange', label: 'Explained that direct exchange is not available', isRequired: true },
      { key: 'return_address_included', label: 'Return address included in email', isRequired: true },
      { key: 'shipping_cost_explained', label: 'Customer shipping responsibility explained', isRequired: true },
      { key: 'refund_timeline_included', label: 'Refund timeline explained', isRequired: true },
      { key: 'internal_note_added', label: 'Internal Zendesk note added', isRequired: true },
    ],
    zendeskTags: [
      { tagName: 'return_request', tagCategory: 'ISSUE_TYPE', isRequired: true },
      { tagName: 'return_eligible', tagCategory: 'ACTION_TAKEN', isRequired: false },
      { tagName: 'pending_return', tagCategory: 'PENDING_REASON', isRequired: false },
    ],
    ticketStatus: 'Pending',
    ticketPriority: 'Normal',
    escalationRules: [
      { triggerReason: 'Return outside 30-day window', escalateTo: 'Team Leader', details: 'Supervisor approval needed for exceptions.' },
      { triggerReason: 'Customized item return claim', escalateTo: 'Team Leader', details: 'Verify whether error was Capelli side or customer side.' },
    ],
    commonMistakes: [
      'Telling the customer a direct exchange is available',
      'Processing return without confirming 30-day window',
      'Not asking about customization before processing',
      'Not including the return address',
      'Promising refund before item is received',
    ],
    doRules: [
      'Confirm 30-day window before processing',
      'Confirm item is unworn, unwashed, and tags are attached',
      'Explain no direct exchange policy',
      'Include return address in email',
      'Add internal note before sending reply',
    ],
    dontRules: [
      'Do NOT say direct exchange is available',
      'Do NOT promise refund before item is received',
      'Do NOT process return for customized items without supervisor',
      'Do NOT forget to explain shipping cost responsibility',
    ],
    sourceNote: 'Return & Exchange Policy. Please verify with uploaded training materials.',
    sortOrder: 1,
  },

  // ─── 2. Replacement Order ─────────────────────────────────────────────────
  {
    workflowId: 'replacement_order',
    name: 'Replacement Order Workflow',
    category: 'REPLACEMENT_ORDER',
    triggerPhrases: ['replacement', 'send me a new one', 'replace', 'damaged in shipping', 'wrong item sent', 'defective'],
    whenToUse: [
      'Item arrived damaged due to shipping',
      'Item is defective out of the box',
      'Capelli sent the wrong item',
      'Item is missing from order',
    ],
    doNotUseWhen: [
      'Customer ordered the wrong size — this is NOT eligible for replacement',
      'Customer wants to exchange for a different style/color — use Return/Exchange Workflow',
      'Item has been worn/washed — replacement not applicable',
    ],
    requiredInfo: [
      'Order number',
      'Item name, size, SKU',
      'Photos of damaged/wrong item',
      'Photo of size tag',
      'Photo of packing slip if available',
      'Player name/number if customized',
      'Description of issue',
    ],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE', 'SAP'],
    steps: [
      { stepNumber: 1, title: 'Collect evidence', description: 'Request photos of the damaged/wrong item, size tag, and packing slip.', warning: 'Do NOT place replacement order until evidence photos are received, unless supervisor has approved an exception.', agentAction: 'Ask customer to send photos via email or Zendesk attachment.', isRequired: true },
      { stepNumber: 2, title: 'Verify the claim', description: 'Review photos to confirm the issue (damaged, wrong item, defective).', agentAction: 'Check photos against the order details in BigCommerce/Shopify/SAP.', isRequired: true },
      { stepNumber: 3, title: 'Confirm replacement window', description: 'Verify the replacement is within the approved window per training materials.', isRequired: true },
      { stepNumber: 4, title: 'Confirm correct item details', description: 'Confirm the replacement should match the original order exactly (same item, size, color, player name/number).', warning: 'Do NOT change any details unless there was a Capelli error on those details.', isRequired: true },
      { stepNumber: 5, title: 'Do not share RO number', description: 'Once replacement order (RO) is created, do NOT share the RO number with the customer.', warning: 'Never share the replacement order number with the customer.', isRequired: true },
      { stepNumber: 6, title: 'Update ticket and add internal note', description: 'Add internal note with all details before sending customer reply.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Regarding Your Order [Order Number] — Replacement Initiated

Hi [Customer Name],

Thank you for contacting Capelli Sports and for providing the photos.

I have reviewed your case and [I can confirm / we are reviewing] the issue with your order.

[If approved:] A replacement order has been submitted. Once it is processed and shipped, you will receive a shipping confirmation with tracking information. Please allow [Processing Time] for processing.

[If awaiting review:] Our team is reviewing the details you provided. We will follow up with you shortly.

We sincerely apologize for the inconvenience and appreciate your patience.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Replacement order request.
Order #: [Order Number]
Issue: [Damage/Wrong item/Defective]
Item: [Item Name / SKU / Size / Color]
Player name/number (if applicable): [Player Info]
Evidence received: Photos [YES/NO] | Size tag photo [YES/NO] | Packing slip [YES/NO]
Verification: [What was confirmed from photos]
Action: Replacement order [submitted / pending supervisor approval]
RO#: [Internal use only — do not share with customer]
Status: [Pending/Open]
Next: Follow up in [X] days for shipping confirmation.`,
    preSendChecklist: [
      { key: 'evidence_collected', label: 'Evidence photos received (damaged/wrong item + size tag)', isRequired: true, warning: 'Do NOT send replacement without photos unless supervisor approved.' },
      { key: 'claim_verified', label: 'Claim verified against order details', isRequired: true },
      { key: 'not_customer_error', label: 'Confirmed this is NOT customer error (not wrong size ordered by customer)', isRequired: true, warning: 'Customer wrong-size errors are NOT eligible for replacement.' },
      { key: 'correct_item_confirmed', label: 'Replacement item details match original order exactly', isRequired: true },
      { key: 'ro_not_shared', label: 'RO number NOT included in customer email', isRequired: true, warning: 'Never share the replacement order number with customer.' },
      { key: 'no_coupon_shared', label: 'Coupon code NOT included in customer email', isRequired: true },
      { key: 'internal_note_added', label: 'Internal note added with all details', isRequired: true },
      { key: 'tags_filled', label: 'Zendesk tags filled', isRequired: true },
    ],
    zendeskTags: [
      { tagName: 'replacement_order', tagCategory: 'ISSUE_TYPE', isRequired: true },
      { tagName: 'evidence_requested', tagCategory: 'PENDING_REASON', isRequired: false },
      { tagName: 'replacement_approved', tagCategory: 'ACTION_TAKEN', isRequired: false },
    ],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [
      { triggerReason: 'No photos available but customer insists', escalateTo: 'Team Leader', details: 'Supervisor must approve any exception to evidence requirement.' },
      { triggerReason: 'High-value order replacement', escalateTo: 'Team Leader', details: 'Higher-value replacements may require additional approval.' },
    ],
    commonMistakes: [
      'Placing replacement order before receiving evidence photos',
      'Creating replacement for customer who ordered wrong size',
      'Sharing the replacement order number with the customer',
      'Sharing a personal coupon code with the customer',
      'Not checking if item is customized before creating replacement',
    ],
    doRules: [
      'Always collect photos before placing replacement',
      'Confirm replacement matches original order exactly',
      'Add internal note with all details',
      'Keep RO number internal only',
    ],
    dontRules: [
      'Do NOT place replacement for customer wrong-size error',
      'Do NOT skip evidence collection without supervisor approval',
      'Do NOT share RO number with customer',
      'Do NOT share coupon code with customer',
    ],
    sourceNote: 'Replacement Order Policy. Verify with uploaded training materials.',
    sortOrder: 2,
  },

  // ─── 3. Damaged / Defective Item ──────────────────────────────────────────
  {
    workflowId: 'damaged_defective',
    name: 'Damaged / Defective Item Workflow',
    category: 'DAMAGED_DEFECTIVE',
    triggerPhrases: ['damaged', 'defective', 'broken', 'torn', 'ripped', 'falling apart', 'quality issue', 'not as expected'],
    whenToUse: [
      'Item arrived damaged from shipping',
      'Item is defective (manufacturing defect)',
      'Item quality does not meet standard',
    ],
    doNotUseWhen: [
      'Damage caused by customer misuse or wear',
      'Customer simply does not like the item — use Return/Exchange Workflow',
    ],
    requiredInfo: [
      'Order number',
      'Item name and SKU',
      'Photos of damage/defect',
      'Photo of size tag',
      'Whether item has been worn or washed',
      'Description of defect',
    ],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE', 'SAP'],
    steps: [
      { stepNumber: 1, title: 'Request photos', description: 'Ask for photos of the damage/defect, the item, and the size tag.', isRequired: true },
      { stepNumber: 2, title: 'Assess damage type', description: 'Determine if damage is shipping damage or manufacturing defect.', isRequired: true },
      { stepNumber: 3, title: 'Check if worn/washed', description: 'If item has been significantly used, document this and escalate if needed.', isRequired: true },
      { stepNumber: 4, title: 'Apply correct resolution', description: 'Based on damage type: replacement order, refund, or escalation.', isRequired: true },
      { stepNumber: 5, title: 'Document and notify', description: 'Add full internal note and send customer response.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Regarding Your Damaged Item — Order [Order Number]

Hi [Customer Name],

Thank you for bringing this to our attention, and I sincerely apologize for the inconvenience.

To help us resolve this quickly, could you please send us the following:
• Clear photos of the damaged/defective area
• A photo of the size tag on the item
• A brief description of the issue

Once we receive these, we will review your case right away and provide a resolution.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Damaged/Defective item report.
Order #: [Order Number]
Item: [Item Name / SKU / Size]
Damage type: [Shipping damage / Manufacturing defect / Quality issue]
Item condition: Worn: [YES/NO] | Washed: [YES/NO]
Evidence received: [YES/NO]
Action: [Photos requested / Replacement submitted / Escalated]
Next: Await photos / Resolution pending.`,
    preSendChecklist: [
      { key: 'photos_requested', label: 'Photos of damage/defect requested or received', isRequired: true },
      { key: 'size_tag_requested', label: 'Size tag photo requested', isRequired: true },
      { key: 'worn_checked', label: 'Checked whether item has been worn/washed', isRequired: true },
      { key: 'no_rma_promised', label: 'Did not promise replacement before reviewing photos', isRequired: true },
    ],
    zendeskTags: [
      { tagName: 'damaged_item', tagCategory: 'ISSUE_TYPE', isRequired: true },
      { tagName: 'defective_item', tagCategory: 'ISSUE_TYPE', isRequired: false },
    ],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [
      { triggerReason: 'Significant damage, no photos available', escalateTo: 'Team Leader', details: 'Supervisor decision needed.' },
    ],
    commonMistakes: [
      'Promising replacement before reviewing photos',
      'Not distinguishing between shipping damage and manufacturing defect',
      'Forgetting to request size tag photo',
    ],
    doRules: ['Always request photos first', 'Check if item was worn/washed'],
    dontRules: ['Do NOT promise replacement without photos', 'Do NOT accept worn/washed items as automatic replacement'],
    sourceNote: 'Damaged/Defective Item Policy. Verify with uploaded training materials.',
    sortOrder: 3,
  },

  // ─── 4. Wrong Item Received ───────────────────────────────────────────────
  {
    workflowId: 'wrong_item_received',
    name: 'Wrong Item Received Workflow',
    category: 'WRONG_ITEM_RECEIVED',
    triggerPhrases: ['wrong item', 'wrong product', 'received wrong', 'not what I ordered', 'got the wrong thing', 'sent wrong'],
    whenToUse: ['Capelli shipped a different item than what was ordered'],
    doNotUseWhen: ['Customer ordered the wrong item — use Customer Wrong Size/Item Workflow'],
    requiredInfo: ['Order number', 'Item ordered (name/SKU)', 'Item received (name/SKU)', 'Photos of received item', 'Photo of packing slip'],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE', 'SAP'],
    steps: [
      { stepNumber: 1, title: 'Verify order details', description: 'Check what was actually ordered vs what customer says they received.', isRequired: true },
      { stepNumber: 2, title: 'Request evidence', description: 'Ask for photo of the item received and the packing slip.', isRequired: true },
      { stepNumber: 3, title: 'Confirm Capelli error', description: 'If confirmed Capelli shipped the wrong item, this qualifies for replacement.', isRequired: true },
      { stepNumber: 4, title: 'Process replacement', description: 'Follow Replacement Order Workflow to create the correct item.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Regarding Wrong Item — Order [Order Number]

Hi [Customer Name],

I'm sorry to hear you received the wrong item. To help us correct this, please send:
• A photo of the item you received
• A photo of the packing slip inside the package

Once we confirm the details, we will arrange for the correct item to be sent to you right away.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Wrong item received.
Order #: [Order Number]
Item ordered: [Item Name / SKU / Size]
Item received: [Described by customer]
Evidence: Photos requested [YES/NO] | Received [YES/NO]
Confirmation: Capelli error confirmed [YES/NO]
Action: [Pending photos / Replacement ordered]`,
    preSendChecklist: [
      { key: 'order_verified', label: 'Verified what was actually ordered in the system', isRequired: true },
      { key: 'evidence_requested', label: 'Photos of received item and packing slip requested', isRequired: true },
      { key: 'capelli_error_confirmed', label: 'Confirmed this is a Capelli error, not customer error', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'wrong_item_received', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [],
    commonMistakes: ['Treating customer wrong-order as Capelli wrong-item error'],
    doRules: ['Verify order details before accepting claim', 'Request photos of item AND packing slip'],
    dontRules: ['Do NOT process replacement without verifying Capelli error'],
    sourceNote: 'Wrong Item Received Policy.',
    sortOrder: 4,
  },

  // ─── 5. Missing Item ──────────────────────────────────────────────────────
  {
    workflowId: 'missing_item',
    name: 'Missing Item Workflow',
    category: 'MISSING_ITEM',
    triggerPhrases: ['missing item', 'item not in box', 'did not receive', 'not in my order', 'incomplete order', 'only got part of my order'],
    whenToUse: ['An item from a multi-item order was not in the package'],
    doNotUseWhen: ['Single-item order not delivered — use Delivered Not Received Workflow'],
    requiredInfo: ['Order number', 'Item that is missing', 'Items that were received', 'Photo of package contents if possible', 'Packing slip'],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE', 'SAP'],
    steps: [
      { stepNumber: 1, title: 'Verify order contents', description: 'Check in BigCommerce/SAP what items were supposed to be in the order. Check if it was a split shipment.', isRequired: true },
      { stepNumber: 2, title: 'Check for split shipment', description: 'Confirm whether it was a split shipment — the missing item may still be en route.', agentAction: 'Check SAP for multiple tracking numbers.', isRequired: true },
      { stepNumber: 3, title: 'Request packing slip photo', description: 'Ask customer to send a photo of the packing slip to confirm what was listed.', isRequired: true },
      { stepNumber: 4, title: 'Escalate to warehouse if needed', description: 'If confirmed missing, escalate for warehouse investigation.', isRequired: false },
    ],
    customerEmailTemplate: `Subject: Regarding Your Order [Order Number] — Missing Item

Hi [Customer Name],

Thank you for contacting us. I'm sorry to hear an item may be missing from your order.

Before we investigate, could you please confirm:
• The item(s) you did receive
• A photo of the packing slip included in your package

Also note that some orders are shipped in multiple packages. Please check if you have a separate tracking number for the remaining items.

If after checking you still have not received the item, we will follow up with our warehouse team right away.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Missing item reported.
Order #: [Order Number]
Missing item: [Item Name / SKU]
Items received: [List]
Split shipment: [YES/NO / Checking]
Packing slip: Requested [YES/NO]
Warehouse escalation: [YES/NO]
Action: [Pending investigation / Replacement ordered]`,
    preSendChecklist: [
      { key: 'checked_split_shipment', label: 'Checked if this was a split shipment', isRequired: true },
      { key: 'packing_slip_requested', label: 'Requested packing slip photo', isRequired: true },
      { key: 'order_contents_verified', label: 'Verified order contents in system', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'missing_item', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [{ triggerReason: 'Missing item confirmed by warehouse', escalateTo: 'Warehouse team via Contact Sheet', details: 'Follow warehouse escalation process.' }],
    commonMistakes: ['Not checking for split shipment first', 'Not requesting packing slip'],
    doRules: ['Check for split shipment first', 'Request packing slip as evidence'],
    dontRules: ['Do NOT promise replacement before warehouse confirms'],
    sourceNote: 'Missing Item Policy.',
    sortOrder: 5,
  },

  // ─── 6. Customer Ordered Wrong Size ───────────────────────────────────────
  {
    workflowId: 'customer_wrong_size',
    name: 'Customer Ordered Wrong Size Workflow',
    category: 'CUSTOMER_WRONG_SIZE',
    triggerPhrases: ['ordered wrong size', 'I made a mistake', 'I ordered the wrong', 'size too small', 'size too big', 'my mistake'],
    whenToUse: ['Customer admits they ordered the incorrect size or item'],
    doNotUseWhen: ['Capelli shipped the wrong size — use Wrong Item Received Workflow'],
    requiredInfo: ['Order number', 'Item name', 'Size ordered', 'Size wanted', 'Whether item is customized'],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE'],
    steps: [
      { stepNumber: 1, title: 'Confirm customer error', description: 'Verify the order to confirm that the correct size was shipped and the customer ordered the wrong size.', isRequired: true },
      { stepNumber: 2, title: 'Check return eligibility', description: 'Apply return/exchange eligibility criteria (30 days, unworn, tags attached, not customized).', isRequired: true },
      { stepNumber: 3, title: 'NO replacement order', description: 'Replacement orders are NOT created for customer-ordering errors.', warning: 'This is NOT eligible for a replacement order. Do not place RO.', isRequired: true },
      { stepNumber: 4, title: 'Guide through return process', description: 'If eligible, guide through standard return for refund then new order process.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Regarding Your Order [Order Number] — Size Assistance

Hi [Customer Name],

Thank you for reaching out. I understand you may have ordered a different size than intended.

Please note that our team ships exactly what is ordered, so unfortunately we are unable to create a replacement order for a size change on your end.

However, if the item is unworn, unwashed, and the original tags are still attached, and it is within 30 days of receipt, you may be able to return it for a refund and place a new order in the correct size.

Would you like me to provide instructions for the return process?

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Customer-ordered wrong size.
Order #: [Order Number]
Item: [Item Name / Size ordered / Size wanted]
Confirmed: Capelli shipped correctly. Customer error confirmed.
Replacement: NOT applicable.
Return eligibility: Within 30 days [YES/NO] | Unworn [YES/NO] | Tags [YES/NO]
Action: Directed to return process.`,
    preSendChecklist: [
      { key: 'capelli_shipped_correctly', label: 'Confirmed Capelli shipped the correct size', isRequired: true },
      { key: 'no_replacement_order', label: 'Confirmed NO replacement order for customer error', isRequired: true, warning: 'Replacement orders are NOT for customer-side errors.' },
      { key: 'return_eligibility_checked', label: 'Checked return eligibility', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'customer_wrong_size', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Open',
    ticketPriority: 'Normal',
    escalationRules: [],
    commonMistakes: ['Creating a replacement order for customer ordering error', 'Treating customer wrong-size as Capelli error'],
    doRules: ['Confirm order was shipped correctly before responding', 'Offer return/exchange process if eligible'],
    dontRules: ['NEVER place replacement order for customer wrong-size', 'Do NOT tell customer they will get a free replacement'],
    sourceNote: 'Customer Wrong Size Policy.',
    sortOrder: 6,
  },

  // ─── 7. Customized Item Return ────────────────────────────────────────────
  {
    workflowId: 'customized_item_return',
    name: 'Customized Item Return Workflow',
    category: 'CUSTOMIZED_ITEM_RETURN',
    triggerPhrases: ['customized', 'personalized', 'name on it', 'number on it', 'custom jersey', 'custom kit', 'logo jersey'],
    whenToUse: ['Customer wants to return or replace a customized/personalized item'],
    doNotUseWhen: [],
    requiredInfo: ['Order number', 'Item name', 'Customization details (name/number)', 'Nature of issue', 'Photos if defective'],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE', 'SAP'],
    steps: [
      { stepNumber: 1, title: 'Identify reason for return', description: 'Determine if the issue is Capelli error (wrong name/number printed) or customer preference.', isRequired: true },
      { stepNumber: 2, title: 'Apply correct rule', description: 'Customized items CANNOT be returned for customer preference. They CAN be replaced if Capelli made an error.', warning: 'Customized items are final sale unless Capelli made an error.', isRequired: true },
      { stepNumber: 3, title: 'Request proof if Capelli error', description: 'If claiming Capelli error, request photo of item showing incorrect customization vs what was ordered.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Regarding Your Customized Order [Order Number]

Hi [Customer Name],

Thank you for contacting us about your customized item.

Please note that customized/personalized items are considered final sale and cannot be returned for preference or size changes.

However, if there was an error with the customization on our end (such as incorrect name, number, or logo), please send us a photo of the item along with your order details and we will review the case immediately.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Customized item return request.
Order #: [Order Number]
Item: [Item Name / Customization details]
Issue type: Capelli error [YES/NO] | Customer preference [YES/NO]
Action: [Return denied — final sale / Replacement reviewed for Capelli error]`,
    preSendChecklist: [
      { key: 'error_type_confirmed', label: 'Confirmed whether error is Capelli-side or customer preference', isRequired: true },
      { key: 'final_sale_explained', label: 'Explained final sale policy for customized items', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'customized_item', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'Normal',
    escalationRules: [{ triggerReason: 'Customer disputes Capelli error on customization', escalateTo: 'Team Leader', details: 'Team Leader reviews photo evidence.' }],
    commonMistakes: ['Processing return for customized item without confirming Capelli error'],
    doRules: ['Determine error type before responding', 'Request photo evidence for Capelli error claims'],
    dontRules: ['Do NOT accept return of customized item for preference', 'Do NOT promise replacement without supervisor review'],
    sourceNote: 'Customized Item Policy.',
    sortOrder: 7,
  },

  // ─── 8. Order Status / ETA ────────────────────────────────────────────────
  {
    workflowId: 'order_status_eta',
    name: 'Order Status / ETA Workflow',
    category: 'ORDER_STATUS_ETA',
    triggerPhrases: ['where is my order', 'order status', 'when will it arrive', 'ETA', 'order update', 'shipping update', 'when will I get'],
    whenToUse: ['Customer asking about order status or estimated delivery'],
    doNotUseWhen: [],
    requiredInfo: ['Order number', 'Customer email (for order lookup)'],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE', 'SHOPIFY', 'SAP'],
    steps: [
      { stepNumber: 1, title: 'Look up order', description: 'Use order number or customer email to find the order in the correct system (BigCommerce for team shop, Shopify for CS.COM).', isRequired: true },
      { stepNumber: 2, title: 'Check order status', description: 'Confirm order status: processing, shipped, in transit, delivered.', isRequired: true },
      { stepNumber: 3, title: 'Check OBD/Wave if applicable', description: 'For team shop orders, check OBD and wave status in SAP.', isRequired: false },
      { stepNumber: 4, title: 'Provide accurate update', description: 'Do NOT give ETA unless you have confirmed it from the system.', warning: 'Never promise an ETA you cannot confirm from the system.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Order Update — Order [Order Number]

Hi [Customer Name],

Thank you for reaching out. Here is the current status of your order:

Order Number: [Order Number]
Current Status: [Order Status]
[If shipped:] Tracking Number: [Tracking Number]
[If shipped:] You can track your order here: [Tracking Link]

[If processing:] Your order is currently being processed. We will notify you once it ships.

Please allow [Processing Time] for processing.

If you have any additional questions, please don't hesitate to contact us.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Order status inquiry.
Order #: [Order Number]
System checked: [BigCommerce / Shopify / SAP]
Status found: [Status]
OBD/Wave status (if applicable): [Details]
Action: Provided status update to customer.`,
    preSendChecklist: [
      { key: 'order_found', label: 'Order located in the correct system', isRequired: true },
      { key: 'status_confirmed', label: 'Order status confirmed from system (not assumed)', isRequired: true },
      { key: 'no_unconfirmed_eta', label: 'No ETA given that was not confirmed from system', isRequired: true, warning: 'Never promise an ETA you cannot confirm.' },
    ],
    zendeskTags: [{ tagName: 'order_status', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Normal',
    escalationRules: [],
    commonMistakes: ['Giving ETA based on assumption, not system data', 'Not checking OBD/Wave for team orders'],
    doRules: ['Check system before responding', 'Give tracking number if available'],
    dontRules: ['Do NOT promise ETA without confirmation', 'Do NOT assume order has shipped without checking'],
    sourceNote: 'Order Status Process.',
    sortOrder: 8,
  },

  // ─── 9. Processing Time ───────────────────────────────────────────────────
  {
    workflowId: 'processing_time',
    name: 'Processing Time Workflow',
    category: 'PROCESSING_TIME',
    triggerPhrases: ['processing time', 'how long', 'when will it ship', 'order not shipped yet', 'still processing'],
    whenToUse: ["Customer asking why order hasn't shipped yet"],
    doNotUseWhen: ['Order has already shipped — use Order Status Workflow'],
    requiredInfo: ['Order number', 'Order date'],
    systemChecks: ['BIGCOMMERCE', 'SHOPIFY', 'SAP'],
    steps: [
      { stepNumber: 1, title: 'Verify order date and processing start', description: 'Confirm when the order was placed and the expected processing time per training materials.', isRequired: true },
      { stepNumber: 2, title: 'Check if within normal window', description: 'Confirm if the order is within standard processing window.', isRequired: true },
      { stepNumber: 3, title: 'Check for OBD or Wave delay', description: 'For team shop orders, check if there is an OBD or wave affecting shipment.', isRequired: false },
      { stepNumber: 4, title: 'Provide honest timeline', description: 'Give accurate expected ship date based on system data.', warning: 'Do NOT commit to a ship date you cannot confirm.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Order Processing Update — [Order Number]

Hi [Customer Name],

Thank you for your patience. Our current processing time is [Processing Time] from the order date. Your order was placed on [Order Date], so it is expected to ship by [Expected Ship Date].

Once your order ships, you will receive a shipping confirmation with tracking information.

We appreciate your understanding and look forward to getting your order to you soon.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Processing time inquiry.
Order #: [Order Number]
Order date: [Date]
Processing window: [X days]
Expected ship date: [Date]
OBD/Wave checked: [YES/NO / Results]
Action: Provided processing timeline to customer.`,
    preSendChecklist: [
      { key: 'order_date_confirmed', label: 'Order date confirmed from system', isRequired: true },
      { key: 'processing_window_checked', label: 'Processing time window confirmed', isRequired: true },
      { key: 'obd_wave_checked', label: 'OBD/Wave checked for team orders', isRequired: false },
    ],
    zendeskTags: [{ tagName: 'processing_time', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Normal',
    escalationRules: [{ triggerReason: 'Order significantly past processing window', escalateTo: 'Team Leader', details: 'Investigate delay.' }],
    commonMistakes: ['Giving processing time from memory instead of checking policy', 'Not checking OBD/Wave for team orders'],
    doRules: ['Give accurate processing time from policy', 'Check OBD for team orders'],
    dontRules: ['Do NOT give a ship date you cannot confirm'],
    sourceNote: 'Processing Time Policy.',
    sortOrder: 9,
  },

  // ─── 10. Order Change ─────────────────────────────────────────────────────
  {
    workflowId: 'order_change',
    name: 'Order Change Workflow',
    category: 'ORDER_CHANGE',
    triggerPhrases: ['change my order', 'update my order', 'wrong address', 'wrong size ordered', 'change shipping address', 'modify order'],
    whenToUse: ['Customer requests a change to their order before shipment'],
    doNotUseWhen: ['Order has already shipped'],
    requiredInfo: ['Order number', 'What needs to be changed', 'Order system (BigCommerce, Shopify, SAP)', 'OBD status', 'Wave status'],
    systemChecks: ['SAP', 'BIGCOMMERCE', 'SHOPIFY', 'ZENDESK'],
    steps: [
      { stepNumber: 1, title: 'Check OBD status', description: 'Check if the order has an OBD (Order-Based Delivery) in SAP.', warning: 'Do NOT promise a change before checking OBD/Wave status.', isRequired: true },
      { stepNumber: 2, title: 'Check wave status', description: 'Check if the order is on a wave in SAP and whether the wave has a release date.', isRequired: true },
      { stepNumber: 3, title: 'Determine if change is possible', description: 'If OBD exists and wave is open, change may be possible. If wave is released, change may not be possible.', isRequired: true },
      { stepNumber: 4, title: 'Identify correct team to contact', description: 'Depending on order type (FBPA vs FBB vs regular), identify who must be notified to make the change.', agentAction: 'Refer to Contact Sheet for correct internal contact.', isRequired: true },
      { stepNumber: 5, title: 'Communicate clearly', description: 'Tell customer whether the change can be made and the timeline.', warning: 'Do NOT promise change can be made until confirmed internally.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Order Change Request — [Order Number]

Hi [Customer Name],

Thank you for reaching out. We have received your request to [describe change] on order [Order Number].

We are currently checking with our fulfillment team to see if this change is possible before your order ships.

We will follow up with you within [Timeframe] with an update.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Order change request.
Order #: [Order Number]
Change requested: [Details of change]
OBD status: [Exists / Does not exist]
Wave status: [Open / Released / No wave]
Order type: [FBPA / FBB / Regular]
Internal contact notified: [Name/Team]
Promise made to customer: [NONE — pending confirmation]
Action: Checking internally. Customer informed of timeline.`,
    preSendChecklist: [
      { key: 'obd_checked', label: 'OBD status checked in SAP', isRequired: true, warning: 'Must check OBD before making any promise.' },
      { key: 'wave_checked', label: 'Wave status checked in SAP', isRequired: true },
      { key: 'no_change_promised', label: 'Did NOT promise change can be made before internal confirmation', isRequired: true, warning: 'Never promise order change without confirming with fulfillment.' },
      { key: 'correct_team_notified', label: 'Correct internal team notified (per Contact Sheet)', isRequired: true },
      { key: 'internal_note_added', label: 'Internal note added with all details', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'order_change', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [
      { triggerReason: 'Wave already released', escalateTo: 'Team Leader', details: 'May not be possible to change.' },
      { triggerReason: 'FBPA order change request', escalateTo: 'FBPA team via Contact Sheet', details: 'Different process for FBPA.' },
    ],
    commonMistakes: [
      'Promising order change before checking OBD/Wave status',
      'Not identifying whether order is FBPA or FBB',
      'Not using the Contact Sheet to find the right team',
    ],
    doRules: ['Check OBD and Wave status first', 'Use Contact Sheet for correct escalation contact', 'Set ticket to Pending until confirmed'],
    dontRules: ['Do NOT promise change before internal confirmation', 'Do NOT attempt change without checking OBD/Wave'],
    sourceNote: 'Order Change & Cancellation Guidelines.',
    sortOrder: 10,
  },

  // ─── 11. Order Cancellation ───────────────────────────────────────────────
  {
    workflowId: 'order_cancellation',
    name: 'Order Cancellation Workflow',
    category: 'ORDER_CANCELLATION',
    triggerPhrases: ['cancel my order', 'cancel order', 'I want to cancel', 'please cancel', 'stop my order'],
    whenToUse: ['Customer requests cancellation of their order'],
    doNotUseWhen: ['Order has already shipped — cannot cancel'],
    requiredInfo: ['Order number', 'Reason for cancellation', 'Order type (FBPA/FBB/Regular)', 'OBD status', 'Wave status'],
    systemChecks: ['SAP', 'BIGCOMMERCE', 'SHOPIFY'],
    steps: [
      { stepNumber: 1, title: 'Check if order has shipped', description: 'Confirm whether order has already shipped. If shipped, cancellation is not possible.', isRequired: true },
      { stepNumber: 2, title: 'Check OBD/Wave status', description: 'In SAP, check OBD and wave status for team orders.', warning: 'Do NOT promise cancellation before checking OBD/Wave.', isRequired: true },
      { stepNumber: 3, title: 'Identify order type', description: 'Identify whether the order is FBPA, FBB, or regular. Different cancellation processes apply.', isRequired: true },
      { stepNumber: 4, title: 'Process cancellation or escalate', description: 'If possible, process cancellation. If FBPA/FBB, escalate to correct team.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Cancellation Request — [Order Number]

Hi [Customer Name],

Thank you for contacting us. We have received your request to cancel order [Order Number].

[If possible:] We have processed the cancellation. You will receive a refund within [Refund Timeline].

[If not possible:] Unfortunately, your order has already been processed for shipment and cannot be cancelled at this time. Once received, you may be eligible to return the item. Please refer to our return policy.

[If pending confirmation:] We are checking with our fulfillment team. We will follow up with you within [Timeframe].

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Cancellation request.
Order #: [Order Number]
Order status: [Shipped / Processing / Pending]
OBD: [YES/NO] | Wave: [Open/Released]
Order type: [FBPA / FBB / Regular]
Cancellation possible: [YES/NO/Pending]
Action: [Cancelled / Escalated / Directed to return policy]`,
    preSendChecklist: [
      { key: 'shipped_checked', label: 'Confirmed whether order has already shipped', isRequired: true },
      { key: 'obd_wave_checked', label: 'OBD and Wave status checked in SAP', isRequired: true },
      { key: 'order_type_identified', label: 'Identified order type (FBPA/FBB/Regular)', isRequired: true },
      { key: 'no_cancellation_promised', label: 'Did NOT promise cancellation before confirming', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'cancellation_request', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [
      { triggerReason: 'FBPA cancellation', escalateTo: 'FBPA team via Contact Sheet', details: 'FBPA has a different cancellation workflow.' },
      { triggerReason: 'FBB cancellation', escalateTo: 'FBB team via Contact Sheet', details: 'FBB has a different cancellation workflow.' },
    ],
    commonMistakes: ['Promising cancellation before checking system', 'Not distinguishing FBPA from FBB'],
    doRules: ['Check system before making any promise', 'Identify order type first'],
    dontRules: ['Do NOT promise cancellation before confirming', 'Do NOT cancel without knowing order type'],
    sourceNote: 'Order Cancellation Guidelines.',
    sortOrder: 11,
  },

  // ─── 12. OBD / Wave ───────────────────────────────────────────────────────
  {
    workflowId: 'obd_wave',
    name: 'OBD / Wave Workflow',
    category: 'OBD_WAVE',
    triggerPhrases: ['OBD', 'wave', 'release date', 'team order', 'when does the wave release', 'wave status'],
    whenToUse: ['Ticket involves a team shop order with OBD or wave scheduling'],
    doNotUseWhen: ['Order is a regular individual order without OBD'],
    requiredInfo: ['Order number', 'Team/club name', 'OBD number if known', 'Wave number if known'],
    systemChecks: ['SAP', 'BIGCOMMERCE', 'TEAM_STORE'],
    steps: [
      { stepNumber: 1, title: 'Find the OBD in SAP', description: 'Locate the OBD (Order-Based Delivery) in SAP using the order number or team name.', isRequired: true },
      { stepNumber: 2, title: 'Check wave status', description: 'Determine if the order is on a wave and check the wave release date.', isRequired: true },
      { stepNumber: 3, title: 'Provide accurate update', description: 'Give the customer an accurate status based on wave release date.', warning: 'Do NOT give ETA unless wave release date is confirmed.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Update on Your Team Order — [Order Number]

Hi [Customer Name],

Thank you for reaching out about your team order [Order Number].

Your order is currently scheduled for release on [Wave Release Date / Expected Ship Date]. Once released, your order will be processed and you will receive tracking information.

If you have any further questions, please let us know.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `OBD/Wave inquiry.
Order #: [Order Number] | Team: [Team Name]
OBD: [Number/Status] | Wave: [Number/Status]
Wave release date: [Date or N/A]
Action: Provided wave status update to customer.`,
    preSendChecklist: [
      { key: 'obd_found', label: 'OBD located in SAP', isRequired: true },
      { key: 'wave_checked', label: 'Wave status and release date confirmed', isRequired: true },
      { key: 'no_unconfirmed_eta', label: 'No ETA given without confirmed wave release date', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'obd_wave', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Normal',
    escalationRules: [{ triggerReason: 'Wave significantly delayed', escalateTo: 'Team Leader', details: 'Investigate wave delay.' }],
    commonMistakes: ['Giving ETA without confirmed wave release date'],
    doRules: ['Check SAP for wave release date', 'Give accurate wave status'],
    dontRules: ['Do NOT give ETA without confirmed wave date'],
    sourceNote: 'OBD/Wave Process.',
    sortOrder: 12,
  },

  // ─── 13. Team Store Password ──────────────────────────────────────────────
  {
    workflowId: 'team_store_password',
    name: 'Team Store Password Workflow',
    category: 'TEAM_STORE_PASSWORD',
    triggerPhrases: ['team store password', 'team shop password', 'store password', 'cannot access store', 'password for team store', 'club store access'],
    whenToUse: ['Customer cannot access their team store and needs the password'],
    doNotUseWhen: [],
    requiredInfo: ['Team/club name', 'Customer name', 'Whether they are a player, parent, or coach'],
    systemChecks: ['TEAM_STORE', 'ZENDESK'],
    steps: [
      { stepNumber: 1, title: 'Identify the club/team store', description: 'Find the correct club store using the Clubs/Passwords sheet.', isRequired: true },
      { stepNumber: 2, title: 'Verify the request is legitimate', description: 'Confirm the customer is associated with the team (player, parent, coach).', isRequired: true },
      { stepNumber: 3, title: 'Share password via secure channel', description: 'Share the team store password only via Zendesk (not social media, external email, or unsecured channel).', warning: 'NEVER include the team store password in an outbound customer email if it would be visible to others.', isRequired: true },
      { stepNumber: 4, title: 'Add to internal note', description: 'Document that password was shared, to whom, and via which channel.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Team Store Access — [Team Name]

Hi [Customer Name],

Thank you for contacting us. Here is the access information for the [Team Name] team store:

Store Link: [Team Store Link]
Password: [Approved Password]

Please keep this information confidential and do not share it publicly.

If you have any questions about ordering, please let us know.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Team store password request.
Team/Club: [Team Name]
Customer: [Customer Name / Role: Player/Parent/Coach]
Password shared: YES (via Zendesk ticket)
Store link provided: YES
Authorized: YES — customer verified as team member.
Note: Password shared internally only, not via external channel.`,
    preSendChecklist: [
      { key: 'club_identified', label: 'Correct club/team store identified from Clubs sheet', isRequired: true },
      { key: 'customer_verified', label: 'Customer verified as team member', isRequired: true },
      { key: 'password_correct', label: 'Password confirmed from Clubs/Passwords sheet', isRequired: true },
      { key: 'secure_channel', label: 'Shared via secure channel (Zendesk) only', isRequired: true, warning: 'Never share password via unsecured channels.' },
      { key: 'internal_note_added', label: 'Documented in internal note who received password', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'team_store_password', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Normal',
    escalationRules: [{ triggerReason: 'Cannot find club in Clubs/Passwords sheet', escalateTo: 'Team Leader', details: 'May need to contact the club coordinator.' }],
    commonMistakes: ['Sharing password in a public or external channel', 'Sharing wrong club password'],
    doRules: ['Verify club identity from the Clubs/Passwords sheet', 'Share via secure Zendesk channel only'],
    dontRules: ['NEVER share passwords via unsecured channels', 'Do NOT share the general internal password with customers'],
    sourceNote: 'Clubs/Passwords Sheet. Keep confidential.',
    sortOrder: 13,
  },

  // ─── 14. Player Link ──────────────────────────────────────────────────────
  {
    workflowId: 'player_link',
    name: 'Player Link Workflow',
    category: 'PLAYER_LINK',
    triggerPhrases: ['player link', 'player page', 'individual link', 'personal link', 'can I order individually', 'player store'],
    whenToUse: ['Player needs their individual player link to order from team store'],
    doNotUseWhen: [],
    requiredInfo: ['Player name', 'Team/club name', 'Player email (if available)'],
    systemChecks: ['TEAM_STORE', 'BIGCOMMERCE'],
    steps: [
      { stepNumber: 1, title: 'Locate team store', description: 'Find the club/team store using Clubs sheet.', isRequired: true },
      { stepNumber: 2, title: 'Find player link', description: 'Locate the individual player link for that player in the team store system.', isRequired: true },
      { stepNumber: 3, title: 'Provide link securely', description: 'Send the player link to the verified customer.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Player Store Link — [Team Name]

Hi [Player Name],

Thank you for reaching out. Here is your individual player store link:

[Player Store Link]

This link is for your use only. Please do not share it publicly. Using this link, you can order your individual items from the [Team Name] store.

If you have any questions, please let us know.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Player link request.
Team: [Team Name] | Player: [Player Name]
Link provided: YES
Method: Zendesk ticket reply
Player email on file: [YES/NO]`,
    preSendChecklist: [
      { key: 'team_identified', label: 'Team/club identified', isRequired: true },
      { key: 'player_link_found', label: 'Correct player link found in system', isRequired: true },
      { key: 'player_verified', label: 'Player identity verified', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'player_link', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Normal',
    escalationRules: [{ triggerReason: 'Player link not in system', escalateTo: 'Team Leader', details: 'May need to set up player link.' }],
    commonMistakes: ['Sending wrong player link', 'Not verifying player identity'],
    doRules: ['Verify player identity', 'Send correct link for correct team'],
    dontRules: ['Do NOT send link without verifying player'],
    sourceNote: 'Player Link Process.',
    sortOrder: 14,
  },

  // ─── 15. Refund Request ───────────────────────────────────────────────────
  {
    workflowId: 'refund_request',
    name: 'Refund Request Workflow',
    category: 'REFUND_REQUEST',
    triggerPhrases: ['refund', 'money back', 'credit', 'charge back', 'I want my money back', 'please refund'],
    whenToUse: ['Customer is requesting a monetary refund'],
    doNotUseWhen: [],
    requiredInfo: ['Order number', 'Item(s) to be refunded', 'Reason for refund request', 'Payment method used'],
    systemChecks: ['ZENDESK', 'BIGCOMMERCE', 'SHOPIFY'],
    steps: [
      { stepNumber: 1, title: 'Determine refund eligibility', description: 'Check return eligibility: 30 days, unworn, tags attached, not customized.', isRequired: true },
      { stepNumber: 2, title: 'Verify supervisor/accounting approval requirement', description: 'Refunds require supervisor or accounting approval in most cases. Do not process without authorization.', warning: 'Do NOT process refund without supervisor/accounting approval.', isRequired: true },
      { stepNumber: 3, title: 'Set expectations', description: 'Inform customer of refund timeline once item is received and approved.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Refund Request — Order [Order Number]

Hi [Customer Name],

Thank you for contacting us about a refund for order [Order Number].

[If eligible:] We have reviewed your request. Once we receive the returned item, your refund will be processed within [Refund Timeline].

[If pending review:] We are reviewing your request and will follow up with you shortly.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Refund request.
Order #: [Order Number]
Item: [Item Details]
Reason: [Reason]
Return eligibility: [YES/NO]
Supervisor approval: [Obtained / Pending / Not required]
Action: [Refund approved and pending / Pending supervisor / Item return required first]`,
    preSendChecklist: [
      { key: 'eligibility_checked', label: 'Return/refund eligibility confirmed', isRequired: true },
      { key: 'supervisor_approval', label: 'Supervisor/accounting approval obtained if required', isRequired: true, warning: 'Never refund without proper authorization.' },
      { key: 'no_refund_promised', label: 'Refund not promised before approval', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'refund_request', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [{ triggerReason: 'Any refund request', escalateTo: 'Supervisor/Accounting', details: 'Refunds require authorization.' }],
    commonMistakes: ['Processing refund without supervisor approval', 'Promising refund before authorization'],
    doRules: ['Get supervisor approval', 'Set correct expectations for timeline'],
    dontRules: ['Do NOT refund without authorization', 'Do NOT promise refund before approval'],
    sourceNote: 'Refund Policy.',
    sortOrder: 15,
  },

  // ─── 16. Escalation ───────────────────────────────────────────────────────
  {
    workflowId: 'escalation',
    name: 'Escalation Workflow',
    category: 'ESCALATION',
    triggerPhrases: ['escalate', 'supervisor', 'manager', 'I want to speak to someone', 'this is unacceptable', 'threatening chargeback', 'legal action', 'complaint'],
    whenToUse: [
      'Customer requests a manager or supervisor',
      'Customer threatens chargeback or legal action',
      'Issue is outside agent authorization',
      'Agent is unsure of correct policy',
      'High-value order exception needed',
      'Repeated complaint on same issue',
    ],
    doNotUseWhen: ['Agent can resolve with standard workflow'],
    requiredInfo: ['All available order and customer details', 'Issue summary', 'What has already been tried', 'Customer sentiment'],
    systemChecks: ['ZENDESK', 'CONTACT_SHEET'],
    steps: [
      { stepNumber: 1, title: 'Document everything', description: 'Add a full internal note with all customer details, issue, and what has been tried.', isRequired: true },
      { stepNumber: 2, title: 'Acknowledge the customer', description: 'Send a holding response acknowledging the issue and setting a timeline for follow-up.', isRequired: true },
      { stepNumber: 3, title: 'Contact Team Leader', description: 'Use the Contact Sheet to reach the correct Team Leader or supervisor.', agentAction: 'Refer to Contact Sheet for correct escalation contact.', isRequired: true },
      { stepNumber: 4, title: 'Set ticket to On-hold or Pending', description: 'Set ticket to On-hold while awaiting Team Leader response.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Your Case with Capelli Sports — [Order Number]

Hi [Customer Name],

Thank you for your patience. I want to assure you that your concern is important to us.

I have escalated your case to our senior team for review. A team member will follow up with you within [Timeframe] with a resolution.

We sincerely apologize for any inconvenience and appreciate your patience.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `ESCALATION NOTE:
Customer: [Customer Name] | Order: [Order Number]
Issue: [Full issue summary]
What has been tried: [Previous responses/actions]
Customer sentiment: [Upset / Threatening chargeback / Requesting manager]
Escalated to: [Team Leader name from Contact Sheet]
Holding response sent: YES
Status: On-hold/Pending — awaiting Team Leader.`,
    preSendChecklist: [
      { key: 'full_note_added', label: 'Full internal note with all details added', isRequired: true },
      { key: 'team_leader_notified', label: 'Team Leader notified via Contact Sheet', isRequired: true },
      { key: 'holding_response_sent', label: 'Holding response sent to customer with realistic timeframe', isRequired: true },
      { key: 'ticket_on_hold', label: 'Ticket set to On-hold or Pending', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'escalated', tagCategory: 'ESCALATION', isRequired: true }],
    ticketStatus: 'On-hold',
    ticketPriority: 'Urgent',
    escalationRules: [{ triggerReason: 'Chargeback threat', escalateTo: 'Team Leader immediately', details: 'Handle with priority.' }],
    commonMistakes: ['Not adding internal note before escalating', 'Not sending a holding response to customer', 'Closing ticket while escalation is pending'],
    doRules: ['Document everything first', 'Send holding response', 'Use Contact Sheet for correct contact'],
    dontRules: ['Do NOT close ticket while escalation is pending', 'Do NOT make promises during escalation'],
    sourceNote: 'Escalation Policy.',
    sortOrder: 16,
  },

  // ─── 17. Out of Stock ──────────────────────────────────────────────────────
  {
    workflowId: 'out_of_stock',
    name: 'Out of Stock Workflow',
    category: 'OUT_OF_STOCK',
    triggerPhrases: ['out of stock', 'not available', 'sold out', 'when will it be back', 'back in stock', 'unavailable'],
    whenToUse: ['Customer asking about item availability or restock date'],
    doNotUseWhen: [],
    requiredInfo: ['Item name/SKU', 'Size/Color if applicable'],
    systemChecks: ['BIGCOMMERCE', 'SHOPIFY', 'PRODUCT_DIRECTORY'],
    steps: [
      { stepNumber: 1, title: 'Check availability', description: 'Check current stock in BigCommerce/Shopify for the item.', isRequired: true },
      { stepNumber: 2, title: 'Check restock timeline', description: 'Check with Product team or system for expected restock date.', warning: 'Do NOT promise a restock date unless confirmed.', isRequired: true },
      { stepNumber: 3, title: 'Offer alternatives', description: 'If the item will not be restocked, suggest alternatives if available.', isRequired: false },
    ],
    customerEmailTemplate: `Subject: Item Availability — [Item Name]

Hi [Customer Name],

Thank you for your interest in [Item Name].

[If confirmed restock:] We expect this item to be back in stock around [Restock Date]. We recommend checking our website at that time.

[If no restock date:] Unfortunately, we do not have a confirmed restock date for this item at this time. You may want to check back on our website for updates.

[If alternative available:] You might also be interested in [Alternative Item], which is currently available.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Out of stock inquiry.
Item: [Item Name / SKU / Size]
Current stock: [Zero / Unavailable]
Restock date: [Date / Unknown / Confirmed from product team]
Alternative offered: [YES/NO]
Action: Provided availability update.`,
    preSendChecklist: [
      { key: 'stock_checked', label: 'Current stock confirmed in system', isRequired: true },
      { key: 'no_unconfirmed_restock', label: 'Restock date not promised unless confirmed', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'out_of_stock', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Low',
    escalationRules: [],
    commonMistakes: ['Promising restock date without confirmation'],
    doRules: ['Check system for stock', 'Offer alternative if available'],
    dontRules: ['Do NOT promise restock date without confirmation'],
    sourceNote: 'Product Availability Process.',
    sortOrder: 17,
  },

  // ─── 18. Private Contact Info Request ─────────────────────────────────────
  {
    workflowId: 'private_contact_info',
    name: 'Private Contact Info Request Workflow',
    category: 'PRIVATE_CONTACT_INFO',
    triggerPhrases: ['contact number', 'phone number', 'email address', 'direct contact', 'manager contact', 'CEO contact', 'head office'],
    whenToUse: ['Customer is asking for internal employee contact information or direct phone numbers'],
    doNotUseWhen: [],
    requiredInfo: ['Nature of the customer request'],
    systemChecks: ['ZENDESK'],
    steps: [
      { stepNumber: 1, title: 'Do NOT share internal contact info', description: 'Internal employee phone numbers, direct emails, and personal contacts must NEVER be shared with customers.', warning: 'NEVER share private employee contact information with customers.', isRequired: true },
      { stepNumber: 2, title: 'Redirect to Zendesk/official channel', description: 'Direct customer to the official customer service contact method.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Contact Information — Capelli Sports

Hi [Customer Name],

Thank you for reaching out. For all customer service inquiries, please contact us through our official customer service portal at [Official CS Email / Zendesk Link].

Our team will be happy to assist you with any questions or concerns.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Private contact info request.
Customer asked for: [What they requested]
Action: Redirected to official CS channel. No internal contact information shared.`,
    preSendChecklist: [
      { key: 'no_private_info_shared', label: 'Confirmed no private employee info shared', isRequired: true, warning: 'NEVER share employee direct contact info.' },
    ],
    zendeskTags: [{ tagName: 'contact_info_request', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Normal',
    escalationRules: [],
    commonMistakes: ['Sharing internal phone numbers or email addresses with customers'],
    doRules: ['Redirect to official channel only'],
    dontRules: ['NEVER share private employee contact information with customers'],
    sourceNote: 'Internal Contact Policy.',
    sortOrder: 18,
  },

  // ─── 19. Tracking Not Moving ──────────────────────────────────────────────
  {
    workflowId: 'tracking_not_moving',
    name: 'Tracking Not Moving Workflow',
    category: 'TRACKING_NOT_MOVING',
    triggerPhrases: ['tracking not updating', 'no movement', 'tracking stuck', 'says shipped but no update', 'package not moving'],
    whenToUse: ['Tracking shows no movement for several days after shipping'],
    doNotUseWhen: ['Package was just shipped — tracking may take 24-48 hours to update'],
    requiredInfo: ['Order number', 'Tracking number', 'Date shipped', 'Last tracking update'],
    systemChecks: ['ZENDESK', 'SAP', 'BIGCOMMERCE'],
    steps: [
      { stepNumber: 1, title: 'Check tracking number', description: 'Verify the tracking number and check on carrier website.', isRequired: true },
      { stepNumber: 2, title: 'Check SAP for additional info', description: 'Check SAP for any flags or issues on the shipment.', isRequired: true },
      { stepNumber: 3, title: 'Determine action', description: 'If tracking is confirmed stuck, escalate to fulfillment team or carrier.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Update on Your Shipment — [Tracking Number]

Hi [Customer Name],

Thank you for reaching out about your shipment. I have checked your tracking number [Tracking Number] and I can see the last update was on [Date].

[If within normal window:] Please allow an additional [X] business days as delays can sometimes occur in transit.

[If genuinely stuck:] We are investigating this with our carrier. We will follow up with you within [Timeframe] with an update.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Tracking not moving.
Order #: [Order Number] | Tracking: [Tracking Number]
Date shipped: [Date] | Last update: [Date/Location]
SAP check: [Findings]
Action: [Advised customer to wait / Escalated to carrier / Escalated internally]`,
    preSendChecklist: [
      { key: 'tracking_verified', label: 'Tracking number verified on carrier site', isRequired: true },
      { key: 'sap_checked', label: 'SAP checked for shipment flags', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'tracking_issue', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'Normal',
    escalationRules: [{ triggerReason: 'Tracking stuck for 7+ days', escalateTo: 'Fulfillment/Carrier team', details: 'Investigate lost shipment.' }],
    commonMistakes: ['Not checking the carrier website directly', 'Promising delivery date without confirmation'],
    doRules: ['Check carrier website', 'Check SAP for flags'],
    dontRules: ['Do NOT promise delivery date'],
    sourceNote: 'Tracking Issue Process.',
    sortOrder: 19,
  },

  // ─── 20. Guest Checkout / Account Linking ─────────────────────────────────
  {
    workflowId: 'guest_checkout',
    name: 'Guest Checkout / Account Linking Workflow',
    category: 'GUEST_CHECKOUT',
    triggerPhrases: ['guest checkout', 'no account', 'can\'t find my order', 'checked out as guest', 'link order to account', 'order not showing'],
    whenToUse: ['Customer checked out as guest and cannot find their order in account'],
    doNotUseWhen: [],
    requiredInfo: ['Order number', 'Email used at checkout', 'Customer name'],
    systemChecks: ['BIGCOMMERCE', 'SHOPIFY', 'ZENDESK'],
    steps: [
      { stepNumber: 1, title: 'Look up order by email', description: 'Search for the order using the email used at checkout in BigCommerce/Shopify.', isRequired: true },
      { stepNumber: 2, title: 'Confirm order details', description: 'Verify order details match what the customer describes.', isRequired: true },
      { stepNumber: 3, title: 'Guide account creation/linking', description: 'Help customer create an account with the same email to link the order, if applicable.', isRequired: false },
    ],
    customerEmailTemplate: `Subject: Your Order Information — [Order Number]

Hi [Customer Name],

Thank you for reaching out. I was able to locate your order [Order Number] placed with email [Customer Email].

Your order status is: [Status]

If you would like to track your order or view it in an account, you can create an account using [Customer Email] on our website, and your past orders may appear automatically.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Guest checkout inquiry.
Order located: Order #[Number] via email [Email]
Customer wants account link: [YES/NO]
Action: [Provided order info / Guided account creation]`,
    preSendChecklist: [
      { key: 'order_found', label: 'Order located using email in system', isRequired: true },
      { key: 'order_verified', label: 'Order details verified with customer', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'guest_checkout', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Low',
    escalationRules: [],
    commonMistakes: ['Searching by name instead of email', 'Not checking both BigCommerce and Shopify'],
    doRules: ['Search by email first', 'Check correct platform for the order type'],
    dontRules: [],
    sourceNote: 'Guest Checkout Process.',
    sortOrder: 20,
  },

  // ─── 21. Individual Item Ordering ─────────────────────────────────────────
  {
    workflowId: 'individual_item_ordering',
    name: 'Individual Item Ordering',
    category: 'INDIVIDUAL_ITEM_ORDERING',
    triggerPhrases: ['order one jersey', 'buy individual', 'single item', 'purchase just one', 'order without team', 'not in a club'],
    whenToUse: [
      'Customer wants to order individual items not through a team store',
      'Customer is not part of a club but wants Capelli products',
    ],
    doNotUseWhen: ['Customer is part of a team store — direct them to the team store'],
    requiredInfo: ['Item they want', 'Size', 'Platform to purchase from'],
    systemChecks: ['BIGCOMMERCE', 'SHOPIFY'],
    steps: [
      { stepNumber: 1, title: 'Identify the item', description: 'Determine the exact product and size the customer wants.', isRequired: true },
      { stepNumber: 2, title: 'Check availability', description: 'Check BigCommerce and Shopify for stock availability.', isRequired: true },
      { stepNumber: 3, title: 'Guide purchase', description: 'Direct customer to the correct website to place their order.', isRequired: true },
      { stepNumber: 4, title: 'Provide sizing guidance if needed', description: 'Reference the product guide for sizing information.', agentAction: 'Check Product Directory for size charts.', isRequired: false },
    ],
    customerEmailTemplate: `Subject: Re: Individual Item Purchase — [Item Name]

Hi [Customer Name],

Thank you for reaching out. You can purchase [Item Name] directly from our website at:

[Website URL]

[If out of stock: Unfortunately, this item is currently out of stock. We recommend checking back shortly or contacting us to be notified when it becomes available.]

Please let me know if you have any questions about sizing or availability.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Individual item inquiry.
Item: [Item Name]
Size: [Size]
Platform: [BigCommerce/Shopify]
Stock status: [In stock / Out of stock]
Action: [Directed to website / Offered notification]`,
    preSendChecklist: [
      { key: 'stock_checked', label: 'Stock availability checked on correct platform', isRequired: true },
      { key: 'url_correct', label: 'Correct website URL provided (no internal links)', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'individual_order', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Low',
    escalationRules: [],
    commonMistakes: ['Sending team store link to a non-team customer', 'Not checking stock on both platforms'],
    doRules: ['Check both platforms for availability', 'Offer sizing guide proactively'],
    dontRules: ['Do not share team store passwords with individual buyers'],
    sourceNote: 'Individual Ordering Process.',
    sortOrder: 21,
  },

  // ─── 22. Two Players One Account ──────────────────────────────────────────
  {
    workflowId: 'two_players_one_account',
    name: 'Two Players One Account',
    category: 'TWO_PLAYERS_ONE_ACCOUNT',
    triggerPhrases: ['two players', 'siblings', 'two kids', 'multiple players', 'family account', 'same account two jerseys'],
    whenToUse: [
      'Parent or guardian ordering for two players in the same club',
      'Two players sharing one account on the team store',
    ],
    doNotUseWhen: ['Players are on different clubs — separate workflows needed'],
    requiredInfo: ['Club/team name', 'Player 1 name and number', 'Player 2 name and number', 'Items needed for each player'],
    systemChecks: ['TEAM_STORE', 'BIGCOMMERCE'],
    steps: [
      { stepNumber: 1, title: 'Confirm team store', description: 'Verify the club team store and confirm both players are eligible.', isRequired: true },
      { stepNumber: 2, title: 'Guide ordering process', description: 'Explain how to add items for both players to the cart in a single order.', agentAction: 'Confirm team store supports multiple player customizations.', isRequired: true },
      { stepNumber: 3, title: 'Verify customization fields', description: 'Ensure both player names and numbers are entered correctly before checkout.', warning: 'Customization errors on team store orders cannot be changed once submitted.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Ordering for Two Players — [Club Name]

Hi [Customer Name],

Thank you for reaching out about ordering for two players on [Club Name].

You can add items for both players in a single order through your team store. When adding each item to your cart, make sure to enter the correct name and number for each player separately before adding to cart.

If you have any questions during the ordering process, please don't hesitate to ask.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Two-player account inquiry.
Club: [Club Name]
Player 1: [Name, Number]
Player 2: [Name, Number]
Team store confirmed: [YES/NO]
Action: Guided ordering process.`,
    preSendChecklist: [
      { key: 'team_store_confirmed', label: 'Team store confirmed for the correct club', isRequired: true },
      { key: 'customization_warning_given', label: 'Customer warned to double-check names/numbers before submitting', isRequired: true, warning: 'Customization errors are not correctable after submission.' },
    ],
    zendeskTags: [{ tagName: 'two_players_account', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Low',
    escalationRules: [],
    commonMistakes: ['Not warning about customization finality', 'Sharing wrong team store link'],
    doRules: ['Confirm the team store is correct', 'Warn about customization accuracy'],
    dontRules: ['Do not submit orders on behalf of customers'],
    sourceNote: 'Team Store Ordering Guide.',
    sortOrder: 22,
  },

  // ─── 23. Size Help ────────────────────────────────────────────────────────
  {
    workflowId: 'size_help',
    name: 'Size Help / Size Chart',
    category: 'SIZE_HELP',
    triggerPhrases: ['what size', 'size chart', 'help with sizing', 'which size should I get', 'size recommendation', 'fits true to size'],
    whenToUse: [
      'Customer asks which size to order',
      'Customer wants sizing guidance before purchasing',
      'Customer is between sizes',
    ],
    doNotUseWhen: ['Customer already received a wrong size — use Customer Wrong Size Workflow instead'],
    requiredInfo: ['Item name or product type', 'Customer measurements if provided'],
    systemChecks: ['PRODUCT_DIRECTORY'],
    steps: [
      { stepNumber: 1, title: 'Identify the product', description: 'Confirm exactly which product the customer is asking about.', isRequired: true },
      { stepNumber: 2, title: 'Pull size chart', description: 'Find the appropriate size chart from the Product Directory.', agentAction: 'Check Product Directory for item-specific size chart.', isRequired: true },
      { stepNumber: 3, title: 'Provide recommendation', description: 'Based on measurements or general guidance, recommend the appropriate size.', warning: 'Sizes can vary by product line. Always reference the specific product size chart.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Sizing Information — [Product Name]

Hi [Customer Name],

Thank you for reaching out about sizing for [Product Name].

Based on our size chart:
[Include relevant size chart information or measurements]

[If between sizes: If you are between sizes, we generally recommend sizing up for [reason — e.g., athletic wear, layering over padding].]

If you have any other questions, feel free to ask!

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Size help inquiry.
Product: [Product Name]
Customer measurements: [If provided]
Size recommended: [Size]
Source: Product Directory`,
    preSendChecklist: [
      { key: 'size_chart_checked', label: 'Correct size chart referenced from Product Directory', isRequired: true },
      { key: 'product_specific', label: 'Size guidance is specific to the product (not generic)', isRequired: true, warning: 'Generic size advice can lead to wrong size orders.' },
    ],
    zendeskTags: [{ tagName: 'size_help', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Low',
    escalationRules: [],
    commonMistakes: ['Using a generic size chart instead of product-specific', 'Not checking the Product Directory'],
    doRules: ['Always use the product-specific size chart', 'Recommend sizing up when between sizes for athletic gear'],
    dontRules: ['Do not guess sizes without referencing the Product Directory'],
    sourceNote: 'Product Directory — Size Charts.',
    sortOrder: 23,
  },

  // ─── 24. Product Technical Question ──────────────────────────────────────
  {
    workflowId: 'product_technical',
    name: 'Product Technical Question',
    category: 'PRODUCT_TECHNICAL',
    triggerPhrases: ['material', 'fabric', 'washing instructions', 'care instructions', 'sublimation', 'moisture wicking', 'polyester', 'product specs'],
    whenToUse: [
      'Customer asks about product materials, fabric, or care',
      'Customer asks about technical product specifications',
    ],
    doNotUseWhen: ['Product is damaged — use Damaged/Defective Workflow'],
    requiredInfo: ['Product name or style number'],
    systemChecks: ['PRODUCT_DIRECTORY'],
    steps: [
      { stepNumber: 1, title: 'Identify product', description: 'Get the exact product name or style number from the customer.', isRequired: true },
      { stepNumber: 2, title: 'Look up product specs', description: 'Check the Product Directory for materials, care instructions, and specs.', agentAction: 'Reference Product Directory for full specifications.', isRequired: true },
      { stepNumber: 3, title: 'Respond with accurate info', description: 'Provide only what is confirmed in the Product Directory. Do not guess or invent specs.', warning: 'If information is not in the Product Directory, say so — do not invent product specs.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Product Information — [Product Name]

Hi [Customer Name],

Thank you for your question about [Product Name].

[Product specifications from Product Directory]

[If info not found: I was unable to locate detailed specifications for this item in our current product guide. I have escalated this to our team to get you an accurate answer.]

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Product technical question.
Product: [Product Name / Style Number]
Question: [Customer's question]
Info found in Product Directory: [YES / NO / PARTIAL]
Action: [Provided info / Escalated for missing info]`,
    preSendChecklist: [
      { key: 'product_dir_checked', label: 'Product Directory checked for this item', isRequired: true },
      { key: 'no_invented_specs', label: 'Confirmed: no invented or assumed product specs in email', isRequired: true, warning: 'Invented product info causes customer trust issues.' },
    ],
    zendeskTags: [{ tagName: 'product_question', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Low',
    escalationRules: [
      { triggerReason: 'Product spec not found in Product Directory', escalateTo: 'Team Leader', details: 'Get accurate info before responding.' },
    ],
    commonMistakes: ['Guessing material composition', 'Not checking Product Directory'],
    doRules: ['Only state confirmed product specs', 'Escalate if info not found'],
    dontRules: ['Do not invent or assume product specs'],
    sourceNote: 'Product Directory.',
    sortOrder: 24,
  },

  // ─── 25. Website Issue ────────────────────────────────────────────────────
  {
    workflowId: 'website_issue',
    name: 'Website Issue / Technical Problem',
    category: 'WEBSITE_ISSUE',
    triggerPhrases: ['website not working', 'cannot checkout', "can't add to cart", 'site error', 'page broken', 'not loading', 'error message'],
    whenToUse: [
      'Customer reports a technical issue with the website',
      'Customer cannot complete checkout due to site error',
    ],
    doNotUseWhen: ['Issue is with an order already placed — use Order Status or relevant workflow'],
    requiredInfo: ['Specific error or issue', 'Browser and device type', 'URL or page where issue occurs'],
    systemChecks: ['BIGCOMMERCE', 'SHOPIFY', 'ZENDESK'],
    steps: [
      { stepNumber: 1, title: 'Gather details', description: 'Get the full description of the issue, browser, device, and any error messages.', isRequired: true },
      { stepNumber: 2, title: 'Try basic troubleshooting', description: 'Suggest clearing cache, trying a different browser, or incognito mode.', isRequired: true },
      { stepNumber: 3, title: 'Check if site-wide issue', description: 'Check if the issue is affecting all users or just this customer.', isRequired: true },
      { stepNumber: 4, title: 'Escalate if needed', description: 'If the issue appears to be a site bug, escalate to Team Leader for reporting to tech team.', isRequired: false },
    ],
    customerEmailTemplate: `Subject: Website Issue — We're Looking Into This

Hi [Customer Name],

Thank you for letting us know about the issue you're experiencing on our website.

Could you please try the following steps?
1. Clear your browser cache and cookies
2. Try using a different browser (Chrome, Firefox, Safari)
3. Try using an incognito/private browsing window

If the issue persists after trying these steps, please let me know and I will escalate this to our technical team.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Website technical issue.
Issue description: [Details]
Browser/Device: [Info]
Error message: [If any]
Troubleshooting suggested: [YES/NO]
Escalated to tech team: [YES/NO]`,
    preSendChecklist: [
      { key: 'basic_troubleshoot', label: 'Basic troubleshooting steps included in response', isRequired: true },
      { key: 'not_site_wide', label: 'Confirmed issue is not site-wide / blocking all users', isRequired: true, warning: 'Site-wide issues require immediate escalation.' },
    ],
    zendeskTags: [{ tagName: 'website_issue', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'Normal',
    escalationRules: [
      { triggerReason: 'Site-wide issue affecting multiple customers', escalateTo: 'Team Leader', details: 'Tech team must be notified immediately.' },
    ],
    commonMistakes: ['Not asking for browser/device info', 'Not checking if issue is site-wide before responding'],
    doRules: ['Collect full technical details', 'Try basic troubleshooting first'],
    dontRules: ['Do not promise a specific fix timeline without tech team confirmation'],
    sourceNote: 'Website Support Procedure.',
    sortOrder: 25,
  },

  // ─── 26. Expedited Shipping ───────────────────────────────────────────────
  {
    workflowId: 'expedited_shipping',
    name: 'Expedited Shipping Request',
    category: 'EXPEDITED_SHIPPING',
    triggerPhrases: ['rush order', 'expedited shipping', 'need it faster', 'upgrade shipping', 'overnight', '2-day shipping', 'need by date'],
    whenToUse: [
      'Customer requests faster shipping than standard',
      'Customer has an urgent deadline for their order',
    ],
    doNotUseWhen: ['Order has already shipped — cannot expedite after shipment'],
    requiredInfo: ['Order number', 'Order status (shipped or not)', 'Requested delivery date', 'OBD/Wave status'],
    systemChecks: ['SAP', 'BIGCOMMERCE', 'SHOPIFY'],
    steps: [
      { stepNumber: 1, title: 'Check order status', description: 'Confirm if the order has shipped yet. If already shipped, expediting is not possible.', isRequired: true },
      { stepNumber: 2, title: 'Check OBD and Wave status', description: 'Check SAP for OBD and wave status to determine fulfillment timeline.', warning: 'Do NOT promise expedited shipping before checking OBD/Wave status.', isRequired: true },
      { stepNumber: 3, title: 'Assess feasibility', description: 'Determine if expediting is possible given the order type and fulfillment stage.', isRequired: true },
      { stepNumber: 4, title: 'Escalate for approval', description: 'Escalate to Team Leader if expediting would incur extra cost or operational effort.', isRequired: false },
    ],
    customerEmailTemplate: `Subject: Expedited Shipping Request — Order [Order Number]

Hi [Customer Name],

Thank you for reaching out about your order [Order Number].

We have received your request for expedited shipping. [If possible: We are looking into the feasibility of upgrading your shipping and will follow up within [Timeframe].] [If not possible: Unfortunately, your order has already been [processed/shipped] and we are unable to upgrade the shipping method at this stage.]

[If already shipped: Your current tracking number is [Tracking Number] and your estimated delivery is [Date].]

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Expedited shipping request.
Order #: [Order Number]
Order status: [Not shipped / Shipped]
OBD: [Exists / Does not exist]
Wave status: [Open / Released]
Expediting possible: [YES / NO]
Reason: [Explanation]
Team Leader notified: [YES / NO]`,
    preSendChecklist: [
      { key: 'order_not_shipped', label: 'Confirmed order has not yet shipped', isRequired: true, warning: 'Cannot expedite after shipment.' },
      { key: 'obd_wave_checked', label: 'OBD and Wave status checked in SAP', isRequired: true },
      { key: 'no_promise_made', label: 'Did NOT promise expediting without internal confirmation', isRequired: true, warning: 'Never promise expedited shipping without approval.' },
    ],
    zendeskTags: [{ tagName: 'expedited_shipping', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [
      { triggerReason: 'Expediting requires extra cost', escalateTo: 'Team Leader', details: 'Need approval before committing.' },
    ],
    commonMistakes: ['Promising expedited shipping before checking SAP', 'Not checking if order has already shipped'],
    doRules: ['Always check SAP first', 'Escalate cost-related requests to Team Leader'],
    dontRules: ['Do not promise expedited shipping without approval', 'Do not upgrade shipping for orders already picked'],
    sourceNote: 'Expedited Shipping Policy.',
    sortOrder: 26,
  },

  // ─── 27. FBB Tracking ─────────────────────────────────────────────────────
  {
    workflowId: 'fbb_tracking',
    name: 'FBB Tracking Inquiry',
    category: 'FBB_TRACKING',
    triggerPhrases: ['FBB', 'field based billing', 'my FBB order', 'track FBB', 'FBB shipment'],
    whenToUse: [
      'Customer asks about tracking for an FBB (Field Based Billing) order',
    ],
    doNotUseWhen: ['Regular order tracking — use Tracking Not Moving Workflow instead'],
    requiredInfo: ['Order number', 'FBB confirmation'],
    systemChecks: ['SAP', 'ZENDESK'],
    steps: [
      { stepNumber: 1, title: 'Confirm FBB order type', description: 'Verify that this is an FBB order and not a standard order.', isRequired: true },
      { stepNumber: 2, title: 'Check SAP for tracking', description: 'Look up the FBB order in SAP for shipment and tracking details.', isRequired: true },
      { stepNumber: 3, title: 'Communicate tracking status', description: 'Provide tracking information or expected fulfillment timeline.', warning: 'FBB shipment timelines may differ from standard orders. Do not apply standard shipping SLAs.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: FBB Order Tracking — Order [Order Number]

Hi [Customer Name],

Thank you for your inquiry about your FBB order [Order Number].

[Tracking information / Status update from SAP]

FBB orders have a different fulfillment process from standard orders. [Provide applicable timeline or tracking details.]

Please let me know if you have further questions.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `FBB tracking inquiry.
Order #: [Order Number]
SAP status: [Status]
Tracking info: [If available]
Action: Provided tracking info to customer.`,
    preSendChecklist: [
      { key: 'fbb_confirmed', label: 'Confirmed this is an FBB order (not standard)', isRequired: true, warning: 'Applying wrong workflow to FBB order causes confusion.' },
      { key: 'sap_checked', label: 'SAP checked for current shipment status', isRequired: true },
    ],
    zendeskTags: [{ tagName: 'fbb_tracking', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Solved',
    ticketPriority: 'Normal',
    escalationRules: [
      { triggerReason: 'FBB order severely delayed', escalateTo: 'Team Leader', details: 'Check with logistics on FBB timeline.' },
    ],
    commonMistakes: ['Using standard tracking SLAs for FBB orders', 'Not checking SAP for FBB-specific info'],
    doRules: ['Confirm FBB before responding', 'Check SAP for FBB-specific tracking'],
    dontRules: ['Do not apply standard order timelines to FBB orders'],
    sourceNote: 'FBB Order Process Guide.',
    sortOrder: 27,
  },

  // ─── 28. Partial Shipment ─────────────────────────────────────────────────
  {
    workflowId: 'partial_shipment',
    name: 'Partial Shipment',
    category: 'PARTIAL_SHIPMENT',
    triggerPhrases: ['only received part', 'partial shipment', 'missing part of order', 'split shipment', 'some items missing', 'got some items'],
    whenToUse: [
      'Customer received part of their order but not all items',
      'Order was shipped in multiple packages',
    ],
    doNotUseWhen: [
      'Customer received completely wrong items — use Wrong Item Received Workflow',
      'All items are missing — may be a lost package, use Missing Item Workflow',
    ],
    requiredInfo: ['Order number', 'Items received', 'Items missing', 'Number of packages received'],
    systemChecks: ['SAP', 'BIGCOMMERCE', 'SHOPIFY'],
    steps: [
      { stepNumber: 1, title: 'Confirm what was received', description: 'Get exact list of items received vs. ordered.', isRequired: true },
      { stepNumber: 2, title: 'Check SAP for split shipments', description: 'Verify in SAP whether the order was intentionally split into multiple shipments.', isRequired: true },
      { stepNumber: 3, title: 'Locate remaining items', description: 'Find tracking for remaining items if split shipment. If not split, investigate missing items.', warning: 'Do not assume a split shipment without checking SAP first.', isRequired: true },
      { stepNumber: 4, title: 'Update customer', description: 'Let customer know whether remaining items are on the way or are being investigated.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: Re: Partial Order Receipt — Order [Order Number]

Hi [Customer Name],

Thank you for letting us know about your order [Order Number].

[If split shipment: Your order was shipped in multiple packages. The remaining items ([Item List]) were shipped separately and are on their way. Tracking: [Tracking Number]. Estimated delivery: [Date].]

[If investigating: We are looking into why [Item List] was not included in your shipment. We will follow up within [Timeframe] with an update.]

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `Partial shipment inquiry.
Order #: [Order Number]
Items received: [List]
Items missing: [List]
SAP split shipment: [YES / NO]
Remaining tracking: [If available]
Action: [Informed customer / Investigating]`,
    preSendChecklist: [
      { key: 'sap_checked', label: 'SAP checked for split shipment details', isRequired: true, warning: 'Always check SAP before assuming an error.' },
      { key: 'tracking_provided', label: 'Tracking for remaining items provided (if available)', isRequired: false },
    ],
    zendeskTags: [{ tagName: 'partial_shipment', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'Normal',
    escalationRules: [
      { triggerReason: 'Missing items confirmed not in any shipment', escalateTo: 'Team Leader', details: 'Replacement may be needed.' },
    ],
    commonMistakes: ['Assuming error without checking SAP', 'Not checking for intentional split shipments'],
    doRules: ['Check SAP for split shipment details first', 'Provide remaining tracking when available'],
    dontRules: ['Do not promise replacement without confirming items are truly missing'],
    sourceNote: 'Partial Shipment Procedure.',
    sortOrder: 28,
  },

  // ─── 29. FBPA Cancellation ────────────────────────────────────────────────
  {
    workflowId: 'fbpa_cancellation',
    name: 'FBPA Order Cancellation',
    category: 'FBPA_CANCELLATION',
    triggerPhrases: ['cancel FBPA', 'FBPA cancellation', 'cancel my FBPA order', 'FBPA order cancel'],
    whenToUse: [
      'Customer wants to cancel an FBPA (Fulfillment By Partner Agent) order',
    ],
    doNotUseWhen: ['Standard order cancellation — use Order Cancellation Workflow'],
    requiredInfo: ['FBPA order number', 'Reason for cancellation', 'FBPA partner details'],
    systemChecks: ['SAP', 'ZENDESK'],
    steps: [
      { stepNumber: 1, title: 'Confirm FBPA order type', description: 'Verify this is an FBPA order and gather order details.', isRequired: true },
      { stepNumber: 2, title: 'Check FBPA cancellation policy', description: 'FBPA cancellations follow a different process. Check with the FBPA team via Contact Sheet.', agentAction: 'Refer to Contact Sheet for FBPA team contact.', warning: 'Do NOT cancel FBPA orders directly. Must go through FBPA team.', isRequired: true },
      { stepNumber: 3, title: 'Escalate to FBPA team', description: 'Contact the FBPA team to initiate the cancellation request.', isRequired: true },
      { stepNumber: 4, title: 'Keep customer informed', description: 'Let the customer know the request is being processed and provide timeline.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: FBPA Cancellation Request — Order [Order Number]

Hi [Customer Name],

Thank you for reaching out about cancelling your FBPA order [Order Number].

We have forwarded your cancellation request to our FBPA fulfillment team. They will process your request and we expect to have an update for you within [Timeframe].

We will follow up as soon as we have confirmation of your cancellation status.

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `FBPA cancellation request.
FBPA Order #: [Order Number]
Reason: [Customer reason]
FBPA team contacted: [YES / NO]
Contact method: [Email / Phone via Contact Sheet]
Expected response: [Timeframe]
Action: Escalated to FBPA team.`,
    preSendChecklist: [
      { key: 'fbpa_confirmed', label: 'Confirmed this is an FBPA order', isRequired: true, warning: 'Wrong workflow for non-FBPA orders.' },
      { key: 'fbpa_team_notified', label: 'FBPA team notified via Contact Sheet', isRequired: true, warning: 'Never cancel FBPA orders directly.' },
    ],
    zendeskTags: [{ tagName: 'fbpa_cancellation', tagCategory: 'ISSUE_TYPE', isRequired: true }],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [
      { triggerReason: 'FBPA team unreachable', escalateTo: 'Team Leader', details: 'Escalate immediately if FBPA team does not respond.' },
    ],
    commonMistakes: ['Attempting to cancel FBPA order directly without going through FBPA team', 'Not using Contact Sheet for FBPA contact'],
    doRules: ['Always contact FBPA team for FBPA cancellations', 'Use Contact Sheet for correct contact'],
    dontRules: ['Do not cancel FBPA orders directly', 'Do not promise cancellation before FBPA team confirms'],
    sourceNote: 'FBPA Process — Contact Sheet.',
    sortOrder: 29,
  },

  // ─── 30. FBB Change / Cancellation ────────────────────────────────────────
  {
    workflowId: 'fbb_change_cancellation',
    name: 'FBB Change / Cancellation',
    category: 'FBB_CHANGE_CANCELLATION',
    triggerPhrases: ['change FBB', 'cancel FBB', 'FBB order change', 'FBB cancel', 'modify FBB order'],
    whenToUse: [
      'Customer wants to change or cancel an FBB (Field Based Billing) order',
    ],
    doNotUseWhen: ['Standard order change/cancellation — use Order Change or Cancellation Workflow'],
    requiredInfo: ['FBB order number', 'Change or cancellation request details', 'FBB fulfillment stage'],
    systemChecks: ['SAP', 'ZENDESK'],
    steps: [
      { stepNumber: 1, title: 'Confirm FBB order', description: 'Verify the order is FBB and gather full order details from SAP.', isRequired: true },
      { stepNumber: 2, title: 'Check FBB fulfillment stage', description: 'Determine current stage of FBB fulfillment in SAP — changes or cancellations may not be possible once production has started.', warning: 'FBB orders may be in production. Changes after production start are typically not possible.', isRequired: true },
      { stepNumber: 3, title: 'Contact FBB team', description: 'Contact the FBB team via Contact Sheet to assess feasibility of change or cancellation.', agentAction: 'Refer to Contact Sheet for FBB team contact.', isRequired: true },
      { stepNumber: 4, title: 'Communicate outcome', description: 'Let the customer know the result and timeline based on FBB team feedback.', isRequired: true },
    ],
    customerEmailTemplate: `Subject: FBB Order Change/Cancellation — Order [Order Number]

Hi [Customer Name],

Thank you for reaching out about your FBB order [Order Number].

FBB orders go through a specialized fulfillment process. We have contacted our FBB team to review your request to [change/cancel] this order.

[If in production: Unfortunately, your order appears to be in production and changes/cancellations may not be possible at this stage. We will confirm with our team and follow up.]

[If pre-production: We are working to process your request and will update you within [Timeframe].]

Best regards,
[Agent Name]
Capelli Sports Customer Service`,
    internalNoteTemplate: `FBB change/cancellation request.
FBB Order #: [Order Number]
Request type: [Change / Cancellation]
Details: [What customer wants changed/cancelled]
SAP fulfillment stage: [Pre-production / In production / Shipped]
FBB team contacted: [YES / NO]
Feasibility: [Possible / Not possible / TBD]
Action: Escalated to FBB team.`,
    preSendChecklist: [
      { key: 'fbb_confirmed', label: 'Confirmed this is an FBB order', isRequired: true },
      { key: 'sap_stage_checked', label: 'FBB fulfillment stage checked in SAP', isRequired: true, warning: 'Cannot promise changes if in production.' },
      { key: 'fbb_team_notified', label: 'FBB team notified via Contact Sheet', isRequired: true },
      { key: 'no_promise_made', label: 'Did NOT promise change/cancellation is possible before FBB team confirms', isRequired: true, warning: 'Never promise FBB changes without team confirmation.' },
    ],
    zendeskTags: [
      { tagName: 'fbb_change', tagCategory: 'ISSUE_TYPE', isRequired: false },
      { tagName: 'fbb_cancellation', tagCategory: 'ISSUE_TYPE', isRequired: false },
    ],
    ticketStatus: 'Pending',
    ticketPriority: 'High',
    escalationRules: [
      { triggerReason: 'FBB order already in production', escalateTo: 'Team Leader', details: 'Production changes require management decision.' },
      { triggerReason: 'FBB team unreachable', escalateTo: 'Team Leader', details: 'Escalate if FBB team does not respond within SLA.' },
    ],
    commonMistakes: [
      'Promising FBB changes before checking production status',
      'Not using Contact Sheet for FBB team contact',
      'Applying standard change/cancellation workflow to FBB orders',
    ],
    doRules: ['Check SAP production stage first', 'Contact FBB team before making any commitment', 'Use Contact Sheet for correct contact'],
    dontRules: ['Do not cancel/change FBB orders directly', 'Do not promise changes once in production'],
    sourceNote: 'FBB Process — Contact Sheet.',
    sortOrder: 30,
  },
];
