"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { ShoppingBag, TrendingUp, Receipt, CornerUpLeft, Sparkles, ArrowRight } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { OrderWithCustomer, columns } from "@/features/orders/columns"
import { DataTable } from "@/features/orders/data-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const categoryData = [
  { name: "Electronics", value: 35, color: "#3B82F6" },
  { name: "Beauty", value: 22, color: "#10B981" },
  { name: "Home", value: 18, color: "#F59E0B" },
  { name: "Sports", value: 15, color: "#8B5CF6" },
  { name: "Other", value: 10, color: "#94A3B8" },
]

const channelData = [
  { name: "Web", value: 65, color: "#3B82F6" },
  { name: "Mobile App", value: 25, color: "#10B981" },
  { name: "In-Store", value: 10, color: "#F59E0B" },
]

export default function OrdersPage() {
  const [data, setData] = useState<OrderWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordRes, custRes] = await Promise.all([
          axios.get("http://localhost:5000/api/orders"),
          axios.get("http://localhost:5000/api/customers")
        ]);
        
        // Map customer_id to customer_name
        const customerMap = new Map(custRes.data.map((c: any) => [c.id, c.name]));
        
        const mappedOrders = ordRes.data.map((o: any) => ({
          ...o,
          customer_name: customerMap.get(o.customer_id) || `Customer #${o.customer_id}`
        }));

        setData(mappedOrders)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-full text-slate-900">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Order Intelligence Hub</h1>
        <p className="text-sm text-slate-500">Analyze purchasing behavior and uncover revenue opportunities.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Orders</p>
            <h3 className="text-2xl font-bold text-slate-900">500</h3>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><ShoppingBag className="h-5 w-5" /></div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">₹7.8L</h3>
          </div>
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><TrendingUp className="h-5 w-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Avg Order</p>
            <h3 className="text-2xl font-bold text-slate-900">₹1,560</h3>
          </div>
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600"><Receipt className="h-5 w-5" /></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Refund Rate</p>
            <h3 className="text-2xl font-bold text-slate-900">4.2%</h3>
          </div>
          <div className="bg-rose-100 p-3 rounded-xl text-rose-600"><CornerUpLeft className="h-5 w-5" /></div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
         {/* Category Distribution */}
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
           <div className="flex-1 w-full">
             <h3 className="text-sm font-semibold mb-6">Category Distribution</h3>
             <div className="space-y-3">
                {categoryData.map(c => (
                  <div key={c.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></div>
                      <span className="font-medium text-slate-700">{c.name}</span>
                    </div>
                    <span className="text-slate-500 font-semibold">{c.value}%</span>
                  </div>
                ))}
             </div>
           </div>
           <div className="w-32 h-32 shrink-0 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                   {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
           </div>
         </div>

         {/* Channel Distribution */}
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
           <div className="flex-1 w-full">
             <h3 className="text-sm font-semibold mb-6">Channel Distribution</h3>
             <div className="space-y-3">
                {channelData.map(c => (
                  <div key={c.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }}></div>
                      <span className="font-medium text-slate-700">{c.name}</span>
                    </div>
                    <span className="text-slate-500 font-semibold">{c.value}%</span>
                  </div>
                ))}
             </div>
           </div>
           <div className="w-32 h-32 shrink-0 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={channelData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none">
                   {channelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
           </div>
         </div>
      </div>



      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        {loading ? (
          <div className="text-muted-foreground animate-pulse text-sm">Loading orders...</div>
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </div>
    </div>
  )
}
