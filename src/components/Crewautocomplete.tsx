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
  onCommit?: () => void; // called when user finalises (Enter on empty dropdown / no match)
}

const CrewAutocomplete = ({
  value,
  onSelect,
  placeholder = "Passenger Name",
  onCommit,
}: Props) => {
  const [query, setQuery] = useState(value);
  const [crewList, setCrewList] = useState<Crew[]>([]);
  const [suggestions, setSuggestions] = useState<Crew[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // sync when parent resets value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // load once
  useEffect(() => {
    let cancelled = false;
    fetchCrew()
      .then((d) => {
        if (!cancelled) {
          setCrewList(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // scroll active item into view
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const search = (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const lower = q.toLowerCase();
    const hits = crewList
      .filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(lower) ||
          (c.phone ?? "").includes(q) ||
          (c.designation ?? "").toLowerCase().includes(lower),
      )
      .slice(0, 8);
    setSuggestions(hits);
    setOpen(hits.length > 0);
    setActiveIdx(-1);
  };

  const mapsLink = (lat?: number | null, lng?: number | null): string =>
    lat && lng ? `${lat},${lng}` : "";

  const pick = (crew: Crew) => {
    setQuery(crew.name);
    setOpen(false);
    setActiveIdx(-1);
    onSelect(
      crew.name,
      crew.phone ?? "",
      crew.address ?? "",
      mapsLink(crew.lat, crew.lng),
    );
    // move focus to next field after selection
    setTimeout(() => onCommit?.(), 30);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onSelect(q, "", "", "");
    search(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const target = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
        pick(target);
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        setActiveIdx(-1);
        return;
      }
    } else if (e.key === "Enter") {
      // no dropdown — just advance to next field
      e.preventDefault();
      onCommit?.();
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id="passengerName"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() =>
          query.length >= 2 && suggestions.length > 0 && setOpen(true)
        }
        placeholder={loading ? "Loading crew…" : placeholder}
        // disabled={loading}
        autoComplete="off"
        className="input-style disabled:opacity-60"
      />

      {open && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-64 overflow-y-auto"
        >
          {suggestions.map((crew, i) => (
            <li
              key={crew.id}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(crew);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`px-4 py-2.5 cursor-pointer border-b last:border-0 transition-colors ${
                i === activeIdx ? "bg-[#e8faf0]" : "hover:bg-[#f4fdf8]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {crew.name}
                </p>
                {i === activeIdx && (
                  <span className="shrink-0 text-[10px] text-[#00a884] font-mono bg-[#e8faf4] px-1.5 py-0.5 rounded">
                    ↵ select
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {[crew.designation, crew.location, crew.phone]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {crew.bookingLeadTime && (
                <p className="text-xs text-[#075E54] font-medium mt-0.5">
                  ⏱ Book {crew.bookingLeadTime} prior
                </p>
              )}
            </li>
          ))}
          {suggestions.length > 0 && (
            <li className="px-4 py-1.5 text-[10px] text-gray-400 flex items-center gap-3 bg-gray-50 rounded-b-xl border-t">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>Esc close</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CrewAutocomplete;
