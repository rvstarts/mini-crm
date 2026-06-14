"use client"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAICommandStore } from "@/lib/store/ai-command"
import api from "@/lib/api"
import { Sparkles, Send, Bot, User, Command, Zap, ArrowRight, History, Target, AlertTriangle, TrendingUp, Megaphone, Loader2, FireExtinguisher } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AICommandCenterPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const { messages, setMessages, saveSessionAndNewChat, sessions, loadSession } = useAICommandStore()
  
  const { data: insights, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['copilot_insights'],
    queryFn: () => api.get('/copilot/insights').then(res => res.data)
  })

  const { data: recommendations, isLoading: isRecommendationsLoading } = useQuery({
    queryKey: ['copilot_recommendations'],
    queryFn: () => api.get('/copilot/recommendations').then(res => res.data)
  })

  // Initialize the chat feed with AI Insights once the insights are loaded
  useEffect(() => {
    if (insights && messages.length === 0) {
      if (insights.insights_feed) {
        setMessages([
          { 
            role: 'ai', 
            type: 'greeting',
            content: insights.greeting || "Welcome to TARS AI. I've analyzed your CRM database and found some critical opportunities you should review today." 
          },
          ...insights.insights_feed.map((insight: any) => ({
             role: 'ai',
             type: 'insight',
             ...insight
          }))
        ])
      }
    }
  }, [insights, messages.length])

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || prompt;
    if (!textToSend.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: textToSend }])
    setPrompt("")
    
    try {
      const historyContext = messages.slice(-4).map((m: any) => ({ role: m.role, content: m.content || m.title || "" }));
      const res = await api.post('/copilot/chat', { 
        message: textToSend,
        history: historyContext
      });
      const aiResponse = res.data;
      setMessages(prev => [...prev, {
        role: 'ai',
        type: 'response',
        content: aiResponse.content,
        metrics: aiResponse.metrics,
        actions: aiResponse.actions
      }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error analyzing your request." }])
    }
  }

  const handleActionClick = (action: string) => {
    const lower = action.toLowerCase();
    
    // Actions that imply creation or execution should be sent to the AI
    if (
      lower.startsWith('create') || 
      lower.startsWith('generate') || 
      lower.startsWith('launch') || 
      lower.startsWith('build') ||
      lower.startsWith('run') ||
      lower.startsWith('start') ||
      lower.includes('suggested') ||
      lower.includes('draft')
    ) {
      handleSend(action);
      return;
    }
    
    // Otherwise, route the user to the appropriate page to view/analyze
    if (lower.includes('campaign') || lower.includes('email') || lower.includes('whatsapp')) {
        router.push('/campaigns');
    } else if (lower.includes('segment') || lower.includes('compare')) {
        router.push('/segments');
    } else if (lower.includes('customer') || lower.includes('profile') || lower.includes('vip') || lower.includes('churn')) {
        router.push('/customers');
    } else {
        router.push('/');
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AI Command Center</h1>
          </div>
          <p className="text-sm text-slate-500">Your intelligent assistant for CRM operations and growth.</p>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Opportunities</p>
            <h3 className="text-2xl font-bold text-slate-900">{isInsightsLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : insights?.ai_opportunities_found}</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Target className="h-5 w-5" /></div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">At-Risk</p>
            <h3 className="text-2xl font-bold text-slate-900">{isInsightsLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : insights?.high_risk_customers}</h3>
          </div>
          <div className="bg-rose-100 p-3 rounded-xl text-rose-600"><AlertTriangle className="h-5 w-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Rev. Opportunity</p>
            <h3 className="text-2xl font-bold text-emerald-600">{isInsightsLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : formatCurrency(insights?.revenue_opportunity || 0)}</h3>
          </div>
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Suggestions</p>
            <h3 className="text-2xl font-bold text-slate-900">{isInsightsLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : insights?.campaign_suggestions}</h3>
          </div>
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><Megaphone className="h-5 w-5" /></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full flex-1">
        {/* Main Chat / Insights Feed Area */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[600px] lg:min-h-0">
          
          <div className="bg-slate-50/80 border-b border-slate-100 p-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-blue-500" /> AI Insights Feed
            </h3>
            <Button 
              onClick={() => saveSessionAndNewChat()}
              variant="outline" 
              size="sm" 
              className="text-xs bg-white h-7 border-slate-200"
            >
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/30">
            {messages.length === 0 && isInsightsLoading && (
              <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'ai' ? 'bg-[#0B132B] text-blue-400 shadow-sm' : 'bg-blue-100 text-blue-600 shadow-sm'}`}>
                  {msg.role === 'ai' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] rounded-2xl p-4 text-sm bg-blue-600 text-white rounded-tr-none shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    {msg.type === 'greeting' ? (
                       <div className="rounded-2xl p-4 text-sm bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none">
                         {msg.content}
                       </div>
                    ) : (
                       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                         {msg.title && (
                           <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                             <Sparkles className="h-4 w-4 text-amber-500" />
                             <span className="font-semibold text-slate-800 text-sm">{msg.title}</span>
                           </div>
                         )}
                         <div className="p-4">
                           <p className="text-sm text-slate-600 mb-4">{msg.content}</p>
                           
                           {msg.metrics && Object.keys(msg.metrics).length > 0 && (
                             <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                               {Object.entries(msg.metrics).map(([key, value]) => (
                                 <div key={key}>
                                   <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{key}</div>
                                   <div className="font-bold text-slate-900">{value as React.ReactNode}</div>
                                 </div>
                               ))}
                             </div>
                           )}

                           {msg.actions && msg.actions.length > 0 && (
                             <div className="flex gap-2 flex-wrap">
                               {msg.actions.map((action: string, j: number) => (
                                 <Button 
                                   key={j} 
                                   onClick={() => handleActionClick(action)}
                                   size="sm" 
                                   variant={j === 0 ? "default" : "outline"} 
                                   className={j === 0 ? "bg-blue-600 hover:bg-blue-700 shadow-sm text-xs" : "text-xs shadow-sm"}
                                 >
                                   {action}
                                 </Button>
                               ))}
                             </div>
                           )}
                         </div>
                       </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
              <Command className="absolute left-4 text-slate-400 h-5 w-5" />
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI to 'Find high value customers'..."
                className="w-full pl-12 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm shadow-inner"
              />
              <Button 
                onClick={() => handleSend()}
                size="icon" 
                className="absolute right-2 bg-blue-600 hover:bg-blue-700 h-10 w-10 rounded-lg text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex mt-3 gap-2 flex-wrap items-center">
              <span className="text-[10px] text-slate-400 font-medium tracking-wider">TRY ASKING:</span>
              <button onClick={() => handleSend("Find high value customers")} className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full transition-colors font-medium">Find high value customers</button>
              <button onClick={() => handleSend("Analyze recent churn risk")} className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full transition-colors font-medium">Analyze churn</button>
            </div>
          </div>
        </div>

        {/* Sidebar / Recommendations */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Recommended Actions
            </h3>
            
            {isRecommendationsLoading ? (
               <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-3">
                {recommendations?.map((rec: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => handleActionClick(rec.title + ' ' + rec.action)}
                    className="w-full p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                       {rec.icon === 'fire' && <span className="text-rose-500 text-xs">🔥</span>}
                       {rec.icon === 'chart' && <span className="text-emerald-500 text-xs">📈</span>}
                       {rec.icon === 'message' && <span className="text-blue-500 text-xs">💬</span>}
                       {rec.icon === 'target' && <span className="text-amber-500 text-xs">🎯</span>}
                       <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{rec.title}</span>
                    </div>
                    {rec.audience_size && (
                      <div className="text-xs text-slate-500 ml-5">{rec.audience_size} customers</div>
                    )}
                    {rec.opportunity && (
                      <div className="text-xs text-emerald-600 font-medium ml-5">{formatCurrency(rec.opportunity)} opportunity</div>
                    )}
                    {rec.subtitle && (
                      <div className="text-xs text-slate-500 ml-5">{rec.subtitle}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex-1 overflow-y-auto">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-blue-500 shrink-0" /> Chat History
            </h3>
            {sessions.length === 0 ? (
              <div className="text-sm text-slate-500 italic">No past chat history.</div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session, i) => {
                  const minutesAgo = Math.floor((Date.now() - session.timestamp) / 60000);
                  const timeText = minutesAgo < 1 ? 'Just now' : minutesAgo < 60 ? `${minutesAgo} min ago` : `${Math.floor(minutesAgo/60)} hr ago`;
                  
                  return (
                    <div key={session.id} className="relative pl-4 border-l-2 border-blue-100 pb-2">
                      <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-1"></div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5 font-semibold">{timeText}</p>
                      <button 
                        onClick={() => loadSession(session.id)}
                        className="text-sm font-medium text-slate-700 hover:text-blue-600 text-left"
                      >
                        {session.title}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
