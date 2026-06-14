"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LayoutTemplate, Search, Plus, Sparkles, Filter, 
  MoreVertical, Copy, Edit3, Trash2, Eye, LayoutGrid, List
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function formatDistanceToNow(dateInput: string | Date, options?: any) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

const TemplateThumbnail = ({ src, alt }: { src: string, alt: string }) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return <LayoutTemplate className="h-12 w-12 text-slate-300" />;
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover"
      onError={() => setError(true)}
    />
  );
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Templates");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("updated_at");

  const categories = [
    "All Templates",
    "Newsletter",
    "Win Back",
    "Promotional",
    "VIP",
    "Cart Recovery",
    "Cross Sell",
    "Product Launch",
    "Seasonal",
    "Birthday",
    "Saved Image"
  ];

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      // Use cache busting to ensure we never get a stale empty response
      const timestamp = new Date().getTime();
      const res = await fetch(`http://localhost:5000/api/templates/?sort=${sortBy}&_t=${timestamp}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [sortBy]);

  const handleGenerateTemplate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    const toastId = toast.loading("Gemini is designing your enterprise template...");
    
    try {
      const res = await fetch("http://localhost:5000/api/templates/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success("Template generated!", { id: toastId });
        setAiPrompt("");
        fetchTemplates();
        router.push(`/templates/${data.id}`);
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      toast.error("Failed to generate template", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Template deleted");
        fetchTemplates();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.subject_line || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All Templates" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  const topTemplates = [...templates].sort((a, b) => b.revenue_generated - a.revenue_generated).slice(0, 3);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header & AI Generator */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Template Studio</h1>
        <p className="text-slate-500 mb-8">Enterprise template management with AI generation and real-time performance tracking.</p>
        
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 shadow-lg text-white mb-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-200" />
              AI Template Generation
            </h2>
            <p className="text-purple-100 mb-6">Describe your objective, and Gemini will generate a full responsive layout with targeted copy, subject line, and CTA.</p>
            
            <div className="flex gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
              <input 
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Create a highly converting abandoned cart email with a 15% discount code..."
                className="flex-1 bg-transparent border-none text-white placeholder:text-purple-200 px-4 outline-none focus:ring-0"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateTemplate()}
              />
              <Button 
                onClick={handleGenerateTemplate} 
                disabled={isGenerating || !aiPrompt.trim()}
                className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-6 py-2 rounded-lg shrink-0"
              >
                {isGenerating ? "Generating..." : "Generate with AI"}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Top Performing Templates Row */}
        {topTemplates.length > 0 && topTemplates[0].revenue_generated > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Top Performing Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topTemplates.map(t => (
                <div key={`top-${t.id}`} className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4 flex gap-4 items-center">
                  <div className="h-16 w-16 rounded-lg bg-white border border-yellow-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <TemplateThumbnail src={t.thumbnail} alt={t.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 line-clamp-1">{t.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Generated: <span className="font-bold text-green-600">${t.revenue_generated.toLocaleString()}</span></p>
                    <p className="text-xs text-slate-500">Conv. Rate: <span className="font-bold text-slate-700">{(t.messages_clicked / (t.messages_delivered || 1) * 100).toFixed(1)}%</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Categories */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Categories</h3>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name or subject line..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="updated_at">Recently Updated</option>
                <option value="revenue">Highest Revenue</option>
                <option value="opened">Most Opened</option>
                <option value="clicked">Most Clicked</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-slate-100' : ''}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-slate-100' : ''}>
                <List className="h-4 w-4" />
              </Button>
              <Link href="/templates/new">
                <Button className="bg-slate-900 text-white ml-2">
                  <Plus className="h-4 w-4 mr-2" /> Blank Template
                </Button>
              </Link>
            </div>
          </div>

          {/* Template Grid */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden text-center shadow-sm">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-12">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No templates found for "{activeCategory}"</h3>
                <p className="text-slate-600 mb-8 max-w-lg mx-auto">
                  It looks like there are no templates here. Let Gemini generate a high-converting, professional {activeCategory} template for you instantly.
                </p>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => {
                      setAiPrompt(`Create a professional ${activeCategory} email template.`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate {activeCategory} Template with AI
                  </Button>
                </div>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map(template => (
                <div key={template.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                  {/* Thumbnail Area */}
                  <div className="h-40 bg-slate-50 border-b border-slate-200 relative overflow-hidden flex items-center justify-center">
                    <TemplateThumbnail src={template.thumbnail} alt={template.name} />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                      <div className="flex gap-2">
                        <Link href={`/templates/${template.id}`}>
                          <Button size="sm" className="bg-white hover:bg-slate-100 text-slate-900 font-bold shadow-lg">
                            <Edit3 className="h-4 w-4 mr-2" /> Edit Template
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Info Area */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 truncate">{template.name}</h3>
                        <p className="text-xs text-slate-500 truncate mt-1">Subj: {template.subject_line || "No subject set"}</p>
                      </div>
                      <button onClick={() => handleDelete(template.id)} className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-4 gap-2 text-center mb-3">
                        <div className="bg-slate-50 rounded-lg py-2">
                          <p className="text-xs text-slate-400 mb-1">Sent</p>
                          <p className="font-bold text-slate-900 text-sm">{template.messages_sent}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg py-2">
                          <p className="text-xs text-slate-400 mb-1">Open</p>
                          <p className="font-bold text-slate-900 text-sm">
                            {template.messages_delivered ? Math.round((template.messages_opened / template.messages_delivered) * 100) : 0}%
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg py-2">
                          <p className="text-xs text-slate-400 mb-1">Click</p>
                          <p className="font-bold text-slate-900 text-sm">
                            {template.messages_delivered ? Math.round((template.messages_clicked / template.messages_delivered) * 100) : 0}%
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg py-2">
                          <p className="text-xs text-green-600/70 mb-1">Revenue</p>
                          <p className="font-bold text-green-700 text-sm">${template.revenue_generated.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md">{template.category}</span>
                        <span className="text-slate-400">Updated {formatDistanceToNow(new Date(template.updated_at))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-xs">
                   <tr>
                     <th className="px-6 py-3">Template Info</th>
                     <th className="px-6 py-3">Delivery</th>
                     <th className="px-6 py-3">Engagement</th>
                     <th className="px-6 py-3">Revenue</th>
                     <th className="px-6 py-3 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredTemplates.map(template => (
                     <tr key={template.id} className="hover:bg-slate-50 group">
                       <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{template.name}</div>
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{template.subject_line || "No subject"}</div>
                       </td>
                       <td className="px-6 py-4 text-slate-600">
                         <div>Sent: <strong>{template.messages_sent}</strong></div>
                         <div className="text-xs text-slate-400 mt-1">Del: {template.messages_delivered}</div>
                       </td>
                       <td className="px-6 py-4 text-slate-600">
                         <div className="flex gap-4">
                           <div>
                             <span className="text-xs text-slate-400 block">Open</span>
                             <strong>{template.messages_delivered ? Math.round((template.messages_opened / template.messages_delivered) * 100) : 0}%</strong>
                           </div>
                           <div>
                             <span className="text-xs text-slate-400 block">Click</span>
                             <strong>{template.messages_delivered ? Math.round((template.messages_clicked / template.messages_delivered) * 100) : 0}%</strong>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 font-bold text-green-600">
                         ${template.revenue_generated.toLocaleString()}
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Link href={`/templates/${template.id}`}>
                             <Button variant="outline" size="sm">Edit</Button>
                           </Link>
                           <Link href={`/campaigns/new?templateId=${template.id}`}>
                             <Button variant="default" size="sm" className="bg-purple-600">Use</Button>
                           </Link>
                           <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(template.id)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
