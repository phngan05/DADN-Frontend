interface SettingInputProps {
  label: string;
  value: string | undefined;
  isLoading: boolean;
  uniqueKey: string | undefined;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}

export default function SettingInput({
  label,
  value,
  isLoading,
  uniqueKey,
  onChange,
  placeholder = "",
  type = "text",
}: SettingInputProps) {
  return (
    <div className="w-full">
      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
        {label}
      </label>
      
      {isLoading ? (
        <div className="h-10 w-full animate-pulse bg-gray-200 rounded-xl" />
      ) : (
        <input
          key={uniqueKey} 
          type={type}
          defaultValue={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-slate-100 px-4 py-2 rounded-xl text-sm outline-none border border-transparent focus:border-blue-200 transition-all"
        />
      )}
    </div>
  );
}