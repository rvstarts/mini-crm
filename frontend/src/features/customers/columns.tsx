"use client"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { MoreHorizontal, Eye, PieChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Customer = {
  id: number
  name: string
  email: string
  city: string
  total_spend: number
  churn_risk_score: number | null
  churn_risk_category: string | null
  churn_risk_reason: string | null
  churn_risk_recommendation: string | null
  churn_risk_generated_at: string | null
  predicted_ltv: number
  order_count: number
  avg_order_value: number
  last_active: string
}



export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link href={`/customers/${row.original.id}`} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
        {row.getValue("name")}
      </Link>
    )
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "total_spend",
    header: "LTV / Total Spend",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_spend"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(amount)
      return <div className="font-medium text-slate-700">{formatted}</div>
    },
  },
  {
    accessorKey: "churn_risk_score",
    header: "Churn Risk",
    cell: ({ row }) => {
      const riskScore = row.getValue("churn_risk_score") as number | null
      const riskCategory = row.original.churn_risk_category
      
      if (riskScore === null || riskScore === undefined) {
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">Pending AI Analysis</span>
      }

      if (riskCategory === 'High') {
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">🔴 High Risk {riskScore}%</span>
      } else if (riskCategory === 'Medium') {
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">🟡 Medium Risk {riskScore}%</span>
      } else {
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">🟢 Low Risk {riskScore}%</span>
      }
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>} />
          <DropdownMenuContent align="end" sideOffset={8} className="w-[180px] z-[9999]">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={`/customers/${customer.id}`}>
                <DropdownMenuItem className="cursor-pointer text-slate-700 focus:text-blue-600 focus:bg-blue-50 hover:text-blue-600 hover:bg-blue-50">
                  <Eye className="mr-2 h-4 w-4" /> View Profile
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
