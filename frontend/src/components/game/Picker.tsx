import { useState } from "react";
// Styled card + custom styled list (a native <select> list can't be styled).
const Picker: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  format?: (v: string) => string; // i18n: how to display a value (value itself stays English)
}> = ({ icon, label, value, options, onChange, format = (v) => v }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-80" tabIndex={0} onBlur={() => setOpen(false)}>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-4 px-4 py-3 bg-black/60 border-2 border-pacova-green rounded-xl cursor-pointer hover:shadow-[0_0_12px_#8ED603]"
      >
        <span className="text-3xl">{icon}</span>
        <div className="flex-1 border-s border-pacova-green/40 ps-4">
          <p className="font-vt323 text-sm text-pacova-green tracking-widest">
            {label}
          </p>
          <p className="font-pixelify text-2xl text-pacova-pink uppercase">
            {format(value)}
          </p>
        </div>
        <span className="text-pacova-green">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <ul className="absolute z-30 w-full mt-1 bg-black/90 border-2 border-pacova-green rounded-xl overflow-hidden">
          {options.map((o) => (
            <li
              key={o}
              onMouseDown={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`px-4 py-2 font-pixelify text-xl uppercase cursor-pointer hover:bg-pacova-green hover:text-black ${
                o === value ? "text-pacova-pink" : "text-pacova-green"
              }`}
            >
              {format(o)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Picker;