import { Order } from '@/lib/types';
import { formatDateForExport, daysOld, mostRecentDenial } from '@/lib/utils';
import workflowData from '../../../../schemas/workflow.json';

const allStages = workflowData.workflow.map(w => w.stage);

// Shared column schema
export const referralExportOrder = [
    'Referral ID',
    'Patient',
    'DOB',
    'Payer',
    'Status',
    'Archived',
    'Delivered Date',
    'Created',
    'Updated',
    'Patient ID',
    'Assigned Rep',
    'Payer Type',
    'Region',
    'Referral Date',
    'Referral Age (Days)',
    'Referral Aging Category',
    'Workflow Stage',
    'Workflow Progress %',
    'Days in Stage',
    'Docs Missing',
    'Docs Completion Ratio',
    'Is Urgent',
    'Denials Count',
    'Latest Denial Reason',
    'Days Since Last Denial',
    'Equipment Category',
    'Equipment Model',
    'Chair Type',
    'Vendor ID'
];

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

    existingKeys.forEach(key => {
        if (!newObj.hasOwnProperty(key)) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
};

export const flattenReferralForExport = (r: Order, exportTimestamp: Date) => {
    const docsMissingCount = (r.patients?.required_documents || []).filter(
        docKey => r.document_status?.[docKey] !== 'Complete'
    ).length;
    const totalDocs = (r.patients?.required_documents || []).length;
    const docsCompletionRatio = totalDocs > 0 ? `${totalDocs - docsMissingCount}/${totalDocs}` : 'N/A';

    const payerName = r.patients?.primary_insurance?.toLowerCase() || '';
    let payerType = 'Commercial';
    if (payerName.includes('medicare')) payerType = 'Medicare';
    else if (payerName.includes('medicaid')) payerType = 'Medicaid';

    const referralAge = r.referral_date ? Math.floor(daysOld(r.referral_date)) : 0;
    let referralAgingCategory = 'N/A';
    if (referralAge <= 30) referralAgingCategory = '0-30 Days';
    else if (referralAge <= 60) referralAgingCategory = '31-60 Days';
    else if (referralAge <= 90) referralAgingCategory = '61-90 Days';
    else referralAgingCategory = '91+ Days';

    const stageIndex = allStages.indexOf(r.workflow_stage || '');
    const workflowProgress = stageIndex !== -1 ? Math.round(((stageIndex + 1) / allStages.length) * 100) : 0;
    const isUrgent = referralAge > 90 && docsMissingCount > 0;

    const denial = mostRecentDenial(r.denials);
    const denialCount = r.denials?.length ?? 0;
    const denialLatestDays = denial ? daysOld(denial.denial_date).toFixed(0) : '';
    const denialLatestReason = denial?.reason_text ?? '';

    const latestEquipment = (r.equipment || []).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const equipmentCategory = latestEquipment?.category ?? '';
    const equipmentModel = latestEquipment?.model ?? '';

    const status = r.status || r.workflow_stage || "";
    const archived = r.is_archived ? "Yes" : "No";
    const deliveryDate = latestEquipment?.date_delivered || (r as any).delivery_date || null;

    const flat = {
        'Referral ID': r.id,
        'Patient': r.patients?.name,
        'DOB': formatDateForExport(r.patients?.dob, true),
        'Payer': r.patients?.primary_insurance,
        'Status': status,
        'Archived': archived,
        'Delivered Date': formatDateForExport(deliveryDate, true),
        'Created': formatDateForExport(r.created_at, true),
        'Updated': formatDateForExport(r.updated_at, true),
        'Patient ID': r.patient_id,
        'Assigned Rep': r.rep_name,
        'Payer Type': payerType,
        'Region': r.payer_region || 'N/A',
        'Referral Date': formatDateForExport(r.referral_date, true),
        'Referral Age (Days)': referralAge,
        'Referral Aging Category': referralAgingCategory,
        'Workflow Stage': r.workflow_stage,
        'Workflow Progress %': `${workflowProgress}%`,
        'Days in Stage': r.last_stage_change ? Math.floor(daysOld(r.last_stage_change)) : 0,
        'Docs Missing': docsMissingCount,
        'Docs Completion Ratio': docsCompletionRatio,
        'Is Urgent': isUrgent ? 'Yes' : 'No',
        'Denials Count': denialCount,
        'Latest Denial Reason': denialLatestReason,
        'Days Since Last Denial': denialLatestDays,
        'Equipment Category': equipmentCategory,
        'Equipment Model': equipmentModel,
        'Chair Type': r.chair_type,
        'Vendor ID': r.vendor_id,
    };
    return createOrderedObject(flat, referralExportOrder);
};
