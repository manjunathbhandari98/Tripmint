/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { DRIVERS } from "../../data/drivers";

const DriverSearchInput = ({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (driver: any) => void;
}) => {
  const [show, setShow] = useState(false);

  const filtered =
    value.length >= 2
      ? DRIVERS.filter(
          (d) =>
            d.name.toLowerCase().includes(value.toLowerCase()) ||
            d.vehicleNumber.toLowerCase().includes(value.toLowerCase()),
        )
      : [];

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => {
          onSelect({ name: e.target.value });
          setShow(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filtered.length > 0) {
            e.preventDefault();
            onSelect(filtered[0]);
            setShow(false);
          }
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder="Search driver by name or vehicle"
        className="input-style"
      />

      {show && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((driver) => (
            <div
              key={driver.vehicleNumber}
              // onMouseDown fires before onBlur, so the click is never lost
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur
                onSelect(driver);
                setShow(false);
              }}
              className="px-4 py-2 text-sm hover:bg-green-50 cursor-pointer"
            >
              <div className="font-medium">{driver.name}</div>
              <div className="text-xs text-gray-500">
                {driver.vehicleNumber} • {driver.phone}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverSearchInput;
