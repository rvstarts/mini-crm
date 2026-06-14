"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import api from '@/lib/api';
import { 
  Users, Send, TrendingUp, ArrowRight,
  AlertCircle, Loader2, Clock, Zap, Target,
  Activity, DollarSign, Sparkles, LayoutDashboard
} from 'lucide-react';
import { 
  XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DashboardOverview() {
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);

  // Queries from both Analytics and Overview
  const { data: dashboard = {}, isLoading: dashboardLoading } = useQuery({ queryKey: ['analytics', 'dashboard'], queryFn: () => api.get('/analytics/dashboard').then(res => res.data) });
  const { data: insights = {}, isLoading: insightsLoading } = useQuery({ queryKey: ['analytics', 'insights'], queryFn: () => api.get('/analytics/insights').then(res => res.data) });
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({ queryKey: ['campaigns'], queryFn: () => api.get('/campaigns/').then(res => res.data) });
  const { data: funnel = {}, isLoading: funnelLoading } = useQuery({ queryKey: ['analytics', 'funnel'], queryFn: () => api.get('/analytics/funnel').then(res => res.data) });
  const { data: execDash = {}, isLoading: execLoading } = useQuery({ queryKey: ['analytics', 'executive-dashboard'], queryFn: () => api.get('/analytics/executive-dashboard').then(res => res.data) });
  const { data: forecast = {}, isLoading: forecastLoading } = useQuery({ queryKey: ['analytics', 'forecast'], queryFn: () => api.get('/analytics/forecast').then(res => res.data) });
  const { data: custInsights = {}, isLoading: custLoading } = useQuery({ queryKey: ['analytics', 'customer-insights'], queryFn: () => api.get('/analytics/customer-insights').then(res => res.data) });
  const { data: channelTable = {}, isLoading: channelTableLoading } = useQuery({ queryKey: ['analytics', 'channel-table'], queryFn: () => api.get('/analytics/channel-table').then(res => res.data) });
  const { data: activityFeed = [], isLoading: feedLoading } = useQuery({ queryKey: ['analytics', 'activity-feed'], queryFn: () => api.get('/analytics/activity-feed').then(res => res.data) });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num || 0);
  const fn = formatNumber;

  const isLoading = dashboardLoading || insightsLoading || campaignsLoading || funnelLoading || execLoading || forecastLoading || custLoading || channelTableLoading || feedLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-full min-h-screen bg-slate-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const KPICard = ({ title, data, suffix = '', isCurrency = false, inverse = false, icon: Icon, gradientClass }: any) => {
    if (!data) return null;
    const isPositive = data.trend >= 0;
    const trendColor = isPositive ? (inverse ? 'text-rose-500' : 'text-emerald-500') : (inverse ? 'text-emerald-500' : 'text-rose-500');
    const formattedVal = isCurrency ? formatCurrency(data.value) : `${fn(data.value)}${suffix}`;
    const sparkData = data.sparkline ? data.sparkline.map((v:any, i:any) => ({ value: v, day: i })) : [];
    
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden h-36 hover:shadow-lg hover:-translate-y-1 transition-all group cursor-pointer">
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className="text-sm font-semibold text-slate-500">{title}</div>
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradientClass} text-white shadow-sm ring-1 ring-white/20`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-slate-900 mb-1 relative z-10 tracking-tight">{formattedVal}</div>
        <div className={`text-xs font-bold flex items-center relative z-10 ${trendColor}`}>
          <TrendingUp className={`h-3 w-3 mr-1 ${isPositive ? '' : 'rotate-180'}`} />
          {isPositive ? '+' : ''}{data.trend}% {inverse && data.trend > 0 ? <span className="ml-1 text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">⚠ At Risk</span> : ''}
        </div>
        {sparkData.length > 0 && (
          <div className="absolute left-0 bottom-0 h-16 w-full opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`color${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive && !inverse ? '#10b981' : '#f43f5e'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositive && !inverse ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={isPositive && !inverse ? '#10b981' : '#f43f5e'} strokeWidth={2} fill={`url(#color${title.replace(/\s+/g, '')})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  const topCampaigns = [...campaigns].sort((a: any, b: any) => (b.revenue_generated || 0) - (a.revenue_generated || 0)).slice(0, 4);
  const channels = channelTable.channels || [];

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      
      {/* 1. Compact Hero Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Good Morning, {profile.firstName} 👋</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm flex items-center font-semibold text-slate-700">
              Revenue Today: <span className="ml-1.5 mr-2">{formatCurrency(dashboard?.revenue_today || 0)}</span> 
              <span className="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded text-xs flex items-center"><TrendingUp className="w-3 h-3 mr-0.5"/> {dashboard?.revenue_today_trend}%</span>
            </div>
            <div className="bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm font-semibold text-slate-700 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              {dashboard?.active_campaigns || 0} Active Campaigns
            </div>
            {insights.churn_risk?.count > 0 && (
              <div className="bg-rose-50 border border-rose-100 px-3 py-1 rounded-full shadow-sm font-semibold text-rose-700 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1.5" />
                {insights.churn_risk.count} At-Risk Customers
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/campaigns" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            <Send className="h-4 w-4" /> Launch
          </Link>
          <Link href="/segments" className="bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
            <Users className="h-4 w-4" /> Segment
          </Link>
        </div>
      </div>

      {/* 2. AI Command Center Strip */}
      {insights.churn_risk?.count > 0 && (
      <div className="bg-gradient-to-r from-indigo-900 to-[#0F172A] rounded-xl p-5 mb-8 text-white shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between border border-indigo-800/50 relative overflow-hidden gap-4">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-start lg:items-center gap-4 lg:gap-6 relative z-10 w-full lg:w-auto">
          <div className="bg-white/10 p-3 rounded-xl border border-white/20 shrink-0">
            <Sparkles className="h-6 w-6 lg:h-8 lg:w-8 text-blue-300" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-1">🧠 AI Command Center</div>
            <h2 className="text-base lg:text-lg font-bold leading-tight">Detected {insights.churn_risk.count} customers likely to churn</h2>
            <div className="text-xs lg:text-sm text-blue-100 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              <span>Potential recovery: <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">{formatCurrency(insights.churn_risk.expected_recovery)}</span></span>
              <span className="flex items-center gap-1 font-medium"><Target className="h-3.5 w-3.5 text-emerald-400" /> Confidence: 92%</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 relative z-10 w-full lg:w-auto shrink-0 mt-2 lg:mt-0">
          <Button 
            className="bg-white text-indigo-900 hover:bg-blue-50 font-bold border-none w-full lg:w-auto shadow-sm"
            onClick={async () => {
              try {
                await api.post('/segments/', {
                  name: `AI Churn Risk Segment - ${insights.churn_risk.count} Users`,
                  description: 'Auto-generated segment of users with high churn probability',
                  audience_count: insights.churn_risk.count,
                  rules_json: {"condition": "AND", "rules": [{"field": "churn_risk_score", "operator": ">", "value": 70}]}
                });
                toast.success(`Segment created successfully for ${insights.churn_risk.count} users!`);
                queryClient.invalidateQueries({ queryKey: ['segments'] });
                router.push('/segments');
              } catch {
                toast.error("Failed to generate segment");
              }
            }}
          >
            Generate Segment
          </Button>
          <Button 
            className="bg-transparent text-white border border-white/30 hover:bg-white/10 w-full lg:w-auto font-medium"
            onClick={async () => {
              try {
                await api.post('/campaigns/', {
                  name: `AI Win-Back - ${insights.churn_risk.count} At-Risk Users`,
                  segment_id: 3, 
                  channel: 'Email',
                  message: 'Here is a special 15% discount to come back!'
                });
                toast.success(`Campaign created successfully for ${insights.churn_risk.count} users!`);
                queryClient.invalidateQueries({ queryKey: ['campaigns'] });
                queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
                router.push('/campaigns');
              } catch {
                toast.error("Failed to launch campaign");
              }
            }}
          >
            Launch Campaign
          </Button>
        </div>
      </div>
      )}

      {/* 3. Smart KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Total Revenue" data={dashboard.total_revenue} isCurrency={true} icon={DollarSign} gradientClass="from-emerald-400 to-emerald-600" />
        <KPICard title="Marketing ROI" data={dashboard.marketing_roi} suffix="x" icon={TrendingUp} gradientClass="from-blue-400 to-blue-600" />
        <KPICard title="Customer LTV" data={dashboard.customer_ltv} isCurrency={true} icon={Users} gradientClass="from-indigo-400 to-indigo-600" />
        <KPICard title="Churn Risk Revenue" data={dashboard.churn_risk_revenue} isCurrency={true} inverse={true} icon={AlertCircle} gradientClass="from-rose-400 to-rose-600" />
      </div>

      {/* 4. AI Recommendations & AI Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* AI Recommendations Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full relative overflow-hidden">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" /> AI Recommendations
          </h3>
          <div className="space-y-4 flex-1">
            {insights.recommendations?.map((rec: any, i: number) => (
               <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white hover:border-blue-200 hover:shadow-sm transition-all group">
                 <div className="p-2 rounded-full h-fit bg-blue-50 text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm border border-blue-100">
                   <Sparkles className="h-5 w-5"/>
                 </div>
                 <div className="flex-1">
                   <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: rec.priority === 'Critical' ? '#e11d48' : '#2563eb' }}>
                     🧠 AI Opportunity
                   </div>
                   <div className="text-sm font-bold text-slate-800 mb-1 leading-tight">{rec.title}</div>
                   <div className="text-xs text-slate-500 mb-3 font-medium">{rec.desc}</div>
                   
                   <div className="flex gap-2">
                     <Button size="sm" onClick={() => setSelectedRecommendation(rec)} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 h-7 text-[11px] px-3 rounded text-center font-bold border border-indigo-100 shadow-sm transition-colors">
                       Review Details
                     </Button>
                   </div>
                 </div>
               </div>
            ))}
          </div>
        </div>

        {/* Live AI Alerts Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" /> Live AI Monitoring
            </h3>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </div>
          <div className="space-y-0 flex-1 relative pt-2">
            <div className="absolute left-[11px] top-4 bottom-4 w-px bg-slate-100"></div>
            {(insights?.ai_alerts || []).map((alert: any, idx: number) => {
              const times = ["2 mins ago", "5 mins ago", "8 mins ago"];
              const time = times[idx] || "15 mins ago";
              const isHigh = alert.priority === 'high';
              const dotColor = isHigh ? 'bg-rose-500' : alert.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
              return (
              <div key={idx} className="relative pl-8 pb-6 last:pb-0 group">
                <div className={`absolute left-[7.5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${dotColor} group-hover:scale-125 transition-transform shadow-sm`}></div>
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-sm font-semibold leading-snug ${isHigh ? 'text-rose-700' : 'text-slate-800'}`}>{alert.text}</div>
                </div>
                <div className="text-xs text-slate-400 font-medium tracking-wide">{time}</div>
              </div>
            )})}
            {(!insights?.ai_alerts || insights.ai_alerts.length === 0) && (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">No new alerts at this time.</div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Marketing Health & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Marketing Health Score Radial Gauge */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center relative col-span-1 hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 self-start w-full mb-2 flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-slate-400" /> Health
          </h3>
          <div className="h-[140px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[{value: execDash.overall_score || 85, fill: '#3b82f6'}, {value: 100 - (execDash.overall_score || 85), fill: '#f1f5f9'}]} 
                  cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={80} outerRadius={110} dataKey="value" stroke="none" 
                  isAnimationActive={false}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="text-4xl font-black text-blue-600">{execDash.overall_score || 85}<span className="text-xl text-slate-300 font-medium">/100</span></span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1 bg-emerald-50 px-2 py-0.5 rounded-full">Excellent</span>
            </div>
          </div>
          <div className="w-full grid grid-cols-2 gap-y-4 gap-x-2 mt-8 text-center">
            {Object.entries(execDash.metrics || {}).map(([key, val]) => (
              <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">{key}</div>
                <div className="text-lg font-bold text-slate-800">{val as number}</div>
              </div>
            ))}
          </div>
        </div>

        {/* True Campaign Funnel */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" /> True Delivery Funnel
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-1.5 w-full pt-2">
            {[
              { label: "Sent", value: funnel.sent, color: "bg-[#0f172a]" },     // Navy
              { label: "Delivered", value: funnel.delivered, color: "bg-[#3b82f6]" }, // Blue
              { label: "Opened", value: funnel.opened, color: "bg-[#8b5cf6]" }, // Purple
              { label: "Clicked", value: funnel.clicked, color: "bg-[#f97316]" }, // Orange
              { label: "Redeemed", value: funnel.redeemed, color: "bg-[#22c55e]" }, // Green
              { label: "Purchased", value: funnel.purchased, color: "bg-[#10b981]" } // Emerald
            ].map((step, i, arr) => {
              const widthStr = arr[0].value ? `${Math.max((step.value/arr[0].value)*100, 1)}%` : "0%";
              const pctOfPrev = i > 0 && arr[i-1].value ? Math.round((step.value / arr[i-1].value) * 100) : null;
              
              return (
                <div key={i} className="flex flex-col relative w-full group">
                  {i > 0 && (
                    <div className="w-full flex justify-center mt-1 mb-1">
                       <div className="text-[10px] font-bold text-slate-400 flex items-center bg-white px-2 rounded-full border border-slate-100 shadow-sm z-10">
                         ↓ {pctOfPrev}%
                       </div>
                    </div>
                  )}
                  <div className="flex items-center w-full">
                    <div className="w-24 md:w-32 text-right pr-3 shrink-0">
                      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{step.label}</span>
                    </div>
                    <div className="flex-1 flex justify-center h-8 lg:h-10">
                      <div className={`h-full rounded shadow-sm transition-all duration-500 ${step.color} relative overflow-hidden`} style={{ width: widthStr, minWidth: '4px' }}>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>
                    <div className="w-24 md:w-32 text-left pl-3 shrink-0">
                      <span className="text-sm font-bold text-slate-800">{fn(step.value)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 6. Live Activity Feed & Campaign Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Live Campaign Activity */}
        <div className="col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock className="h-5 w-5 text-emerald-600" /> Live Activity</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">Live</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-0 max-h-[400px] relative">
            <div className="absolute left-[75px] top-2 bottom-4 w-px bg-slate-100"></div>
            {activityFeed?.map((log: any, idx: number) => {
              const actionLower = log.action.toLowerCase();

              const isOpened = actionLower.includes('opened');
              const isClicked = actionLower.includes('clicked');
              const isRedeemed = actionLower.includes('redeemed');
              const isPurchased = actionLower.includes('revenue') || actionLower.includes('purchase');
              
              const statusColor = isPurchased ? 'text-emerald-600' : isRedeemed ? 'text-green-600' : isClicked ? 'text-blue-600' : isOpened ? 'text-purple-600' : 'text-slate-600';
              const dotColor = isPurchased ? 'bg-emerald-500' : isRedeemed ? 'bg-green-500' : isClicked ? 'bg-blue-500' : isOpened ? 'bg-purple-500' : 'bg-slate-400';
              const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${log.desc.replace(/[^a-zA-Z]/g, '') || idx}`;

              return (
              <div key={log.id} className="flex gap-4 relative pb-5 last:pb-0 group">
                <div className="w-14 text-right shrink-0 mt-0.5">
                  <div className="text-[11px] font-bold text-slate-400">{log.time}</div>
                </div>
                <div className="w-px relative shrink-0">
                  <div className={`absolute w-2.5 h-2.5 rounded-full ${dotColor} -left-[4.5px] top-1.5 ring-4 ring-white shadow-sm group-hover:scale-125 transition-transform`}></div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`text-sm font-bold ${statusColor}`}>{log.action}</div>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mb-1">{log.campaign}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100">
                    <img src={avatar} className="w-4 h-4 rounded-full bg-white border border-slate-200" alt="user"/>
                    {log.desc}
                  </div>
                </div>
              </div>
            )})}
            {(!activityFeed || activityFeed.length === 0) && (
              <div className="text-slate-400 text-sm text-center py-8">No recent activity</div>
            )}
          </div>
        </div>

        {/* Campaign Leaderboard */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" /> Top Performing Campaigns
            </h3>
            <Link href="/campaigns" className="text-sm text-blue-600 font-bold flex items-center hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              View all <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {topCampaigns.map((camp: any, idx: number) => {
              const medals = ['🥇', '🥈', '🥉', '🏅'];
              const ctr = camp.messages_delivered ? ((camp.messages_clicked / camp.messages_delivered) * 100).toFixed(1) : 0;
              return (
                <div key={camp.id} onClick={() => setSelectedCampaign(camp)} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-blue-100 transition-all cursor-pointer group shadow-sm hover:shadow">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl w-10 text-center drop-shadow-sm group-hover:scale-110 transition-transform">{medals[idx] || '🎖'}</div>
                    <div>
                      <div className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors leading-tight mb-1">{camp.name}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{camp.channel || 'Omnichannel'}</div>
                    </div>
                  </div>
                  <div className="flex gap-6 w-full sm:w-auto justify-between sm:justify-end items-center bg-white sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-none border-slate-100 mt-2 sm:mt-0">
                    <div className="text-center sm:text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">CTR</div>
                      <div className="font-bold text-slate-700 text-sm">{ctr}%</div>
                    </div>
                    <div className="w-px h-8 bg-slate-100 hidden sm:block"></div>
                    <div className="text-center sm:text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Revenue</div>
                      <div className="font-black text-emerald-600 text-base">{formatCurrency(camp.revenue_generated)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {topCampaigns.length === 0 && (
              <div className="text-slate-500 text-center py-8">No campaigns available</div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Forecast & Channel Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Forecast Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" /> Revenue Forecast
            </h3>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
              <Zap className="h-3 w-3 fill-current" /> AI Model
            </span>
          </div>
          
          <div className="flex items-end justify-between mb-8 relative">
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Expected Next 30 Days</div>
              <div className="text-3xl font-black text-slate-900">{formatCurrency(forecast.expected_revenue)}</div>
            </div>
            <div className="text-right absolute right-0 top-0 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg shadow-sm">
              <div className="text-[10px] text-blue-600 uppercase font-bold tracking-widest mb-0.5">AI Confidence</div>
              <div className="text-sm font-black text-blue-700">{forecast.confidence}%</div>
            </div>
          </div>
          
          <div className="w-full h-64 relative mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <pattern id="diagonalHatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="4" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.2" />
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} tickFormatter={(value) => `₹${value/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                />
                {/* AI Forecast Zone Shading */}
                <Area type="monotone" dataKey="forecast" fill="url(#colorForecast)" stroke="none" isAnimationActive={false} />
                <Area type="monotone" dataKey="forecast" fill="url(#diagonalHatch)" stroke="none" isAnimationActive={false} />
                
                <Line type="monotone" dataKey="actual" stroke="#0f172a" strokeWidth={3} dot={{r:4, fill:'#0f172a', strokeWidth:0}} activeDot={{r:6, strokeWidth: 0, fill: '#3b82f6'}} />
                <Line type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={3} strokeDasharray="6 6" dot={{r:4, fill:'#6366f1', strokeWidth:0}} activeDot={{r:6, strokeWidth: 0}} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="absolute right-4 -bottom-6 text-[10px] font-bold text-indigo-400 bg-white/80 px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm border border-indigo-50">
              <span className="w-2 h-0.5 bg-indigo-500 border border-indigo-500 border-dashed"></span> Predicted Data
            </div>
            <div className="absolute right-32 -bottom-6 text-[10px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm border border-slate-50">
              <span className="w-2 h-0.5 bg-slate-900"></span> Actual Data
            </div>
          </div>
        </div>

        {/* Channel Intelligence Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" /> Channel Performance Matrix
          </h3>
          
          <div className="overflow-x-auto flex-1 bg-slate-50 rounded-xl border border-slate-100 p-1">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="py-3 px-4 font-bold rounded-tl-lg">Channel</th>
                  <th className="py-3 px-4 font-bold text-center">Score</th>
                  <th className="py-3 px-4 font-bold">Revenue</th>
                  <th className="py-3 px-4 font-bold rounded-tr-lg">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {channels.map((ch: any, idx: number) => {
                  const score = Math.min(99, Math.round(ch.roi * 4 + ch.conversion_rate * 2 + 30));
                  const scoreColor = score >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : score >= 80 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200';
                  const isLast = idx === channels.length - 1;
                  return (
                  <tr key={ch.channel} className="hover:bg-slate-50 transition-colors group">
                    <td className={`py-4 px-4 font-bold text-slate-800 ${isLast ? 'rounded-bl-lg' : ''}`}>{ch.channel}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded font-black text-xs border shadow-sm ${scoreColor}`}>{score}</span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">{formatCurrency(ch.revenue)}</td>
                    <td className={`py-4 px-4 font-semibold text-slate-700 ${isLast ? 'rounded-br-lg' : ''}`}>{ch.ctr}%</td>
                  </tr>
                )})}
                {channels.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No channel data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>

      {/* 8. Customer Intelligence Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8 hover:shadow-md transition-shadow">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" /> Customer Intelligence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 rounded-xl shadow-sm hover:shadow transition-shadow group">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5"/> Most Valuable</div>
            <div className="font-black text-2xl text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">{custInsights.most_valuable?.name}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Revenue</div>
            <div className="font-black text-emerald-600 text-xl">{formatCurrency(custInsights.most_valuable?.revenue)}</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-5 rounded-xl shadow-sm hover:shadow transition-shadow group">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5"/> Fastest Growing</div>
            <div className="font-black text-2xl text-slate-800 mb-2 group-hover:text-blue-700 transition-colors">{custInsights.fastest_growing?.name}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Growth</div>
            <div className="font-black text-blue-600 text-xl">+{custInsights.fastest_growing?.growth}%</div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-5 rounded-xl shadow-sm hover:shadow transition-shadow group">
            <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> Highest Churn</div>
            <div className="font-black text-2xl text-slate-800 mb-2 group-hover:text-rose-700 transition-colors">{custInsights.highest_churn?.name}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Potential Loss</div>
            <div className="font-black text-rose-600 text-xl">{formatCurrency(custInsights.highest_churn?.potential_loss)}</div>
          </div>
        </div>
      </div>

      {/* Campaign Drill-down Modal (unchanged logic, just styled slightly better) */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
          {selectedCampaign && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <Activity className="h-40 w-40 -mr-10 -mt-10" />
                </div>
                <div className="bg-white/10 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 backdrop-blur-sm border border-white/20 shadow-sm">
                  {selectedCampaign.channel || 'Omnichannel'} Campaign
                </div>
                <DialogTitle className="text-2xl font-black mb-2">{selectedCampaign.name}</DialogTitle>
                <div className="text-slate-300 text-xs font-bold flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ring-2 ring-white/20 ${selectedCampaign.status === 'active' ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                  {selectedCampaign.status === 'active' ? 'CURRENTLY RUNNING' : 'COMPLETED'}
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border-b border-slate-100">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Audience</div>
                  <div className="text-xl font-black text-slate-800">{fn(selectedCampaign.messages_sent)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Conversions</div>
                  <div className="text-xl font-black text-indigo-600">{fn(selectedCampaign.conversions)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Revenue</div>
                  <div className="text-xl font-black text-emerald-600">{formatCurrency(selectedCampaign.revenue_generated)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">ROI</div>
                  <div className="text-xl font-black text-amber-600">
                    {selectedCampaign.messages_sent ? (selectedCampaign.revenue_generated / (selectedCampaign.messages_sent * 0.1)).toFixed(1) : 0}x
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500"/> Engagement Funnel</h4>
                <div className="flex items-center gap-1">
                  <div className="bg-[#0f172a] text-white text-[10px] font-bold py-2.5 px-3 rounded-l-lg w-[100%] text-center shadow-inner">Sent</div>
                  <div className="bg-[#3b82f6] text-white text-[10px] font-bold py-2.5 px-3 w-[80%] text-center shadow-inner">Open</div>
                  <div className="bg-[#f97316] text-white text-[10px] font-bold py-2.5 px-3 w-[30%] text-center shadow-inner">Click</div>
                  <div className="bg-[#10b981] text-white text-[10px] font-bold py-2.5 px-3 rounded-r-lg w-[15%] text-center shadow-inner">Buy</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Recommendation Drill-down Modal */}
      <Dialog open={!!selectedRecommendation} onOpenChange={(open) => !open && setSelectedRecommendation(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
          {selectedRecommendation && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                  <Sparkles className="h-40 w-40 -mr-10 -mt-10" />
                </div>
                <div className="bg-white/10 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 backdrop-blur-sm border border-white/20 shadow-sm flex items-center gap-1.5">
                  <Target className="w-3 h-3"/> AI Insight
                </div>
                <DialogTitle className="text-2xl font-black mb-2">{selectedRecommendation.title}</DialogTitle>
                <div className="text-blue-200 text-sm font-medium">
                  {selectedRecommendation.desc}
                </div>
              </div>
              <div className="p-6 bg-slate-50">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-600"/> AI Analysis & Recommended Steps</h4>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-700 mb-3 leading-relaxed">
                      Based on recent customer behavior and interaction data, our AI model has identified this as a <span className="font-bold lowercase">{selectedRecommendation.priority}</span> priority opportunity. Taking immediate action could significantly improve your overall marketing ROI.
                    </div>
                    {selectedRecommendation.title.toLowerCase().includes('churn') ? (
                      <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-sm text-rose-800">
                        <span className="font-bold">Suggested Action:</span> Generate a segment of these at-risk customers and launch a specialized Win-Back campaign offering a special discount.
                      </div>
                    ) : selectedRecommendation.title.toLowerCase().includes('budget') ? (
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800">
                        <span className="font-bold">Suggested Action:</span> Reallocate underperforming channel budget to this high-performing channel to maximize conversions.
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-sm text-emerald-800">
                        <span className="font-bold">Suggested Action:</span> Proceed with the recommended campaign setup using our AI Copilot to generate optimized copy.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedRecommendation(null)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={async () => {
                  try {
                    const titleStr = selectedRecommendation.title.toLowerCase();
                    const numMatch = selectedRecommendation.title.match(/\d+/);
                    const numPeople = numMatch ? numMatch[0] : 'Target';
                    
                    if (titleStr.includes('churn') || titleStr.includes('win-back')) {
                      // Automatically create the campaign
                      await api.post('/campaigns/', {
                        name: `AI Win-Back - ${numPeople} At-Risk Users`,
                        segment_id: 3, 
                        channel: 'Email',
                        message: 'Here is a special 15% discount to come back!'
                      });
                      toast.success(`Campaign created successfully for ${numPeople} users!`);
                      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
                      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
                      router.push('/campaigns');
                    } else if (titleStr.includes('budget')) {
                      toast.success(`Channel budget successfully reallocated!`);
                      // In a real app this would call an API to update budget settings
                      queryClient.invalidateQueries({ queryKey: ['analytics'] });
                    } else {
                      toast.success(`Action executed successfully!`);
                      router.push('/campaigns');
                    }
                  } catch {
                    toast.error("Failed to execute action");
                  } finally {
                    setSelectedRecommendation(null);
                  }
                }}>
                  Take Action Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
