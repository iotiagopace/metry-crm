import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

export function Modal({ title, onClose, children, width = "max-w-lg" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div
        className={`bg-white w-full ${width} sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="font-bold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
