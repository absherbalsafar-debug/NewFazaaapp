import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, ChevronDown } from "lucide-react";

export const YEMEN_CITIES = [
  "صنعاء",
  "أمانة العاصمة",
  "عدن",
  "تعز",
  "الحديدة",
  "إب",
  "ذمار",
  "حضرموت",
  "شبوة",
  "مأرب",
  "لحج",
  "أبين",
  "الضالع",
  "صعدة",
  "الجوف",
  "المهرة",
  "حجة",
  "المحويت",
  "ريمة",
  "البيضاء",
  "عمران",
  "سقطرى",
];

interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

export function CitySelector({ value, onChange, placeholder = "اختر محافظتك", className = "" }: CitySelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`w-full h-12 rounded-xl justify-between font-normal text-start ${className} ${!value ? "text-muted-foreground" : ""}`}
        >
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            {value || placeholder}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 max-h-72 overflow-y-auto" align="start">
        {YEMEN_CITIES.map((city) => (
          <DropdownMenuItem
            key={city}
            onSelect={() => onChange(city)}
            className={`cursor-pointer ${value === city ? "text-primary font-bold" : ""}`}
          >
            {value === city && "✓ "}
            {city}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
