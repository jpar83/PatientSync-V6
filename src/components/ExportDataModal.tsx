import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Button } from './ui/button';
import { Select } from './ui/Select';
import { Checkbox } from './ui/Checkbox';
import { Loader2, Download, AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Patient, Order, Vendor } from '@/lib/types';
import { generateExecutiveWorkbook } from '@/lib/exportUtils';
import { flattenReferralForExport } from '@/lib/export/schema/referralsExportSchema';
import { flattenPatientForExport } from '@/lib/export/schema/patientExportSchema';
import { cn } from '@/lib/utils';

type ExportScope = 'current_view' | 'all_referrals' | 'all_patients' | 'all_data_workbook' | 'vendors' | 'summary_pdf' | 'executive_summary';
type ExportFormat = 'xlsx' | 'csv';
type ExportType = 'current' | 'choose';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: 'referrals' | 'patients';
  dataSets: {
    patients: Patient[];
    referrals: Order[];
    allReferrals: Order[];
    vendors: Vendor[];
  };
  currentViewData: (Order[] | Patient[]);
  isViewFiltered: boolean;
  viewQuery: Record<string, any>;
  filters: Record<string, any>;
  dashboardMetrics?: Record<string, any>;
  orders: Order[];
  regressionInsights: { reason: string; count: number }[];
  activityFeed: { patient_name: string; content: string; timestamp: string }[];
  user: any;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  context = 'referrals',
  dataSets,
  currentViewData,
  isViewFiltered,
  viewQuery,
  filters,
  dashboardMetrics,
  orders,
  regressionInsights,
  activityFeed,
  user,
}) => {
  const [exportType, setExportType] = useState<ExportType>(isViewFiltered ? 'current' : 'choose');
  const [selectedScope, setSelectedScope] = useState<ExportScope>(context === 'referrals' ? 'all_referrals' : 'all_patients');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [addWatermark, setAddWatermark] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(true);

  const isCurrentViewExport = exportType === 'current';

  useEffect(() => {
    if (isOpen) {
      setExportType(isViewFiltered ? 'current' : 'choose');
      if (context === 'patients') {
        setSelectedScope('all_patients');
      }
    }
  }, [isViewFiltered, isOpen, context]);

  const finalScope = exportType === 'current' ? 'current_view' : selectedScope;
  const isFormatDisabled = useMemo(() => ['all_data_workbook', 'summary_pdf', 'executive_summary'].includes(finalScope), [finalScope]);

  const { data: allDenials } = useQuery({
    queryKey: ['all_denials_for_export'],
    queryFn: async () => {
        const { data, error } = await supabase.from('denials').select('order_id');
        if (error) {
            console.error("Error fetching denials for export:", error);
            return [];
        }
        return data;
    },
    enabled: isOpen,
  });

  const enhanceSheet = (ws: XLSX.WorkSheet, data: any[], tabColor: string, isAoa: boolean = false) => {
    if (!ws || !data || data.length === 0) return;

    const getVal = (row: any, index: number) => isAoa ? row[index] : row[Object.keys(row)[index]];
    const getHeader = (index: number) => isAoa ? data[0][index] : Object.keys(data[0])[index];

    const columnCount = isAoa ? data[0].length : Object.keys(data[0]).length;
    const columnWidths = Array.from({ length: columnCount }, (_, i) => {
      const header = getHeader(i);
      const maxLength = Math.max(
        (header ? String(header).length : 0),
        ...data.map(row => (getVal(row, i) ? String(getVal(row, i)).length : 0))
      );
      return { wch: maxLength + 2 };
    });
    ws['!cols'] = columnWidths;

    ws['!view'] = { state: 'frozen', ySplit: 1 };

    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "FFF3F4F6" } }
    };
    const range = XLSX.utils.decode_range(ws['!ref']!);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (ws[cellAddress]) {
        ws[cellAddress].s = headerStyle;
      }
    }

    if (!ws['!props']) ws['!props'] = {};
    ws['!props'].tabColor = { rgb: tabColor };
  };

  const handleExport = async () => {
    setIsExporting(true);
    toast('Preparing export...', 'ok');

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      
      const metadataRows = [
        ['Export Generated', now.toLocaleString('en-US')],
        ['Generated By', user?.user_metadata.full_name || user?.email || 'N/A'],
        ['Data Scope', finalScope],
        ['Filters Applied', ''],
        ...Object.entries(filters)
          .filter(([, value]) => value && (!Array.isArray(value) || value.length > 0))
          .map(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const formattedValue = Array.isArray(value) ? value.join(', ') : value.toString();
            return [`  ${formattedKey}`, formattedValue];
          }),
      ];

      if (finalScope === 'summary_pdf') {
        if (dashboardMetrics) {
          await generateDashboardSummaryPDF({
            metrics: dashboardMetrics,
            filters,
            orders,
            regressionInsights,
            activityFeed,
            user,
            options: { includeCoverPage, addWatermark },
          });
          toast(`✅ Dashboard Summary PDF saved.`, 'ok');
        } else {
          toast('Dashboard metrics not available for export.', 'warning');
        }
      } else if (finalScope === 'executive_summary') {
        const wb = await generateExecutiveWorkbook({
            patients: dataSets.patients,
            referrals: dataSets.allReferrals,
            vendors: dataSets.vendors,
            denials: allDenials || [],
            filters,
            user,
        });
        const regionFilter = filters.region && filters.region !== 'all' ? String(filters.region).replace(/\s/g, '_') : 'AllRegions';
        const fileName = `PatientSync_Executive_Summary_${timestamp}_${regionFilter}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast(`✅ Executive Summary saved.`, 'ok');

      } else if (finalScope === 'all_data_workbook') {
        const wb = XLSX.utils.book_new();
        
        const ws_meta = XLSX.utils.aoa_to_sheet(metadataRows);
        enhanceSheet(ws_meta, metadataRows, "A9A9A9", true);
        XLSX.utils.book_append_sheet(wb, ws_meta, 'Metadata');

        const allPatientOrders = dataSets.allReferrals || [];
        const patientsToExport = includeArchived
            ? dataSets.patients
            : dataSets.patients.filter(p => {
                const patientOrders = allPatientOrders.filter(o => o.patient_id === p.id);
                const latestReferral = patientOrders.length > 0 ? [...patientOrders].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0] : null;
                return !(p.archived || latestReferral?.is_archived || ['Delivered', 'Closed', 'Archived'].includes(latestReferral?.status || ''));
            });

        const patientExportData = patientsToExport.map(p => flattenPatientForExport(p, allPatientOrders.filter(o => o.patient_id === p.id)));
        if (patientExportData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(patientExportData);
            enhanceSheet(ws, patientExportData, "92D050");
            XLSX.utils.book_append_sheet(wb, ws, 'Patients');
        }

        const referralsToExport = includeArchived
          ? dataSets.allReferrals
          : dataSets.allReferrals.filter(r => !r.is_archived);

        const referralExportData = referralsToExport.map(r => flattenReferralForExport(r, now));
        if (referralExportData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(referralExportData);
            enhanceSheet(ws, referralExportData, "0070C0");
            XLSX.utils.book_append_sheet(wb, ws, 'Referrals');
        }

        const regionFilter = filters.region && filters.region !== 'all' ? String(filters.region).replace(/\s/g, '_') : 'AllRegions';
        const fileName = `PatientSync_Export_All_${timestamp}_${regionFilter}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast(`✅ Exported All Data – ${fileName} saved.`, 'ok');

      } else {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metadataRows), 'Metadata');
        
        let dataToExport: any[], sheetName: string, toastMessage: string;
        
        switch(finalScope) {
            case 'current_view':
                if (context === 'referrals') {
                    dataToExport = (currentViewData as Order[]).map(r => flattenReferralForExport(r, now));
                    sheetName = 'Referrals (Current View)';
                } else { // context === 'patients'
                    dataToExport = (currentViewData as Patient[]).map(p => flattenPatientForExport(p, dataSets.allReferrals.filter(o => o.patient_id === p.id)));
                    sheetName = 'Patients (Current View)';
                }
                const filterDesc = Object.keys(viewQuery).length > 0 ? Object.entries(viewQuery).map(([k, v]) => `${k}: ${v}`).join(', ') : 'no filters';
                toastMessage = `Exported ${currentViewData.length} ${context} — scope: Current view (${filterDesc}).`;
                break;
            case 'all_referrals':
                const referralsToExport = includeArchived ? dataSets.allReferrals : dataSets.allReferrals.filter(r => !r.is_archived);
                dataToExport = referralsToExport.map(r => flattenReferralForExport(r, now));
                sheetName = 'All Referrals';
                toastMessage = `Exported ${dataToExport.length} referrals.`;
                break;
            case 'all_patients':
                const allPatientOrders = dataSets.allReferrals || [];
                let patientsToExport = dataSets.patients || [];
                if (!includeArchived) {
                    patientsToExport = patientsToExport.filter(p => {
                        const patientOrders = allPatientOrders.filter(o => o.patient_id === p.id);
                        const latestReferral = patientOrders.length > 0 ? [...patientOrders].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0] : null;
                        return !(p.archived || latestReferral?.is_archived || ['Delivered', 'Closed', 'Archived'].includes(latestReferral?.status || ''));
                    });
                }
                dataToExport = patientsToExport.map(p => flattenPatientForExport(p, allPatientOrders.filter(o => o.patient_id === p.id)));
                sheetName = 'All Patients';
                toastMessage = `Exported ${dataToExport.length} patients.`;
                break;
            default:
                dataToExport = [];
                sheetName = 'Export';
                toastMessage = 'No data to export for this scope.';
        }

        const fileName = `PatientSync_Export_${finalScope}_${timestamp}`;

        if (dataToExport.length > 0) {
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            if (format === 'xlsx') {
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
                XLSX.writeFile(wb, `${fileName}.xlsx`);
            } else {
                const csv = XLSX.utils.sheet_to_csv(ws);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                saveAs(blob, `${fileName}.csv`);
            }
            toast(toastMessage, 'ok');
        } else {
            toast('No data to export for the selected scope.', 'warning');
        }
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast('An error occurred during export.', 'err');
    } finally {
      setIsExporting(false);
    }
  };
  
  const scopeOptions = [
    ...(context === 'referrals' ? [
        { value: 'current_view', label: 'Referrals (Current View)', disabled: true },
        { value: 'all_referrals', label: 'All Active Referrals' },
    ] : []),
    ...(context === 'patients' ? [
        { value: 'current_view', label: 'Patients (Current View)', disabled: true },
        { value: 'all_patients', label: 'All Patients (Simple)' },
    ] : []),
    { value: 'all_data_workbook', label: 'All Data Workbook (Simple)' },
    { value: 'executive_summary', label: 'Executive Summary (XLSX)' },
    { value: 'summary_pdf', label: 'Dashboard Summary (PDF)' },
  ];

  const formatOptions = [
    { value: 'xlsx', label: 'Excel (.xlsx)' },
    { value: 'csv', label: 'CSV (.csv)', disabled: isFormatDisabled },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>Export Data</DialogHeader>
        <div className="p-6 space-y-4">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-muted">Export scope</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 dark:bg-zinc-800 p-1">
                    <button onClick={() => setExportType('current')} disabled={!isViewFiltered} className={cn('px-3 py-1.5 rounded-md text-sm font-medium', exportType === 'current' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-muted', !isViewFiltered && 'opacity-50 cursor-not-allowed')}>
                        Use current view
                    </button>
                    <button onClick={() => setExportType('choose')} className={cn('px-3 py-1.5 rounded-md text-sm font-medium', exportType === 'choose' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-muted')}>
                        Choose scope here
                    </button>
                </div>
                <p className="text-xs text-muted px-1">Note: When ‘Use current view’ is selected, your on-screen filters and sort order determine what gets exported.</p>
            </div>
            
            <Select
                label="Data Scope"
                options={scopeOptions}
                value={isCurrentViewExport ? 'current_view' : selectedScope}
                onChange={(e) => {
                  const newScope = e.target.value as ExportScope;
                  setSelectedScope(newScope);
                  if (['all_data_workbook', 'summary_pdf', 'executive_summary'].includes(newScope)) setFormat('xlsx');
                }}
                disabled={isCurrentViewExport}
            />

            {(finalScope === 'all_data_workbook' || finalScope === 'all_patients' || finalScope === 'all_referrals') && !isCurrentViewExport && (
                <div className="pl-2 pt-2">
                    <Checkbox
                        label="Include archived"
                        checked={includeArchived}
                        onChange={(e) => setIncludeArchived(e.target.checked)}
                    />
                </div>
            )}

            <Select
                label="File Format"
                options={formatOptions}
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                disabled={isFormatDisabled}
            />

            {finalScope === 'summary_pdf' && (
                <div className="p-4 border-t dark:border-zinc-800 mt-4 space-y-3">
                <h4 className="text-sm font-medium text-muted">PDF Options</h4>
                <Checkbox
                    label="Include Cover Page"
                    checked={includeCoverPage}
                    onChange={(e) => setIncludeCoverPage(e.target.checked)}
                />
                <Checkbox
                    label="Add 'Confidential' Watermark"
                    checked={addWatermark}
                    onChange={(e) => setAddWatermark(e.target.checked)}
                />
                </div>
            )}
            
            {isFormatDisabled && (
                <div className="flex items-start p-3 text-xs text-amber-800 bg-amber-50 dark:bg-amber-900/40 dark:text-amber-200 rounded-lg" role="alert">
                <AlertTriangle className="flex-shrink-0 inline w-4 h-4 mr-2 mt-0.5"/>
                <div>
                    {finalScope === 'summary_pdf' 
                    ? 'Dashboard Summary is only available as a PDF.'
                    : 'This export requires Excel format for multiple sheets and advanced formatting.'
                    }
                </div>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancel</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {isExporting ? 'Preparing export...' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDataModal;
