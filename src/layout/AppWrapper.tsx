import { useState } from "react";
import Login from "../pages/Login";
import { isAuthenticated, logout } from "../utils/auth";
import MainLayout from "./MainLayout";

const AppWrapper = () => {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <>
      <div className="absolute top-4 right-4">
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

      <MainLayout />
    </>
  );
};

export default AppWrapper;
