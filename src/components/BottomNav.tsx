import React from "react";
import { NavLink } from "react-router-dom";
import { Home, ClipboardList, Megaphone, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Referrals', path: '/referrals', icon: ClipboardList },
  { name: 'Patients', path: '/patients', icon: Users },
  { name: 'Marketing', path: '/marketing', icon: Megaphone },
];

const BottomNav: React.FC = () => (
  <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg shadow-[0_-2px_12px_rgba(0,0,0,0.08)] dark:shadow-none h-[calc(72px+max(12px,env(safe-area-inset-bottom)))] pb-[max(12px,env(safe-area-inset-bottom))] z-40 border-t border-black/5 dark:border-white/5 md:hidden">
    {TABS.map(({ name, path, icon: Icon }) => (
      <NavLink
        key={name}
        to={path}
        end={path === '/'}
        className={({ isActive }) =>
          cn(
            "relative flex flex-col items-center justify-center text-muted hover:text-accent w-full h-full focus-ring transition-colors rounded-lg",
            isActive && "text-accent"
          )
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative">
              <Icon className="h-6 w-6 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
              {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full" />}
            </div>
            <span className="text-[10px] font-medium">{name}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
