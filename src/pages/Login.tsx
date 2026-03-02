import { LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { login } from "../utils/auth";

interface Props {
  onLogin: () => void;
}

const Login = ({ onLogin }: Props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const success = login(username, password);

    if (success) {
      toast.success("Welcome back 👋");
      onLogin();
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center 
                    bg-gradient-to-br from-green-50 via-white to-green-100 px-4"
    >
      <div
        className="w-full max-w-md bg-white 
                      rounded-2xl shadow-xl 
                      border border-gray-100 
                      p-8"
      >
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div
            className="mx-auto w-14 h-14 
                          flex items-center justify-center 
                          rounded-full 
                          bg-[#25D366]/10 text-[#075E54] mb-4"
          >
            <ShieldCheck size={28} />
          </div>

          <h2 className="text-2xl font-bold text-[#075E54] tracking-wide">
            TripMint
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Secure Dispatch Panel Access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2.5 
                         rounded-xl border border-gray-200
                         bg-gray-50 text-sm
                         focus:outline-none 
                         focus:ring-2 focus:ring-[#25D366]
                         focus:bg-white
                         transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 
                         rounded-xl border border-gray-200
                         bg-gray-50 text-sm
                         focus:outline-none 
                         focus:ring-2 focus:ring-[#25D366]
                         focus:bg-white
                         transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 
                       rounded-xl 
                       bg-gradient-to-r 
                       from-[#168c41] to-[#25D366]
                       hover:from-[#0f6f33] hover:to-[#1ebe5d]
                       text-white font-semibold text-sm
                       flex items-center justify-center gap-2
                       shadow-md hover:shadow-lg
                       active:scale-[0.98]
                       transition-all duration-200"
          >
            <LogIn size={16} />
            Login
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-gray-400 mt-6">
          Authorized access only
        </p>
      </div>
    </div>
  );
};

export default Login;
