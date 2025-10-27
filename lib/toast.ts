export function toast(
  msg: string, 
  type: "ok" | "err" | "warning" = "ok",
  action?: { label: string; onClick: () => void }
) {
  const el = document.createElement("div");
  const typeClasses = {
    ok: "border-emerald-200 bg-white text-gray-800 dark:bg-zinc-800 dark:text-gray-200 dark:border-zinc-700",
    err: "border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-800",
    warning: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800"
  };

  el.className = `fixed bottom-5 right-5 z-[999] soft-card px-4 py-3 text-sm font-medium fade-in flex items-center gap-4 ${typeClasses[type]}`;
  
  const textEl = document.createElement("span");
  textEl.textContent = msg;
  el.appendChild(textEl);

  if (action) {
    const buttonEl = document.createElement("button");
    buttonEl.textContent = action.label;
    buttonEl.className = "text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline focus:outline-none";
    buttonEl.onclick = (e) => {
      e.stopPropagation();
      action.onClick();
      removeToast();
    };
    el.appendChild(buttonEl);
  }
  
  document.body.appendChild(el);

  const removeToast = () => {
    if (!document.body.contains(el)) return;

    const fallbackTimeout = setTimeout(() => {
      if (document.body.contains(el)) {
        el.remove();
      }
    }, 500); // 300ms transition + 200ms buffer

    const handleTransitionEnd = () => {
      clearTimeout(fallbackTimeout);
      if (document.body.contains(el)) {
        el.remove();
      }
      el.removeEventListener('transitionend', handleTransitionEnd);
    };

    el.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.addEventListener('transitionend', handleTransitionEnd);
  };

  const timer = setTimeout(removeToast, 4000);

  el.addEventListener('click', (e) => {
    // only close if not clicking the action button
    if (e.target !== el.querySelector('button')) {
      clearTimeout(timer);
      removeToast();
    }
  });
}
