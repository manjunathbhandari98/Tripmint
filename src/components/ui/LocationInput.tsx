import { useState } from "react";

const GOA_LOCATION_SUGGESTIONS = [
  "Manohar International Airport (GOX) - Goa",
  "Dabolim International Airport (GOI) - Goa",
  "Multi Level Car Parking",
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

  // Only filter if user typed at least 2 characters
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
          {filtered.map((loc) => (
            <div
              key={loc}
              onClick={() => {
                onChange(loc);
                setShow(false);
              }}
              className="px-4 py-2 text-sm hover:bg-green-50 cursor-pointer transition"
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
