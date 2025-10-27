export const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export const preferredContactMethods = [
  { value: 'Phone', label: 'Phone' },
  { value: 'Email', label: 'Email' },
  { value: 'Text', label: 'Text Message' },
];

export const caseTypeOptions = [
    { value: 'New Eval', label: 'New Evaluation' },
    { value: 'Rehab Replacement', label: 'Rehab Replacement' },
    { value: 'Repair', label: 'Repair' },
    { value: 'Other', label: 'Other' },
];

export const referralSourceOptions = [
    { value: 'Hospital', label: 'Hospital' },
    { value: 'SNF', label: 'Skilled Nursing Facility' },
    { value: 'Clinic', label: 'Clinic' },
    { value: 'Vendor', label: 'Vendor' },
    { value: 'Self', label: 'Self-Referral' },
    { value: 'Other', label: 'Other' },
];

export const denialReasonOptions = [
    { value: 'Documentation Missing', label: 'Documentation Missing' },
    { value: 'Clinical Review Fail', label: 'Clinical Review Fail' },
    { value: 'Out of Coverage', label: 'Out of Coverage' },
    { value: 'Not Medically Necessary', label: 'Not Medically Necessary' },
    { value: 'Other', label: 'Other' },
];

export const appealOutcomeOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Denied Again', label: 'Denied Again' },
    { value: 'Withdrawn', label: 'Withdrawn' },
];

export const equipmentTypeOptions = [
    { value: 'Power Wheelchair', label: 'Power Wheelchair' },
    { value: 'Manual Wheelchair', label: 'Manual Wheelchair' },
    { value: 'Hospital Bed', label: 'Hospital Bed' },
    { value: 'Walker', label: 'Walker' },
    { value: 'Other', label: 'Other' },
];

export const equipmentStatusOptions = [
    { value: 'Pending Setup', label: 'Pending Setup' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Returned', label: 'Returned' },
    { value: 'Repair', label: 'In for Repair' },
];

export const regressionReasonOptions = [
    { value: 'Documentation Error', label: 'Documentation Error' },
    { value: 'Payer Request', label: 'Payer Request for Info' },
    { value: 'Clinical Update', label: 'Clinical Update/Change' },
    { value: 'Incorrect Stage', label: 'Incorrect Stage Selection' },
    { value: 'Other', label: 'Other' },
];

export const authStatusOptions = [
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Denied', label: 'Denied' },
];

export const touchpointPurposeOptions = [
    { value: 'Intro', label: 'Intro' },
    { value: 'Follow-up', label: 'Follow-up' },
    { value: 'Check-in', label: 'Check-in' },
    { value: 'In-service', label: 'In-service' },
    { value: 'Training', label: 'Training' },
    { value: 'Community Outreach', label: 'Community Outreach' },
    { value: 'Repair Visit', label: 'Repair Visit' },
    { value: 'Delivery', label: 'Delivery' },
    { value: 'Pickup', label: 'Pickup' },
    { value: 'Demo/Training', label: 'Demo/Training' },
    { value: 'Objection Handling', label: 'Objection Handling' },
    { value: 'Thank-you', label: 'Thank-you' },
    { value: 'Escalation', label: 'Escalation' },
    { value: 'Close Won', label: 'Close Won' },
    { value: 'Close Lost', label: 'Close Lost' },
];

export const marketingEventTypeOptions = [
    { value: 'In-Service', label: 'In-Service' },
    { value: 'Repair', label: 'Repair' },
    { value: 'Training', label: 'Training' },
    { value: 'Community', label: 'Community Event' },
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Delivery', label: 'Delivery' },
    { value: 'Pickup', label: 'Pickup' },
    { value: 'Other', label: 'Other' },
];
