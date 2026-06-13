import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_WORKFLOWS } from '../src/lib/workflows/default-workflows';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Capelli CS Workflow Coach database...');

  // ─── Users ─────────────────────────────────────────────────────────────────
  const users = [
    { name: 'Admin User', email: 'admin@capelliCS.com', password: 'Admin123!', role: 'ADMIN' as const },
    { name: 'Team Leader', email: 'teamlead@capelliCS.com', password: 'Leader123!', role: 'TEAM_LEADER' as const },
    { name: 'CS Trainer', email: 'trainer@capelliCS.com', password: 'Trainer123!', role: 'TRAINER' as const },
    { name: 'CS Agent', email: 'agent@capelliCS.com', password: 'Agent123!', role: 'AGENT' as const },
    { name: 'QA Reviewer', email: 'qa@capelliCS.com', password: 'QA1234567!', role: 'QA' as const },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password: hashed,
        role: u.role,
        isActive: true,
        avatarInitials: u.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2),
      },
    });
    console.log(`  ✓ User: ${u.email} (${u.role})`);
  }

  // ─── Workflows ─────────────────────────────────────────────────────────────
  for (const wf of DEFAULT_WORKFLOWS) {
    const existing = await prisma.workflow.findUnique({ where: { workflowId: wf.workflowId } });
    if (existing) {
      console.log(`  ~ Workflow already exists: ${wf.name}`);
      continue;
    }

    await prisma.workflow.create({
      data: {
        workflowId: wf.workflowId,
        name: wf.name,
        category: wf.category as any,
        triggerPhrases: wf.triggerPhrases,
        whenToUse: wf.whenToUse,
        doNotUseWhen: wf.doNotUseWhen,
        requiredInfo: wf.requiredInfo,
        systemChecks: wf.systemChecks as any[],
        status: 'APPROVED',
        isBuiltIn: true,
        sortOrder: wf.sortOrder,
        steps: {
          create: wf.steps.map(s => ({
            stepNumber: s.stepNumber,
            title: s.title,
            description: s.description,
            agentAction: s.agentAction ?? null,
            warning: s.warning ?? null,
            isRequired: s.isRequired,
          })),
        },
        templates: {
          create: [
            {
              name: `${wf.name} — Customer Email`,
              type: 'CUSTOMER_EMAIL' as const,
              subject: `Re: Your Capelli Sports Order`,
              body: wf.customerEmailTemplate,
              placeholders: extractPlaceholders(wf.customerEmailTemplate),
              status: 'APPROVED',
            },
            {
              name: `${wf.name} — Internal Note`,
              type: 'INTERNAL_NOTE' as const,
              body: wf.internalNoteTemplate,
              placeholders: extractPlaceholders(wf.internalNoteTemplate),
              status: 'APPROVED',
            },
          ],
        },
        zendeskTags: {
          create: wf.zendeskTags.map(t => ({
            tagName: t.tagName,
            tagCategory: t.tagCategory as any,
            isRequired: t.isRequired,
            isApproved: true,
          })),
        },
        escalationRules: {
          create: wf.escalationRules.map(r => ({
            triggerReason: r.triggerReason,
            escalateTo: r.escalateTo ?? null,
            details: r.details,
          })),
        },
        commonMistakes: {
          create: wf.commonMistakes.map((m, i) => ({
            mistake: m,
            sortOrder: i,
          })),
        },
      },
    });
    console.log(`  ✓ Workflow: ${wf.name}`);
  }

  // ─── App Settings ──────────────────────────────────────────────────────────
  const settings = [
    { key: 'app_name', value: 'Capelli CS Workflow Coach', category: 'general' },
    { key: 'max_upload_size_mb', value: '50', category: 'documents' },
    { key: 'ai_model', value: 'gpt-4o', category: 'ai' },
    { key: 'embedding_model', value: 'text-embedding-3-small', category: 'ai' },
    { key: 'max_search_results', value: '8', category: 'ai' },
    { key: 'low_confidence_threshold', value: '60', category: 'ai' },
    { key: 'require_checklist_before_copy', value: 'true', category: 'policy' },
    { key: 'audit_all_email_copies', value: 'true', category: 'policy' },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`  ✓ App settings seeded`);

  // ─── Admin Update ──────────────────────────────────────────────────────────
  await prisma.adminUpdate.upsert({
    where: { id: 'welcome-update' } as any,
    update: {},
    create: {
      title: 'Welcome to Capelli CS Workflow Coach!',
      message: 'To enable AI-powered guidance, upload your Capelli training documents in Admin › Upload Docs. The AI needs your materials to cite policies correctly.',
      isActive: true,
      visibleTo: [],
    },
  }).catch(() =>
    prisma.adminUpdate.create({
      data: {
        title: 'Welcome to Capelli CS Workflow Coach!',
        message: 'To enable AI-powered guidance, upload your Capelli training documents in Admin › Upload Docs. The AI needs your materials to cite policies correctly.',
        isActive: true,
        visibleTo: [],
      },
    })
  );
  console.log('  ✓ Welcome announcement created');

  // ─── Sample Training Scenarios ─────────────────────────────────────────────
  const scenarios = [
    {
      title: 'The Customized Jersey Return',
      category: 'CUSTOMIZED_ITEM_RETURN' as const,
      difficulty: 'BEGINNER' as const,
      complaint: "Hi, I ordered a jersey with my son's name and number on it but it arrived with the wrong number. I want to return it for a full refund.",
      correctWorkflow: 'customized_item_return',
      hints: [
        'The item has customization (name + number)',
        "The error was on the customer's submission, not Capelli's production",
        'Review the customized item return policy carefully',
      ],
      explanation: 'This requires the Customized Item Return workflow. Even though the customer received an item with the wrong number, it was based on what they submitted. No return is accepted for correctly-produced customized items.',
      isPublished: true,
    },
    {
      title: 'The Missing Item',
      category: 'MISSING_ITEM' as const,
      difficulty: 'BEGINNER' as const,
      complaint: 'I received my order but one of the items is missing. I ordered 3 jerseys but only got 2.',
      correctWorkflow: 'missing_item',
      hints: [
        'Check if the order was split into multiple shipments',
        'Check SAP for OBD and wave details',
        'Require photo evidence of what was received',
      ],
      explanation: 'Use the Missing Item workflow. Check SAP first before issuing a replacement — it may be a split shipment. Require photographic evidence of the received package.',
      isPublished: true,
    },
    {
      title: 'The Refund Request',
      category: 'REFUND_REQUEST' as const,
      difficulty: 'INTERMEDIATE' as const,
      complaint: 'I want my money back. I ordered the wrong size and Capelli doesn\'t accept exchanges. This is unacceptable.',
      correctWorkflow: 'refund_request',
      hints: [
        'Capelli does not do direct exchanges — they do replacements',
        'Check if original item can be returned',
        'Remain empathetic but policy-bound',
      ],
      explanation: 'Use the Refund Request workflow. Capelli does not do direct exchanges. If the customer ordered the wrong size themselves, standard return policy applies and a refund may not be possible for team store items.',
      isPublished: true,
    },
  ];

  for (const s of scenarios) {
    const existing = await prisma.trainingScenario.findFirst({ where: { title: s.title } });
    if (!existing) {
      await prisma.trainingScenario.create({ data: s });
      console.log(`  ✓ Training scenario: ${s.title}`);
    }
  }

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Demo Accounts:');
  for (const u of users) {
    console.log(`   ${u.role.padEnd(12)} ${u.email}  /  ${u.password}`);
  }
}

function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\[([^\]]+)\]/g) ?? [];
  return Array.from(new Set(matches));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
