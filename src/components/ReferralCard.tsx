import React, { useMemo } from 'react';
import type { Order } from '../lib/types';
import { cn } from '../lib/utils';
import { daysOld } from '../lib/utils';
import MiniPipeline from './MiniPipeline';
import { labelMap, DocKey } from '../lib/docMapping';
import { highlight } from '../lib/highlight';
import { MoreVertical, Edit, Archive, Eye, RotateCcw, FileText, Loader2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { Checkbox } from './ui/Checkbox';
import { StoplightBadge } from './ui/StoplightBadge';

interface ReferralCardProps {
  order: Order;
  onViewDetails: () => void;
  onStageChange: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onExportSnapshot: () => void;
  isExporting: boolean;
  term?: string;
  isSelected: boolean;
  onToggleSelection: () => void;
  onUpdate: () => void;
}

const stageStyleMap: Record<string, string> = {
  "Clinical Review": "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
  "Referral Received": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  "Patient Intake & Demographics": "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  "Documentation Verification": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  "Preauthorization (PAR)": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
};

const ReferralCard: React.FC<ReferralCardProps> = React.memo(({ order, onViewDetails, onStageChange, onArchive, onDelete, onExportSnapshot, isExporting, term, isSelected, onToggleSelection, onUpdate }) => {
  const { patients, workflow_stage, last_stage_change, stoplight_status } = order;
  const patientName = patients?.name || 'Unknown Patient';
  const insurance = patients?.primary_insurance || 'N/A';
  const initials = patientName.split(' ').map(n => n[0]).join('').substring(0, 2) || 'R';
  const daysInStage = Math.floor(daysOld(last_stage_change));
  
  const { isReadyForPar, firstMissingDocKey } = useMemo(() => {
    const requiredDocs = patients?.required_documents || [];
    const firstMissing = requiredDocs.find(key => order.document_status?.[key] !== 'Complete');
    const ready = requiredDocs.length > 0 && !firstMissing;
    return { isReadyForPar: ready, firstMissingDocKey: firstMissing };
  }, [patients?.required_documents, order.document_status]);

  const stoplightTooltips = {
      green: 'Good to Go',
      yellow: 'Risk / Needs Review',
      red: 'Declined / Stop'
  };

  return (
    <li
      className={cn(
        "relative flex items-start gap-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm transition-all card h-full",
        isSelected ? "shadow-md ring-2 ring-teal-500" : "hover:shadow-md"
      )}
    >
      <div className="pt-3 pl-1" onClick={(e) => { e.stopPropagation(); onToggleSelection(); }}>
        <Checkbox
            label=""
            checked={isSelected}
            readOnly
            className="h-5 w-5"
        />
      </div>
      <div className="flex-1 flex flex-col gap-3 cursor-pointer min-w-0" onClick={onViewDetails}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
            <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div title={stoplightTooltips[stoplight_status || 'green']}>
                <StoplightBadge color={stoplight_status || 'green'} />
              </div>
              <p 
                className="font-semibold truncate-soft patient-name card-title"
                dangerouslySetInnerHTML={{ __html: highlight(patientName, term || '') }}
              />
            </div>
            <p className="text-xs text-muted truncate meta-line">{insurance}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
            <span
              className={cn(
                "whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
                stageStyleMap[workflow_stage || ''] || "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300"
              )}
            >
              {workflow_stage}
            </span>
            {isReadyForPar ? (
              <span className="text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300 rounded-full px-2 py-0.5">Ready for PAR</span>
            ) : firstMissingDocKey ? (
              <span className="text-xs font-semibold text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-full px-2 py-0.5" title={`Missing: ${labelMap[firstMissingDocKey as DocKey]}`}>
                Missing Doc
              </span>
            ) : (
              <span className="text-[10px] text-muted whitespace-nowrap">
                {daysInStage}d in stage
              </span>
            )}
          </div>
        </div>
        {workflow_stage && <MiniPipeline currentStage={workflow_stage} />}
      </div>
      <div id="tour-referrals-actions" className="pt-1" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 -mr-1 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-zinc-800" aria-label="More options">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewDetails}><Eye className="h-4 w-4 mr-2"/>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={onStageChange}><Edit className="h-4 w-4 mr-2"/>Change Stage</DropdownMenuItem>
            <DropdownMenuItem onClick={onExportSnapshot} disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                {isExporting ? 'Generating...' : 'Export Snapshot PDF'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onArchive} className={order.is_archived ? "text-blue-600" : "text-amber-600"}>
              {order.is_archived ? <RotateCcw className="h-4 w-4 mr-2"/> : <Archive className="h-4 w-4 mr-2"/>}
              {order.is_archived ? 'Restore' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-error">
                <Trash2 className="h-4 w-4 mr-2"/>
                Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
});

export default ReferralCard;
