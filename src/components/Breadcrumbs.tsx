import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbNameMap: Record<string, string> = {
  '/': 'Dashboard',
  '/referrals': 'Referrals',
  '/patients': 'Patients',
  '/marketing': 'Marketing',
  '/trends': 'Trends',
  '/settings': 'Settings',
  '/audit-log': 'Audit Log',
  '/my-accounts': 'Payers',
  '/archived': 'Archived',
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Check for patient detail page
  const isPatientDetailPage = pathnames[0] === 'patient' && pathnames.length === 2;
  const patientId = isPatientDetailPage ? pathnames[1] : null;

  const { data: patient, isLoading: isLoadingPatientName } = useQuery({
    queryKey: ['breadcrumb_patient_name', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const { data, error } = await supabase
        .from('patients')
        .select('name')
        .eq('id', patientId)
        .single();
      if (error) {
        console.error("Breadcrumb patient fetch error:", error);
        return null;
      }
      return data;
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  let crumbs = [{ name: 'Dashboard', path: '/' }];

  if (isPatientDetailPage) {
    crumbs.push({ name: 'Patients', path: '/patients' });
    const patientName = isLoadingPatientName ? 'Loading...' : patient?.name || 'Patient Details';
    crumbs.push({ name: patientName, path: location.pathname });
  } else {
    // Existing logic for other pages
    pathnames.forEach((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const name = breadcrumbNameMap[to] || value.charAt(0).toUpperCase() + value.slice(1);
        if (name) {
            // Avoid duplicating 'Dashboard' if it's the only segment
            if (crumbs.length === 1 && crumbs[0].name === name) return;
            crumbs.push({ name, path: to });
        }
    });
    
    // Handle "virtual" breadcrumbs from filters
    const searchParams = new URLSearchParams(location.search);
    const accountFilter = searchParams.get('account');
    const stoplightFilter = searchParams.get('stoplight_status');

    if (location.pathname === '/referrals') {
        const referralsIndex = crumbs.findIndex(c => c.path === '/referrals');
        if (referralsIndex !== -1) {
            if (accountFilter) {
                crumbs.splice(referralsIndex, 1, 
                    { name: 'Payers', path: '/my-accounts' },
                    { name: accountFilter, path: location.pathname + location.search }
                );
            } else if (stoplightFilter) {
                crumbs.push({ name: `${stoplightFilter.charAt(0).toUpperCase() + stoplightFilter.slice(1)} Status`, path: location.pathname + location.search });
            }
        }
    }
  }

  return (
    <nav className="flex items-center text-sm font-medium" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted mx-1" />}
            <Link
              to={crumb.path}
              className={cn(
                'transition-colors truncate',
                isLast ? 'text-text font-semibold pointer-events-none' : 'text-muted hover:text-text'
              )}
              aria-current={isLast ? 'page' : undefined}
            >
              {crumb.name}
            </Link>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
