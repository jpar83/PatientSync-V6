import { cn } from "@/lib/utils";
import React from "react";

export function Btn({ as:Comp="button", variant="primary", size, className, children, ...props }: any) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold focus-ring transition-all duration-150 lift elevate disabled:opacity-50 disabled:cursor-not-allowed";
  
  const styles = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-600",
    outline: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 dark:bg-surface dark:text-text dark:border-border-color dark:hover:bg-zinc-800",
    ghost:   "text-gray-700 hover:bg-gray-100/70 dark:text-muted dark:hover:bg-zinc-800",
    danger:  "bg-rose-600 text-white hover:bg-rose-700"
  }[variant];

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs h-8",
    md: "px-3.5 py-2 text-sm h-10",
  }

  return <Comp className={cn(base, styles, size ? sizes[size] : sizes.md, className)} {...props}>{children}</Comp>;
}
