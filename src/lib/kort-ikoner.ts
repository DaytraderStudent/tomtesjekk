import {
  Droplets,
  Mountain,
  AlertTriangle,
  Radiation,
  Layers,
  Home,
  FileText,
  TrendingUp,
  Route,
  Volume2,
  type LucideIcon,
} from "lucide-react";

interface KortIkon {
  icon: LucideIcon;
  farge: string;
}

const KORT_IKONER: Record<string, KortIkon> = {
  flom: { icon: Droplets, farge: "#3B82F6" },
  skred: { icon: Mountain, farge: "#8B5CF6" },
  kvikkleire: { icon: AlertTriangle, farge: "#EF4444" },
  radon: { icon: Radiation, farge: "#F59E0B" },
  grunn: { icon: Layers, farge: "#6366F1" },
  eiendom: { icon: Home, farge: "#10B981" },
  boligpris: { icon: Home, farge: "#14B8A6" },
  regulering: { icon: FileText, farge: "#0EA5E9" },
  ssb: { icon: TrendingUp, farge: "#F97316" },
  nvdb: { icon: Route, farge: "#64748B" },
  stoy: { icon: Volume2, farge: "#A855F7" },
};

export function hentKortIkon(kortId: string): KortIkon {
  return KORT_IKONER[kortId] || { icon: FileText, farge: "#6B7280" };
}
