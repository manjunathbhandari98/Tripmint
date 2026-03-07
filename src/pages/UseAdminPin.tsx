import { Shield, X } from "lucide-react";
import { useRef, useState } from "react";

// Set your admin PIN in .env as VITE_ADMIN_PIN=123456
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? "123456";

interface PinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PinModal = ({ onSuccess, onCancel }: PinModalProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
      <div
        className="absolute inset-0 bg-black/50"
        style={{ backdropFilter: "blur(3px)" }}
        onClick={onCancel}
      />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-5"
        style={{ animation: "popIn .22s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e8faf4] flex items-center justify-center">
              <Shield size={17} className="text-[#00a884]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Admin Required
              </p>
              <p className="text-[11px] text-gray-400">Enter PIN to continue</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X size={15} />
          </button>
        </div>

        {/* PIN dots */}
        <div
          className={`flex justify-center gap-3 ${shake ? "animate-shake" : ""}`}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-150 ${
                i < pin.length
                  ? error
                    ? "bg-red-500 scale-110"
                    : "bg-[#00a884] scale-110"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          autoFocus
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setPin(val);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-transparent text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:border-[#00a884] focus:ring-2 focus:ring-[#00a884]/15 transition-all"
          placeholder="••••••"
        />

        {error && (
          <p className="text-center text-xs text-red-500 font-medium -mt-2">
            Incorrect PIN. Try again.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length === 0}
            className="py-2.5 rounded-xl bg-[#00a884] text-white text-sm font-bold hover:bg-[#008f72] transition-colors disabled:opacity-40"
          >
            Confirm
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        .animate-shake { animation: shake .45s ease-in-out; }
        @keyframes popIn {
          from { opacity: 0; transform: scale(.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────
// Usage:
//   const { guardedDelete } = useAdminPin();
//   <button onClick={() => guardedDelete(() => handleActualDelete())}>Delete</button>

export const useAdminPin = () => {
  const [modal, setModal] = useState<{ onSuccess: () => void } | null>(null);

  const guardedDelete = (onConfirmed: () => void) => {
    setModal({
      onSuccess: () => {
        setModal(null);
        onConfirmed();
      },
    });
  };

  const PinGate = modal ? (
    <PinModal onSuccess={modal.onSuccess} onCancel={() => setModal(null)} />
  ) : null;

  return { guardedDelete, PinGate };
};
