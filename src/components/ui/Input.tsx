type InputProps = {
  label: string;
  id: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Input = ({
  label,
  id,
  type = "text",
  defaultValue,
  value,
  onChange,
}: InputProps) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={id} className="text-sm font-medium text-gray-600">
        {label}
      </label>

      <input
        id={id}
        type={type}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        inputMode={type === "tel" ? "numeric" : undefined}
        pattern={type === "tel" ? "[0-9]*" : undefined}
        onInput={(e) => {
          if (type === "tel") {
            e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
          }
        }}
        placeholder={`Enter ${label}`}
        className="bg-[#f0f2f5] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition"
      />
    </div>
  );
};

export default Input;
