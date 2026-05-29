import { Star } from "lucide-react";

const LABELS = ["", "Frio", "Morno", "Quente", "Muito quente", "Hot 🔥"];

interface Props {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}

export function Stars({ value, onChange, size = 16 }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(value === n ? 0 : n)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          style={{ cursor: onChange ? "pointer" : "default" }}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={n <= value ? "fill-amber-400 text-amber-400" : "text-neutral-200"}
          />
        </button>
      ))}
      {value > 0 && onChange && (
        <span className="ml-1.5 text-xs text-neutral-500">{LABELS[value]}</span>
      )}
    </div>
  );
}
