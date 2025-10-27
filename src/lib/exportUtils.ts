import * as XLSX from 'xlsx';
import type { Patient, Order, Vendor, User, Denial } from '@/lib/types';
import { formatDateForExport, daysOld } from '@/lib/utils';
import { flattenReferralForExport } from '@/lib/export/schema/referralsExportSchema';
import { flattenPatientForExport } from '@/lib/export/schema/patientExportSchema';

export const generateExecutiveWorkbook = async ({
    patients,
    referrals,
    vendors,
    denials,
    filters,
    user,
}: {
    patients: Patient[];
    referrals: Order[];
    vendors: Vendor[];
    denials: any[];
    filters: Record<string, any>;
    user: any;
}): Promise<XLSX.WorkBook> => {
    const wb = XLSX.utils.book_new();
    const now = new Date();
    const exportTimestamp = formatDateForExport(now.toISOString());

    // --- 1. Dashboard Overview Sheet ---
    const totalReferrals = referrals.length;
    const readyForPar = referrals.filter(r => {
        const required = r.patients?.required_documents || [];
        if (required.length === 0) return false;
        return required.every(doc => r.document_status?.[doc] === 'Complete');
    }).length;
    const totalDenials = new Set(denials.map(d => d.order_id)).size;
    const avgAge = totalReferrals > 0 ? referrals.reduce((sum, r) => sum + daysOld(r.referral_date), 0) / totalReferrals : 0;
    
    const overviewData = [
        ['Metric', 'Value', 'Trend'],
        ['Total Active Referrals', totalReferrals, '→'],
        ['Ready for PAR', readyForPar, '🔼'],
        ['Total Denials (Unique Referrals)', totalDenials, '🔽'],
        ['Average Referral Age (Days)', avgAge.toFixed(1), '→'],
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Dashboard Overview');

    // --- 2. Summary Sheets ---
    const repSummary = referrals.reduce((acc, r) => {
        const rep = r.rep_name || 'Unassigned';
        if (!acc[rep]) {
            acc[rep] = { 'Referral Count': 0, 'Total Denials': 0, 'Total Days': 0 };
        }
        acc[rep]['Referral Count']++;
        if ((denials.filter(d => d.order_id === r.id).length) > 0) {
            acc[rep]['Total Denials']++;
        }
        acc[rep]['Total Days'] += daysOld(r.referral_date);
        return acc;
    }, {} as Record<string, any>);

    const repSummaryData = Object.entries(repSummary).map(([rep, metrics]) => ({
        'Representative': rep,
        'Referral Count': metrics['Referral Count'],
        'Denial Count': metrics['Total Denials'],
        'Avg. Referral Age': (metrics['Total Days'] / metrics['Referral Count']).toFixed(1),
    }));
    if (repSummaryData.length > 0) {
        const wsRep = XLSX.utils.json_to_sheet(repSummaryData);
        XLSX.utils.book_append_sheet(wb, wsRep, 'Summary_By_Rep');
    }

    const payerSummary = referrals.reduce((acc, r) => {
        const payer = r.patients?.primary_insurance || 'Unassigned';
        if (!acc[payer]) {
            acc[payer] = { 'Referral Count': 0 };
        }
        acc[payer]['Referral Count']++;
        return acc;
    }, {} as Record<string, any>);
    const payerSummaryData = Object.entries(payerSummary).map(([payer, metrics]) => ({
        'Payer': payer,
        'Referral Count': metrics['Referral Count'],
    }));
    if (payerSummaryData.length > 0) {
        const wsPayer = XLSX.utils.json_to_sheet(payerSummaryData);
        XLSX.utils.book_append_sheet(wb, wsPayer, 'Summary_By_Payer');
    }
    
    const equipmentSummary = referrals.reduce((acc, r) => {
        const category = r.equipment?.[0]?.category || 'None';
        if (!acc[category]) {
            acc[category] = { 'Count': 0 };
        }
        acc[category]['Count']++;
        return acc;
    }, {} as Record<string, any>);
    const equipmentSummaryData = Object.entries(equipmentSummary).map(([category, metrics]) => ({
        'Equipment Category': category,
        'Count': metrics['Count'],
    }));
    if (equipmentSummaryData.length > 0) {
        const wsEquip = XLSX.utils.json_to_sheet(equipmentSummaryData);
        XLSX.utils.book_append_sheet(wb, wsEquip, 'Summary_By_Equipment');
    }

    // --- 3 & 4. Extended Referrals & Patients Sheets ---
    const referralExportData = referrals.map(r => flattenReferralForExport(r, now));
    const patientExportData = patients.map(p => flattenPatientForExport(p, referrals.filter(r => r.patient_id === p.id)));

    if (referralExportData.length > 0) {
        const wsReferrals = XLSX.utils.json_to_sheet(referralExportData);
        XLSX.utils.book_append_sheet(wb, wsReferrals, 'Referrals');
    }
    if (patientExportData.length > 0) {
        const wsPatients = XLSX.utils.json_to_sheet(patientExportData);
        XLSX.utils.book_append_sheet(wb, wsPatients, 'Patients');
    }

    // --- 5 & 7. Metadata & Summary Narrative ---
    const summaryNarrative = `This report summarizes ${totalReferrals} active referrals. A total of ${readyForPar} referrals are ready for PAR submission, while ${totalDenials} have at least one denial on record.`;
    const metadataRows = [
        ['Export Generated', exportTimestamp],
        ['Generated By', user?.user_metadata.full_name || user?.email || 'N/A'],
        ['Data Scope', 'Executive Summary'],
        ['App Version', '3.0.0'],
        ['Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone],
        [],
        ['Filters Applied', ''],
        ...Object.entries(filters)
          .filter(([, value]) => value && (!Array.isArray(value) || value.length > 0))
          .map(([key, value]) => [`  ${key.replace(/_/g, ' ')}`, Array.isArray(value) ? value.join(', ') : value.toString()]),
        [],
        ['Total Records', ''],
        ['  Patients', patients.length],
        ['  Referrals', referrals.length],
        ['  Vendors', vendors.length],
        [],
        ['Summary Narrative', summaryNarrative],
    ];
    const wsMeta = XLSX.utils.aoa_to_sheet(metadataRows);
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Metadata');

    return wb;
};
