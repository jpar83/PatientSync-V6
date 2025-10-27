import React from 'react';
import type { Order } from '../lib/types';
import { cn } from '../lib/utils';
import { highlight } from '../lib/highlight';
import { MoreVertical, Edit, Archive, Eye, RotateCcw, FileText, Loader2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu';
import { Checkbox } from './ui/Checkbox';
import StoplightStatusControl from './StoplightStatusControl';

interface ReferralListItemProps {
  order: Order;
  onViewDetails: () => void;
  onStageChange: (order: Order) => void;
  onArchive: (order: Order) => void;
  onDelete: (order: Order) => void;
  onExportSnapshot: (order: Order) => void;
  isExporting: boolean;
  term?: string;
  isSelected: boolean;
  onToggleSelection: () => void;
  onUpdate: () => void;
}

const ReferralListItem: React.FC<ReferralListItemProps> = ({
  order,
  onViewDetails,
  onStageChange,
  onArchive,
  onDelete,
  onExportSnapshot,
  isExporting,
  term,
  isSelected,
  onToggleSelection,
  onUpdate,
}) => {
  const { patients, workflow_stage, stoplight_status, id: orderId, patient_id: patientId } = order;
  const patientName = patients?.name || 'Unknown Patient';
  const insurance = patients?.primary_insurance || 'N/A';

  return (
    <li
      onClick={onViewDetails}
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 cursor-pointer card",
        isSelected ? "bg-teal-50 dark:bg-teal-900/50" : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
      )}
    >
      <div onClick={(e) => { e.stopPropagation(); onToggleSelection(); }}>
        <Checkbox
            label=""
            checked={isSelected}
            readOnly
            className="h-5 w-5"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <p
              className="font-medium truncate-soft patient-name card-title"
              dangerouslySetInnerHTML={{ __html: highlight(patientName, term || '') }}
            />
            <div className="flex-shrink-0">
              {patientId && (
                <StoplightStatusControl
                  orderId={orderId}
                  patientId={patientId}
                  currentStatus={stoplight_status}
                  onUpdate={onUpdate}
                  showLabel={false}
                />
              )}
            </div>
        </div>
        <p className="text-xs text-muted truncate meta-line">{insurance}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted truncate">{workflow_stage}</span>
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="p-2 -mr-2 rounded-full text-muted hover:bg-gray-200 dark:hover:bg-zinc-700" aria-label="More options">
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onViewDetails}><Eye className="h-4 w-4 mr-2"/>View Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStageChange(order)}><Edit className="h-4 w-4 mr-2"/>Change Stage</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExportSnapshot(order)} disabled={isExporting}>
                        {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                        {isExporting ? 'Generating...' : 'Export Snapshot PDF'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive(order)} className={order.is_archived ? "text-blue-600" : "text-amber-600"}>
                        {order.is_archived ? <RotateCcw className="h-4 w-4 mr-2"/> : <Archive className="h-4 w-4 mr-2"/>}
                        {order.is_archived ? 'Restore' : 'Archive'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(order)} className="text-red-600 dark:text-error">
                        <Trash2 className="h-4 w-4 mr-2"/>
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </li>
  );
};

export default ReferralListItem;
