"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { 
  ArrowLeft, Mail, MessageSquare, Phone, MapPin, 
  ShoppingBag, Activity, 
  TrendingUp, Sparkles, Send, User, Calendar, X, Smartphone, RefreshCw,
  CheckCircle2, MousePointerClick, Ticket, Edit2, Play, Check, Loader2, Lightbulb, Megaphone, ChevronDown, ChevronUp, Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<'orders' | 'campaigns'>('orders');
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', city: '' });
  
  // AI Copilot State
  const [copilotChannel, setCopilotChannel] = useState<'WhatsApp' | 'SMS' | 'Email'>('WhatsApp');
  const [copilotMessage, setCopilotMessage] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [launchedCampaignId, setLaunchedCampaignId] = useState<number | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setIsAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await api.get(`/copilot/generate-customer-analysis/${id}`);
      const data = res.data;
      if (data.error) {
        setAnalysisError(data.error);
        setAnalysisData(data); // Provide debug data
        return;
      }
      setAnalysisData(data);
      const channel_rec = data.bestChannel;
      const msg = data.message;
      if (channel_rec) setCopilotChannel(channel_rec as 'WhatsApp' | 'SMS' | 'Email');
      if (msg) setCopilotMessage(msg);
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'AI insights temporarily unavailable.';
      setAnalysisError(msg);
      console.error('[Copilot] Analysis failed:', e);
    } finally {
      setIsAnalysisLoading(false);
    }
  };
  
  // UI State
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then(res => res.data),
  });

  const { data: campaignsData = [] } = useQuery({
    queryKey: ['customer-campaigns', id],
    queryFn: () => api.get(`/campaigns/customer/${id}`).then(res => res.data),
    refetchInterval: 3000,
  });

  const { data: intelligenceData, isLoading: isIntelligenceLoading } = useQuery({
    queryKey: ['customer-intelligence', id],
    queryFn: () => api.get(`/customers/${id}/intelligence`).then(res => res.data),
  });

  const refreshIntelligenceMutation = useMutation({
    mutationFn: () => api.post(`/customers/${id}/intelligence/refresh`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-intelligence', id] });
      toast.success("AI Analysis updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to analyze customer.");
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: (data: any) => api.put(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      setIsEditDialogOpen(false);
      toast.success("Profile updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update profile.");
    }
  });

  if (isLoading) {
    return <div className="p-8 flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  if (!customerData) {
    return <div className="p-8 text-slate-500 text-sm">Customer not found.</div>;
  }

  const customer = customerData;
  const { orders = [] } = customer;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const riskBadge = () => {
    const score = customer.churn_risk_score;
    const category = customer.churn_risk_category;
    if (!score || !category) return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">Pending AI Analysis</span>;
    if (category === 'High') return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">🔴 High Risk {score}%</span>;
    if (category === 'Medium') return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">🟡 Medium Risk {score}%</span>;
    return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">🟢 Low Risk {score}%</span>;
  };


  

  


  const handleEditOpen = () => {
    setEditForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerMutation.mutate(editForm);
  };

  const handleOpenPanel = () => {
    setLaunchedCampaignId(null);
    setIsEditing(false);
    setIsActionPanelOpen(true);
    if (!analysisData) {
      fetchAnalysis();
    } else if (analysisData.personalized_message) {
      setCopilotMessage(analysisData.personalized_message);
      if (analysisData.recommended_channel) {
        setCopilotChannel(analysisData.recommended_channel);
      }
    }
  };

  const handleChannelChange = (channel: 'WhatsApp' | 'SMS' | 'Email') => {
    setCopilotChannel(channel);
    // Ideally we would regenerate specifically for the channel by passing channel to backend
    // For now we just hit fetchAnalysis again if we really want, but let's just mock a short loading state and regenerate
    fetchAnalysis();
  };

  const handleLaunchCampaign = async () => {
    setIsSending(true);
    
    try {
      const res = await api.post('/campaigns/', {
        name: `${copilotChannel} Campaign`,
        customer_id: id,
        channel: copilotChannel,
        message: copilotMessage,
        is_single_user: true
      });
      setLaunchedCampaignId(res.data.id);
      queryClient.invalidateQueries({ queryKey: ['customer-campaigns', id] });
      toast.success('Campaign sent to channel service!');
      // DO NOT close modal, allow user to watch the live timeline
    } catch (err) {
      console.error(err);
      toast.error('Failed to launch campaign.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = () => {
    fetchAnalysis();
  };

  let currentStep = 0;
  if (launchedCampaignId) {
    const liveCamp = campaignsData.find((c: any) => c.id === launchedCampaignId);
    if (liveCamp && liveCamp.logs) {
      if (liveCamp.logs.some((l: any) => l.event_type === 'sent')) currentStep = 1;
      if (liveCamp.logs.some((l: any) => l.event_type === 'delivered')) currentStep = 2;
      if (liveCamp.logs.some((l: any) => l.event_type === 'opened')) currentStep = 3;
      if (liveCamp.logs.some((l: any) => l.event_type === 'clicked')) currentStep = 4;
      if (liveCamp.logs.some((l: any) => l.event_type === 'redeemed')) currentStep = 5;
    }
  }

  const handleDownloadReceipt = (order: any) => {
    const receiptContent = `================================================
                    PULSE STORE
================================================

RECEIPT FOR ORDER #${order.id}
DATE: ${new Date(order.created_at).toLocaleString()}
CUSTOMER: ${customer.name}
------------------------------------------------
CATEGORY:      ${order.category || 'N/A'}
SALES CHANNEL: ${order.channel || 'N/A'}
STATUS:        ${order.status}
------------------------------------------------
TOTAL AMOUNT:  ${formatCurrency(order.amount)}

================================================
           Thank you for your purchase!
================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_Order_${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full text-slate-900">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()} 
            className="text-slate-500 hover:text-slate-900 flex items-center text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
          </button>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-3">
                {customer.name} {riskBadge()}
              </h1>
              <p className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center"><Mail className="h-3 w-3 mr-1"/> {customer.email}</span>
                <span className="flex items-center"><Phone className="h-3 w-3 mr-1"/> {customer.phone || 'N/A'}</span>
                <span className="flex items-center"><MapPin className="h-3 w-3 mr-1"/> {customer.city || 'N/A'}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger render={<Button variant="outline" onClick={handleEditOpen} className="flex-1 md:flex-none border-slate-200">Edit Profile</Button>} />
            <DialogContent className="sm:max-w-[425px] bg-white">
              <DialogHeader>
                <DialogTitle>Edit Customer Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateCustomerMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {updateCustomerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button onClick={handleOpenPanel} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
            <Sparkles className="h-4 w-4" /> Send Personalized Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Insights & Quick Stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Insights Card */}
          <div className="bg-gradient-to-br from-[#111C3A] to-[#1A2954] rounded-xl p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Sparkles className="w-24 h-24" />
             </div>
             <div className="flex items-center gap-2 mb-4">
               <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                 <Sparkles className="h-5 w-5 text-blue-400" />
               </div>
               <h3 className="text-sm font-semibold">AI Customer Intelligence</h3>
             </div>
             
             {isIntelligenceLoading || refreshIntelligenceMutation.isPending ? (
               <div className="flex flex-col items-center justify-center py-12 relative z-10 text-slate-300">
                 <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-4" />
                 <span className="text-sm font-medium">Analyzing Customer...</span>
               </div>
             ) : refreshIntelligenceMutation.isError ? (
               <div className="flex flex-col items-center justify-center py-8 relative z-10 text-slate-300">
                 <span className="text-sm font-bold text-rose-400 mb-2">AI Analysis Failed</span>
                 <span className="text-xs text-rose-300 mb-4 text-center">{(refreshIntelligenceMutation.error as any)?.response?.data?.error || "Unknown error occurred"}</span>
                 <Button onClick={() => refreshIntelligenceMutation.mutate()} className="bg-rose-600 hover:bg-rose-500 text-white shadow-sm text-xs py-1 h-8">
                   Retry Analysis
                 </Button>
               </div>
             ) : intelligenceData?.has_analysis ? (
               <div className="space-y-4 relative z-10">
                 <div>
                   <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Predicted LTV</span>
                   <span className="text-2xl font-bold text-white">{formatCurrency(intelligenceData.predictedLTV)}</span>
                 </div>
                 <div className="flex gap-4">
                   <div>
                     <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Risk Score</span>
                     <span className="text-2xl font-bold text-white">
                       {intelligenceData.riskScore != null ? `${intelligenceData.riskScore}%` : '—'}
                     </span>
                   </div>
                   <div>
                     <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Risk Level</span>
                     <span className="text-lg font-bold">
                       {intelligenceData.riskLevel === 'High' ? (
                         <span className="text-rose-400">High</span>
                       ) : intelligenceData.riskLevel === 'Medium' ? (
                         <span className="text-amber-400">Medium</span>
                       ) : intelligenceData.riskLevel ? (
                         <span className="text-emerald-400">Low</span>
                       ) : <span className="text-slate-400">—</span>}
                     </span>
                   </div>
                 </div>
                 <div>
                   <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Reason</span>
                   <span className="text-sm text-slate-200">
                     {intelligenceData.reason}
                   </span>
                 </div>
                 <div className="pt-2 border-t border-slate-700/50">
                   <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-2">Recommended Action</span>
                   <span className="text-sm text-slate-200 mb-3 block">
                     {intelligenceData.recommendedAction}
                   </span>
                   <Button onClick={handleOpenPanel} className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-sm text-xs py-1 h-8">
                     Open AI Copilot
                   </Button>
                 </div>
                 <div className="pt-4 text-[10px] text-slate-500 flex justify-between items-end">
                   <div>
                     <button onClick={() => refreshIntelligenceMutation.mutate()} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                       <RefreshCw className="h-3 w-3" /> Refresh
                     </button>
                   </div>
                   <div className="text-right">
                     <div className="italic mb-1">Generated by {intelligenceData.modelUsed || "Gemini"}</div>
                     <div>{new Date(intelligenceData.generatedAt).toLocaleString()}</div>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-12 relative z-10 text-slate-300">
                 <span className="text-sm font-medium mb-4 text-center">No AI Analysis generated yet.<br/>Generate intelligence to predict LTV and churn risk.</span>
                 <Button onClick={() => refreshIntelligenceMutation.mutate()} className="bg-blue-600 hover:bg-blue-500 text-white shadow-sm text-xs py-1 h-8">
                   <Sparkles className="h-3 w-3 mr-2" /> Run AI Analysis
                 </Button>
               </div>
             )}
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-4 text-slate-900">Purchase Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-600"><TrendingUp className="h-4 w-4 mr-2 text-slate-400" /> Total Spend</div>
                <div className="font-semibold text-slate-900">{formatCurrency(customer.total_spend)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-600"><ShoppingBag className="h-4 w-4 mr-2 text-slate-400" /> Total Orders</div>
                <div className="font-semibold text-slate-900">{customer.order_count}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-600"><ShoppingBag className="h-4 w-4 mr-2 text-slate-400" /> Avg Order Value</div>
                <div className="font-semibold text-slate-900">{formatCurrency(customer.avg_order_value)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-600"><Calendar className="h-4 w-4 mr-2 text-slate-400" /> Last Active</div>
                <div className="font-medium text-slate-900 text-xs">
                  {customer.last_active ? new Date(customer.last_active).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-600"><User className="h-4 w-4 mr-2 text-slate-400" /> Joined</div>
                <div className="font-medium text-slate-900 text-xs">
                  {new Date(customer.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Order History / Campaigns / Insights */}
        <div className="md:col-span-8 space-y-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setProfileTab('orders')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${profileTab === 'orders' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Recent Orders
              </button>
              <button 
                onClick={() => setProfileTab('campaigns')}
                className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${profileTab === 'campaigns' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Campaign History
              </button>
            </div>
            
            {profileTab === 'orders' && (
              <div className="p-0">
                {orders.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {orders.map((order: any) => (
                      <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <div 
                          className="flex items-center justify-between cursor-pointer group"
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Order #{order.id}</p>
                              <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <p className="font-bold text-slate-900">{formatCurrency(order.amount)}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                {order.status}
                              </span>
                            </div>
                            {expandedOrderId === order.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                          </div>
                        </div>
                        
                        {expandedOrderId === order.id && (
                          <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                            <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product Category</div>
                                <div className="text-sm font-medium text-slate-700">{order.category || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sales Channel</div>
                                <div className="text-sm font-medium text-slate-700">{order.channel || 'N/A'}</div>
                              </div>
                              <div className="col-span-2 pt-2 mt-2 border-t border-slate-100 flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs font-bold shadow-sm"
                                  onClick={() => handleDownloadReceipt(order)}
                                >
                                  <Download className="h-3.5 w-3.5 mr-2" /> Download Receipt
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <ShoppingBag className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                    <p>No orders yet</p>
                  </div>
                )}
              </div>
            )}

            {profileTab === 'campaigns' && (
              <div className="p-0">
                {campaignsData?.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {campaignsData.map((camp: any) => {
                      const allLogs = camp.logs || [];
                      const latestLog = allLogs.length > 0 ? allLogs[allLogs.length - 1] : null;
                      
                      return (
                      <div key={camp.id} className="p-6 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <div 
                          className="flex justify-between items-center cursor-pointer group"
                          onClick={() => setExpandedCampaignId(expandedCampaignId === camp.id ? null : camp.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                              {camp.channel === 'WhatsApp' ? <MessageSquare className="h-5 w-5" /> : camp.channel === 'Email' ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{camp.name}</h3>
                              <p className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{camp.channel}</span> • <span>{new Date(camp.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {latestLog && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider border border-indigo-100">
                                Status: {latestLog.event_type}
                              </span>
                            )}
                            {expandedCampaignId === camp.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                          </div>
                        </div>

                        {expandedCampaignId === camp.id && (
                          <div className="mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200">
                            {camp.message && (
                              <div className="mb-8 p-4 bg-white rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap shadow-sm">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Message Content</div>
                                {camp.message}
                              </div>
                            )}
                            
                            {/* Timeline Visualization */}
                            <div className="relative pt-2">
                              <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200"></div>
                              
                              <div className="flex justify-between relative z-10">
                                {['generated', 'sent', 'delivered', 'opened', 'clicked', 'redeemed'].map((step) => {
                                  const logEntry = allLogs.find((l: any) => l.event_type === step);
                                  const isComplete = !!logEntry;
                                  
                                  return (
                                    <div key={step} className="flex flex-col items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white ${isComplete ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 text-slate-300'}`}>
                                        {isComplete ? <Check className="h-4 w-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>}
                                      </div>
                                      <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${isComplete ? 'text-slate-800' : 'text-slate-400'}`}>{step}</span>
                                      {isComplete && <span className="text-[9px] text-slate-400 mt-0.5">{new Date(logEntry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    <Megaphone className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                    <p>No campaigns found for this customer.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI Campaign Copilot Modal */}
      {isActionPanelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => !isSending && setIsActionPanelOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-[1100px] max-h-[100vh] md:max-h-[90vh] bg-[#F8FAFC] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl flex-shrink-0 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">AI Campaign Copilot</h2>
                  <div className="text-xs font-medium text-slate-500">Targeting: <span className="text-slate-700">{customer.name}</span></div>
                </div>
              </div>
              <button 
                onClick={() => setIsActionPanelOpen(false)} 
                disabled={isSending}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                
                {/* Column 1: Intelligence & Predictions */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-indigo-500" /> AI Churn Analysis
                    </h3>
                    {isAnalysisLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3">
                        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                        <span className="text-xs text-slate-500 font-medium">Analyzing behavior...</span>
                      </div>
                    ) : analysisError ? (
                      <div className="flex flex-col items-center justify-center py-10 space-y-3 px-4 text-center">
                        <div className="text-sm font-bold text-rose-600">AI Service Unavailable</div>
                        <div className="text-xs text-slate-500 font-mono break-all">Technical Details: {analysisError}</div>
                        <Button variant="outline" size="sm" onClick={() => fetchAnalysis()}>Retry</Button>
                      </div>
                    ) : analysisData && !analysisData.error ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="text-xs text-slate-500 font-medium">Risk Score</span>
                          <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                            analysisData.churnScore <= 30 ? 'text-emerald-700 bg-emerald-50' :
                            analysisData.churnScore <= 70 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                          }`}>{analysisData.churnScore}%</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="text-xs text-slate-500 font-medium">Customer Health</span>
                          <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                            (analysisData.customerHealth) === 'Healthy' || analysisData.customerHealth === 'Low' ? 'text-emerald-700 bg-emerald-50' :
                            (analysisData.customerHealth) === 'Medium' || analysisData.customerHealth === 'At Risk' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                          }`}>{analysisData.customerHealth}</span>
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Reason</span>
                          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg leading-relaxed">
                            {analysisData.reason}
                          </div>
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Recommended Action</span>
                          <div className="text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                            {analysisData.recommendedAction}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="bg-gradient-to-br from-[#111C3A] to-[#1A2954] rounded-xl border border-slate-800 shadow-md p-5 text-white relative overflow-hidden">
                    <Sparkles className="absolute top-2 right-2 w-24 h-24 text-white/5" />
                    <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 relative z-10">
                      <Activity className="h-4 w-4 text-blue-400" /> AI Predictions
                    </h3>
                    {isAnalysisLoading ? (
                      <div className="flex justify-center items-center py-6 relative z-10">
                        <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                      </div>
                    ) : analysisData && !analysisData.error ? (
                      <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Success Prob.</div>
                          <div className="text-xl font-bold text-emerald-400">{analysisData.expectedConversion}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Expected Open</div>
                          <div className="text-xl font-bold text-blue-300">{analysisData.expectedOpenRate}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Column 2: Action & Message */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-indigo-500" /> Personalized Message
                    </h3>
                    
                    <div className="mb-4">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-2">Delivery Channel</label>
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button 
                          onClick={() => handleChannelChange('WhatsApp')}
                          disabled={isSending || isAnalysisLoading}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${copilotChannel === 'WhatsApp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <Smartphone className="h-3.5 w-3.5" /> WhatsApp
                        </button>
                        <button 
                          onClick={() => handleChannelChange('SMS')}
                          disabled={isSending || isAnalysisLoading}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${copilotChannel === 'SMS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> SMS
                        </button>
                        <button 
                          onClick={() => handleChannelChange('Email')}
                          disabled={isSending || isAnalysisLoading}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all ${copilotChannel === 'Email' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <Mail className="h-3.5 w-3.5" /> Email
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col relative">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex justify-between items-end mb-2">
                        <span>Generated Content</span>
                        <button onClick={handleRegenerate} disabled={isAnalysisLoading || isSending} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                          <RefreshCw className={`h-3 w-3 ${isAnalysisLoading ? 'animate-spin' : ''}`} /> Regenerate
                        </button>
                      </label>
                      <div className="relative flex-1 min-h-[200px]">
                        <Textarea 
                          id="copilot-message-input"
                          value={copilotMessage}
                          onChange={(e) => setCopilotMessage(e.target.value)}
                          disabled={isSending || isAnalysisLoading}
                          readOnly={!isEditing}
                          className={`w-full h-full resize-none bg-slate-50 border-slate-200 text-sm p-4 font-medium focus-visible:ring-indigo-500 ${isEditing ? 'text-slate-900 border-indigo-400 ring-1 ring-indigo-400' : 'text-slate-600'}`}
                        />
                        {isAnalysisLoading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-md border border-transparent z-10">
                            <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse mb-2" />
                            <span className="text-xs font-bold text-indigo-600">AI is writing...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
                      <Button 
                        variant={isEditing ? "secondary" : "outline"}
                        disabled={isSending || isAnalysisLoading} 
                        onClick={() => {
                          setIsEditing(!isEditing);
                          if (!isEditing) {
                            setTimeout(() => document.getElementById('copilot-message-input')?.focus(), 50);
                          }
                        }}
                        className={`flex-1 font-semibold ${isEditing ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}`}
                      >
                        <Edit2 className="h-4 w-4 mr-2" /> {isEditing ? 'Done Editing' : 'Edit Manually'}
                      </Button>
                      <Button 
                        onClick={handleLaunchCampaign} 
                        disabled={isSending || launchedCampaignId !== null} 
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-200"
                      >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2" />} 
                        {launchedCampaignId !== null ? "Campaign Launched" : "Launch Campaign"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Column 3: Timeline & Metrics */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 h-full flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-500" /> Live Campaign Tracking
                    </h3>

                    {/* Timeline */}
                    <div className="flex-1 relative pl-4 border-l-2 border-slate-100 space-y-6">
                      {[
                        { step: 0, label: 'Generated by AI', icon: Sparkles, color: 'text-indigo-500', bg: 'bg-indigo-100' },
                        { step: 1, label: 'Sent via Channel', icon: Send, color: 'text-blue-500', bg: 'bg-blue-100' },
                        { step: 2, label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100' },
                        { step: 3, label: 'Message Opened', icon: Mail, color: 'text-amber-500', bg: 'bg-amber-100' },
                        { step: 4, label: 'Link Clicked', icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-100' },
                        { step: 5, label: 'Offer Redeemed', icon: Ticket, color: 'text-rose-500', bg: 'bg-rose-100' },
                      ].map((item) => {
                        const isActive = currentStep === item.step;
                        const isPast = currentStep > item.step;
                        const isPending = currentStep < item.step;
                        
                        return (
                          <div key={item.label} className={`relative flex items-center gap-4 transition-all duration-500 ${isPending ? 'opacity-40 grayscale' : ''}`}>
                            <div className={`absolute -left-[25px] w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 ${isPast || isActive ? 'border-indigo-500' : 'border-slate-200'}`}>
                              {isPast ? (
                                <Check className={`h-3 w-3 text-indigo-500`} />
                              ) : isActive ? (
                                <Loader2 className={`h-3 w-3 animate-spin text-indigo-500`} />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                              )}
                            </div>
                            <div className={`p-2 rounded-lg ${isActive || isPast ? item.bg : 'bg-slate-50'}`}>
                              <item.icon className={`h-4 w-4 ${isActive || isPast ? item.color : 'text-slate-400'}`} />
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${isActive ? 'text-slate-900' : isPast ? 'text-slate-700' : 'text-slate-500'}`}>{item.label}</div>
                              {isActive && launchedCampaignId && <div className="text-[10px] text-slate-500 animate-pulse">Awaiting webhook...</div>}
                              {isPast && launchedCampaignId && <div className="text-[10px] text-emerald-600 font-medium">Logged</div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Mini Metrics */}
                    <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Open Rate</div>
                         <div className="text-lg font-bold text-slate-800 transition-all duration-1000">{currentStep >= 3 ? '100%' : '0%'}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">CTR</div>
                         <div className="text-lg font-bold text-slate-800 transition-all duration-1000">{currentStep >= 4 ? '100%' : '0%'}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2 flex justify-between items-center">
                         <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Revenue Generated</div>
                         <div className="text-lg font-bold text-emerald-600 transition-all duration-1000">{currentStep >= 5 ? formatCurrency(customer.avg_order_value * 0.8 || 405) : '$0'}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>


            </div>
          </div>
        </div>
      )}
    </div>
  );
}

