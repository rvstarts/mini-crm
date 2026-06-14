"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Send, BarChart2, MessageSquare, Clock, ArrowUpRight, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function CampaignIdPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.get(`/campaigns/${id}`).then(res => res.data)
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-800">Campaign not found</h1>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n || 0);

  const openRate = campaign.messages_delivered ? ((campaign.messages_opened / campaign.messages_delivered) * 100).toFixed(1) + '%' : '0%';
  const clickRate = campaign.messages_delivered ? ((campaign.messages_clicked / campaign.messages_delivered) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="p-8 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
            <p className="text-sm text-slate-500 mt-1">Created on {new Date(campaign.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center ${
            campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
          }`}>
            {campaign.status === 'active' && <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />}
            {campaign.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-600" /> Campaign Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-slate-500 mb-1">Channel</div>
              <div className="font-medium text-slate-800 px-3 py-1 bg-slate-100 rounded-md inline-block">{campaign.channel}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500 mb-1">Target Segment</div>
              <div className="font-medium text-slate-800">{campaign.segment_id ? `Segment #${campaign.segment_id}` : 'All Users'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-slate-500 mb-2">Message Content</div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap">
                {campaign.message || 'No message content available.'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">Revenue Generated</h3>
          <div className="text-4xl font-bold text-slate-900 mb-2">₹{formatNumber(campaign.revenue_generated)}</div>
          <div className="text-sm text-emerald-600 font-medium flex items-center justify-center bg-emerald-50 px-2 py-1 rounded-md">
            {campaign.conversions} Conversions
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart2 className="h-5 w-5 text-blue-600" /> Performance Metrics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Messages Sent" value={formatNumber(campaign.messages_sent)} icon={<Send className="h-4 w-4 text-slate-400" />} />
        <MetricCard title="Delivered" value={formatNumber(campaign.messages_delivered)} icon={<CheckCircle2 className="h-4 w-4 text-slate-400" />} />
        <MetricCard title="Open Rate" value={openRate} icon={<ArrowUpRight className="h-4 w-4 text-slate-400" />} sub={`(${formatNumber(campaign.messages_opened)})`} />
        <MetricCard title="Click Rate" value={clickRate} icon={<ArrowUpRight className="h-4 w-4 text-slate-400" />} sub={`(${formatNumber(campaign.messages_clicked)})`} />
      </div>

      {campaign.communication_logs && campaign.communication_logs.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" /> Recent Activity</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="space-y-6">
              {campaign.communication_logs.slice(0, 5).map((log: any, i: number) => (
                <div key={log.id} className="flex gap-4 relative">
                  {i !== campaign.communication_logs.slice(0, 5).length - 1 && (
                    <div className="absolute top-8 left-3.5 w-0.5 h-full bg-slate-100 -ml-px"></div>
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white ${
                    log.event_type === 'generated' ? 'bg-slate-200 text-slate-500' :
                    log.event_type === 'sent' ? 'bg-blue-100 text-blue-600' :
                    log.event_type === 'delivered' ? 'bg-indigo-100 text-indigo-600' :
                    log.event_type === 'opened' ? 'bg-amber-100 text-amber-600' :
                    log.event_type === 'clicked' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.event_type === 'generated' ? <Clock className="h-3 w-3" /> :
                     log.event_type === 'sent' ? <Send className="h-3 w-3" /> :
                     log.event_type === 'delivered' ? <CheckCircle2 className="h-3 w-3" /> :
                     log.event_type === 'opened' ? <ArrowUpRight className="h-3 w-3" /> :
                     log.event_type === 'clicked' ? <ArrowUpRight className="h-3 w-3" /> :
                     <MessageSquare className="h-3 w-3" />}
                  </div>
                  <div className="pt-1.5">
                    <div className="text-sm font-semibold text-slate-800 capitalize">{log.event_type}</div>
                    <div className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, sub }: any) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm text-slate-500 font-medium">{title}</h4>
        {icon}
      </div>
      <div className="flex items-baseline gap-2 mt-auto">
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        {sub && <div className="text-xs text-slate-400 font-medium">{sub}</div>}
      </div>
    </div>
  );
}
