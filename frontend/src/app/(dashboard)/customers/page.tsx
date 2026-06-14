"use client"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import api from "@/lib/api"
import { Customer, columns } from "@/features/customers/columns"
import { DataTable } from "@/features/customers/data-table"
import { Users, TrendingUp, AlertTriangle, Star, Loader2 } from "lucide-react"

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers/').then(res => res.data)
  });

  // Auto-run analysis silently whenever customers are loaded and any have null/missing churn scores
  useEffect(() => {
    if (data.length > 0 && data.some((c: Customer) => c.churn_risk_score === null || c.churn_risk_score === undefined)) {
      api.post('/customers/bulk-analyze')
        .then(() => queryClient.invalidateQueries({ queryKey: ['customers'] }))
        .catch(console.error);
    }
  }, [data.length, queryClient]);


  const totalCustomers = data.length;
  const highRiskCustomers = data.filter(c => (c.churn_risk_score || 0) > 70);
  const vipCustomers = data.filter(c => c.total_spend > 5000);
  const avgLtv = totalCustomers > 0 ? data.reduce((acc, c) => acc + (c.predicted_ltv || 0), 0) / totalCustomers : 0;
  const potentialLoss = highRiskCustomers.reduce((acc, c) => acc + (c.predicted_ltv || 0), 0) * 0.5; // Estimated 50% loss if they churn

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-full text-slate-900">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Customer Intelligence Hub</h1>
        <p className="text-sm text-slate-500">Analyze your audience, uncover insights, and take action.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Customers</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalCustomers}</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Users className="h-5 w-5" /></div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg LTV</p>
            <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(avgLtv)}</h3>
          </div>
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">High Risk</p>
            <h3 className="text-2xl font-bold text-slate-900">{highRiskCustomers.length}</h3>
          </div>
          <div className="bg-rose-100 p-3 rounded-xl text-rose-600"><AlertTriangle className="h-5 w-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">VIP Users</p>
            <h3 className="text-2xl font-bold text-slate-900">{vipCustomers.length}</h3>
          </div>
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><Star className="h-5 w-5" /></div>
        </div>
      </div>



      {/* Data Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {isLoading ? (
          <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </div>
    </div>
  )
}
