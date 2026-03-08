import { useEffect, useRef, useState } from "react";

const GOA_LOCATION_SUGGESTIONS = [
  {
    label: "Manohar International Airport (GOX) - Goa",
    aliases: ["mopa", "mop", "gox", "manohar airport"],
  },
  {
    label: "Dabolim International Airport (GOI) - Goa",
    aliases: ["dabolim", "goi", "dabolim airport"],
  },
  { label: "Multi Level Car Park", aliases: ["mlcp", "car park"] },
  {
    label: "Panaji Bus Stand",
    aliases: ["panaji bus stand", "kadamba bus stand"],
  },
  {
    label:
      "FLY91 HQ - 2nd Floor, A Block, Alcon House, Kadamba Plateau Road, Ribandar, Goa 403006",
    aliases: ["fly91", "fly91 hq"],
  },
  { label: "GMR Canteen", aliases: ["gmr"] },
  { label: "Summit Calangute Resort & Spa", aliases: ["summit calangute"] },
  {
    label: "Somy Plaza (formerly Somy Resort)",
    aliases: ["somy", "somy resort"],
  },
  { label: "Casa De Village", aliases: ["casa village"] },
];

const LocationInput = ({
  value,
  onChange,
  placeholder,
  inputId,
  onEnter,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  inputId?: string;
  onEnter?: () => void; // called when Enter is pressed with no dropdown action
}) => {
  const [show, setShow] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered =
    value.trim().length >= 2
      ? GOA_LOCATION_SUGGESTIONS.filter((loc) => {
          const v = value.toLowerCase();
          return (
            loc.label.toLowerCase().includes(v) ||
            loc.aliases.some((a) => a.includes(v))
          );
        })
      : [];

  // scroll active item into view
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const pick = (label: string) => {
    onChange(label);
    setShow(false);
    setActiveIdx(-1);
    // advance to next field after picking
    setTimeout(() => onEnter?.(), 30);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (show && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered.length === 1) {
          pick(filtered[0].label);
          return;
        }
        if (activeIdx >= 0) {
          pick(filtered[activeIdx].label);
          return;
        }
        // multiple results, nothing highlighted — just advance
        setShow(false);
        onEnter?.();
        return;
      }
      if (e.key === "Escape") {
        setShow(false);
        setActiveIdx(-1);
        return;
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  return (
    <div className="relative flex-1">
      <input
        id={inputId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShow(true);
          setActiveIdx(-1);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() =>
          value.trim().length >= 2 && filtered.length > 0 && setShow(true)
        }
        onBlur={() => setTimeout(() => setShow(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className="input-style w-full"
      />

      {show && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((loc, i) => (
            <div
              key={loc.label}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(loc.label);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                i === activeIdx ? "bg-[#e8faf0]" : "hover:bg-[#f4fdf8]"
              }`}
            >
              <span className="truncate">{loc.label}</span>
              {i === activeIdx && (
                <span className="shrink-0 text-[10px] text-[#00a884] font-mono bg-[#e8faf4] px-1.5 py-0.5 rounded">
                  ↵
                </span>
              )}
            </div>
          ))}
          {filtered.length > 1 && (
            <div className="px-4 py-1.5 text-[10px] text-gray-400 flex gap-3 bg-gray-50 rounded-b-xl border-t font-mono">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>Esc close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
