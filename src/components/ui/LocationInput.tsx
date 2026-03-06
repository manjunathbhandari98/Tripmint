import { useState } from "react";

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
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) => {
  const [show, setShow] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  return (
    <div className="relative flex-1">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShow(true);
          setHighlightedIndex(-1);
        }}
        onKeyDown={(e) => {
          if (!show || filtered.length === 0) return;

          // ↓ Navigate Down
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) =>
              prev < filtered.length - 1 ? prev + 1 : prev,
            );
          }

          // ↑ Navigate Up
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }

          // Enter Behavior
          if (e.key === "Enter") {
            e.preventDefault();

            // if only ONE suggestion → auto select it
            if (filtered.length === 1) {
              onChange(filtered[0].label);
              setShow(false);
              return;
            }

            // If multiple & something highlighted → select highlighted
            if (highlightedIndex >= 0) {
              onChange(filtered[highlightedIndex].label);
              setShow(false);
            }
          }
        }}
        onFocus={() => {
          if (value.trim().length >= 2) setShow(true);
        }}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        placeholder={placeholder}
        className="input-style w-full"
      />

      {show && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((loc, index) => (
            <div
              key={loc.label}
              onClick={() => {
                onChange(loc.label);
                setShow(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition ${
                index === highlightedIndex
                  ? "bg-green-100"
                  : "hover:bg-green-50"
              }`}
            >
              {loc.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
