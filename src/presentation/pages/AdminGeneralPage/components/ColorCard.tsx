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
    <div className="group relative flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 p-3 transition-all duration-200 hover:border-border hover:bg-background">
      <label className="relative shrink-0 cursor-pointer">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div
          className="relative h-10 w-10 overflow-hidden rounded-xl shadow-sm ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105"
          style={{ backgroundColor: hex }}
        >
          <div className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
            <Pipette size={12} className="text-white drop-shadow" />
          </div>
        </div>
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {field.label}
        </p>
        <p className="mt-0.5 text-sm leading-tight text-muted-foreground">
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
            className="w-24 rounded-xl border border-primary/40 bg-background px-2.5 py-1.5 text-center font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-xl bg-muted/60 px-2.5 py-1.5 font-mono text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            {hex.toUpperCase()}
          </button>
        )}
      </div>
    </div>
  );
}
