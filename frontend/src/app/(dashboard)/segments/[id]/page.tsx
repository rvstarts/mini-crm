"use client"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Sparkles, ArrowLeft, Users, DollarSign, Target, Calendar, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SegmentDetailsPage() {
  const params = useParams()

  const segmentId = params.id

  const { data: segment, isLoading: isLoadingSeg } = useQuery({
    queryKey: ['segment', segmentId],
    queryFn: () => api.get(`/segments/${segmentId}`).then(res => res.data)
  })

  const { data: customers = [], isLoading: isLoadingCust } = useQuery({
    queryKey: ['segment_customers', segmentId],
    queryFn: () => api.get(`/segments/${segmentId}/customers`).then(res => res.data)
  })

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  if (isLoadingSeg) {
    return <div className="p-8 flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
  }

  if (!segment) {
    return <div className="p-8 text-center text-slate-500">Segment not found.</div>
  }

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full text-slate-900 relative">
      <div className="mb-6">
        <Link href="/segments" className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 w-fit mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Segments
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-blue-100 p-2 rounded-lg"><Target className="h-5 w-5 text-blue-600" /></div>
              <h1 className="text-2xl font-bold">{segment.name}</h1>
            </div>
            <p className="text-sm text-slate-500 ml-11">{segment.description}</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">Create Journey</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Send className="h-4 w-4 mr-2" /> Launch Campaign</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Dynamic Audience Size</div>
          <div className="text-3xl font-bold text-slate-900">{isLoadingCust ? "..." : customers.length}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500" /> Estimated Recovery</div>
          <div className="text-3xl font-bold text-slate-900">{formatCurrency(segment.estimated_recovery || 0)}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2"><Calendar className="h-4 w-4 text-violet-500" /> Created Date</div>
          <div className="text-xl font-bold text-slate-900 mt-2">{new Date(segment.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {(segment.ai_reasoning || segment.recommended_campaign) && (
        <div className="bg-slate-900 rounded-xl p-6 mb-8 shadow-sm text-white">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h3 className="font-bold text-lg">AI Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">AI Reasoning</div>
              <div className="text-sm text-slate-200 italic leading-relaxed">"{segment.ai_reasoning}"</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">Recommendations</div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/5">
                <div className="text-xs text-blue-300 mb-1">Suggested Campaign Strategy</div>
                <div className="text-sm font-medium">{segment.recommended_campaign || "Targeted Re-engagement"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">Dynamic Customer List</h3>
          <div className="text-xs text-slate-500">Live evaluation against rules</div>
        </div>
        
        {isLoadingCust ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No customers match these segment rules.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200 text-slate-500 font-medium">
                <tr>
                  <th className="py-4 px-6 font-medium">Name</th>
                  <th className="py-4 px-6 font-medium">Email</th>
                  <th className="py-4 px-6 font-medium">Last Purchase</th>
                  <th className="py-4 px-6 font-medium">Total Spend</th>
                  <th className="py-4 px-6 font-medium">Churn Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900">{c.name}</td>
                    <td className="py-4 px-6 text-slate-500">{c.email}</td>
                    <td className="py-4 px-6 text-slate-500">{c.last_active ? new Date(c.last_active).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-4 px-6 text-slate-900 font-medium">{formatCurrency(c.total_spend)}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
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
  )
}
