"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemePreference } from "@/components/theme/use-theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSettings() {
  const { preference, setTheme, mounted } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Appearance</p>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={mounted && preference === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme(opt.value)}
          >
            <opt.icon className="size-4" /> {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
