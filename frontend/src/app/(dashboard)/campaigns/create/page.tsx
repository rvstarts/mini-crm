"use client"
import { useState } from "react"
import { Users, MessageSquare, Rocket, Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

export default function CampaignStudio() {
  const [step, setStep] = useState(1)
  const router = useRouter()
  const [audience, setAudience] = useState('High Churn Risk (AI Suggested)')
  const [channel, setChannel] = useState('WhatsApp')
  const [message, setMessage] = useState("Hey there! We noticed you haven't shopped with us in a while. Here is a 20% off coupon just for you. Use code WINBACK20 at checkout.")
  const [campaignName, setCampaignName] = useState("")
  const [isLaunching, setIsLaunching] = useState(false)

  const handleLaunch = async () => {
    setIsLaunching(true)
    try {
      await api.post('/campaigns/', {
        name: campaignName || `Win-back ${audience.split('(')[0].trim()}`,
        segment_id: null,
        channel: channel,
        message: message,
        status: 'active'
      })
      router.push('/campaigns')
    } catch (err) {
      console.error("Failed to launch campaign", err)
      alert("Failed to launch campaign")
      setIsLaunching(false)
    }
  }

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-full text-slate-900">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Campaign Studio</h1>
          <p className="text-sm text-slate-500">Create, review, and launch your AI-powered campaign.</p>
        </div>
        <div className="flex gap-2 text-sm text-slate-400">
          <span className={step >= 1 ? "text-blue-600 font-semibold" : ""}>1. Audience</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className={step >= 2 ? "text-blue-600 font-semibold" : ""}>2. Message</span>
          <span className="mx-2 text-slate-300">/</span>
          <span className={step >= 3 ? "text-blue-600 font-semibold" : ""}>3. Launch</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Users className="h-5 w-5" /></div>
              <h2 className="text-lg font-bold">Select Audience</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">Who should receive this campaign?</p>
            
            <div className="space-y-4">
              <div 
                onClick={() => setAudience('High Churn Risk (AI Suggested)')}
                className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${audience === 'High Churn Risk (AI Suggested)' ? 'border-2 border-blue-500 bg-blue-50' : 'border border-slate-200 hover:border-slate-300'}`}
              >
                <div>
                  <h4 className={`font-semibold ${audience === 'High Churn Risk (AI Suggested)' ? 'text-blue-900' : 'text-slate-700'}`}>High Churn Risk (AI Suggested)</h4>
                  <p className={`text-xs ${audience === 'High Churn Risk (AI Suggested)' ? 'text-blue-700' : 'text-slate-500'}`}>Users with &gt;80% churn risk. (2,450 users)</p>
                </div>
                {audience === 'High Churn Risk (AI Suggested)' ? (
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</div>
                ) : (
                  <div className="border border-slate-300 rounded-full w-5 h-5"></div>
                )}
              </div>
              
              <div 
                onClick={() => setAudience('Recent Buyers')}
                className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${audience === 'Recent Buyers' ? 'border-2 border-blue-500 bg-blue-50' : 'border border-slate-200 hover:border-slate-300'}`}
              >
                <div>
                  <h4 className={`font-semibold ${audience === 'Recent Buyers' ? 'text-blue-900' : 'text-slate-700'}`}>Recent Buyers</h4>
                  <p className={`text-xs ${audience === 'Recent Buyers' ? 'text-blue-700' : 'text-slate-500'}`}>Purchased in last 30 days. (1,200 users)</p>
                </div>
                {audience === 'Recent Buyers' ? (
                  <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</div>
                ) : (
                  <div className="border border-slate-300 rounded-full w-5 h-5"></div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(2)} className="bg-blue-600 hover:bg-blue-700 text-white px-8">Next Step <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><MessageSquare className="h-5 w-5" /></div>
              <h2 className="text-lg font-bold">Craft Message</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Channel</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm mb-6 outline-none"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                </select>

                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  Message Copy
                  <button className="text-blue-600 normal-case tracking-normal flex items-center gap-1 hover:underline">
                    <Sparkles className="h-3 w-3" /> AI Rewrite
                  </button>
                </label>
                <textarea 
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none resize-none focus:border-blue-400 focus:bg-white transition-colors"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center relative overflow-hidden">
                <span className="absolute top-3 left-3 text-xs font-bold text-slate-400">PREVIEW</span>
                <div className="bg-[#E7FFDB] w-3/4 rounded-lg rounded-tr-none p-3 shadow-sm text-sm text-slate-800 self-end mt-8 whitespace-pre-wrap">
                  {message}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 text-white px-8">Review Campaign <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Rocket className="h-5 w-5" /></div>
              <h2 className="text-lg font-bold">Review & Launch</h2>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <span className="text-sm text-slate-500 shrink-0">Campaign Name</span>
                <input 
                  type="text" 
                  className="text-sm font-semibold text-slate-900 text-right bg-transparent border-b border-slate-300 hover:border-slate-400 focus:border-blue-500 outline-none w-1/2 transition-colors pb-0.5"
                  value={campaignName || `Win-back ${audience.split('(')[0].trim()}`}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name"
                />
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-200">
                <span className="text-sm text-slate-500">Target Audience</span>
                <span className="text-sm font-semibold text-slate-900">{audience}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-200">
                <span className="text-sm text-slate-500">Channel</span>
                <span className="text-sm font-semibold text-slate-900">{channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Estimated Cost</span>
                <span className="text-sm font-semibold text-slate-900">₹{audience.includes('Recent') ? '1,200.00' : '2,450.00'}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
              <Button 
                onClick={handleLaunch} 
                disabled={isLaunching}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                {isLaunching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                {isLaunching ? 'Launching...' : 'Launch Campaign'}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
