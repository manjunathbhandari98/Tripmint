import { Settings } from "lucide-react";
import { useState } from "react";
import Login from "../pages/Login";
import { isAuthenticated, logout } from "../utils/auth";
import MainLayout from "./MainLayout";

const ShortcutRow = ({ keys, action }: { keys: string; action: string }) => (
  <div className="flex justify-between items-center border-b last:border-none pb-2">
    <span className="text-gray-700">{action}</span>
    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
      {keys}
    </span>
  </div>
);

const AppWrapper = () => {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [showShortcuts, setShowShortcuts] = useState(false);

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <>
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {/* Settings Button */}
        <button
          onClick={() => setShowShortcuts(true)}
          className="p-2 rounded-full bg-white b hover:bg-gray-50 hover:shadow-md transition"
          title="Keyboard Shortcuts"
        >
          <Settings size={18} />
        </button>

        {/* Logout Button */}
        <button
          onClick={() => {
            logout();
            setLoggedIn(false);
          }}
          className="flex items-center gap-2 px-4 py-2 
          text-sm font-medium 
          bg-white border border-red-200 
          text-red-600 rounded-full 
          shadow-sm hover:shadow-md
          hover:bg-red-50 hover:border-red-300
          transition-all duration-200"
        >
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Logout
        </button>
      </div>

      {/* Main App */}
      <MainLayout />

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[420px] max-w-[90%] p-6 relative">
            <h2 className="text-lg font-semibold text-[#075E54] mb-4">
              Keyboard Shortcuts
            </h2>

            <div className="space-y-3 text-sm">
              <ShortcutRow keys="Ctrl + ." action="Set Pickup Date → Today" />

              <ShortcutRow
                keys="Ctrl + /"
                action="Set Pickup Date → Tomorrow"
              />

              <ShortcutRow
                keys="Ctrl + Shift + D"
                action="Swap Pickup & Drop"
              />

              <ShortcutRow keys="Ctrl + Shift + C" action="Clear Form" />

              <ShortcutRow keys="Alt + P" action="Copy Passenger Phone" />

              <ShortcutRow keys="Alt + D" action="Copy Driver Phone" />
              <ShortcutRow keys="Ctrl + C" action="Copy Generated Message" />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowShortcuts(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AppWrapper;
