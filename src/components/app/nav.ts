import {
  LayoutDashboard,
  SlidersHorizontal,
  PieChart,
  UserRound,
  Activity,
  Database,
  Lightbulb,
  Layers,
  Wallet,
  ShieldAlert,
  CalendarRange,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  group: "plan" | "analyze" | "system";
  shortcut?: string;
}

export const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, group: "plan", shortcut: "G D" },
  { to: "/profile", label: "Profile", icon: UserRound, group: "plan", shortcut: "G F" },
  { to: "/inputs", label: "Inputs", icon: SlidersHorizontal, group: "plan", shortcut: "G I" },
  { to: "/portfolio", label: "Portfolio", icon: PieChart, group: "plan", shortcut: "G P" },
  { to: "/monte-carlo", label: "Monte Carlo", icon: Activity, group: "analyze", shortcut: "G M" },
  { to: "/insights", label: "Insights", icon: Lightbulb, group: "analyze", shortcut: "G N" },
  { to: "/scenarios", label: "Scenarios", icon: Layers, group: "analyze", shortcut: "G S" },
  { to: "/withdrawal", label: "Withdrawal", icon: Wallet, group: "analyze", shortcut: "G W" },
  { to: "/risk", label: "Risk Center", icon: ShieldAlert, group: "analyze", shortcut: "G R" },
  { to: "/timeline", label: "Timeline", icon: CalendarRange, group: "analyze", shortcut: "G T" },
  { to: "/data", label: "Data", icon: Database, group: "system" },
  { to: "/settings", label: "Settings", icon: Settings, group: "system" },
];
