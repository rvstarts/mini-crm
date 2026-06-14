"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { Sparkles, Plus, Users, Loader2, TrendingUp, DollarSign, Target, Megaphone, Download, MoreHorizontal, Eye, X, Filter, Trash2, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Segment = {
  id: number
  name: string
  description: string
  audience_count: number
  journey_id?: number
  journey_name?: string
  created_at: string
}

export default function SegmentsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const { data: segments = [], isLoading, refetch } = useQuery<Segment[]>({
    queryKey: ['segments'],
    queryFn: () => api.get('/segments/').then(res => res.data)
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers/').then(res => res.data)
  });

  const [isForceRefreshing, setIsForceRefreshing] = useState(false);

  const { data: opportunities, isLoading: isLoadingOpp, isError: isErrorOpp, error: errorOpp } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => api.get('/copilot/opportunities').then(res => res.data),
    retry: false
  });

  const handleForceRefreshOpp = async () => {
    setIsForceRefreshing(true);
    try {
        const res = await api.get('/copilot/opportunities?force=true');
        queryClient.setQueryData(['opportunities'], res.data);
    } catch (e) {
        console.error("Refresh failed", e);
    } finally {
        setIsForceRefreshing(false);
    }
  };

  // AI Generator State
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Rule Builder State
  const [showBuilder, setShowBuilder] = useState(false)
  const [segmentName, setSegmentName] = useState("")
  const [rules, setRules] = useState([{ field: "Total Spend", operator: "Is greater than", value: "5000" }])
  const [isSaving, setIsSaving] = useState(false)

  // AI Opportunities Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewSegmentData, setPreviewSegmentData] = useState<any>(null)
  const [previewCustomers, setPreviewCustomers] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  const handleReviewSegment = async (segmentData: any) => {
    if (!segmentData || (!segmentData.rules && !segmentData.generatedRules)) return;
    
    let rawRules = segmentData.generatedRules || segmentData.rules;
    if (typeof rawRules === 'string') {
      try {
        rawRules = JSON.parse(rawRules);
      } catch (e) {
        console.error("Failed to parse rules", e);
        rawRules = [];
      }
    }
    
    const normalizedData = {
      id: segmentData.id,
      segmentName: segmentData.recommendedSegmentName || segmentData.segmentName || segmentData.name,
      reason: segmentData.reasoning || segmentData.reason || segmentData.description,
      rules: rawRules,
      estimatedRecovery: segmentData.potentialRecovery || segmentData.estimatedRecovery || segmentData.estimated_recovery || 0,
      confidence: segmentData.confidence || 90
    };
    
    setPreviewSegmentData(normalizedData);
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      const res = await api.post('/copilot/preview-segment', { rules: normalizedData.rules });
      setPreviewCustomers(res.data.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateOpportunitySegment = async () => {
    if (!previewSegmentData) return;
    setIsSaving(true);
    try {
      await api.post('/segments/', {
        name: previewSegmentData.segmentName || "AI Recommended Segment",
        description: `AI Generated: ${previewSegmentData.reason}`,
        rules_json: previewSegmentData.rules,
        audience_count: previewCustomers.length,
        ai_reasoning: previewSegmentData.reason,
        estimated_recovery: previewSegmentData.estimatedRecovery,
        recommended_campaign: 'Targeted Re-engagement',
        opportunity_id: previewSegmentData.id
      });
      setPreviewModalOpen(false);
      setPreviewSegmentData(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate real audience count
  const uniqueCities = Array.from(new Set(customers.map((c: any) => c.city).filter(Boolean)));
  let estimatedAudience = customers.length;
  if (customers.length > 0) {
    const matched = customers.filter((c: any) => {
      return rules.every(rule => {
        if (!rule.value) return true;
        
        const val = rule.value.toLowerCase();
        
        if (rule.field === 'City') {
          const cCity = (c.city || '').toLowerCase();
          if (rule.operator === 'Equals') return cCity === val;
          if (rule.operator === 'Not equals') return cCity !== val;
          if (rule.operator === 'Contains') return cCity.includes(val);
        }
        
        if (rule.field === 'Total Spend') {
          const numVal = parseFloat(rule.value);
          if (isNaN(numVal)) return true;
          if (rule.operator === 'Is greater than') return c.total_spend > numVal;
          if (rule.operator === 'Is less than') return c.total_spend < numVal;
          if (rule.operator === 'Equals') return c.total_spend === numVal;
        }
        
        if (rule.field === 'Order Count') {
          const numVal = parseInt(rule.value);
          if (isNaN(numVal)) return true;
          const orders = c.order_count || 0;
          if (rule.operator === 'Is greater than') return orders > numVal;
          if (rule.operator === 'Is less than') return orders < numVal;
          if (rule.operator === 'Equals') return orders === numVal;
        }
        
        if (rule.field === 'Last Purchase Date') {
          if (!val) return true;
          const targetDate = new Date(val).getTime();
          const customerDate = new Date(c.last_active).getTime();
          
          if (rule.operator === 'Is older than') {
             return customerDate < targetDate;
          }
          if (rule.operator === 'Is newer than') {
             return customerDate > targetDate;
          }
          if (rule.operator === 'Is exactly') {
             const td = new Date(val);
             const cd = new Date(c.last_active);
             return td.getFullYear() === cd.getFullYear() && td.getMonth() === cd.getMonth() && td.getDate() === cd.getDate();
          }
          return true;
        }
        return true;
      });
    });
    estimatedAudience = matched.length;
  }

  const handleAddRule = () => {
    setRules([...rules, { field: "Total Spend", operator: "Is greater than", value: "" }])
  }

  const handleRemoveRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx))
  }

  const getOperatorsForField = (field: string) => {
    if (field === 'City') return ['Equals', 'Not equals', 'Contains'];
    if (field === 'Last Purchase Date') return ['Is older than', 'Is newer than', 'Is exactly'];
    return ['Is greater than', 'Is less than', 'Equals'];
  };

  const handleRuleChange = (idx: number, key: string, val: string) => {
    const newRules = [...rules]
    newRules[idx] = { ...newRules[idx], [key]: val }
    if (key === 'field') {
      newRules[idx].operator = getOperatorsForField(val)[0];
    }
    setRules(newRules)
  }

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      alert("Please enter a segment name")
      return
    }
    setIsSaving(true)
    try {
      await api.post('/segments/', {
        name: segmentName,
        description: rules.map(r => `${r.field} ${r.operator} ${r.value}`).join(' AND '),
        rules_json: rules,
        audience_count: estimatedAudience
      })
      setShowBuilder(false)
      setSegmentName("")
      setRules([{ field: "Total Spend", operator: "Is greater than", value: "5000" }])
      refetch()
    } catch (err) {
      console.error(err)
      alert("Failed to save segment")
    } finally {
      setIsSaving(false)
    }
  }



  const [generatedSegments, setGeneratedSegments] = useState<any[]>([])
  const [generateError, setGenerateError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const res = await api.post('/copilot/generate-segment', { prompt })
      if (res.data.segments) {
        setGeneratedSegments(res.data.segments)
        setShowPreview(true)
      } else {
        setGenerateError("AI couldn't generate segments")
      }
    } catch (e: any) {
      setGenerateError(e.response?.data?.error || "Failed to generate segment with AI")
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: "compact" }).format(val);

  const totalSegments = segments.length;
  const avgAudienceSize = totalSegments > 0 ? Math.round(segments.reduce((acc: any, s: any) => acc + s.audience_count, 0) / totalSegments) : 0;
  const potentialRev = segments.reduce((acc: any, s: any) => acc + (s.expected_revenue || 0), 0);

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full text-slate-900 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Segments</h1>
          <p className="text-sm text-slate-500">Manage and create target audiences for your campaigns.</p>
        </div>
        <Button onClick={() => setShowBuilder(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" /> Create Segment
        </Button>
      </div>

      {/* Top AI Section: Generator & Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* AI Audience Generator */}
        <div className="lg:col-span-2 bg-[#0B132B] rounded-xl p-5 text-white shadow-md border border-slate-800 flex flex-col justify-center relative overflow-hidden h-full">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex items-start gap-4 mb-4 relative z-10">
            <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30 shrink-0">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">AI Audience Generator</h3>
              <p className="text-sm text-slate-300">Describe who you want to target, and our AI will build the segment rules automatically.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative z-10">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Customers in Delhi who bought shoes in the last 60 days but haven't returned..." 
              className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all w-full font-medium shadow-sm"
            />
            <Button onClick={handleGenerate} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-500 text-white px-6 w-full sm:w-auto font-medium">
              {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : "Generate"}
            </Button>
          </div>
          
          {generateError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-sm text-rose-600 flex items-center gap-2">
              <span className="font-semibold">AI Analysis Failed:</span> {generateError}
            </div>
          )}

          {/* AI Segment Preview Expandable Area */}
          {showPreview && generatedSegments.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-700/50 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> AI Suggested Segments
                </h4>
              </div>
              
              {generatedSegments.map((seg, idx) => (
                <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10 col-span-2 sm:col-span-1">
                      <div className="text-xs text-slate-400 mb-1">Segment Name</div>
                      <div className="text-sm font-semibold text-white truncate">{seg.name}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-slate-400 mb-1">Audience Size</div>
                      <div className="text-sm font-semibold text-white">{seg.estimated_customer_count} Customers</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-slate-400 mb-1">Expected Recovery</div>
                      <div className="text-sm font-semibold text-emerald-400">{formatCurrency(seg.estimated_recovery || 0)}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-slate-400 mb-1">Confidence</div>
                      <div className="text-sm font-semibold text-white">{seg.confidence || 90}%</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="text-xs text-slate-400 mb-1">Description</div>
                      <div className="text-sm font-semibold text-slate-300">{seg.description}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-slate-400 mb-1">AI Reasoning</div>
                        <div className="text-sm font-medium text-slate-300 italic">&quot;{seg.reason}&quot;</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="text-xs text-slate-400 mb-1">Generated Rules</div>
                        <div className="text-xs font-mono text-slate-300 space-y-1">
                           {seg.rules && seg.rules.map((r: any, rIdx: number) => (
                               <div key={rIdx}>• {r.field} {r.operator} {r.value}</div>
                           ))}
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end border-t border-slate-700 pt-4 mt-2">
                    <div className="text-[10px] text-slate-500">
                        Generated by Gemini
                    </div>
                    <div className="flex justify-end gap-3 shrink-0">
                      <Button className="bg-white text-slate-900 font-semibold hover:bg-slate-200" onClick={() => {
                        handleReviewSegment(seg);
                        setShowPreview(false);
                      }}>Review & Create Segment</Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10" onClick={() => setShowPreview(false)}>Dismiss</Button>
              </div>
            </div>
          )}
        </div>

        {/* AI Opportunities Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-full">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp className="h-16 w-16 text-blue-600" />
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">AI Opportunity</h3>
              </div>
              <Button onClick={handleForceRefreshOpp} disabled={isLoadingOpp || isForceRefreshing} variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                <RefreshCcw className={`h-4 w-4 ${isForceRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              </Button>
            </div>
            
            {(isLoadingOpp || isForceRefreshing) ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500 relative z-10">
                <Loader2 className="h-6 w-6 animate-spin text-blue-400 mb-3" />
                <span className="text-sm font-medium">Analyzing customer behavior...</span>
                <span className="text-xs mt-1 text-slate-400">Identifying highest-value audience opportunity...</span>
              </div>
            ) : isErrorOpp || !opportunities ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500 relative z-10">
                 <span className="text-sm text-rose-500 font-medium">AI Analysis Failed</span>
                 <p className="text-xs text-center mt-1 px-4 text-slate-400">
                   {errorOpp ? ((errorOpp as any).response?.data?.error || (errorOpp as Error).message) : "Unable to generate AI opportunities right now."}
                 </p>
              </div>
            ) : (
              <div className="relative z-10 flex-1 flex flex-col justify-center">
                <h4 className="text-sm font-bold text-slate-900 mb-1 leading-snug pr-6">{opportunities.title}</h4>
                <p className="text-[11px] text-slate-600 mb-2 font-medium leading-relaxed">
                  <span className="text-rose-600 font-bold">{opportunities.customerCount} customers</span> matching <span className="font-semibold text-slate-900">{opportunities.recommendedSegmentName}</span>.
                </p>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mb-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Potential Recovery</span>
                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(opportunities.potentialRecovery || 0)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">AI Confidence</span>
                    <span className="text-xs font-bold text-slate-900">{opportunities.confidence < 1 ? (opportunities.confidence * 100).toFixed(0) : opportunities.confidence}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button onClick={() => handleReviewSegment(opportunities)} disabled={!opportunities || isErrorOpp || isLoadingOpp || isForceRefreshing} variant="outline" size="sm" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 relative z-10 text-xs h-8">Review & Create</Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Segments", value: totalSegments, icon: Target, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "AI Generated", value: Math.max(1, Math.floor(totalSegments * 0.4)), icon: Sparkles, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Avg. Audience Size", value: avgAudienceSize, icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
          { label: "Potential Revenue", value: formatCurrency(potentialRev), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-0.5">{kpi.label}</p>
              <h4 className="text-xl font-bold text-slate-900">{kpi.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Saved Segments</h3>
        <div className="text-xs text-slate-500">Updated today</div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
             <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-48 animate-pulse flex flex-col justify-between">
                <div className="h-10 w-10 bg-slate-100 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                </div>
             </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((seg, index) => {
            // Mocking revenue and badges for UI enhancement
            const revenue = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(seg.audience_count * 121);
            let badge = null;
            if (index === 0) badge = { text: "🤖 Recommended", classes: "bg-indigo-50 text-indigo-700 border-indigo-100" };
            if (index === 1) badge = { text: "🔥 High Revenue", classes: "bg-amber-50 text-amber-700 border-amber-100" };

            return (
              <div key={seg.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                      <Users className="h-5 w-5" />
                    </div>
                    {badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.classes}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                  
                  {/* Quick Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900" />}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 z-[9999]" sideOffset={8}>
                      <Link href={`/segments/${seg.id}`}>
                        <DropdownMenuItem className="cursor-pointer text-slate-700 focus:text-blue-600 focus:bg-blue-50 hover:text-blue-600 hover:bg-blue-50">
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/campaigns/create">
                        <DropdownMenuItem className="cursor-pointer text-blue-600 font-medium focus:text-blue-700 focus:bg-blue-50 hover:text-blue-700 hover:bg-blue-50">
                          <Megaphone className="mr-2 h-4 w-4" /> Create Campaign
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem 
                        className="cursor-pointer text-slate-700 focus:text-blue-600 focus:bg-blue-50 hover:text-blue-600 hover:bg-blue-50"
                        onClick={async () => {
                          try {
                            const res = await api.get('/customers/');
                            const customers = res.data;
                            
                            let filtered = customers;
                            const lowerName = seg.name.toLowerCase();
                            
                            // Apply basic filtering to simulate segment logic
                            if (lowerName.includes('dormant') || lowerName.includes('churn')) {
                                filtered = customers.filter((c: any) => c.churn_risk_score >= 70);
                            } else if (lowerName.includes('high revenue') || lowerName.includes('vip')) {
                                filtered = customers.filter((c: any) => c.total_spend >= 5000);
                            } else if (lowerName.includes('recent')) {
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                filtered = customers.filter((c: any) => new Date(c.last_active) >= thirtyDaysAgo);
                            }

                            if (filtered.length === 0) {
                              filtered = customers; // fallback if no match
                            }

                            const headers = ["ID", "Name", "Email", "Phone", "City", "Total Spend", "Churn Risk", "Last Active"];
                            const csvRows = filtered.map((c: any) => {
                              return [
                                c.id,
                                `"${String(c.name || '').replace(/"/g, '""')}"`,
                                `"${String(c.email || '').replace(/"/g, '""')}"`,
                                `"${String(c.phone || '').replace(/"/g, '""')}"`,
                                `"${String(c.city || '').replace(/"/g, '""')}"`,
                                c.total_spend,
                                c.churn_risk_score,
                                `"${String(c.last_active || '').replace(/"/g, '""')}"`
                              ].join(",");
                            });
                            
                            const csvContent = [headers.join(","), ...csvRows].join("\n");
                            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute("download", `segment_${seg.name.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } catch (error) {
                            console.error("Failed to export audience", error);
                            alert("Failed to export audience.");
                          }
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" /> Export Audience
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer text-rose-600 font-medium focus:text-rose-700 focus:bg-rose-50 hover:text-rose-700 hover:bg-rose-50"
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this segment? This cannot be undone.")) {
                            try {
                              await api.delete(`/segments/${seg.id}`);
                              refetch();
                            } catch (error) {
                              console.error("Failed to delete segment", error);
                              alert("Failed to delete segment.");
                            }
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Segment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <Link href={`/segments/${seg.id}`} className="hover:underline">
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{seg.name} <span className="font-normal text-sm text-slate-500 ml-1">Customers</span></h4>
                </Link>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 flex-1">{seg.description}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Audience</div>
                    <div className="text-sm font-bold text-slate-900">{seg.audience_count} <span className="text-xs font-normal text-slate-500">users</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Rev. Potential</div>
                    <div className="text-sm font-bold text-emerald-600">{revenue}</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-5 text-[10px] text-slate-400">
                  Created {new Date(seg.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rule Builder Drawer / Modal Overlay */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Segment Rule Builder</h2>
                <p className="text-xs text-slate-500">Define complex audience targeting rules.</p>
              </div>
              <button onClick={() => setShowBuilder(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block">Segment Name</label>
                  <input type="text" value={segmentName} onChange={(e) => setSegmentName(e.target.value)} placeholder="e.g. High Value Churn Risk" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">Include users who match all of the following:</span>
                </div>
                
                <div className="space-y-3 pl-6 border-l-2 border-slate-200">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      {idx > 0 && (
                        <div className="flex items-center gap-2 -ml-[31px]">
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-200">AND</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <select value={rule.field} onChange={(e) => handleRuleChange(idx, 'field', e.target.value)} className="bg-white border border-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 shadow-sm w-full sm:w-auto">
                          <option>Total Spend</option>
                          <option>Last Purchase Date</option>
                          <option>City</option>
                          <option>Order Count</option>
                        </select>
                        <select value={rule.operator} onChange={(e) => handleRuleChange(idx, 'operator', e.target.value)} className="bg-white border border-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 shadow-sm w-full sm:w-auto">
                          {getOperatorsForField(rule.field).map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                        {rule.field === 'City' ? (
                          <select value={rule.value} onChange={(e) => handleRuleChange(idx, 'value', e.target.value)} className="bg-white border border-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 shadow-sm w-full sm:w-auto">
                            <option value="">Select City...</option>
                            {uniqueCities.map(city => <option key={city as string} value={city as string}>{city as string}</option>)}
                          </select>
                        ) : rule.field === 'Last Purchase Date' ? (
                          <input type="date" value={rule.value} onChange={(e) => handleRuleChange(idx, 'value', e.target.value)} className="bg-white border border-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 shadow-sm w-full sm:w-auto" />
                        ) : (
                          <input type="number" value={rule.value} onChange={(e) => handleRuleChange(idx, 'value', e.target.value)} placeholder="Value..." className="bg-white border border-slate-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 shadow-sm w-full sm:w-24" />
                        )}
                        <button onClick={() => handleRemoveRule(idx)} disabled={rules.length === 1} className="text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed"><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={handleAddRule} variant="outline" size="sm" className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50 border-dashed w-full sm:w-auto">
                  <Plus className="h-3 w-3 mr-1" /> Add Rule
                </Button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-xl">
              <div className="text-sm font-medium text-slate-500">Estimated Audience: <span className="text-slate-900 font-bold">~{estimatedAudience.toLocaleString()} users</span></div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
                
                <Button disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700" onClick={handleSaveSegment}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Segment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Opportunities Preview Modal */}
      {previewModalOpen && previewSegmentData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  {previewSegmentData.segmentName || "Target Segment"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Review AI analysis and matching customers before creating segment.</p>
              </div>
              <button onClick={() => { setPreviewModalOpen(false); setPreviewSegmentData(null); }} className="text-slate-400 hover:text-slate-600 p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="text-xs text-blue-600 font-semibold mb-1">Audience Size</div>
                    <div className="text-2xl font-bold text-blue-900">{previewLoading ? "..." : previewCustomers.length} Customers</div>
                 </div>
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div className="text-xs text-emerald-600 font-semibold mb-1">Potential Recovery</div>
                    <div className="text-2xl font-bold text-emerald-900">{formatCurrency(previewSegmentData.estimatedRecovery || 0)}</div>
                 </div>
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <div className="text-xs text-amber-600 font-semibold mb-1">AI Confidence</div>
                    <div className="text-2xl font-bold text-amber-900">{previewSegmentData.confidence < 1 ? (previewSegmentData.confidence * 100).toFixed(0) : previewSegmentData.confidence}%</div>
                 </div>
               </div>
               
               <div className="mb-8">
                 <h4 className="text-sm font-semibold text-slate-800 mb-2">AI Reasoning</h4>
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 italic">
                   "{previewSegmentData.reason}"
                 </div>
               </div>

               <div>
                 <h4 className="text-sm font-semibold text-slate-800 mb-4">Customers Included</h4>
                 {previewLoading ? (
                   <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
                 ) : previewCustomers.length === 0 ? (
                   <div className="py-8 text-center text-slate-500 border rounded-lg bg-slate-50">No customers match this segment.</div>
                 ) : (
                   <div className="border border-slate-200 rounded-lg overflow-hidden">
                     <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                         <tr>
                           <th className="py-3 px-4">Name</th>
                           <th className="py-3 px-4">Last Purchase</th>
                           <th className="py-3 px-4">Total Spend</th>
                           <th className="py-3 px-4">Churn Risk</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {previewCustomers.map((c) => (
                           <tr key={c.id} className="hover:bg-slate-50">
                             <td className="py-3 px-4 font-medium text-slate-900">{c.name}</td>
                             <td className="py-3 px-4 text-slate-500">{new Date(c.last_active).toLocaleDateString()}</td>
                             <td className="py-3 px-4 text-slate-900">{formatCurrency(c.total_spend)}</td>
                             <td className="py-3 px-4">
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                 c.churn_risk_category === 'High' ? 'bg-rose-100 text-rose-700' : 
                                 c.churn_risk_category === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                                 'bg-emerald-100 text-emerald-700'
                               }`}>
                                 {c.churn_risk_category || 'Low'}
                               </span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
              <Button variant="ghost" onClick={() => { setPreviewModalOpen(false); setPreviewSegmentData(null); }}>Cancel</Button>
              <Button onClick={handleCreateOpportunitySegment} disabled={isSaving || previewLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Segment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
