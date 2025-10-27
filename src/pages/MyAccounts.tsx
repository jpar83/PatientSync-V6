import React from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "../lib/supabaseClient";
import ListSkeleton from "../components/ui/ListSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import AccountListItem from "@/components/AccountListItem";

export interface AccountOverviewData {
    account_name: string;
    total_referrals: number;
    ready_for_par_count: number;
    compliance_percentage: number;
    hot_list: {
        patient_id: string;
        patient_name: string;
    }[];
}

const MyAccounts: React.FC = () => {
    const { data: accounts = [], isLoading, error } = useQuery<AccountOverviewData[], Error>({
        queryKey: ['account_overview_with_all_providers'],
        queryFn: async () => {
            const [overviewRes, providersRes] = await Promise.all([
                supabase.rpc('get_account_overview'),
                supabase.from('insurance_providers').select('name')
            ]);

            if (providersRes.error) {
                throw new Error(`Failed to fetch insurance providers: ${providersRes.error.message}`);
            }
            if (overviewRes.error) {
                console.warn("Could not fetch account overview stats. Displaying providers only.", overviewRes.error);
            }

            const overviewData: AccountOverviewData[] = overviewRes.data || [];
            const allProviderNames: string[] = (providersRes.data || []).map((p: { name: string }) => p.name);

            const overviewMap = new Map<string, AccountOverviewData>(
                overviewData.map(account => [account.account_name, account])
            );

            const allAccountNames = new Set([...allProviderNames, ...overviewData.map(a => a.account_name)]);

            const mergedAccounts: AccountOverviewData[] = Array.from(allAccountNames).map(name => {
                return overviewMap.get(name) || {
                    account_name: name,
                    total_referrals: 0,
                    ready_for_par_count: 0,
                    compliance_percentage: 0,
                    hot_list: [],
                };
            });

            // Only show accounts with active referrals.
            return mergedAccounts.filter(acc => acc.total_referrals > 0);
        }
    });

    if (isLoading) {
        return <div className="p-4 md:p-6"><ListSkeleton rows={5} /></div>;
    }
    
    if (error) {
        const isSchemaError = error.message.includes('PGRST202') || error.message.includes('schema cache');
        return (
             <div className="p-4 md:p-6">
                <EmptyState 
                    title="Error Loading Accounts"
                    message={isSchemaError 
                        ? <>The database schema may be updating. Please <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="underline font-bold text-accent">refresh the page</a>.</>
                        : error.message
                    }
                />
            </div>
        );
    }

    return (
        <div id="tour-accounts-list" className="h-full overflow-y-auto space-y-3 px-4 sm:px-6 lg:px-8 py-6 pb-nav-safe">
            {accounts.length === 0 ? (
                <EmptyState 
                    title="No Accounts with Active Referrals"
                    message="Add referrals with insurance information to see accounts here."
                />
            ) : (
                <div className="space-y-3">
                    {accounts
                        .sort((a, b) => {
                            if (a.account_name === 'Uncategorized') return 1;
                            if (b.account_name === 'Uncategorized') return -1;
                            return a.account_name.localeCompare(b.account_name);
                        })
                        .map((account, index) => (
                            <div key={account.account_name} id={index === 0 ? 'tour-accounts-card' : undefined}>
                                <AccountListItem account={account} />
                            </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAccounts;
