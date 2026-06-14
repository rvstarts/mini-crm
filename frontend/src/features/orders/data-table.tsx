"use client"
import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  
  const [activeTab, setActiveTab] = React.useState("All Orders")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [channelFilter, setChannelFilter] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState("")

  const filteredData = React.useMemo(() => {
    let result = data;

    switch (activeTab) {
      case "Completed":
      case "Refunded":
      case "Cancelled":
        result = result.filter((o: any) => String(o.status || '').toLowerCase() === activeTab.toLowerCase());
        break;
      case "Electronics":
      case "Beauty":
      case "Sports":
      case "Home":
        result = result.filter((o: any) => String(o.product_category || o.category || '').toLowerCase() === activeTab.toLowerCase());
        break;
      case "All Orders":
      default:
        break;
    }

    if (categoryFilter) {
      result = result.filter((o: any) => String(o.product_category || o.category || '') === categoryFilter);
    }
    if (channelFilter) {
      result = result.filter((o: any) => String(o.channel || '') === channelFilter);
    }
    if (dateFilter) {
       const now = new Date();
       result = result.filter((o: any) => {
         const orderDate = new Date(o.created_at);
         if (dateFilter === "7days") {
           return (now.getTime() - orderDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
         } else if (dateFilter === "30days") {
           return (now.getTime() - orderDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
         }
         return true;
       });
    }

    return result;
  }, [data, activeTab, categoryFilter, channelFilter, dateFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const getTabClass = (tabName: string) => {
    return activeTab === tabName
      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
      : "text-slate-500 hover:text-slate-900 border border-slate-200 bg-transparent";
  }

  const getVariant = (tabName: string) => activeTab === tabName ? "secondary" : "ghost";

  const handleExport = () => {
    if (filteredData.length === 0) return;
    
    const headers = ["Order ID", "Customer Name", "Category", "Amount", "Status", "Channel", "Date"];
    const csvRows = filteredData.map((row: any) => {
      return [
        row.id,
        `"${String(row.customer_name || '').replace(/"/g, '""')}"`,
        `"${String(row.product_category || row.category || '').replace(/"/g, '""')}"`,
        row.amount,
        `"${String(row.status || '').replace(/"/g, '""')}"`,
        `"${String(row.channel || '').replace(/"/g, '""')}"`,
        `"${String(row.created_at || '').replace(/"/g, '""')}"`
      ].join(",");
    });
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "orders_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = ["All Orders", "Completed", "Refunded", "Cancelled", "Electronics", "Beauty", "Sports", "Home"];

  return (
    <div>
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(tab => (
          <Button 
            key={tab}
            variant={getVariant(tab)} 
            size="sm" 
            className={getTabClass(tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search Orders (by Customer)..."
            value={(table.getColumn("customer_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("customer_name")?.setFilterValue(event.target.value)
            }
            className="w-full sm:w-64 border-slate-200 bg-white"
          />
          <select 
            className="border border-slate-200 rounded-md bg-white text-sm px-3 py-2 outline-none text-slate-600 w-full sm:w-auto"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Beauty">Beauty</option>
            <option value="Sports">Sports</option>
            <option value="Home">Home</option>
            <option value="Apparel">Apparel</option>
          </select>
          <select 
            className="border border-slate-200 rounded-md bg-white text-sm px-3 py-2 outline-none text-slate-600 w-full sm:w-auto"
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
          >
            <option value="">All Channels</option>
            <option value="Web">Web</option>
            <option value="Mobile App">Mobile App</option>
            <option value="In-Store">In-Store</option>
          </select>
          <select 
            className="border border-slate-200 rounded-md bg-white text-sm px-3 py-2 outline-none text-slate-600 w-full sm:w-auto"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          >
            <option value="">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
        <Button onClick={handleExport} variant="outline" className="text-slate-600 border-slate-200 shrink-0 w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" /> Export Data
        </Button>
      </div>

      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4 mb-4">
        {table.getRowModel().rows?.length ? (
           table.getRowModel().rows.map((row) => {
             const o: any = row.original;
             return (
               <div key={row.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                 <div className="flex justify-between items-center mb-2">
                   <div className="font-semibold text-slate-900 text-sm">Order #{o.id}</div>
                   {String(o.status || '').toLowerCase() === 'completed' && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">Completed</span>}
                   {String(o.status || '').toLowerCase() === 'refunded' && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700">Refunded</span>}
                   {String(o.status || '').toLowerCase() === 'cancelled' && <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700">Cancelled</span>}
                 </div>
                 <div className="space-y-1 text-sm">
                   <div className="flex justify-between"><span className="text-slate-500">Customer:</span> <span className="font-medium text-slate-800">{o.customer_name || 'Unknown'}</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Amount:</span> <span className="font-medium text-slate-800">₹{o.amount ? parseFloat(o.amount).toLocaleString('en-IN') : '0'}</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Category:</span> <span className="text-slate-800">{o.product_category || 'N/A'}</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Date:</span> <span className="text-slate-800">{o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}</span></div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-100">
                   <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">View Details</Button>
                 </div>
               </div>
             )
           })
        ) : (
           <div className="text-center py-8 text-slate-500 text-sm bg-white border border-slate-200 rounded-xl">No orders found.</div>
        )}
      </div>

      {/* Desktop/Tablet Table Layout */}
      <div className="hidden md:block rounded-xl border border-slate-200 bg-white overflow-visible">
        <Table>
          <TableHeader className="bg-slate-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-100">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-xs font-medium text-slate-500 uppercase tracking-wider h-10">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50 transition-colors border-slate-100"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-sm text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500 text-sm">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
