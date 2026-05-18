"use client";

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

/** Scrollable tab bar for small phone screens */
export function AdminTabBar({ tabs, active, onChange }: Props) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-1.5 rounded-full bg-[var(--tg-secondary)]/60 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm ${
              active === tab.id
                ? "bg-[var(--tg-button)] text-[var(--tg-button-text)]"
                : "text-[var(--tg-hint)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
