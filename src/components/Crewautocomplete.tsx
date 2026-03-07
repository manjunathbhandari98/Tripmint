import { useEffect, useRef, useState } from "react";
import { fetchCrew, type Crew } from "../services/crew";

interface Props {
  value: string;
  onSelect: (
    name: string,
    phone: string,
    address: string,
    locationLink: string,
  ) => void;
  placeholder?: string;
}

const CrewAutocomplete = ({
  value,
  onSelect,
  placeholder = "Passenger Name",
}: Props) => {
  const [query, setQuery] = useState(value);
  const [crewList, setCrewList] = useState<Crew[]>([]);
  const [suggestions, setSuggestions] = useState<Crew[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    fetchCrew().then((data) => {
      if (!cancelled) {
        setCrewList(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onSelect(q, "", "", "");

    if (q.length >= 2) {
      const lower = q.toLowerCase();
      const matches = crewList
        .filter(
          (c) =>
            (c.name?.toLowerCase() ?? "").includes(lower) ||
            (c.phone ?? "").includes(q) ||
            (c.designation?.toLowerCase() ?? "").includes(lower),
        )
        .slice(0, 8);
      setSuggestions(matches);
      setOpen(matches.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };

  const mapsLink = (lat?: number, lng?: number): string =>
    lat != null && lng != null
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : "";

  const handlePick = (crew: Crew) => {
    setQuery(crew.name);
    setOpen(false);
    onSelect(crew.name, crew.phone, crew.address, mapsLink(crew.lat, crew.lng));
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={handleChange}
        onFocus={() =>
          query.length >= 2 && suggestions.length > 0 && setOpen(true)
        }
        placeholder={loading ? "Loading crew…" : placeholder}
        disabled={loading}
        className="input-style disabled:opacity-60"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((crew) => (
            <li
              key={crew.id}
              onMouseDown={() => handlePick(crew)}
              className="px-4 py-2.5 hover:bg-[#e8faf0] cursor-pointer border-b last:border-0"
            >
              <p className="font-medium text-sm text-gray-800">{crew.name}</p>
              <p className="text-xs text-gray-500">
                {crew.designation} · {crew.location} · {crew.phone}
              </p>
              {crew.bookingLeadTime && (
                <p className="text-xs text-[#075E54] font-medium mt-0.5">
                  ⏱ Book {crew.bookingLeadTime} prior
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CrewAutocomplete;
