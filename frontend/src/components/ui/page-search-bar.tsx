import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function PageSearchBar({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2",
        className,
      )}
    >
      <Search size={16} className="shrink-0 text-[var(--color-muted)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 rounded p-0.5 text-[var(--color-muted)] hover:text-[var(--color-text-strong)]"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
