import { Pipette } from "lucide-react";
import { useEffect, useState } from "react";
import { IColorField } from "../types/color-field.type";

interface IColorCardProps {
  field: IColorField;
  hex: string;
  onChange: (hex: string) => void;
}

export function ColorCard({ field, hex, onChange }: IColorCardProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(hex);

  useEffect(() => {
    setInputValue(hex);
  }, [hex]);

  return (
    <div className="group relative flex items-center gap-3 rounded-xl border border-border/30 bg-background/60 hover:bg-background hover:border-border/60 p-3 transition-all duration-200">
      <label className="relative cursor-pointer shrink-0">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
        <div
          className="w-10 h-10 rounded-xl shadow-sm ring-1 ring-black/5 group-hover:ring-black/10 group-hover:scale-105 transition-all duration-200 relative overflow-hidden"
          style={{ backgroundColor: hex }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/15 backdrop-blur-[1px]">
            <Pipette size={12} className="text-white drop-shadow" />
          </div>
        </div>
      </label>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground leading-tight">
          {field.label}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {field.description}
        </p>
      </div>
      <div className="shrink-0">
        {editing ? (
          <input
            type="text"
            value={inputValue}
            autoFocus
            onBlur={() => {
              setEditing(false);
              if (/^#[0-9a-fA-F]{6}$/.test(inputValue)) onChange(inputValue);
              else setInputValue(hex);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditing(false);
                if (/^#[0-9a-fA-F]{6}$/.test(inputValue)) onChange(inputValue);
                else setInputValue(hex);
              }
              if (e.key === "Escape") {
                setEditing(false);
                setInputValue(hex);
              }
            }}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-20 text-[11px] font-mono bg-background border border-primary/40 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-lg px-2.5 py-1.5 transition-all"
          >
            {hex.toUpperCase()}
          </button>
        )}
      </div>
    </div>
  );
}
