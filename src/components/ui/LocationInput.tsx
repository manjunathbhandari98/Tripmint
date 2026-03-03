import { useState } from "react";

const GOA_LOCATION_SUGGESTIONS = [
  "Manohar International Airport (GOX) - Goa",
  "Dabolim International Airport (GOI) - Goa",
  "Multi Level Car Park",
  "Panaji Bus Stand",
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
      ? GOA_LOCATION_SUGGESTIONS.filter((loc) =>
          loc.toLowerCase().includes(value.toLowerCase()),
        )
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

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) =>
              prev < filtered.length - 1 ? prev + 1 : prev,
            );
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }

          if (e.key === "Enter" && highlightedIndex >= 0) {
            e.preventDefault();
            onChange(filtered[highlightedIndex]);
            setShow(false);
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
              key={loc}
              onClick={() => {
                onChange(loc);
                setShow(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition ${
                index === highlightedIndex
                  ? "bg-green-100"
                  : "hover:bg-green-50"
              }`}
            >
              {loc}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
