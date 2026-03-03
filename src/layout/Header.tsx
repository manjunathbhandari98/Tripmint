const Header = () => {
  return (
    <div className="w-full h-20 bg-white shadow-md px-10 flex justify-between items-center">
      {/* Left Logo */}
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="logo" width={70} />
        <div>
          <h1 className="text-xl font-bold text-[#075E54] tracking-wide">
            Tripmint
          </h1>
          <p className="text-xs text-gray-500">Smart Cab Dispatch Messaging</p>
        </div>
      </div>

      {/* Right Date & Time */}
      <div className="text-right">
        {/* <p className="text-sm font-medium text-gray-500">{formattedDate}</p>
        <p className="text-lg font-semibold text-[#075E54] tracking-wide">
          {formattedTime}
        </p> */}
      </div>
    </div>
  );
};

export default Header;
