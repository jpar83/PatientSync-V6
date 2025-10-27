import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { AccountOverviewData } from '../pages/MyAccounts';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  account: AccountOverviewData;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
    const { account_name, total_referrals, ready_for_par_count, compliance_percentage, hot_list } = account;

    const status: 'ok' | 'attention' | 'critical' = useMemo(() => {
        if (compliance_percentage < 50 || (hot_list && hot_list.length > 2)) {
            return 'critical';
        }
        if (compliance_percentage < 85 || (hot_list && hot_list.length > 0)) {
            return 'attention';
        }
        return 'ok';
    }, [compliance_percentage, hot_list]);

    const statusConfig = {
        ok: {
            label: "All Good",
            icon: CheckCircle,
            cardClasses: "border-l-8 border-green-500 bg-green-50/40 dark:border-green-600 dark:bg-green-900/10",
            textColor: "text-green-700 dark:text-green-300",
            labelBgColor: "bg-green-100 dark:bg-green-900/30",
        },
        attention: {
            label: "Needs Attention",
            icon: AlertTriangle,
            cardClasses: "border-l-8 border-amber-500 bg-amber-50/40 dark:border-amber-500 dark:bg-amber-900/10",
            textColor: "text-amber-700 dark:text-amber-300",
            labelBgColor: "bg-amber-100 dark:bg-amber-900/30",
        },
        critical: {
            label: "Critical",
            icon: XCircle,
            cardClasses: "border-l-8 border-rose-500 bg-rose-50/40 dark:border-rose-500 dark:bg-rose-900/10",
            textColor: "text-rose-700 dark:text-rose-300",
            labelBgColor: "bg-rose-100 dark:bg-rose-900/30",
        },
    };

    const currentStatus = statusConfig[status];
    const StatusIcon = currentStatus.icon;

    return (
        <div className={cn("soft-card flex flex-col h-full lift elevate", currentStatus.cardClasses)}>
            <div className="p-4 border-b border-border-color/50">
                <h2 className="font-semibold text-base text-text truncate">{account_name}</h2>
                <p className="text-xs text-muted">{total_referrals} active referrals</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-50/50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <div className="text-xs font-medium text-muted">Compliance</div>
                    <div className={cn("text-2xl font-bold", compliance_percentage >= 85 ? 'text-accent' : 'text-amber-600 dark:text-amber-500')}>{compliance_percentage}%</div>
                </div>
                <div className="bg-gray-50/50 dark:bg-zinc-800/50 rounded-xl p-3 text-center">
                    <div className="text-xs font-medium text-muted">Ready for PAR</div>
                    <div className="text-2xl font-bold text-accent">{ready_for_par_count}</div>
                </div>
            </div>
            <div className="p-4 flex-1">
                <div className={cn("text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 p-2 rounded-lg", currentStatus.textColor, currentStatus.labelBgColor)}>
                    <StatusIcon className="h-5 w-5" />
                    {currentStatus.label}
                </div>
                {hot_list && hot_list.length > 0 ? (
                    <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted mb-1">Hot List:</p>
                        {hot_list.map(patient => (
                            <Link 
                                key={patient.patient_id}
                                to={`/referrals?openPatientId=${patient.patient_id}`}
                                className="block text-sm text-text font-medium p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-zinc-800/50"
                            >
                                {patient.patient_name || 'Unknown Patient'}
                            </Link>
                        ))}
                    </div>
                ) : (
                    status !== 'ok' && <p className="text-sm text-muted text-center py-4">No specific patients flagged on the hot list.</p>
                )}
            </div>
            <div className="p-4 mt-auto border-t border-border-color/50">
                <Link to={`/referrals?account=${encodeURIComponent(account_name)}`} className="text-sm font-semibold text-accent hover:underline w-full block text-center">
                    View All ({total_referrals})
                </Link>
            </div>
        </div>
    );
};

export default AccountCard;
