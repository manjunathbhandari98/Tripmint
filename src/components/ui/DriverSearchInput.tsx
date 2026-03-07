import { useEffect, useState } from "react";
import { fetchDrivers, type Driver } from "../../services/drivers";

const DriverSearchInput = ({
  value,
  onSelect,
  refreshKey = 0,
}: {
  value: string;
  onSelect: (driver: Driver, nameOnly?: boolean) => void;
  refreshKey?: number;
}) => {
  const [show, setShow] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    fetchDrivers().then(setDrivers);
  }, [refreshKey]); // re-fetch whenever BookingForm increments refreshKey

  const filtered =
    value.length >= 2
      ? drivers.filter(
          (d) =>
            d.name.toLowerCase().includes(value.toLowerCase()) ||
            d.vehicleNumber.toLowerCase().includes(value.toLowerCase()),
        )
      : [];

  // When the user leaves the field with a typed name that isn't in the list,
  const handleBlur = () => {
    setTimeout(() => setShow(false), 200);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onSelect(
            { name: e.target.value, phone: "", vehicleNumber: "" },
            true,
          );
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filtered.length > 0) {
            e.preventDefault();
            onSelect(filtered[0]);
            setShow(false);
          }
        }}
        placeholder="Search driver by name or vehicle"
        className="input-style"
      />

      {show && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((driver) => (
            <div
              key={driver.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(driver);
                setShow(false);
              }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 cursor-pointer border-b last:border-0"
            >
              {/* Prime indicator */}
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
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {[driver.vehicleNumber, driver.vehicleType, driver.phone]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverSearchInput;
