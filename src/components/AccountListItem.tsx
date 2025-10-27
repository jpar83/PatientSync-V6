import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import type { AccountOverviewData } from '../pages/MyAccounts';
import { cn } from '@/lib/utils';

interface AccountListItemProps {
  account: AccountOverviewData;
}

const AccountListItem: React.FC<AccountListItemProps> = ({ account }) => {
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
            icon: CheckCircle,
            barColor: "bg-green-500",
            textColor: "text-green-700 dark:text-green-300",
        },
        attention: {
            icon: AlertTriangle,
            barColor: "bg-amber-500",
            textColor: "text-amber-700 dark:text-amber-300",
        },
        critical: {
            icon: XCircle,
            barColor: "bg-rose-500",
            textColor: "text-rose-700 dark:text-rose-300",
        },
    };

    const currentStatus = statusConfig[status];

    return (
        <Link 
            to={`/referrals?account=${encodeURIComponent(account_name)}`} 
            className="block soft-card p-0 overflow-hidden lift elevate group"
        >
            <div className="flex items-stretch">
                <div className={cn("w-1.5 flex-shrink-0", currentStatus.barColor)}></div>
                <div className="flex-1 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Left Side: Name and Hotlist */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-base text-text truncate group-hover:text-accent">
                                        {account_name}
                                    </h2>
                                    <p className="text-xs text-muted">{total_referrals} active referrals</p>
                                </div>
                                <div className="md:hidden">
                                     <ChevronRight className="h-5 w-5 text-muted group-hover:text-accent transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                            {hot_list && hot_list.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-border-color/50">
                                    <p className="text-xs font-medium text-muted mb-1">Hot List:</p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                        {hot_list.map(patient => (
                                            <span 
                                                key={patient.patient_id}
                                                className="text-sm text-text font-medium"
                                            >
                                                {patient.patient_name || 'Unknown Patient'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Metrics */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-center w-24">
                                <div className="text-xs font-medium text-muted">Compliance</div>
                                <div className="relative">
                                    <div className={`text-xl font-bold mt-1 ${currentStatus.textColor}`}>
                                        {compliance_percentage}%
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-1 mt-1">
                                        <div 
                                            className={cn("h-1 rounded-full", currentStatus.barColor)} 
                                            style={{ width: `${compliance_percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center w-24">
                                <div className="text-xs font-medium text-muted">Ready for PAR</div>
                                <div className="text-2xl font-bold text-accent mt-1">{ready_for_par_count}</div>
                            </div>
                            <div className="hidden md:block pl-2">
                                <ChevronRight className="h-6 w-6 text-muted group-hover:text-accent transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default AccountListItem;
