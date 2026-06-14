"use client"
import { useState, useRef, useEffect } from "react"
import { User, Bell, Shield, Plug, CheckCircle2, Sparkles, Activity, MessageSquare, Mail, Database, Loader2, Key, History, Laptop, AlertCircle, BrainCircuit, Sliders } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useUser } from "@/contexts/UserContext"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { profile: globalProfile, updateProfile } = useUser()

  // Tab States
  const [profile, setProfile] = useState(globalProfile)

  // Keep local state synced if global profile changes
  useEffect(() => {
    setProfile(globalProfile)
  }, [globalProfile])

  // AI Configuration
  const [aiConfig, setAiConfig] = useState({
    provider: "OpenAI",
    model: "GPT-4o",
    temperature: 0.7,
    segmentGeneration: true,
    campaignGeneration: true,
    journeyGeneration: true,
    revenuePrediction: true
  })

  // Channel Service
  const [channelService, setChannelService] = useState({
    email: {
      connected: true,
      simulationMode: true,
      deliveryRate: 92,
      openRate: 41,
      clickRate: 12
    },
    whatsapp: {
      connected: true,
      simulationMode: true,
      deliveryRate: 95,
      readRate: 78
    }
  })

  // Notifications
  const [notifications, setNotifications] = useState({
    journeyCompleted: true,
    campaignCreated: true,
    segmentGenerated: true,
    highChurnAlert: true,
    aiRecommendation: true
  })

  // AI Learning & Memory
  const [aiLearning, setAiLearning] = useState({
    learnCampaigns: true,
    learnSegments: true,
    learnJourneys: true,
    confidenceThreshold: 85
  })
  
  // Security
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  })
  
  const [apiKey, setApiKey] = useState("pk_live_*******************")

  // Fetch Config from API
  useEffect(() => {
    fetch("http://localhost:5000/api/settings/config", {
      headers: { "Authorization": "Bearer default-demo-user-token" }
    })
    .then(res => res.json())
    .then(data => {
      if (data.aiConfig) setAiConfig(data.aiConfig);
      if (data.channelService) setChannelService(data.channelService);
      if (data.notifications) setNotifications(data.notifications);
      if (data.aiLearning) setAiLearning(data.aiLearning);
      setIsLoaded(true);
    })
    .catch(err => {
      console.error(err);
      setIsLoaded(true);
    });

    fetch("http://localhost:5000/api/settings/security/api-key", {
      headers: { "Authorization": "Bearer default-demo-user-token" }
    })
    .then(res => res.json())
    .then(data => {
      if (data.api_key) setApiKey(data.api_key);
    })
    .catch(() => {});
  }, []);

  // Integrations
  const [integrations, setIntegrations] = useState([
    { id: "crm", name: "CRM Database", desc: "1,000 Customers Loaded", icon: Database, color: "text-sky-500", bg: "bg-sky-500/10", connected: true, isConnecting: false },
    { id: "campaign", name: "Campaign Dataset", desc: "Historical Campaign Performance", icon: Mail, color: "text-blue-500", bg: "bg-blue-500/10", connected: true, isConnecting: false },
    { id: "journey", name: "Journey Dataset", desc: "Automated Workflows & Paths", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10", connected: true, isConnecting: false },
  ])

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "ai-config", label: "AI Configuration", icon: Sparkles },
    { id: "channel-service", label: "Channel Service", icon: Activity },
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ]

  const handleSaveProfile = async () => {
    // Basic validation
    if (!profile.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSaving(true);
    await updateProfile(profile);
    setIsSaving(false);
    toast.success("Profile updated successfully");
  }

  const handleSaveConfig = async (message: string) => {
    setIsSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/settings/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer default-demo-user-token"
        },
        body: JSON.stringify({
          aiConfig, channelService, notifications, aiLearning
        })
      });
      if (!res.ok) throw new Error("Failed to save config");
      toast.success(message);
    } catch (err) {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setProfile({ ...profile, avatarUrl: url });
      updateProfile({ avatarUrl: url });
      toast.success("Avatar updated successfully");
    }
  }

  const handleConnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, isConnecting: true } : i));
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: true, isConnecting: false } : i));
      const name = integrations.find(i => i.id === id)?.name;
      toast.success(`${name} connected successfully!`);
    }, 1500);
  }

  const handleDisconnect = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: false } : i));
    const name = integrations.find(i => i.id === id)?.name;
    toast.success(`${name} has been disconnected.`);
  }

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full text-slate-900">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1 text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your AI CRM platform configuration.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Settings Navigation */}
        <div className="block lg:hidden w-full mb-4">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Settings Menu</label>
          <div className="relative">
            <select 
              className="w-full appearance-none bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-medium shadow-sm"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Desktop Settings Navigation */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <nav className="flex flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? "text-white" : "text-slate-500"}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 min-h-[600px] mb-8">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Information</h2>
              
              <div className="flex items-center gap-6 mb-8">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover shadow-inner" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl font-bold shadow-inner">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                )}
                <div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg">Change Avatar</Button>
                  <p className="text-xs text-slate-500 font-medium">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First Name</label>
                  <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 bg-white focus:bg-slate-50 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last Name</label>
                  <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 bg-white focus:bg-slate-50 transition-colors" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 bg-white focus:bg-slate-50 transition-colors" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Role</label>
                  <div className="relative">
                    <select value={profile.role} onChange={(e) => setProfile({...profile, role: e.target.value})} className="w-full appearance-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 bg-white focus:bg-slate-50 transition-colors">
                      <option value="Marketing Admin">Marketing Admin</option>
                      <option value="Campaign Manager">Campaign Manager</option>
                      <option value="Data Analyst">Data Analyst</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              </div>



              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* AI CONFIGURATION TAB */}
          {activeTab === "ai-config" && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" /> AI Engine Configuration
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border border-slate-200 rounded-2xl bg-slate-50">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">AI Provider</label>
                    <select 
                      value={aiConfig.provider} 
                      onChange={(e) => setAiConfig({...aiConfig, provider: e.target.value})} 
                      className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 font-bold shadow-sm outline-none"
                    >
                      <option value="OpenAI">OpenAI</option>
                      <option value="Gemini">Gemini</option>
                      <option value="Claude">Claude</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Model</label>
                    <select 
                      value={aiConfig.model} 
                      onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})} 
                      className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 font-bold shadow-sm outline-none"
                    >
                      <option value="GPT-4o">GPT-4o</option>
                      <option value="GPT-4-Turbo">GPT-4-Turbo</option>
                      <option value="Gemini 2.5 Pro">Gemini 2.5 Pro</option>
                      <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex justify-between text-sm font-semibold text-slate-700">
                      <span>Temperature</span>
                      <span className="text-indigo-600">{aiConfig.temperature}</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.1" 
                      value={aiConfig.temperature}
                      onChange={(e) => setAiConfig({...aiConfig, temperature: parseFloat(e.target.value)})}
                      className="w-full accent-indigo-600"
                    />
                    <p className="text-xs text-slate-500">Lower values produce deterministic outputs. Higher values are more creative.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 mb-2">Enable AI Capabilities</h4>
                  {[
                    { key: "segmentGeneration", title: "AI Segmentation", desc: "Allow AI to analyze customers and generate targeted segments." },
                    { key: "campaignGeneration", title: "AI Campaign Generation", desc: "Enable automated email & SMS campaign drafting." },
                    { key: "journeyGeneration", title: "AI Journey Generation", desc: "Allow AI to build multi-step automated journeys." },
                    { key: "revenuePrediction", title: "AI Revenue Prediction", desc: "Predict LTV and campaign revenue dynamically." }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                        <p className="text-xs font-medium text-slate-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" checked={aiConfig[item.key as keyof typeof aiConfig] as boolean} onChange={(e) => setAiConfig({...aiConfig, [item.key]: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button onClick={() => handleSaveConfig("AI Configuration saved")} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
              </div>
            </div>
          )}

          {/* CHANNEL SERVICE TAB */}
          {activeTab === "channel-service" && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" /> Channel Service Simulator
              </h2>
              
              <p className="text-sm text-slate-500 mb-6 font-medium">Configure the simulated communication providers and conversion rates for your CRM demo.</p>

              <div className="space-y-6 mb-8">
                
                {/* Email Service */}
                <div className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Mail className="h-5 w-5"/></div>
                      <div>
                        <h4 className="font-bold text-slate-900">Email Service</h4>
                        <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Simulation Mode</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={channelService.email.simulationMode} onChange={(e) => setChannelService({...channelService, email: {...channelService.email, simulationMode: e.target.checked}})} />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  {channelService.email.simulationMode && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">Delivery Rate: {channelService.email.deliveryRate}%</label>
                        <input type="range" min="0" max="100" value={channelService.email.deliveryRate} onChange={(e) => setChannelService({...channelService, email: {...channelService.email, deliveryRate: parseInt(e.target.value)}})} className="w-full accent-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">Open Rate: {channelService.email.openRate}%</label>
                        <input type="range" min="0" max="100" value={channelService.email.openRate} onChange={(e) => setChannelService({...channelService, email: {...channelService.email, openRate: parseInt(e.target.value)}})} className="w-full accent-amber-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">Click Rate: {channelService.email.clickRate}%</label>
                        <input type="range" min="0" max="100" value={channelService.email.clickRate} onChange={(e) => setChannelService({...channelService, email: {...channelService.email, clickRate: parseInt(e.target.value)}})} className="w-full accent-purple-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* WhatsApp Service */}
                <div className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><MessageSquare className="h-5 w-5"/></div>
                      <div>
                        <h4 className="font-bold text-slate-900">WhatsApp Service</h4>
                        <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Simulation Mode</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={channelService.whatsapp.simulationMode} onChange={(e) => setChannelService({...channelService, whatsapp: {...channelService.whatsapp, simulationMode: e.target.checked}})} />
                        <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  {channelService.whatsapp.simulationMode && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">Delivery Rate: {channelService.whatsapp.deliveryRate}%</label>
                        <input type="range" min="0" max="100" value={channelService.whatsapp.deliveryRate} onChange={(e) => setChannelService({...channelService, whatsapp: {...channelService.whatsapp, deliveryRate: parseInt(e.target.value)}})} className="w-full accent-emerald-500" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600">Read Rate: {channelService.whatsapp.readRate}%</label>
                        <input type="range" min="0" max="100" value={channelService.whatsapp.readRate} onChange={(e) => setChannelService({...channelService, whatsapp: {...channelService.whatsapp, readRate: parseInt(e.target.value)}})} className="w-full accent-sky-500" />
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button onClick={() => handleSaveConfig("Channel Service configured")} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Rates
                </Button>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === "integrations" && (
            <div className="max-w-3xl animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">CRM Data Integrations</h2>
              </div>
              
              <div className="space-y-4">
                {integrations.map((integ) => (
                  <div key={integ.id} className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${integ.bg} ${integ.color}`}>
                        <integ.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{integ.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">{integ.desc}</p>
                      </div>
                    </div>
                    {integ.connected ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                        </div>
                        <Button onClick={() => handleDisconnect(integ.id)} variant="ghost" size="sm" className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold px-2">
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => handleConnect(integ.id)} disabled={integ.isConnecting} variant="outline" className="text-slate-700 font-semibold border-slate-200 hover:bg-slate-50 rounded-lg min-w-[100px]">
                        {integ.isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Notifications & Alerts</h2>
              
              <div className="space-y-6 mb-8">
                <div className="space-y-4">
                  {[
                    { key: "journeyCompleted", title: "Journey Completed", desc: "Notify when an active journey concludes for all participants." },
                    { key: "campaignCreated", title: "Campaign Created", desc: "Notify when a new campaign is drafted or launched." },
                    { key: "segmentGenerated", title: "Segment Generated", desc: "Alert when AI automatically identifies a new customer segment." },
                    { key: "highChurnAlert", title: "High Churn Alert", desc: "Critical alerts when key customers show risk of churning." },
                    { key: "aiRecommendation", title: "AI Recommendation Available", desc: "Notify when the copilot has a new optimization suggestion." }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="pr-4">
                        <p className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" className="sr-only peer" checked={notifications[item.key as keyof typeof notifications] as boolean} onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})} />
                        <div className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all bg-slate-200 peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-blue-600`}></div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-5 border border-amber-200 bg-amber-50 rounded-xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 mb-1 text-sm">Quiet Hours</h4>
                    <p className="text-xs font-medium text-amber-800">You currently have quiet hours enabled from 10:00 PM to 7:00 AM. Push notifications will be silenced.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button onClick={() => handleSaveConfig("Notification preferences updated")} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Security & Access</h2>
              
              <div className="space-y-8 mb-8">
                
                {/* Password Change */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Key className="h-4 w-4 text-slate-500" /> Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Current Password</label>
                      <input type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white focus:bg-slate-50 transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">New Password</label>
                        <input type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white focus:bg-slate-50 transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                        <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} placeholder="••••••••" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white focus:bg-slate-50 transition-colors" />
                      </div>
                    </div>
                    <Button onClick={() => {
                      if (!passwords.current || !passwords.new || !passwords.confirm) {
                        toast.error("Please fill all password fields")
                        return
                      }
                      if (passwords.new !== passwords.confirm) {
                        toast.error("New passwords do not match")
                        return
                      }
                      if (passwords.new.length < 8) {
                        toast.error("Password must be at least 8 characters long")
                        return
                      }
                      
                      setIsSaving(true);
                      fetch("http://localhost:5000/api/settings/security/password", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer default-demo-user-token" },
                        body: JSON.stringify({ current: passwords.current, new: passwords.new })
                      }).then(res => {
                        if (!res.ok) throw new Error("Failed to update password");
                        toast.success("Password updated successfully");
                        setPasswords({current: "", new: "", confirm: ""});
                      }).catch(() => toast.error("Error updating password"))
                      .finally(() => setIsSaving(false));
                    }} disabled={isSaving} variant="outline" className="font-bold rounded-lg border-slate-200 mt-2 text-slate-700 hover:bg-slate-50">Update Password</Button>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {/* 2FA */}
                <div className="flex items-center justify-between p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Two-Factor Authentication (2FA)</h4>
                    <p className="text-sm font-medium text-slate-500">Adds an extra layer of security to your account using an authenticator app.</p>
                  </div>
                  <Button variant="outline" className="font-bold text-blue-600 border-blue-200 hover:bg-blue-50">Enable 2FA</Button>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {/* API Keys */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Plug className="h-4 w-4 text-slate-500" /> API Keys</h3>
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50">
                    <p className="text-sm text-slate-600 mb-4 font-medium">Use these keys to authenticate your external services with the CRM Engine.</p>
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2">
                      <code className="text-sm font-mono text-slate-800 flex-1">{apiKey}</code>
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600 font-bold px-2 py-1 h-auto" onClick={() => {navigator.clipboard.writeText(apiKey); toast.success("Copied to clipboard")}}>Copy</Button>
                    </div>
                    <Button variant="outline" onClick={() => {
                      fetch("http://localhost:5000/api/settings/security/api-key", {
                        method: "POST",
                        headers: { "Authorization": "Bearer default-demo-user-token" }
                      }).then(res => res.json()).then(data => {
                        setApiKey(data.api_key);
                        toast.success("New API key generated");
                      })
                    }} className="mt-4 font-bold border-slate-200 text-slate-700 hover:bg-slate-100">Generate New Key</Button>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {/* Login History */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><History className="h-4 w-4 text-slate-500" /> Recent Activity</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Device</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        <tr className="bg-white">
                          <td className="py-3 px-4 flex items-center gap-2"><Laptop className="h-4 w-4 text-emerald-500"/> Windows PC (Chrome)</td>
                          <td className="py-3 px-4">San Francisco, CA</td>
                          <td className="py-3 px-4 text-emerald-600 font-bold">Current Session</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}



        </div>
      </div>
    </div>
  )
}
