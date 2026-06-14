"use client"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { 
  Plus, Megaphone, MoreVertical, TrendingUp, Sparkles, Send, 
  MousePointerClick, DollarSign, ArrowRight, X, Mail, MessageSquare, 
  Smartphone, Play, Pause, BarChart2, Users, Loader2, Trash2, Activity, LayoutTemplate, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

function CampaignAnalyticsDashboard({ campaignId, onClose }: { campaignId: number, onClose: () => void }) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['campaignAnalytics', campaignId],
    queryFn: () => api.get(`/campaigns/${campaignId}/analytics`).then(res => res.data)
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="font-semibold text-slate-800">Simulating Communication Lifecycle...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl">
          Error loading analytics for campaign {campaignId}.
          <button onClick={onClose} className="ml-4 text-blue-500">Close</button>
        </div>
      </div>
    );
  }

  const { campaign, funnel, stages, timeline, insights } = analytics;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-lg text-white shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Journey Analytics</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-medium text-slate-600">{campaign.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Live Sim</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Funnel & AI */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              
              {/* Funnel Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                  <BarChart2 className="h-5 w-5 text-blue-500" /> Lifecycle Funnel
                </h3>
                <div className="flex flex-col gap-4">
                  {funnel.map((step: any, i: number) => {
                    const colors = ["bg-blue-500", "bg-indigo-500", "bg-amber-500", "bg-purple-500", "bg-emerald-500"];
                    const width = step.percentage > 0 ? `${step.percentage}%` : "0%";
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-24 text-right text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">
                          {step.stage}
                        </div>
                        <div className="flex-1 bg-slate-100 h-10 rounded-r-lg overflow-hidden flex relative group">
                          <div 
                            className={`${colors[i]} h-full transition-all duration-1000 ease-out`} 
                            style={{ width: width, minWidth: '4px' }}
                          ></div>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-sm font-bold text-white drop-shadow-md">
                              {new Intl.NumberFormat('en-US').format(step.count)}
                            </span>
                            <span className="text-xs font-semibold text-white/80 drop-shadow-md">
                              ({step.percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stage Breakdown Visualizer */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-indigo-500" /> Customer Stage Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {['sent', 'delivered', 'opened', 'clicked', 'converted'].map((stage) => (
                    <div key={stage} className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col h-40">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                        {stage} ({stages[stage]?.length || 0})
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {stages[stage]?.map((c: any) => (
                          <div key={c.id} className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 truncate shadow-sm">
                            {c.name}
                          </div>
                        ))}
                        {(!stages[stage] || stages[stage].length === 0) && (
                          <div className="text-xs text-slate-400 italic text-center mt-4">Empty</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Journey Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="p-5 border-b border-slate-100 shrink-0">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-emerald-500" /> Journey Roster
                  </h3>
                </div>
                <div className="overflow-auto flex-1 custom-scrollbar min-h-0 max-h-[600px]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Customer</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Current Stage</th>
                        <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.keys(stages).map(stageKey => 
                        stages[stageKey]?.map((cust: any) => (
                          <tr key={cust.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-medium text-slate-800">{cust.name}</td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">Workflow Step {['sent', 'delivered', 'opened', 'clicked', 'converted'].indexOf(stageKey) + 1}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                stageKey === 'converted' ? 'bg-emerald-100 text-emerald-700' :
                                stageKey === 'clicked' ? 'bg-purple-100 text-purple-700' :
                                stageKey === 'opened' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {stageKey}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column: Timeline & Revenue */}
            <div className="flex flex-col gap-6">
              
              {/* Revenue Attribution */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md p-6 text-white">
                <h3 className="font-bold text-white/90 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Journey Revenue
                </h3>
                <div className="text-4xl font-black mb-2 tracking-tight">
                  {formatCurrency(campaign.revenue)}
                </div>
                <div className="flex items-center gap-4 text-emerald-50 mt-4 border-t border-emerald-400/30 pt-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Conversions</div>
                    <div className="text-xl font-bold">{campaign.conversions || 0}</div>
                  </div>
                  <div className="w-px h-8 bg-emerald-400/30"></div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Avg. Order</div>
                    <div className="text-xl font-bold">{formatCurrency(campaign.aov)}</div>
                  </div>
                </div>
              </div>

              {/* Message Content Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-500" /> Campaign Message
                  </h3>
                  {campaign.template_name && campaign.template_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Template: {campaign.template_name}
                      </span>
                      <Link 
                        href={`/templates/${campaign.template_id}`} 
                        target="_blank"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline bg-indigo-50 px-2 py-1 rounded transition-colors"
                      >
                        View Template
                      </Link>
                    </div>
                  )}
                </div>
                <div 
                  className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-700 font-medium leading-relaxed max-h-48 overflow-y-auto custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: campaign.message || "No message content." }}
                />
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-6">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-500" /> Copilot Insights
                </h3>
                <div className="space-y-3">
                  {insights.map((ins: string, idx: number) => (
                    <div key={idx} className="flex gap-3 text-sm text-indigo-800 bg-white p-3 rounded-lg border border-indigo-100/50 shadow-sm">
                      <div className="mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div></div>
                      <div className="font-medium">{ins}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[450px]">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 flex justify-between items-center z-10">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-slate-400" /> Live Event Timeline
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                  <div className="absolute left-[33px] top-5 bottom-5 w-0.5 bg-slate-100"></div>
                  <div className="space-y-6 relative">
                    {timeline.map((event: any) => {
                      const isConversion = event.event_type === 'converted';
                      const isClick = event.event_type === 'clicked';
                      const isOpened = event.event_type === 'opened';
                      
                      let Icon = Mail;
                      let color = "bg-blue-100 text-blue-600 border-blue-200";
                      
                      if (isConversion) { Icon = DollarSign; color = "bg-emerald-100 text-emerald-600 border-emerald-200"; }
                      else if (isClick) { Icon = MousePointerClick; color = "bg-purple-100 text-purple-600 border-purple-200"; }
                      else if (isOpened) { Icon = Mail; color = "bg-amber-100 text-amber-600 border-amber-200"; }
                      else if (event.event_type === 'delivered') { Icon = Send; color = "bg-indigo-100 text-indigo-600 border-indigo-200"; }

                      return (
                        <div key={event.id} className="flex gap-4 relative animate-in slide-in-from-left-4 duration-300 fade-in">
                          <div className={`w-8 h-8 rounded-full border shrink-0 flex items-center justify-center relative z-10 bg-white ${color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="pt-1.5 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-500">
                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${color.replace('border-', '')}`}>
                                {event.event_type}
                              </span>
                            </div>
                            <p className={`text-sm ${isConversion ? 'font-bold text-emerald-700' : 'text-slate-700'}`}>
                              {event.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedAnalyticsCampaign, setSelectedAnalyticsCampaign] = useState<any>(null);

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns/').then(res => res.data)
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates-list'],
    queryFn: () => api.get('/templates/').then(res => res.data)
  });
  const templates = templatesData?.templates || [];

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: () => api.get('/segments/').then(res => res.data)
  });

  const { data: aiOpportunity, isLoading: aiOpportunityLoading, isFetching: aiOpportunityFetching, error: aiOpportunityError } = useQuery({
    queryKey: ['campaign-ai-opportunity'],
    queryFn: () => api.get('/copilot/campaign-opportunity').then(res => res.data),
    retry: false
  });

  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  
  // Wizard Selections
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [isLaunching, setIsLaunching] = useState(false)
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false)
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  const [filter, setFilter] = useState('All')

  const handleLaunchCampaign = async () => {
    setIsLaunching(true)
    try {
      const seg = segments.find((s: any) => s.name === selectedAudience)
      await api.post('/campaigns/', {
        name: `${selectedChannel} to ${selectedAudience}`,
        segment_id: seg ? seg.id : null,
        channel: selectedChannel || 'Email',
        status: 'active',
        template_id: selectedTemplateId,
        message: aiOpportunity?.message_content || "We miss you! Here is a 20% discount on your next order."
      })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      resetWizard()
    } catch (err) {
      console.error(err)
      alert('Failed to create campaign')
    } finally {
      setIsLaunching(false)
    }
  }

  const [isAILaunching, setIsAILaunching] = useState(false)
  const [showAICampaignReview, setShowAICampaignReview] = useState(false)

  const handleLaunchAICampaign = async () => {
    if (!aiOpportunity) return;
    setIsAILaunching(true)
    try {
      // 1. Automatically create a formally saved Segment for this audience
      const segmentRes = await api.post('/segments/', {
        name: `${aiOpportunity.campaign_name} Audience`,
        description: `Target audience mapped by AI for ${aiOpportunity.campaign_name}`,
        rules_json: aiOpportunity.rules || [],
        ai_reasoning: aiOpportunity.objective
      });
      const segmentId = segmentRes.data.id;

      // 2. Launch the campaign tied to that segment
      await api.post('/campaigns/', {
        name: aiOpportunity.campaign_name,
        segment_id: segmentId,
        channel: aiOpportunity.recommended_channel || 'Email',
        message: aiOpportunity.message_content,
        status: 'active'
      })

      // 3. Mark the AI opportunity as consumed in the backend
      if (aiOpportunity.id) {
        await api.post(`/copilot/campaign-opportunity/${aiOpportunity.id}/consume`);
      }

      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-ai-opportunity'] })
      toast.success("AI Campaign Launched Successfully!");
      setShowAICampaignReview(false);
    } catch (err) {
      console.error(err)
      toast.error('Failed to create AI campaign')
    } finally {
      setIsAILaunching(false)
    }
  }

  const resetWizard = () => {
    setShowWizard(false)
    setWizardStep(1)
    setSelectedAudience(null)
    setSelectedChannel(null)
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/campaigns/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch {
      console.error("Failed to update campaign status");
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const activeCount = campaigns.filter((c: any) => c.status === 'active').length;
  const draftCount = campaigns.filter((c: any) => c.status === 'draft').length;
  const messagesSent = campaigns.reduce((acc: number, c: any) => acc + (c.messages_sent || 0), 0);
  
  let totalClicks = 0;
  let totalDelivered = 0;
  campaigns.forEach((c: any) => {
    totalClicks += (c.messages_clicked || 0);
    totalDelivered += (c.messages_delivered || 0);
  });
  const avgCtr = totalDelivered > 0 ? ((totalClicks / totalDelivered) * 100).toFixed(1) + "%" : "0%";

  const bestCampaign = [...campaigns].sort((a: any, b: any) => (b.revenue_generated || 0) - (a.revenue_generated || 0))[0];

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full text-slate-900 relative">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Campaign Studio</h1>
          <p className="text-sm text-slate-500">Discover audiences, create campaigns, and measure results.</p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* High-Level KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Campaigns", value: activeCount, icon: Play, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Draft Campaigns", value: draftCount, icon: Pause, color: "text-amber-600", bg: "bg-amber-100" },
          { label: "Messages Sent", value: new Intl.NumberFormat('en-US').format(messagesSent), icon: Send, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Avg CTR", value: avgCtr, icon: MousePointerClick, color: "text-indigo-600", bg: "bg-indigo-100" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* AI Campaign Opportunity Hero */}
        <div className="lg:col-span-2 bg-[#0B132B] rounded-xl p-6 md:p-8 text-white shadow-md border border-slate-800 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Sparkles className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">AI Campaign Opportunity</h2>
          </div>
          
          {(aiOpportunityLoading || aiOpportunityFetching) ? (
            <div className="flex flex-col items-center justify-center py-10 relative z-10">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-4" />
              <p className="text-slate-400">Analyzing customer data for opportunities...</p>
            </div>
          ) : aiOpportunityError ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-8">
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 max-w-lg text-center">
                <p className="text-rose-400 font-bold mb-1">AI Service Unavailable</p>
                <p className="text-rose-300 text-sm">{((aiOpportunityError as any)?.response?.data?.error) || "Unknown API Error"}</p>
              </div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['campaign-ai-opportunity'] })} className="mt-4 bg-white/10 hover:bg-white/20 text-white text-xs">
                Retry Analysis
              </Button>
            </div>
          ) : aiOpportunity ? (
            <>
              <p className="text-lg text-slate-300 mb-6 relative z-10 max-w-xl leading-relaxed">
                <span className="text-rose-400 font-bold">{aiOpportunity.target_audience}</span>
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 relative z-10">
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Suggested Campaign</div>
                  <div className="text-sm font-bold text-white">{aiOpportunity.campaign_name}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Expected Reach</div>
                  <div className="text-sm font-bold text-white">{aiOpportunity.target_audience_size} Customers</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Expected Revenue</div>
                  <div className="text-sm font-bold text-emerald-400">{formatCurrency(aiOpportunity.expected_revenue)}</div>
                </div>
              </div>
              
              <div className="relative z-10">
                <Button onClick={() => { console.log('Opening AI Campaign Review modal'); setShowAICampaignReview(true); }} disabled={isAILaunching} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-sm font-bold shadow-lg">
                  {isAILaunching ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Review & Create Campaign
                </Button>
              </div>
            </>
          ) : (
            <p className="text-slate-400 relative z-10">Opportunity data unavailable.</p>
          )}
        </div>

        {/* Performance Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="h-32 w-32 text-emerald-600" />
          </div>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900">Campaign Performance</h3>
          </div>
          
          {bestCampaign ? (
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Best Performing Campaign</p>
              <h4 className="text-lg font-bold text-slate-800 mb-6">{bestCampaign.name}</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MousePointerClick className="h-4 w-4" /> <span className="text-sm font-medium">CTR</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {bestCampaign.messages_delivered > 0 ? ((bestCampaign.messages_clicked / bestCampaign.messages_delivered) * 100).toFixed(1) + '%' : '0%'}
                  </div>
                </div>
                <div className="flex justify-between items-end pb-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="h-4 w-4" /> <span className="text-sm font-medium">Revenue</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-600">{formatCurrency(bestCampaign.revenue_generated)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
              No campaign data available.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-sm font-semibold">All Campaigns</h3>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Active', 'Completed', 'Draft'].map(tab => (
              <Button 
                key={tab}
                variant={filter === tab ? "outline" : "ghost"} 
                size="sm" 
                onClick={() => setFilter(tab)}
                className={`text-slate-500 ${filter === tab ? 'bg-slate-50 border-slate-200' : ''}`}
              >
                {tab === 'Draft' ? 'Drafts' : tab}
              </Button>
            ))}
          </div>
        </div>

        {campaignsLoading ? (
          <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="text-xs text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="pb-3 font-medium pl-2 w-1/3">Campaign</th>
                  <th className="pb-3 font-medium px-4">Status</th>
                  <th className="pb-3 font-medium px-4">Channel</th>
                  <th className="pb-3 font-medium text-right px-4">Sent</th>
                  <th className="pb-3 font-medium text-right px-4 whitespace-nowrap">Open Rate</th>
                  <th className="pb-3 font-medium text-right px-4">CTR</th>
                  <th className="pb-3 font-medium text-right px-4">Revenue</th>
                  <th className="pb-3 font-medium text-right px-4 whitespace-nowrap">Created</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.filter((c: any) => filter === 'All' || c.status === filter.toLowerCase()).map((camp: any) => {
                  let statusColor = "bg-slate-100 text-slate-600 border-slate-200"
                  if (camp.status === 'completed') statusColor = "bg-slate-100 text-slate-600 border-slate-200"
                  if (camp.status === 'active') statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                  if (camp.status === 'draft') statusColor = "bg-amber-50 text-amber-700 border-amber-200"

                  const openRate = camp.messages_delivered > 0 ? ((camp.messages_opened / camp.messages_delivered) * 100).toFixed(1) + '%' : '-';
                  const ctr = camp.messages_delivered > 0 ? ((camp.messages_clicked / camp.messages_delivered) * 100).toFixed(1) + '%' : '-';

                  return (
                    <tr key={camp.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 pl-2">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-slate-800">{camp.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-700">{camp.channel}</td>
                      <td className="py-4 px-4 font-medium text-slate-700 text-right">{new Intl.NumberFormat('en-US').format(camp.messages_sent)}</td>
                      <td className="py-4 px-4 font-medium text-slate-700 text-right">{openRate}</td>
                      <td className="py-4 px-4 font-medium text-slate-700 text-right">{ctr}</td>
                      <td className="py-4 px-4 font-bold text-emerald-600 text-right">{formatCurrency(camp.revenue_generated)}</td>
                      <td className="py-4 px-4 font-medium text-slate-500 text-xs text-right whitespace-nowrap">
                        {new Date(camp.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900" />}>
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-max min-w-[200px]">
                            <DropdownMenuItem onClick={() => setSelectedAnalyticsCampaign(camp)} className="cursor-pointer text-slate-700 hover:bg-slate-50 hover:text-blue-600 focus:bg-slate-50 focus:text-blue-600">
                              <BarChart2 className="mr-2 h-4 w-4 shrink-0" /> View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              if (camp.segment_id) router.push(`/segments/${camp.segment_id}`);
                              else if (camp.customer_id) router.push(`/customers/${camp.customer_id}`);
                              else toast.error("Audience details were not saved for this AI campaign.");
                            }} className="cursor-pointer text-slate-700 hover:bg-slate-50 hover:text-blue-600 focus:bg-slate-50 focus:text-blue-600">
                              <Users className="mr-2 h-4 w-4 shrink-0" /> View Audience
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setShowWizard(true)} className="cursor-pointer text-blue-600 focus:bg-blue-50 focus:text-blue-700">
                              <Sparkles className="mr-2 h-4 w-4 shrink-0" /> 
                              <span className="whitespace-nowrap">Generate Similar Campaign</span>
                            </DropdownMenuItem>

                            {camp.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(camp.id, 'paused')} className="cursor-pointer text-amber-600 focus:bg-amber-50 focus:text-amber-700">
                                <Pause className="mr-2 h-4 w-4 shrink-0" /> Pause Campaign
                              </DropdownMenuItem>
                            )}
                            {camp.status === 'paused' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(camp.id, 'active')} className="cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                                <Play className="mr-2 h-4 w-4 shrink-0" /> Resume Campaign
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                              onClick={async () => {
                                if (confirm("Are you sure you want to delete this campaign? This cannot be undone.")) {
                                  try {
                                    await api.delete(`/campaigns/${camp.id}`);
                                    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
                                  } catch {
                                    console.error("Failed to delete campaign");
                                    alert("Failed to delete campaign.");
                                  }
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4 shrink-0" /> Delete Campaign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Campaign Wizard Overlay */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 h-[600px]">
            
            {/* Wizard Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AI Campaign Creator</h2>
                  <p className="text-xs text-slate-500">Step {wizardStep} of 4</p>
                </div>
              </div>
              <button onClick={resetWizard} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Wizard Progress Bar */}
            <div className="w-full bg-slate-100 h-1">
              <div className="bg-blue-600 h-1 transition-all duration-300" style={{ width: `${(wizardStep / 4) * 100}%` }}></div>
            </div>

            {/* Wizard Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-white">
              
              {wizardStep === 1 && (
                <div className="animate-in slide-in-from-right-8 duration-300">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Select Audience</h3>
                  <p className="text-sm text-slate-500 mb-6">Choose the target segment for your new campaign.</p>
                  
                  <div className="space-y-3">
                    {segments.slice(0, 5).map((seg: any) => (
                      <div 
                        key={seg.id} 
                        onClick={() => setSelectedAudience(seg.name)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAudience === seg.name ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-300'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold ${selectedAudience === seg.name ? 'text-blue-900' : 'text-slate-700'}`}>
                            {seg.name} <span className="text-slate-400 text-xs font-normal ml-2">({seg.audience_count} users)</span>
                          </span>
                          {selectedAudience === seg.name && <div className="h-3 w-3 bg-blue-600 rounded-full"></div>}
                        </div>
                      </div>
                    ))}
                    {segments.length === 0 && <div className="text-sm text-slate-500">No segments available. Please create one first.</div>}
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="animate-in slide-in-from-right-8 duration-300">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Choose Channel</h3>
                  <p className="text-sm text-slate-500 mb-6">Select how you want to reach {selectedAudience || "your audience"}.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "WhatsApp", icon: MessageSquare, desc: "High engagement, instant delivery" },
                      { id: "Email", icon: Mail, desc: "Rich content, higher conversion" },
                      { id: "SMS", icon: Smartphone, desc: "Direct and reliable alerts" },
                    ].map(ch => (
                      <div 
                        key={ch.id} 
                        onClick={() => setSelectedChannel(ch.id)}
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-3 ${selectedChannel === ch.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-300'}`}
                      >
                        <ch.icon className={`h-6 w-6 ${selectedChannel === ch.id ? 'text-blue-600' : 'text-slate-400'}`} />
                        <div>
                          <div className={`font-bold mb-1 ${selectedChannel === ch.id ? 'text-blue-900' : 'text-slate-700'}`}>{ch.id}</div>
                          <div className="text-xs text-slate-500">{ch.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="animate-in slide-in-from-right-8 duration-300">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Generate Message</h3>
                  <p className="text-sm text-slate-500 mb-6">Review the AI-generated message for your {selectedChannel} campaign targeting {selectedAudience}.</p>
                  
                  {aiOpportunityLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4 relative">
                        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                          <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> AI Suggested
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{
                          __html: aiOpportunity?.message_content || "We miss you! Here is a 20% discount on your next order."
                        }} />
                      </div>
                      <Button 
                        variant="outline" 
                        disabled={isGeneratingVariation}
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={async () => {
                          setIsGeneratingVariation(true);
                          try {
                            const currentMsg = aiOpportunity?.message_content || "We miss you! Here is a 20% discount on your next order.";
                            const styles = ["Urgent and Exciting", "Warm and Friendly", "Short and Punchy", "Playful and Clever", "Exclusive and Premium", "Direct and Action-Oriented"];
                            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                            
                            const res = await api.post('/templates/ai-rewrite', {
                              content: currentMsg,
                              instructions: `Rewrite this promotional message to be completely unique. You MUST use a completely different vocabulary and sentence structure from the original. Make the style: ${randomStyle}. Keep the exact same core offer and intent. Make it short and impactful.`,
                              tone: randomStyle
                            });
                            
                            queryClient.setQueryData(['campaign-ai-opportunity'], (old: any) => ({
                              ...old,
                              message_content: res.data.content
                            }));
                            setSelectedTemplateName(null);
                            setSelectedTemplateId(null);
                            toast.success("New variation generated!");
                          } catch (err) {
                            console.error(err);
                            toast.error("Failed to generate variation");
                          } finally {
                            setIsGeneratingVariation(false);
                          }
                        }}
                      >
                        {isGeneratingVariation ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />} 
                        Regenerate Variation
                      </Button>
                      <div className="relative mt-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="w-full text-slate-700 border border-slate-200 hover:bg-slate-50 justify-start h-auto py-2.5 px-4 font-medium relative flex items-center rounded-md cursor-pointer">
                              <LayoutTemplate className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                              <span className="truncate">{selectedTemplateName || "Or Select Existing Template"}</span>
                              <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" side="bottom" className="w-[400px] max-h-[250px] overflow-y-auto z-[100] mt-1">
                            {templates.map((t: any) => (
                              <DropdownMenuItem 
                                key={t.id} 
                                className="cursor-pointer py-2"
                                onClick={async () => {
                                  try {
                                    const res = await api.get(`/templates/${t.id}`);
                                    const content = res.data.html_content ? res.data.html_content.replace(/<[^>]+>/g, '').trim() : (res.data.preheader || "Template selected");
                                    
                                    queryClient.setQueryData(['campaign-ai-opportunity'], (old: any) => ({
                                      ...old,
                                      message_content: content
                                    }));
                                    setSelectedTemplateName(t.name);
                                    setSelectedTemplateId(t.id);
                                    toast.success("Template applied!");
                                  } catch {
                                    toast.error("Failed to load template");
                                  }
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-800">{t.name}</span>
                                  <span className="text-xs text-slate-500">{t.category}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </div>
              )}

              {wizardStep === 4 && (
                <div className="animate-in slide-in-from-right-8 duration-300 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <Megaphone className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to Launch!</h3>
                  <p className="text-slate-500 max-w-sm mb-8">
                    Your <span className="font-semibold text-slate-700">{selectedChannel}</span> campaign for <span className="font-semibold text-slate-700">{selectedAudience}</span> is ready to go live.
                  </p>
                  
                  <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8 text-left">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">Estimated Reach:</span>
                      <span className="text-sm font-bold text-slate-900">
                        ~{(() => {
                          const s = segments?.find((seg: any) => seg.name === selectedAudience);
                          return s ? s.audience_count : 0;
                        })()} users
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-500">Expected CTR:</span>
                      <span className="text-sm font-bold text-slate-900">
                        {selectedChannel === 'Email' ? '12.5%' : selectedChannel === 'SMS' ? '18.2%' : '24.5%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-500">Estimated Revenue:</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {(() => {
                          const s = segments?.find((seg: any) => seg.name === selectedAudience);
                          const count = s ? s.audience_count : 0;
                          const rate = selectedChannel === 'Email' ? 0.05 : selectedChannel === 'SMS' ? 0.08 : 0.1;
                          return formatCurrency(count * rate * 150);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Wizard Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-b-xl">
              {wizardStep > 1 ? (
                <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>Back</Button>
              ) : (
                <div></div>
              )}
              
              {wizardStep < 4 ? (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={() => setWizardStep(wizardStep + 1)}
                  disabled={(wizardStep === 1 && !selectedAudience) || (wizardStep === 2 && !selectedChannel)}
                >
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  disabled={isLaunching}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8" 
                  onClick={handleLaunchCampaign}
                >
                  {isLaunching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Launch Campaign
                </Button>
              )}
            </div>
            
          </div>
        </div>
      )}

      {selectedAnalyticsCampaign && (
        <CampaignAnalyticsDashboard 
          campaignId={selectedAnalyticsCampaign.id} 
          onClose={() => setSelectedAnalyticsCampaign(null)} 
        />
      )}

      {/* AI Campaign Review Modal */}
      {showAICampaignReview && aiOpportunity && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#0B132B] text-white">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-bold">Campaign Recommendation</h2>
              </div>
              <Button variant="ghost" onClick={() => setShowAICampaignReview(false)} className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Strategy & Audience */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Campaign Strategy</h3>
                    <div className="text-xl font-bold text-slate-900 mb-1">{aiOpportunity.campaign_name}</div>
                    <p className="text-sm text-slate-600">{aiOpportunity.objective}</p>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Target Customers ({aiOpportunity.customers?.length || aiOpportunity.target_audience_size})</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {aiOpportunity.customers?.map((customer: any, i: number) => (
                        <div key={i} className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                          <div className="mt-0.5"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">✓</div></div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
                            <div className="text-xs text-slate-500">{customer.reason}</div>
                          </div>
                        </div>
                      ))}
                      {!aiOpportunity.customers?.length && (
                        <div className="text-center text-slate-500 text-sm py-4">Audience details not available</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Content & Metrics */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Generated Content</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Subject Line</div>
                        <div className="font-medium text-slate-900 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          {aiOpportunity.subject_line}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Message Body</div>
                        <div className="text-sm text-slate-700 p-4 bg-slate-50 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed h-[200px] overflow-y-auto">
                          {aiOpportunity.message_content}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Revenue</div>
                      <div className="text-2xl font-bold text-emerald-600">{formatCurrency(aiOpportunity.expected_revenue)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">AI Confidence</div>
                      <div className="text-2xl font-bold text-blue-600">{Math.round((aiOpportunity.confidence || 0) * 100)}%</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAICampaignReview(false)}>Cancel</Button>
              <Button onClick={handleLaunchAICampaign} disabled={isAILaunching} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isAILaunching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Launch
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
