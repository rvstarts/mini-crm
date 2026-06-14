"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { Bell, Search, User as UserIcon, Mail, Users, Sparkles, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useUser();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search API Call
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchResultClick = (result: any) => {
    if (result.type === "action" && result.action === "open_ai_command") {
      router.push("/ai-command-center");
    } else if (result.url) {
      router.push(result.url);
    }
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const getLinkClass = (path: string) => {
    // For overview, match exactly '/'
    // For others, check if pathname starts with the path
    const isActive = path === '/' ? pathname === '/' : pathname.startsWith(path);
    return `h-16 flex items-center transition-colors font-semibold px-1 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 border-b-2 border-transparent hover:text-slate-900'}`;
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-8 text-sm font-medium h-full">
        <Link href="/" className={getLinkClass("/")}>
          Overview
        </Link>
        <Link href="/campaigns" className={getLinkClass("/campaigns")}>
          Campaigns
        </Link>
        <Link href="/segments" className={getLinkClass("/segments")}>
          Segments
        </Link>
        <Link href="/settings" className={getLinkClass("/settings")}>
          Settings
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        <div ref={searchRef} className={`relative flex items-center transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search campaigns, segments, customers..." 
             className="w-full h-9 px-4 border border-slate-200 bg-slate-50 rounded-full text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all" 
             autoFocus={isSearchOpen}
           />
           
           {/* Dropdown Menu */}
           {isSearchOpen && searchQuery.trim() && (
             <div className="absolute top-12 left-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
               {isSearching ? (
                 <div className="p-4 flex items-center justify-center text-slate-500 text-sm">
                   <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                 </div>
               ) : searchResults.length > 0 ? (
                 <div className="max-h-[300px] overflow-y-auto p-2">
                   {searchResults.map((res, i) => (
                     <div 
                       key={i} 
                       onClick={() => handleSearchResultClick(res)}
                       className="p-2 hover:bg-slate-50 cursor-pointer rounded-lg flex flex-col gap-1 transition-colors"
                     >
                       <div className="flex items-center gap-2">
                         {res.type === "customer" && <UserIcon className="h-4 w-4 text-sky-500" />}
                         {res.type === "campaign" && <Mail className="h-4 w-4 text-blue-500" />}
                         {res.type === "segment" && <Users className="h-4 w-4 text-emerald-500" />}
                         {res.type === "action" && <Sparkles className="h-4 w-4 text-purple-500" />}
                         <span className="text-sm font-bold text-slate-900">{res.title}</span>
                       </div>
                       {res.subtitle && <span className="text-xs text-slate-500 font-medium ml-6">{res.subtitle}</span>}
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="p-4 text-center text-slate-500 text-sm font-medium">
                   No results found for "{searchQuery}"
                 </div>
               )}
             </div>
           )}
        </div>
        
        {!isSearchOpen && (
          <button onClick={() => setIsSearchOpen(true)} className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors bg-white shadow-sm">
            <Search className="h-4 w-4" />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors relative outline-none cursor-pointer bg-white shadow-sm">
            <Bell className="h-4 w-4" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-rose-500 rounded-full border border-white"></span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 bg-white border border-slate-200 shadow-lg rounded-xl z-[9999] p-2">
            <div className="px-3 py-2 text-sm font-bold text-slate-900">Notifications</div>
            <div className="h-px bg-slate-100 my-1 mx-2"></div>
            <DropdownMenuItem className="py-3 px-3 cursor-pointer rounded-lg hover:bg-slate-50 focus:bg-slate-50 text-slate-700">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-900">Campaign Completed</span>
                <span className="text-xs text-slate-500 font-medium">Your "Flash Sale Friday" campaign has finished sending.</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-3 px-3 cursor-pointer rounded-lg hover:bg-slate-50 focus:bg-slate-50 text-slate-700">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-blue-600">New AI Insights</span>
                <span className="text-xs text-slate-500 font-medium">TARS AI found 3 new opportunities for upsell. Click to view.</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors ml-1 border border-transparent hover:border-slate-200">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
              {profile.firstName?.[0]}{profile.lastName?.[0]}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 leading-tight">{profile.firstName} {profile.lastName}</span>
            <span className="text-xs font-medium text-slate-500 leading-tight">{profile.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
