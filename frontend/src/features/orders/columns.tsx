"use client"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { MoreHorizontal, Eye, PieChart, Megaphone, Receipt } from "lucide-react"
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

export type OrderWithCustomer = {
  id: number
  customer_id: number
  customer_name: string
  amount: number
  product_category: string
  status: string
  channel: string
  created_at: string
}

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ActionsCell = ({ row }: { row: any }) => {
  const order = row.original
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900" />}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-[180px] z-[9999]">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href={`/customers/${order.customer_id}`}>
              <DropdownMenuItem className="cursor-pointer text-slate-700 focus:text-blue-600 focus:bg-blue-50 hover:text-blue-600 hover:bg-blue-50">
                <Eye className="mr-2 h-4 w-4" /> View Customer
              </DropdownMenuItem>
            </Link>
            <Link href="/campaigns">
              <DropdownMenuItem className="cursor-pointer text-blue-600 font-medium focus:text-blue-700 focus:bg-blue-50 hover:text-blue-700 hover:bg-blue-50">
                <Megaphone className="mr-2 h-4 w-4" /> Generate Campaign
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-slate-500 focus:text-blue-600 focus:bg-blue-50 hover:text-blue-600 hover:bg-blue-50"
              onSelect={() => setIsDetailsOpen(true)}
            >
              <Receipt className="mr-2 h-4 w-4" /> View Details
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details #{order.id}</DialogTitle>
            <DialogDescription>
              Complete details for this order record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm mt-4">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Customer ID</span>
              <span className="font-medium text-slate-900">{order.customer_id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Customer Name</span>
              <span className="font-medium text-slate-900">{order.customer_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Amount</span>
              <span className="font-medium text-slate-900">₹{order.amount ? parseFloat(order.amount).toLocaleString('en-IN') : '0'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Category</span>
              <span className="font-medium text-slate-900">{order.product_category || order.category || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Channel</span>
              <span className="font-medium text-slate-900">{order.channel || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Status</span>
              <span className="font-bold text-slate-900 uppercase tracking-wider text-xs">{order.status}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-medium text-slate-900">{order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const columns: ColumnDef<OrderWithCustomer>[] = [
  { 
    accessorKey: "id", 
    header: "Order ID",
    cell: ({ row }) => <span className="font-medium text-slate-700">#{row.getValue("id")}</span>
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => (
      <Link href={`/customers/${row.original.customer_id}`} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
        {row.getValue("customer_name")}
      </Link>
    )
  },
  { accessorKey: "product_category", header: "Category" },
  { 
    accessorKey: "amount", 
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(amount)
      return <div className="font-medium text-slate-900">{formatted}</div>
    }
  },
  { 
    accessorKey: "status", 
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status")).toLowerCase()
      let color = "bg-slate-100 text-slate-600"
      if (status === 'completed') color = "bg-emerald-50 text-emerald-700"
      else if (status === 'refunded') color = "bg-rose-50 text-rose-700"
      else if (status === 'cancelled') color = "bg-amber-50 text-amber-700"
      return <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${color}`}>{status}</span>
    }
  },
  { accessorKey: "channel", header: "Channel" },
  { 
    accessorKey: "created_at", 
    header: "Date",
    cell: ({ row }) => {
      const dateVal = row.getValue("created_at");
      if (!dateVal) return <span className="text-slate-500">N/A</span>;
      try {
        return <span className="text-slate-500">{new Date(dateVal as string).toLocaleDateString()}</span>
      } catch (e) {
        return <span className="text-slate-500">Invalid Date</span>
      }
    }
  },
  {
    id: "actions",
    cell: ActionsCell,
  },
]
