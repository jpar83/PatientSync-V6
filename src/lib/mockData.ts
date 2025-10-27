import { faker } from '@faker-js/faker';
import type { Order, WorkflowStage, KpiData, Doctor, Vendor, WorkflowHistoryEntry, Profile, MarketingLead, MarketingTouchpoint, MarketingInService } from './types';

const workflowStages: WorkflowStage[] = [
  "Referral Received",
  "Patient Intake & Demographics",
  "Insurance Verification",
  "Clinical Review",
  "ATP / PT Assessment",
  "Documentation Verification",
  "Preauthorization (PAR)",
  "Vendor / Order Processing",
  "Delivery & Billing",
  "Post-Delivery Follow-up / Archive",
];

const orderStatuses: any[] = ["Pending Intake", "In Progress", "Missing Info", "Verified", "Pending", "Denied"];

const createRandomOrder = (): Order => {
  return {
    id: faker.string.uuid(),
    patient_name: faker.person.fullName(),
    insurance_primary: faker.company.name(),
    chair_type: faker.commerce.productName(),
    accessories: faker.commerce.productAdjective(),
    workflow_stage: faker.helpers.arrayElement(workflowStages),
    status: faker.helpers.arrayElement(orderStatuses),
    rep_name: "Kristin Segal",
    last_stage_change: faker.date.recent().toISOString(),
  } as Order;
};

export const mockOrders: Order[] = Array.from({ length: 88 }, createRandomOrder);

export const mockKpiData: KpiData[] = [
    { title: "Total Open", value: "875", change: "+5.1%", changeType: 'increase' as const },
    { title: "Missing Docs", value: "125", change: "-2.8%", changeType: 'decrease' as const },
    { title: "30/60/90 Aging", value: "42", change: "+10.5%", changeType: 'increase' as const },
    { title: "UHC AOR", value: "18", change: "+2.0%", changeType: 'increase' as const },
];

export const mockDoctors: Doctor[] = Array.from({ length: 5 }, () => ({
    id: faker.string.uuid(),
    name: `Dr. ${faker.person.lastName()}`,
    specialty: faker.person.jobTitle(),
    created_at: new Date().toISOString(),
}));

export const mockVendors: Vendor[] = Array.from({ length: 4 }, () => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    service_type: faker.commerce.department(),
    created_at: new Date().toISOString(),
}));

const createRandomHistoryEntry = (orderId: string): WorkflowHistoryEntry => {
    const stage1 = faker.helpers.arrayElement(workflowStages);
    let stage2 = faker.helpers.arrayElement(workflowStages);
    while (stage1 === stage2) {
        stage2 = faker.helpers.arrayElement(workflowStages);
    }
    return {
        id: faker.string.uuid(),
        order_id: orderId,
        previous_stage: stage1,
        new_stage: stage2,
        note: faker.lorem.sentence(),
        changed_by: "Kristin Segal",
        changed_at: faker.date.recent().toISOString(),
    }
};

export const mockWorkflowHistory: WorkflowHistoryEntry[] = Array.from({ length: 3 }, () => createRandomHistoryEntry(mockOrders[0].id));

export const createRandomProfile = (): Profile => ({
    id: faker.string.uuid(),
    email: faker.internet.email().toLowerCase(),
    full_name: faker.person.fullName(),
    // @ts-ignore
    role: faker.helpers.arrayElement(['user', 'user']),
    created_at: faker.date.past().toISOString(),
});

export const mockProfiles: Profile[] = Array.from({ length: 5 }, createRandomProfile);


// --- Marketing Mock Data ---
const marketingLeadNames = [
    { name: 'Austin Regional Clinic', type: 'Clinic', city: 'Austin', state: 'TX' },
    { name: 'St. David\'s Medical Center', type: 'Hospital', city: 'Austin', state: 'TX' },
    { name: 'Cedar Park Regional Medical Center', type: 'Hospital', city: 'Cedar Park', state: 'TX' },
    { name: 'Leander Primary Care', type: 'PCP', city: 'Leander', state: 'TX' },
    { name: 'Ascension Seton Williamson', type: 'Hospital', city: 'Round Rock', state: 'TX' },
    { name: 'Baylor Scott & White Clinic - Leander', type: 'Clinic', city: 'Leander', state: 'TX' },
    { name: 'The Enclave at Round Rock', type: 'SNF', city: 'Round Rock', state: 'TX' },
    { name: 'Texas Orthopedics', type: 'Clinic', city: 'Austin', state: 'TX' },
    { name: 'NuMotion', type: 'DME', city: 'Austin', state: 'TX'},
    { name: 'Family Practice of Central Texas', type: 'PCP', city: 'Austin', state: 'TX'}
];

const createRandomMarketingLead = (i: number): MarketingLead => {
    const leadDetails = marketingLeadNames[i % marketingLeadNames.length];
    return {
        id: faker.string.uuid(),
        created_at: faker.date.past().toISOString(),
        name: leadDetails.name,
        type: leadDetails.type,
        city: leadDetails.city,
        state: leadDetails.state,
        status: faker.helpers.arrayElement(['Prospect', 'Warm', 'Active', 'Dormant']),
        owner_id: null,
        interests: null,
        notes: faker.lorem.sentence(),
    };
};

export const mockMarketingLeads: MarketingLead[] = Array.from({ length: 10 }, (_, i) => createRandomMarketingLead(i));

const createRandomTouchpoint = (lead: MarketingLead): MarketingTouchpoint => ({
    id: faker.string.uuid(),
    created_at: faker.date.recent().toISOString(),
    lead_id: lead.id,
    channel: faker.helpers.arrayElement(['In-person', 'Call', 'Email', 'Drop-off', 'Event']),
    purpose: faker.helpers.arrayElement(['Intro', 'Follow-up', 'In-service pitch', 'PAR education', 'Relationship']),
    notes: faker.lorem.sentences(2),
    outcome: faker.helpers.arrayElement(['Positive', 'Neutral', 'Negative', 'No response']),
    next_step: faker.lorem.sentence(),
    follow_up_date: faker.date.future().toISOString(),
    marketing_leads: { name: lead.name },
});

export const mockTouchpoints: MarketingTouchpoint[] = mockMarketingLeads.flatMap(lead => 
    Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => createRandomTouchpoint(lead))
).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

const createRandomInService = (lead: MarketingLead): MarketingInService => ({
    id: faker.string.uuid(),
    created_at: faker.date.recent().toISOString(),
    topic: faker.lorem.words(3),
    date_time: faker.date.future().toISOString(),
    location: `${lead.name}, ${lead.city}`,
    host_contact_id: null,
    status: faker.helpers.arrayElement(['Scheduled', 'Completed', 'Proposed', 'Canceled']),
    lead_id: lead.id,
    marketing_leads: { name: lead.name },
});

export const mockInServices: MarketingInService[] = mockMarketingLeads.slice(0, 5).map(createRandomInService)
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

export const createRandomVendorLog = (): any => ({
    id: faker.string.uuid(),
    patient_name: faker.person.fullName(),
    vendor_name: faker.company.name(),
    status: faker.helpers.arrayElement(['sent', 'pending', 'failed']),
    sent_at: faker.date.recent().toISOString(),
    sent_by: faker.internet.email(),
});

export const mockVendorLogs: any[] = Array.from({ length: 15 }, createRandomVendorLog);
