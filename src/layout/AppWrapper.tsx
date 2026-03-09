import { Keyboard, Settings, X } from "lucide-react";
import { useState } from "react";
import Login from "../pages/Login";
import SettingsPage from "../pages/Settings";
import { isAuthenticated, logout } from "../utils/auth";
import MainLayout from "./MainLayout";

const ShortcutRow = ({ keys, action }: { keys: string; action: string }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-none">
    <span className="text-gray-700 text-sm">{action}</span>
    <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-mono text-gray-600 shrink-0 ml-4">
      {keys}
    </span>
  </div>
);

const SHORTCUTS = [
  { keys: "Ctrl + .", action: "Set Pickup Date → Today" },
  { keys: "Ctrl + /", action: "Set Pickup Date → Tomorrow" },
  { keys: "Ctrl + Shift + D", action: "Swap Pickup & Drop" },
  { keys: "Ctrl + Shift + C", action: "Clear Form" },
  { keys: "Alt + P", action: "Copy Passenger Phone" },
  { keys: "Alt + D", action: "Copy Driver Phone" },
  { keys: "Ctrl + C", action: "Copy Generated Message" },
  { keys: "ALT + O", action: "Toggle OTP" },
  { keys: "ALT + N", action: "Toggle Notes" },
  { keys: "ALT + T", action: "Toggle Pickup Date/Time" },
];

const AppWrapper = () => {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [showShortcuts, setShortcuts] = useState(false);
  const [showSettings, setSettings] = useState(false);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  // Full-screen settings page
  if (showSettings) {
    return (
      <div className="fixed inset-0 z-40 bg-[#efeae2] overflow-y-auto">
        {/* Override the back button in SettingsPage with our close handler */}
        <div className="h-full">
          <SettingsPage
            onClose={() => setSettings(false)}
            onLogout={() => {
              logout();
              setLoggedIn(false);
              setSettings(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Top Right Controls ── */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
        {/* Keyboard Shortcuts */}
        <button
          onClick={() => setShortcuts(true)}
          title="Keyboard Shortcuts"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md hover:bg-gray-50 text-gray-500 hover:text-[#075E54] transition-all"
        >
          <Keyboard size={17} />
        </button>

        {/* Settings */}
        <button
          onClick={() => setSettings(true)}
          title="Settings"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md hover:bg-gray-50 text-gray-500 hover:text-[#075E54] transition-all"
        >
          <Settings size={17} />
        </button>

        {/* Logout */}
        {/* <button
          onClick={() => {
            logout();
            setLoggedIn(false);
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-red-200 text-red-600 rounded-full shadow-sm hover:shadow-md hover:bg-red-50 hover:border-red-300 transition-all"
        >
          <span className="w-2 h-2 bg-red-500 rounded-full" />
          Logout
        </button> */}
      </div>

      {/* ── Main App ── */}
      <MainLayout />

      {/* ── Shortcuts Modal ── */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90vw] overflow-hidden"
            style={{ animation: "popIn .2s cubic-bezier(.34,1.56,.64,1) both" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e8faf4] flex items-center justify-center">
                  <Keyboard size={15} className="text-[#075E54]" />
                </div>
                <h2 className="font-semibold text-gray-900">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                onClick={() => setShortcuts(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            {/* List */}
            <div className="px-5 py-2 pb-4">
              {SHORTCUTS.map((s) => (
                <ShortcutRow key={s.action} {...s} />
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default AppWrapper;
