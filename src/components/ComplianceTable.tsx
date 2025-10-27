import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order, DocumentTemplate } from '../lib/types';
import { highlight } from '../lib/highlight';
import { cn } from '../lib/utils';
import { DocToggleButton } from './DocToggleButton';

interface ComplianceTableProps {
  orders: Order[];
  documents: DocumentTemplate[];
  patientFilter: string;
}

const ComplianceRow = React.memo(({ order, documents, patientFilter, isScrolled, navigate }: {
    order: Order;
    documents: DocumentTemplate[];
    patientFilter: string;
    isScrolled: boolean;
    navigate: (path: string) => void;
}) => (
    <tr className="border-b hover:bg-gray-50">
        <td className={cn("font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50 z-10 w-48 min-w-48 border-b", isScrolled && "shadow-md")}>
            <button
                onClick={() => navigate(`/referrals?patientId=${order.patients?.id}`)}
                className="text-teal-600 hover:underline text-left focus-ring rounded"
                title={`View details for ${order.patients?.name}`}
            >
                <span dangerouslySetInnerHTML={{ __html: highlight(order.patients?.name || 'Unknown', patientFilter) }} />
            </button>
        </td>
        {documents.map(doc => {
            const isRequired = order.patients?.required_documents?.includes(doc.abbrev);
            if (!isRequired) {
                return <td key={doc.abbrev} className="text-center text-gray-300 border-b">-</td>;
            }
            const status = order.document_status?.[doc.abbrev];
            return (
                <td key={doc.abbrev} className="text-center border-b">
                <DocToggleButton
                    orderId={order.id}
                    patientName={order.patients?.name || 'Unknown'}
                    docAbbrev={doc.abbrev}
                    initialStatus={status}
                />
                </td>
            );
        })}
    </tr>
));

const ComplianceTable: React.FC<ComplianceTableProps> = ({ orders, documents, patientFilter }) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  const handleScroll = () => {
    if (tableContainerRef.current) {
      setIsScrolled(tableContainerRef.current.scrollLeft > 0);
    }
  };

  return (
    <div ref={tableContainerRef} onScroll={handleScroll} className="overflow-auto h-[calc(100vh-320px)] border rounded-xl">
      <table className="min-w-full w-full text-sm border-collapse relative table-compact">
        <thead className="sticky top-0 z-30 bg-white transition-shadow">
          <tr className="bg-gray-100 text-gray-600 uppercase text-xs border-b">
            <th className={cn("text-left sticky left-0 bg-gray-100 z-20 w-48 min-w-48", isScrolled && "shadow-md")}>Patient</th>
            {documents.map(doc => (
              <th key={doc.abbrev} className="text-center w-20 min-w-20" title={doc.name}>
                {doc.abbrev}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[content-visibility:auto] [contain-intrinsic-size:4000px]">
          {orders.length > 0 ? orders.map(order => (
            <ComplianceRow 
                key={order.id}
                order={order}
                documents={documents}
                patientFilter={patientFilter}
                isScrolled={isScrolled}
                navigate={navigate}
            />
          )) : (
            <tr>
              <td colSpan={documents.length + 1}>
                <div className="soft-card p-6 text-center text-gray-600 fade-in my-4">
                  <p className="font-semibold">No Records Found</p>
                  <p className="text-sm mt-1">No records match the current filters.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ComplianceTable;
