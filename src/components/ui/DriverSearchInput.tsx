import { useEffect, useRef, useState } from "react";
import { fetchDrivers, type Driver } from "../../services/drivers";

const DriverSearchInput = ({
  value,
  onSelect,
  refreshKey = 0,
  onCommit,
}: {
  value: string;
  onSelect: (driver: Driver, nameOnly?: boolean) => void;
  refreshKey?: number;
  onCommit?: () => void;
}) => {
  const [show, setShow] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    fetchDrivers().then(setDrivers);
  }, [refreshKey]);

  // scroll active item into view
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const filtered =
    value.length >= 2
      ? drivers.filter(
          (d) =>
            d.name.toLowerCase().includes(value.toLowerCase()) ||
            d.vehicleNumber.toLowerCase().includes(value.toLowerCase()),
        )
      : [];

  const pick = (driver: Driver) => {
    onSelect(driver);
    setShow(false);
    setActiveIdx(-1);
    setTimeout(() => onCommit?.(), 30);
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
        const target = activeIdx >= 0 ? filtered[activeIdx] : filtered[0];
        pick(target);
        return;
      }
      if (e.key === "Escape") {
        setShow(false);
        setActiveIdx(-1);
        return;
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      onCommit?.();
    }
  };

  return (
    <div className="relative">
      <input
        id="driverName"
        value={value}
        onChange={(e) => {
          onSelect(
            { name: e.target.value, phone: "", vehicleNumber: "" },
            true,
          );
          setShow(true);
          setActiveIdx(-1);
        }}
        onFocus={() => filtered.length > 0 && setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder="Search driver by name or vehicle"
        autoComplete="off"
        className="input-style"
      />

      {show && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto"
        >
          {filtered.map((driver, i) => (
            <li
              key={driver.id}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(driver);
              }}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b last:border-0 transition-colors ${
                i === activeIdx ? "bg-[#e8faf0]" : "hover:bg-[#f4fdf8]"
              }`}
            >
              <span
                title={driver.isPrimary ? "Prime driver" : "Non-prime driver"}
                className={`shrink-0 w-2 h-2 rounded-full ${driver.isPrimary ? "bg-[#00a884]" : "bg-gray-300"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 truncate">
                    {driver.name}
                  </span>
                  {driver.isPrimary && (
                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e8faf4] text-[#00a884]">
                      ★ Prime
                    </span>
                  )}
                  {i === activeIdx && (
                    <span className="ml-auto shrink-0 text-[10px] text-[#00a884] font-mono bg-[#e8faf4] px-1.5 py-0.5 rounded">
                      ↵ select
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {[driver.vehicleNumber, driver.vehicleType, driver.phone]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            </li>
          ))}
          <li className="px-4 py-1.5 text-[10px] text-gray-400 flex items-center gap-3 bg-gray-50 rounded-b-xl border-t">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>Esc close</span>
          </li>
        </ul>
      )}
    </div>
  );
};

export default DriverSearchInput;
