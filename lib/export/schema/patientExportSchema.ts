import { Order, Patient } from '@/lib/types';
import { formatDateForExport } from '@/lib/utils';

// Helper to create an object with a specific key order
const createOrderedObject = (obj: Record<string, any>, order: string[]) => {
    const newObj: Record<string, any> = {};
    const existingKeys = new Set(Object.keys(obj));

    order.forEach(key => {
        if (existingKeys.has(key)) {
            newObj[key] = obj[key];
        } else {
            newObj[key] = '';
        }
    });

    // Add any extra keys from obj that weren't in the order array
    existingKeys.forEach(key => {
        if (!newObj.hasOwnProperty(key)) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
};


export const patientExportOrder = [
  "Patient ID",
  "Patient Name",
  "DOB",
  "Primary Payer",
  "Status (Latest Referral)",
  "Archived",
  "Active Referrals",
  "Archived Referrals",
  "Latest Referral ID",
  "Latest Referral Updated",
  "Created",
  "Updated",
  "Email",
  "Phone",
  "Address",
  "City",
  "State",
  "ZIP Code",
  "Assigned To ID",
];

export const flattenPatientForExport = (patient: Patient, allPatientOrders: Order[]) => {
    const latestReferral = allPatientOrders.length > 0
        ? [...allPatientOrders].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0]
        : null;

    const isPatientArchived = patient.archived === true;
    const isLatestReferralArchived = latestReferral?.is_archived === true;
    const isLatestReferralClosed = ['Delivered', 'Closed', 'Archived'].includes(latestReferral?.status || '');
    const derivedArchivedStatus = isPatientArchived || isLatestReferralArchived || isLatestReferralClosed;

    const activeReferrals = allPatientOrders.filter(o => !o.is_archived).length;
    const archivedReferrals = allPatientOrders.length - activeReferrals;

    const flat = {
        'Patient ID': patient.id,
        'Patient Name': patient.name,
        'DOB': formatDateForExport(patient.dob, true),
        'Primary Payer': patient.primary_insurance,
        'Status (Latest Referral)': latestReferral?.status || latestReferral?.workflow_stage || '',
        'Archived': derivedArchivedStatus ? 'Yes' : 'No',
        'Active Referrals': activeReferrals,
        'Archived Referrals': archivedReferrals,
        'Latest Referral ID': latestReferral?.id || '',
        'Latest Referral Updated': formatDateForExport(latestReferral?.updated_at || latestReferral?.created_at),
        'Created': formatDateForExport(patient.created_at),
        'Updated': formatDateForExport(patient.updated_at),
        'Email': patient.email,
        'Phone': patient.phone_number,
        'Address': `${patient.address_line1 || ''} ${patient.address_line2 || ''}`.trim(),
        'City': patient.city,
        'State': patient.state,
        'ZIP Code': patient.zip,
        'Assigned To ID': patient.assigned_to,
    };

    return createOrderedObject(flat, patientExportOrder);
};
