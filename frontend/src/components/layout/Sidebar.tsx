"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag,
  PieChart, 
  Sparkles,
  Megaphone,
  Settings,
  Split,
  LayoutTemplate,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes: Array<{ label: string, icon: LucideIcon, href: string, color: string, badge?: string, notification?: string }> = [
  { label: "Overview", icon: LayoutDashboard, href: "/", color: "text-slate-300" },
  { label: "Customers", icon: Users, href: "/customers", color: "text-slate-300" },
  { label: "Orders", icon: ShoppingBag, href: "/orders", color: "text-slate-300" },
  { label: "Segments", icon: PieChart, href: "/segments", color: "text-slate-300" },
  { label: "Campaigns", icon: Megaphone, href: "/campaigns", color: "text-slate-300" },
  { label: "Journey Builder", icon: Split, href: "/journey-builder", color: "text-slate-300" },
  { label: "AI Command Center", icon: Sparkles, href: "/ai-command-center", color: "text-blue-400" },
  { label: "Templates", icon: LayoutTemplate, href: "/templates", color: "text-purple-500" },
  { label: "Settings", icon: Settings, href: "/settings", color: "text-slate-300" },
];

export function Sidebar() {
  const pathname = usePathname();

  const { data: dashboard } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then(res => res.data),
    refetchInterval: 10000 // Keep it somewhat fresh
  });

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#0B132B] text-white w-64 flex-shrink-0">
      <div className="px-6 py-4 flex items-center gap-2 mb-4">
        <div className="text-white p-1 rounded-md flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="tarsGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <polygon points="50,20 76,35 76,65 50,80 24,65 24,35" stroke="url(#tarsGrad)" strokeWidth="4" />
            <polygon points="50,2 56,8 50,14 44,8" stroke="url(#tarsGrad)" strokeWidth="2" />
            <circle cx="50" cy="8" r="1.5" fill="url(#tarsGrad)" />
            <line x1="50" y1="14" x2="50" y2="20" stroke="url(#tarsGrad)" strokeWidth="2" />
            <polygon points="50,86 56,92 50,98 44,92" stroke="url(#tarsGrad)" strokeWidth="2" />
            <circle cx="50" cy="92" r="1.5" fill="url(#tarsGrad)" />
            <line x1="50" y1="80" x2="50" y2="86" stroke="url(#tarsGrad)" strokeWidth="2" />
            <polygon points="8,50 14,56 20,50 14,44" stroke="url(#tarsGrad)" strokeWidth="2" />
            <circle cx="14" cy="50" r="1.5" fill="url(#tarsGrad)" />
            <line x1="20" y1="50" x2="24" y2="50" stroke="url(#tarsGrad)" strokeWidth="2" />
            <polygon points="80,50 86,56 92,50 86,44" stroke="url(#tarsGrad)" strokeWidth="2" />
            <circle cx="86" cy="50" r="1.5" fill="url(#tarsGrad)" />
            <line x1="76" y1="50" x2="80" y2="50" stroke="url(#tarsGrad)" strokeWidth="2" />
            <path d="M 38 40 L 62 40 M 44 40 L 44 65 M 56 40 L 56 65" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight">TARS AI</h1>
      </div>
      <div className="px-4 flex-1">
        <ul className="space-y-1.5">
          {routes.map((route) => {
            const isActive = pathname === route.href || (pathname.startsWith(route.href) && route.href !== '/');
            return (
              <li key={route.href}>
                <Link
                  href={route.href}
                  className={cn(
                    "text-sm group flex items-center p-3 w-full font-medium cursor-pointer rounded-lg transition-colors",
                    isActive ? "bg-[#1D4ED8] text-white" : "text-slate-500 hover:bg-slate-800 hover:text-white",
                    route.label === "AI Command Center" && !isActive ? "text-blue-400 hover:text-blue-300" : ""
                  )}
                >
                  <route.icon className={cn("h-5 w-5 mr-3", isActive ? "text-white" : (route.label === "AI Command Center" ? "text-blue-400" : "text-slate-500"))} />
                  <span className="flex-1">{route.label}</span>
                  
                  {route.badge && (
                    <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded ml-2">
                      {route.badge}
                    </span>
                  )}
                  {route.notification && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                      {route.notification}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Campaign Health */}
      <div className="px-6 mb-4">
        <div className="border-t border-slate-800 pt-6 mb-2">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Campaign Health</h4>
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Active Campaigns: <span className="font-semibold text-white ml-auto">{dashboard ? dashboard.active_campaigns : '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            Conversion Rate: <span className="font-semibold text-white ml-auto">{dashboard ? `${dashboard.conversion_rate}%` : '-'}</span>
          </div>
        </div>
      </div>

      {/* AI Copilot Card */}
      <div className="px-4 pb-4">
        <div className="bg-[#111C3A] rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold text-sm">AI Copilot</span>
          </div>
          <ul className="text-[11px] text-slate-500 mb-4 leading-relaxed space-y-1.5">
            <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500"></div> Generate audiences</li>
            <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500"></div> Create campaigns</li>
            <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500"></div> Optimize performance</li>
          </ul>
          <button className="w-full bg-[#1A2954] hover:bg-[#253974] text-blue-400 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            Open Copilot
          </button>
        </div>
      </div>

    </div>
  );
}
