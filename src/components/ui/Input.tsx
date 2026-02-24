type InputProps = {
  label: string;
  id: string;
  type?: string;
};

const Input = (data: InputProps) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={data.id} className="text-sm font-medium text-gray-600">
        {data.label}
      </label>
      <input
        type={data.type}
        id={data.id}
        placeholder={`Enter ${data.label}`}
        className="bg-[#f0f2f5] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition"
      />
    </div>
  );
};

export default Input;
