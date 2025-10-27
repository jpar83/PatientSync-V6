import { Step } from 'react-joyride';

export const dashboardSteps: Step[] = [
  {
    target: '#tour-step-1-kpis',
    content: 'These cards give you a high-level overview of your key metrics. Click on them to see more details.',
    title: 'Dashboard KPIs',
    disableBeacon: true,
  },
  {
    target: '#tour-step-2-filters',
    content: 'Use this button to open the filter drawer. You can filter your dashboard by date, payer, region, and more.',
    title: 'Filter Your Data',
  },
  {
    target: '#tour-step-3-export',
    content: 'Export your current dashboard view or a full data dump to Excel or PDF.',
    title: 'Export Data',
  },
  {
    target: '#tour-fab',
    content: 'This is the Quick Actions button. Use it to add new referrals, upload reports, and more, from anywhere in the app.',
    title: 'Quick Actions',
    placement: 'top',
  },
  {
    target: '#tour-step-5-nav',
    content: 'Use these tabs to navigate between the main sections of the application.',
    title: 'Main Navigation',
    placement: 'right',
  },
];

export const referralsSteps: Step[] = [
  {
    target: '#tour-referrals-filters',
    content: 'This bar lets you filter referrals. You can use quick filters for common stages or click \'Advanced\' for more options.',
    title: 'Filter Your View',
    disableBeacon: true,
  },
  {
    target: '#tour-referrals-actions-group',
    content: 'Use these actions to manage your list. You can toggle archived items, select all referrals for bulk updates, or export your current view.',
    title: 'List Actions',
  },
  {
    target: '#tour-referrals-list',
    content: 'This is your main list of referrals. Click on any card to view its full details.',
    title: 'Your Referrals',
  },
  {
    target: '#tour-referrals-actions',
    content: 'Use this menu for quick actions on a single referral, like changing its stage or exporting a PDF snapshot.',
    title: 'Quick Actions',
    placement: 'left',
  },
];

export const marketingSteps: Step[] = [
  {
    target: '#tour-marketing-tabs',
    content: 'Switch between your Leads, your activity Journal, and your event Calendar.',
    title: 'Marketing Hub',
    disableBeacon: true,
  },
  {
    target: '#tour-marketing-card',
    content: 'Each card gives you a quick overview of a lead. Click the menu to edit or delete.',
    title: 'Lead Card',
  },
  {
    target: '#tour-fab',
    content: 'Use the quick actions button to add a new lead, log a touchpoint, or schedule an in-service.',
    title: 'Log Marketing Activity',
    placement: 'top',
  },
];

export const myAccountsSteps: Step[] = [
  {
    target: '#tour-accounts-list',
    content: 'This list shows all insurance payers. You can see key metrics like compliance and how many referrals are ready for PAR.',
    title: 'Payer Accounts',
    disableBeacon: true,
  },
  {
    target: '#tour-accounts-card',
    content: 'Clicking on any account card will take you to the Referrals page, pre-filtered to show only referrals for that payer.',
    title: 'Filter by Payer',
  },
];

export const settingsSteps: Step[] = [
  {
    target: '#tour-settings-tabs',
    content: 'Navigate between different settings panels here.',
    title: 'Settings Navigation',
    disableBeacon: true,
  },
  {
    target: '#tour-settings-panel',
    content: 'In the Profile panel, you can update your name, password, and avatar. Other panels allow you to manage doctors, vendors, and insurance providers.',
    title: 'Manage Your Account',
    placement: 'bottom',
  },
];

export const stoplightSteps: Step[] = [
  {
    target: 'body',
    content: 'The Stoplight System helps you quickly see the health of a referral. Let\'s see how it works.',
    title: 'The Stoplight System',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: '🟢 Green means the referral is ready to start and has no immediate risks. 🟡 Yellow means it needs review for missing docs or potential issues. 🔴 Red means it is blocked, denied, or closed.',
    title: 'Color Meanings',
    placement: 'center',
  },
  {
    target: '#tour-stoplight-dot',
    content: 'You can see the current status of any referral with this colored dot.',
    title: 'Status at a Glance',
  },
  {
    target: '#tour-stoplight-changer',
    content: 'Click here to manually change the stoplight status. This is useful when conditions change, like receiving new information.',
    title: 'Change Status',
    placement: 'bottom',
  },
  {
    target: '#tour-stoplight-filter',
    content: 'You can also filter your main referral list by stoplight color to prioritize your work.',
    title: 'Filter by Status',
  },
  {
    target: 'body',
    content: 'When you import a new report, you\'ll be asked to set a default stoplight color for all new referrals in that batch.',
    title: 'Importing',
    placement: 'center',
  },
  {
    target: 'body',
    content: 'That\'s it! Use the Stoplight System to prioritize your day: Green first, then Yellow, and review Red weekly.',
    title: 'Summary',
    placement: 'center',
  },
];
