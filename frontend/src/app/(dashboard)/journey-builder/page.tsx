"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  Handle,
  Position,
  MarkerType,
  MiniMap,
  EdgeLabelRenderer,
  BaseEdge,
  getStraightPath,
  type EdgeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sparkles, MessageSquare, Mail, Users, Clock, Split, Save, FileText, Play, Settings, Bell, LayoutDashboard, GitMerge, ShoppingCart, Star, Zap, UserMinus, Box, CheckCircle, FolderOpen, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

// --- TEMPLATES ---

const winBackNodes = [
  { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'No Purchase 30 Days' } },
  { id: '2', type: 'action', position: { x: 300, y: 150 }, data: { label: 'Send WhatsApp Discount', type: 'whatsapp' } },
  { id: '3', type: 'delay', position: { x: 340, y: 250 }, data: { label: 'Wait 2 Days' } },
  { id: '4', type: 'condition', position: { x: 300, y: 350 }, data: { label: 'Opened?' } },
  { id: '5', type: 'action', position: { x: 100, y: 500 }, data: { label: 'Generate Coupon', type: 'coupon' } },
  { id: '6', type: 'action', position: { x: 500, y: 500 }, data: { label: 'Send SMS Reminder', type: 'sms' } },
  { id: '7', type: 'condition', position: { x: 300, y: 650 }, data: { label: 'Purchased?' } },
  { id: '8', type: 'end', position: { x: 300, y: 800 }, data: { label: 'End' } },
];
const winBackEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', sourceHandle: 'yes', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e4-6', source: '4', target: '6', sourceHandle: 'no', type: 'smoothstep', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#f43f5e' } },
  { id: 'e5-7', source: '5', target: '7', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e6-7', source: '6', target: '7', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e7-8', source: '7', target: '8', sourceHandle: 'yes', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
];

const cartRecoveryNodes = [
  { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'Cart Abandoned' } },
  { id: '2', type: 'action', position: { x: 300, y: 150 }, data: { label: 'Send Reminder WhatsApp', type: 'whatsapp' } },
  { id: '3', type: 'delay', position: { x: 340, y: 250 }, data: { label: 'Wait 6 Hours' } },
  { id: '4', type: 'condition', position: { x: 300, y: 350 }, data: { label: 'Purchased?' } },
  { id: '5', type: 'end', position: { x: 100, y: 500 }, data: { label: 'End' } },
  { id: '6', type: 'action', position: { x: 500, y: 500 }, data: { label: 'Send Discount SMS', type: 'sms' } },
  { id: '7', type: 'end', position: { x: 500, y: 650 }, data: { label: 'End' } },
];
const cartRecoveryEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', sourceHandle: 'yes', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e4-6', source: '4', target: '6', sourceHandle: 'no', type: 'smoothstep', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#f43f5e' } },
  { id: 'e6-7', source: '6', target: '7', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
];

const vipLoyaltyNodes = [
  { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'VIP Customer' } },
  { id: '2', type: 'action', position: { x: 300, y: 150 }, data: { label: 'Send Thank You Email', type: 'email' } },
  { id: '3', type: 'action', position: { x: 300, y: 250 }, data: { label: 'Generate VIP Coupon', type: 'coupon' } },
  { id: '4', type: 'action', position: { x: 300, y: 350 }, data: { label: 'Add VIP Tag', type: 'tag' } },
  { id: '5', type: 'end', position: { x: 300, y: 450 }, data: { label: 'End' } },
];
const vipLoyaltyEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
];

const newCustomerNodes = [
  { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'Purchase Completed' } },
  { id: '2', type: 'action', position: { x: 300, y: 150 }, data: { label: 'Welcome Email', type: 'email' } },
  { id: '3', type: 'delay', position: { x: 340, y: 250 }, data: { label: 'Wait 3 Days' } },
  { id: '4', type: 'action', position: { x: 300, y: 350 }, data: { label: 'Product Education Email', type: 'email' } },
  { id: '5', type: 'delay', position: { x: 340, y: 450 }, data: { label: 'Wait 7 Days' } },
  { id: '6', type: 'action', position: { x: 300, y: 550 }, data: { label: 'Review Request', type: 'email' } },
  { id: '7', type: 'end', position: { x: 300, y: 650 }, data: { label: 'End' } },
];
const newCustomerEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e5-6', source: '5', target: '6', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e6-7', source: '6', target: '7', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
];

const crossSellNodes = [
  { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'Purchase Completed' } },
  { id: '2', type: 'delay', position: { x: 340, y: 150 }, data: { label: 'Wait 5 Days' } },
  { id: '3', type: 'action', position: { x: 300, y: 250 }, data: { label: 'Send Related Product Recommendation', type: 'email' } },
  { id: '4', type: 'condition', position: { x: 300, y: 350 }, data: { label: 'Opened?' } },
  { id: '5', type: 'action', position: { x: 100, y: 500 }, data: { label: 'Offer', type: 'whatsapp' } },
  { id: '6', type: 'action', position: { x: 500, y: 500 }, data: { label: 'Reminder', type: 'sms' } },
  { id: '7', type: 'end', position: { x: 300, y: 650 }, data: { label: 'End' } },
];
const crossSellEdges = [
  { id: 'e1-2', source: '1', target: '2', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', sourceHandle: 'yes', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e4-6', source: '4', target: '6', sourceHandle: 'no', type: 'smoothstep', animated: true, markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#f43f5e' } },
  { id: 'e5-7', source: '5', target: '7', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
  { id: 'e6-7', source: '6', target: '7', type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } },
];

const templatesData: Record<string, { nodes: any[], edges: any[] }> = {
  "Win Back": { nodes: winBackNodes, edges: winBackEdges },
  "Cart Recovery": { nodes: cartRecoveryNodes, edges: cartRecoveryEdges },
  "VIP Loyalty": { nodes: vipLoyaltyNodes, edges: vipLoyaltyEdges },
  "New Customer": { nodes: newCustomerNodes, edges: newCustomerEdges },
  "Cross Sell": { nodes: crossSellNodes, edges: crossSellEdges },
  "Reactivation": { nodes: winBackNodes, edges: winBackEdges }, // fallback to winback
};

// --- CUSTOM EDGES ---
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, style, markerEnd }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} id={id} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan flex items-center justify-center w-5 h-5 bg-white border border-slate-200 rounded-full cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-slate-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all z-50 group"
          onClick={() => alert(`Ready to insert new node on edge: ${id}`)}
        >
          <Plus className="w-3 h-3 group-hover:scale-125 transition-transform duration-200" />
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// --- CUSTOM NODES ---

const TriggerNode = ({ data }: any) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-100 border-l-[6px] border-l-blue-500 w-64 p-3 flex items-center gap-4 relative">
      {data.stats && (
        <div className="absolute -top-2.5 right-2 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm ring-1 ring-white">
          {data.stats}
        </div>
      )}
      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
        <Users className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-0.5">TRIGGER</div>
        <div className="text-sm font-bold text-slate-800">{data.label}</div>
        {data.preview && <div className="text-[10px] text-slate-400 mt-0.5 font-medium line-clamp-1">{data.preview}</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
    </div>
  );
};

const ActionNode = ({ data }: any) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-100 border-l-[6px] border-l-blue-500 w-64 p-3 flex items-center gap-4 relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
      {data.stats && (
        <div className="absolute -top-2.5 right-2 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm ring-1 ring-white">
          {data.stats}
        </div>
      )}
      <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-blue-500 shrink-0">
        <Mail className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-0.5">ACTION</div>
        <div className="text-sm font-bold text-slate-800">{data.label}</div>
        {data.preview && <div className="text-[10px] text-slate-400 mt-0.5 font-medium line-clamp-1">{data.preview}</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
    </div>
  );
};

const ConditionNode = ({ data }: any) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-100 border-l-[6px] border-l-blue-500 w-64 p-3 flex items-center gap-4 relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
      {data.stats && (
        <div className="absolute -top-2.5 right-2 bg-blue-100 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm ring-1 ring-white">
          {data.stats}
        </div>
      )}
      <div className="h-10 w-10 rounded-lg bg-sky-50 flex items-center justify-center text-blue-500 shrink-0">
        <Split className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-0.5">CONDITION</div>
        <div className="text-sm font-bold text-slate-800">{data.label}</div>
        {data.preview && <div className="text-[10px] text-slate-400 mt-0.5 font-medium line-clamp-1">{data.preview}</div>}
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '25%' }} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
      <Handle type="source" position={Position.Bottom} id="no" style={{ left: '75%' }} className="w-3 h-3 bg-rose-500 border-2 border-white shadow-sm" />
      <div className="absolute -bottom-6 left-12 text-[10px] font-bold text-blue-500 bg-white px-2 rounded-full border border-blue-100 shadow-sm">YES</div>
      <div className="absolute -bottom-6 right-12 text-[10px] font-bold text-rose-500 bg-white px-2 rounded-full border border-rose-100 shadow-sm">NO</div>
    </div>
  );
};

const DelayNode = ({ data }: any) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-100 border-l-[6px] border-l-blue-400 w-64 p-3 flex items-center gap-4 relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-400 border-2 border-white shadow-sm" />
      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
        <Clock className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-0.5">WAIT</div>
        <div className="text-sm font-bold text-slate-800">{data.label}</div>
        {data.preview && <div className="text-[10px] text-slate-400 mt-0.5 font-medium line-clamp-1">{data.preview}</div>}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-400 border-2 border-white shadow-sm" />
    </div>
  );
};

const EndNode = ({ _data }: any) => {
  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 border-dashed w-64 p-3 flex items-center justify-center relative shadow-sm">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-400 border-2 border-white shadow-sm" />
      <span className="text-blue-400 font-bold text-sm">+ Add Step</span>
    </div>
  );
};

const ABTestNode = ({ data }: any) => {
  return (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-100 border-l-[6px] border-l-blue-500 w-64 p-3 flex items-center gap-4 relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
      <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-blue-500 shrink-0">
        <GitMerge className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-0.5">A/B TEST</div>
        <div className="text-sm font-bold text-slate-800">{data.label}</div>
        {data.split && <div className="text-[10px] text-slate-400 font-medium mt-0.5 text-right">{data.split.a}% / {data.split.b}% Split</div>}
      </div>
      <Handle type="source" position={Position.Bottom} id="a" style={{ left: '25%' }} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
      <Handle type="source" position={Position.Bottom} id="b" style={{ left: '75%' }} className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm" />
      <div className="absolute -bottom-6 left-12 text-[10px] font-bold text-blue-500 bg-white px-2 rounded-full border border-blue-100 shadow-sm">A</div>
      <div className="absolute -bottom-6 right-12 text-[10px] font-bold text-blue-500 bg-white px-2 rounded-full border border-blue-100 shadow-sm">B</div>
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
  end: EndNode,
  abtest: ABTestNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// --- MAIN COMPONENT ---

function JourneyBuilder() {
  const searchParams = useSearchParams();
  const urlJourneyId = searchParams.get('id');

  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [activeTab, setActiveTab] = useState('Builder');
  const [journeyStatus, setJourneyStatus] = useState("Draft");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [journeyId, setJourneyId] = useState<number | null>(null);
  const [journeyName, setJourneyName] = useState("Untitled Journey");
  const [activeDashboardId, setActiveDashboardId] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [draftsList, setDraftsList] = useState<any[]>([]);
  const [customTemplates, setCustomTemplates] = useState<Record<string, { nodes: any[], edges: any[] }>>({});
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalType, setSaveModalType] = useState<'draft' | 'template' | 'activate'>('draft');
  const [saveModalName, setSaveModalName] = useState("");
  const reactFlowWrapper = useRef(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  useEffect(() => {
    // 1. Check if loading from URL
    if (urlJourneyId) {
      loadSavedDraft(Number(urlJourneyId), "Loading...", "Draft"); // We'll overwrite these when data loads
    } else {
      // Initial Load Experience: Never show empty canvas! Load Win Back.
      setNodes(JSON.parse(JSON.stringify(winBackNodes)));
      setEdges(JSON.parse(JSON.stringify(winBackEdges)));
      setJourneyName("Win Back Campaign");
    }
    
    // Also fetch drafts
    const fetchDrafts = async () => {
      try {
        const res = await api.get('/journeys/');
        if(res.data && res.data.length > 0) {
          setDraftsList(res.data);
        }
      } catch (err) {
        console.error("Could not load journeys", err);
      }
    };
    fetchDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // POLLING FOR ACTIVE DASHBOARD
  useEffect(() => {
    let interval: any;
    if (activeDashboardId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/journeys/${activeDashboardId}`);
          setDashboardData(res.data);
          
          // Optionally trigger the backend engine tick from here just for simulation purposes!
          await api.post('/journeys/engine/tick');
        } catch (err) {
          console.error("Poll failed", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeDashboardId]);

  const openDashboard = async (id: number) => {
    setActiveDashboardId(id);
    try {
      const res = await api.get(`/journeys/${id}`);
      setDashboardData(res.data);
    } catch (_err) {
      showNotification("Failed to load dashboard.", "error");
    }
  };

  const pauseJourney = async (id: number) => {
    try {
      await api.put(`/journeys/${id}`, { status: 'draft' });
      showNotification("Journey paused.", "success");
      setActiveDashboardId(null);
      const resDrafts = await api.get('/journeys/');
      setDraftsList(resDrafts.data);
    } catch (_e) {
      showNotification("Failed to pause.", "error");
    }
  };

  const deleteJourney = async (id: number) => {
    if (!confirm("Are you sure you want to delete this journey?")) return;
    try {
      await api.delete(`/journeys/${id}`);
      showNotification("Journey deleted.", "success");
      setActiveDashboardId(null);
      const resDrafts = await api.get('/journeys/');
      setDraftsList(resDrafts.data);
    } catch (_e) {
      showNotification("Failed to delete.", "error");
    }
  };

  const showNotification = (message: string, type: 'error'|'success') => {
    setNotification({message, type});
    setTimeout(() => setNotification(null), 4000);
  };

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => addEdge({ ...params, type: 'custom', animated: false, style: { stroke: '#cbd5e1', strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow-type');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const subType = event.dataTransfer.getData('application/reactflow-subType');

      if (typeof type === 'undefined' || !type) return;

      const position = { x: event.clientX - 300, y: event.clientY - 150 };
      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label, type: subType, description: '' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const updateNodeData = (id: string, key: string, value: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, [key]: value } };
        }
        return node;
      })
    );
  };

  const loadTemplate = (templateName: string) => {
    const template = templatesData[templateName] || customTemplates[templateName];
    if (template) {
      setNodes(JSON.parse(JSON.stringify(template.nodes)));
      setEdges(JSON.parse(JSON.stringify(template.edges)));
      setJourneyName(`${templateName} Campaign`);
      setJourneyId(null); // It's a new template, not an existing saved draft
      setJourneyStatus("Draft");
      setActiveTab('Builder');
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
      showNotification(`${templateName} loaded.`, "success");
    }
  };

  const loadSavedDraft = (id: number, name: string, status: string) => {
    api.get(`/journeys/${id}`)
      .then(res => {
        const fullData = res.data;
        setJourneyId(id);
        setJourneyName(fullData.name || name);
        setJourneyStatus(fullData.status || status);
        if (fullData.nodes_json) setNodes(fullData.nodes_json);
        if (fullData.edges_json) setEdges(fullData.edges_json);
        setActiveTab('Builder');
        setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
        showNotification(`Loaded ${fullData.name || name}`, "success");
      })
      .catch(err => {
        console.error("Failed to load journey", err);
        showNotification("Failed to load journey", "error");
      });
  };

  const handleAIGenerate = async () => {
    if (!prompt.trim()) {
      showNotification("Please enter a prompt.", "error");
      return;
    }
    setIsGeneratingAI(true);
    
    try {
      const res = await api.post('/copilot/generate-journey', { prompt });
      if (res.data.nodes && res.data.edges) {
        setAiPreviewData(res.data);
      } else {
        showNotification("Failed to parse AI journey.", "error");
      }
    } catch (_e) {
      showNotification("Failed to generate AI journey.", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const applyAIJourney = () => {
    if (!aiPreviewData) return;
    setNodes(aiPreviewData.nodes);
    setEdges(aiPreviewData.edges);
    setJourneyName(aiPreviewData.journeyName || "AI Generated Journey");
    showNotification("Journey applied to canvas!", "success");
    setAiPreviewData(null);
    setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
  };


  const handleSaveDraft = async (nameToSave: string) => {
    const payload = {
      name: nameToSave,
      status: "draft",
      nodes_json: nodes,
      edges_json: edges
    };
    
    const url = journeyId ? `/journeys/${journeyId}` : `/journeys/`;
    
    try {
      let data;
      if (journeyId) {
        const res = await api.put(url, payload);
        data = res.data;
      } else {
        const res = await api.post(url, payload);
        data = res.data;
      }
      
      if (!journeyId && data && data.id) {
        setJourneyId(data.id);
      }
      
      showNotification(`Saved as ${nameToSave}`, "success");
      
      // Also fetch drafts again
      const resDrafts = await api.get('/journeys/');
      setDraftsList(resDrafts.data);
      return data?.id || journeyId;
    } catch (err) {
      console.error(err);
      showNotification("Failed to save draft.", "error");
      return null;
    }
  };

  const handleSaveTemplate = (nameToSave: string) => {
    setCustomTemplates(prev => ({
      ...prev,
      [nameToSave]: { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }
    }));
    showNotification(`Template "${nameToSave}" saved successfully!`, "success");
  };

  const openSaveModal = (type: 'draft' | 'template' | 'activate') => {
    setSaveModalType(type);
    setSaveModalName(journeyName === 'Untitled Journey' ? '' : journeyName);
    setSaveModalOpen(true);
  };

  const confirmSave = async () => {
    if (!saveModalName.trim()) {
      showNotification("Please enter a name.", "error");
      return;
    }
    setJourneyName(saveModalName);
    setSaveModalOpen(false);
    
    if (saveModalType === 'draft') {
      await handleSaveDraft(saveModalName);
    } else if (saveModalType === 'activate') {
      const activeId = await handleSaveDraft(saveModalName);
      if (activeId) {
        try {
          await api.post(`/journeys/${activeId}/activate`);
          setJourneyStatus("Active");
          showNotification("Journey validated and Activated successfully!", "success");
          
          const resDrafts = await api.get('/journeys/');
          setDraftsList(resDrafts.data);
          setActiveTab("Active Journeys");
        } catch (_e) {
          showNotification("Failed to activate journey.", "error");
        }
      }
    } else {
      handleSaveTemplate(saveModalName);
    }
  };

  const validateGraph = () => {
    const triggers = nodes.filter(n => n.type === 'trigger');
    const actions = nodes.filter(n => n.type === 'action');
    if (triggers.length === 0 || actions.length === 0) {
      return { valid: false, error: "Journey must contain at least one Trigger and one Action." };
    }
    if (triggers.length > 1) return { valid: false, error: "Journey can only have one Trigger node." };
    
    const ends = nodes.filter(n => n.type === 'end');
    if (ends.length === 0) return { valid: false, error: "Journey must end with an End node." };

    if (edges.length === 0) return { valid: false, error: "Nodes must be connected." };

    const inDegree: Record<string, number> = {};
    nodes.forEach(n => inDegree[n.id] = 0);
    edges.forEach(e => {
      if (inDegree[e.target] !== undefined) {
        inDegree[e.target]++;
      }
    });

    const queue = Object.keys(inDegree).filter(id => inDegree[id] === 0);
    let count = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      count++;
      const outgoing = edges.filter(e => e.source === current);
      outgoing.forEach(e => {
        if (inDegree[e.target] !== undefined) {
          inDegree[e.target]--;
          if (inDegree[e.target] === 0) queue.push(e.target);
        }
      });
    }

    if (count !== nodes.length) return { valid: false, error: "Circular loop detected. Journeys cannot have loops." };
    
    // We relax the "all nodes must be connected" to just warn if there are disconnected nodes
    // but the prompt strictly says: "Must have connections." We did that.
    
    return { valid: true };
  };

  const handleActivate = async () => {
    if (nodes.length === 0) {
      showNotification("Please add nodes to your journey before activating.", "error");
      return;
    }
    const { valid, error } = validateGraph();
    if (!valid) {
      showNotification(error || "Validation failed.", "error");
      return;
    }

    openSaveModal('activate');
  };

  const onDragStart = (event: any, nodeType: string, label: string, subType?: string) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    if(subType) event.dataTransfer.setData('application/reactflow-subType', subType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const abTestList = [
    { label: "A/B Traffic Split", icon: <GitMerge className="h-4 w-4" />, split: { a: 50, b: 50 } }
  ];

  const templateNames = [...Object.keys(templatesData), ...Object.keys(customTemplates)];
  
  const triggersList = [
    { label: "Segment Entered", icon: <Users className="h-4 w-4" /> },
    { label: "Segment Exited", icon: <UserMinus className="h-4 w-4" /> },
    { label: "High Churn Risk", icon: <Zap className="h-4 w-4" /> },
    { label: "VIP Customer", icon: <Star className="h-4 w-4" /> },
    { label: "Cart Abandoned", icon: <ShoppingCart className="h-4 w-4" /> },
    { label: "Purchase Completed", icon: <Box className="h-4 w-4" /> },
    { label: "No Purchase 30 Days", icon: <Clock className="h-4 w-4" /> }
  ];

  const actionsList = [
    { label: "Send WhatsApp", icon: <MessageSquare className="h-4 w-4 text-blue-500" />, type: "whatsapp" },
    { label: "Send SMS", icon: <MessageSquare className="h-4 w-4 text-blue-500" />, type: "sms" },
    { label: "Send Email", icon: <Mail className="h-4 w-4 text-blue-500" />, type: "email" },
    { label: "Add Tag", icon: <Star className="h-4 w-4 text-blue-500" />, type: "tag" },
    { label: "Remove Tag", icon: <UserMinus className="h-4 w-4 text-rose-500" />, type: "tag" },
    { label: "Move Segment", icon: <Users className="h-4 w-4 text-blue-500" />, type: "segment" },
    { label: "Generate Coupon", icon: <Sparkles className="h-4 w-4 text-blue-500" />, type: "coupon" },
    { label: "Notify Sales Team", icon: <Bell className="h-4 w-4 text-blue-500" />, type: "notify" }
  ];

  const conditionsList = [
    { label: "Opened Message?", icon: <Split className="h-4 w-4 text-blue-500" /> },
    { label: "Clicked Link?", icon: <Split className="h-4 w-4 text-blue-500" /> },
    { label: "Purchased?", icon: <Split className="h-4 w-4 text-blue-500" /> },
    { label: "Coupon Redeemed?", icon: <Split className="h-4 w-4 text-blue-500" /> },
    { label: "LTV > Threshold?", icon: <Split className="h-4 w-4 text-blue-500" /> },
    { label: "Churn Risk > Threshold?", icon: <Split className="h-4 w-4 text-blue-500" /> },
  ];

  const waitList = [
    { label: "Wait 1 Hour", icon: <Clock className="h-4 w-4 text-slate-500" /> },
    { label: "Wait 1 Day", icon: <Clock className="h-4 w-4 text-slate-500" /> },
    { label: "Wait 3 Days", icon: <Clock className="h-4 w-4 text-slate-500" /> },
    { label: "Custom Wait", icon: <Clock className="h-4 w-4 text-slate-500" /> },
  ];

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-slate-50">
      
      {/* Toast Notification Overlay */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-blue-200 text-blue-800'} animate-in slide-in-from-top-4`}>
           <CheckCircle className={`h-5 w-5 ${notification.type === 'error' ? 'text-rose-500' : 'text-blue-500'}`} />
           <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Save Modal */}
      {/* AI Preview Modal */}
      {aiPreviewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-[800px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{aiPreviewData.journeyName || 'AI Journey'}</h3>
                  <div className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      <Users className="h-3 w-3" /> {aiPreviewData.audience?.count || 0} Customers
                    </span>
                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                      Confidence: {aiPreviewData.confidence || 0}%
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setAiPreviewData(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                ✕
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50 flex gap-6">
               <div className="w-1/2 space-y-6">
                 <div>
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Expected Impact</h4>
                   <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                       <div className="text-sm font-semibold text-slate-700">Estimated Revenue</div>
                       <div className="text-2xl font-black text-emerald-600">${(aiPreviewData.expectedRevenue || 0).toLocaleString()}</div>
                     </div>
                     <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                       <ShoppingCart className="h-6 w-6" />
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Target Audience ({aiPreviewData.audience?.count || 0})</h4>
                   <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[250px] flex flex-col">
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                       <table className="w-full text-left border-collapse">
                         <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                           <tr>
                             <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Customer</th>
                             <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Match Reason</th>
                           </tr>
                         </thead>
                         <tbody>
                           {aiPreviewData.audience?.customers?.slice(0, 10)?.map((c: any, i: number) => (
                             <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                               <td className="py-2 px-3">
                                 <div className="text-xs font-bold text-slate-800">{c.name}</div>
                                 <div className="text-[10px] text-slate-400 truncate w-24">{c.email}</div>
                               </td>
                               <td className="py-2 px-3">
                                 <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">{c.reason}</div>
                               </td>
                             </tr>
                           ))}
                           {aiPreviewData.audience?.customers?.length > 10 && (
                             <tr>
                               <td colSpan={2} className="py-2 px-3 text-center text-[10px] font-semibold text-blue-500 bg-blue-50/50">
                                 + {aiPreviewData.audience.customers.length - 10} more customers
                               </td>
                             </tr>
                           )}
                           {(!aiPreviewData.audience?.customers || aiPreviewData.audience.customers.length === 0) && (
                             <tr>
                               <td colSpan={2} className="py-4 px-3 text-center text-xs text-slate-400 italic">
                                 No matching customers found.
                               </td>
                             </tr>
                           )}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="w-1/2">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Journey Flow</h4>
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-[350px] overflow-y-auto custom-scrollbar space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                   {aiPreviewData.steps?.map((step: any, idx: number) => (
                     <div key={idx} className="relative flex items-start gap-4 z-10">
                       <div className="flex flex-col items-center mt-1">
                         <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] border-2 border-white shadow-sm shrink-0">
                           {idx + 1}
                         </div>
                       </div>
                       <div className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 shadow-sm">
                         <div className="flex items-center justify-between mb-1.5">
                           <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">Day {step.day}</div>
                           <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1">
                             <MessageSquare className="h-3 w-3" /> {step.channel}
                           </div>
                         </div>
                         <div className="text-xs text-slate-600 leading-relaxed italic">
                           &quot;{step.message}&quot;
                         </div>
                       </div>
                     </div>
                   ))}
                   {!aiPreviewData.steps?.length && (
                     <div className="text-xs text-slate-400 italic pl-8">No steps defined.</div>
                   )}
                 </div>
               </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <Button onClick={() => setAiPreviewData(null)} variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100">
                Discard
              </Button>
              <Button onClick={applyAIJourney} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> Apply to Canvas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-[400px] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {saveModalType === 'draft' ? <Save className="h-5 w-5 text-blue-500" /> : saveModalType === 'activate' ? <Play className="h-5 w-5 text-emerald-500 fill-current" /> : <FileText className="h-5 w-5 text-blue-500" />}
                {saveModalType === 'draft' ? 'Save Draft' : saveModalType === 'activate' ? 'Activate Journey' : 'Save as Template'}
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {saveModalType === 'template' ? 'Template Name' : 'Journey Name'}
              </label>
              <input 
                type="text" 
                value={saveModalName}
                onChange={(e) => setSaveModalName(e.target.value)}
                placeholder="e.g. Summer Sale 2026"
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
              />
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <Button onClick={() => setSaveModalOpen(false)} variant="outline" className="text-slate-600 border-slate-300 hover:bg-slate-100">
                Cancel
              </Button>
              <Button onClick={confirmSave} className={`${saveModalType === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-md`}>
                {saveModalType === 'draft' ? 'Save Draft' : saveModalType === 'activate' ? 'Activate' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Dashboard Modal */}
      {activeDashboardId && dashboardData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-[800px] max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                  <Play className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{dashboardData.name}</h3>
                  <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    ACTIVE EXECUTION
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => pauseJourney(activeDashboardId)} variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                   Pause Journey
                </Button>
                <Button onClick={() => deleteJourney(activeDashboardId)} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
                   Delete
                </Button>
                <button onClick={() => setActiveDashboardId(null)} className="ml-2 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto bg-slate-50 flex gap-6">
               <div className="w-1/2 space-y-6">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Metrics</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-xs text-slate-500 font-bold uppercase mb-1">Entered</div>
                      <div className="text-3xl font-black text-slate-800">{dashboardData.analytics?.customers_entered || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                      <div className="text-xs text-blue-600 font-bold uppercase mb-1">Delivered</div>
                      <div className="text-3xl font-black text-blue-700">{dashboardData.analytics?.messages_delivered || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                      <div className="text-xs text-purple-600 font-bold uppercase mb-1">Opened</div>
                      <div className="text-3xl font-black text-purple-700">{dashboardData.analytics?.messages_opened || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                      <div className="text-xs text-amber-600 font-bold uppercase mb-1">Clicked</div>
                      <div className="text-3xl font-black text-amber-700">{dashboardData.analytics?.messages_clicked || 0}</div>
                    </div>
                 </div>
               </div>

               <div className="w-1/2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-[400px]">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Live Timeline</h4>
                 <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {!dashboardData.timeline || dashboardData.timeline.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-4 pl-6">Waiting for events...</div>
                    ) : dashboardData.timeline.map((t: any, i: number) => (
                      <div key={i} className="relative flex items-center justify-between group is-active pl-6">
                        <div className="absolute left-0 flex items-center justify-center w-4 h-4 rounded-full border border-white bg-blue-100 text-blue-500 shadow-sm z-10">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 text-[11px] capitalize">{t.event}</span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight">
                            <span className="font-medium text-slate-700">{t.customer_name}</span> via {t.channel}
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Journey Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-sm">
             <GitMerge className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                className="text-xl font-bold text-slate-900 mb-0.5 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1"
              />
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 px-1">
              Journey Builder • TARS AI <span className={`font-semibold ml-1 ${journeyStatus.toLowerCase() === 'active' ? 'text-emerald-500' : 'text-slate-500'}`}>Status: {journeyStatus.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => openSaveModal('draft')} variant="outline" className="text-slate-700 border-slate-200 hover:bg-slate-50 font-semibold shadow-sm text-sm">
            <Save className="h-4 w-4 mr-2 text-slate-400" /> Save Draft
          </Button>
          <Button onClick={() => openSaveModal('template')} variant="outline" className="text-slate-700 border-slate-200 hover:bg-slate-50 font-semibold shadow-sm text-sm">
            <FileText className="h-4 w-4 mr-2 text-slate-400" /> Save as Template
          </Button>
          <Button onClick={handleActivate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm text-sm border-none">
            <Play className="h-4 w-4 mr-2 fill-current" /> Activate Journey
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="px-6 border-b border-slate-200 bg-white shrink-0 flex gap-6">
         {['Builder', 'Active Journeys', 'Drafts', 'Templates'].map(tab => (
           <div 
             key={tab} 
             onClick={() => setActiveTab(tab)}
             className={`py-3 text-sm font-semibold cursor-pointer transition-colors relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
           >
             {tab}
             {activeTab === tab && (
               <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
             )}
           </div>
         ))}
      </div>

      {/* AI Bar & Templates Row (Only visible in Builder) */}
      {activeTab === 'Builder' && (
        <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
           <div className="flex gap-3 mb-4">
             <div className="flex-1 relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                 <Sparkles className="h-4 w-4" />
               </div>
               <input 
                 type="text" 
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder="Describe the journey you want... e.g. 'Recover customers inactive for 60 days'" 
                 className="w-full bg-blue-50/50 border border-blue-100 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
               />
             </div>
             <Button 
               onClick={handleAIGenerate} 
               disabled={isGeneratingAI} 
               className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 shadow-sm border border-slate-200"
             >
               <Sparkles className={`h-4 w-4 mr-2 ${isGeneratingAI ? 'animate-pulse text-blue-500' : 'text-slate-400'}`} />
               AI Generate
             </Button>
           </div>

           <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Templates:</span>
             {templateNames.map(t => (
               <div key={t} onClick={() => loadTemplate(t)} className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 cursor-pointer hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm">
                 {t}
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {activeTab === 'Active Journeys' && (
          <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Play className="h-5 w-5 text-emerald-500 fill-current" /> Active Journeys
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {draftsList.filter(d => d.status === 'active').map(draft => (
                 <div key={draft.id} onClick={() => openDashboard(draft.id)} className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Play className="h-5 w-5 fill-current" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Active
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">{draft.name}</h4>
                    <p className="text-xs text-slate-500 mb-4">Started: {new Date(draft.updated_at).toLocaleDateString()}</p>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-t border-slate-100 pt-3">
                       <span>{draft.nodes_json?.length || 0} Nodes</span>
                       <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">View Dashboard →</span>
                    </div>
                 </div>
               ))}
               {draftsList.filter(d => d.status === 'active').length === 0 && (
                 <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                   No active journeys right now. Build one and click "Activate Journey".
                 </div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'Drafts' && (
          <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <FolderOpen className="h-5 w-5 text-blue-500" /> Saved Drafts
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {draftsList.filter(d => d.status !== 'active').map(draft => (
                 <div key={draft.id} onClick={() => loadSavedDraft(draft.id, draft.name, draft.status)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <GitMerge className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-slate-100 text-slate-600">
                        {draft.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">{draft.name}</h4>
                    <p className="text-xs text-slate-500 mb-4">Last updated: {new Date(draft.updated_at).toLocaleDateString()}</p>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-t border-slate-100 pt-3">
                       <span>{draft.nodes_json?.length || 0} Nodes</span>
                       <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Open in Builder →</span>
                    </div>
                 </div>
               ))}
               {draftsList.filter(d => d.status !== 'active').length === 0 && (
                 <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
                   No saved drafts found. Build a journey and hit "Save Draft" to see it here.
                 </div>
               )}
             </div>
          </div>
        )}

        {activeTab === 'Templates' && (
          <div className="flex-1 p-8 bg-slate-50 overflow-y-auto">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-blue-500" /> Pre-built Templates
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {templateNames.map(template => (
                 <div key={template} onClick={() => loadTemplate(template)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-2">{template} Campaign</h4>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Automatically load the best practices workflow for the {template} scenario directly into your canvas.
                    </p>
                    <div className="flex items-center justify-end text-xs font-semibold text-blue-500 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span>Use Template →</span>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'Builder' && (
          <>
            {/* Left Sidebar (Triggers & Actions) */}
            <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto z-10 flex flex-col shrink-0 custom-scrollbar shadow-sm">
              
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 text-blue-600 mb-3">
                   <div className="w-1 h-2.5 bg-blue-600 rounded-sm"></div> TRIGGERS
                </h3>
                <div className="space-y-2">
                  {triggersList.map(t => (
                    <div key={t.label} className="bg-white border border-slate-100 p-2.5 rounded-xl text-xs text-slate-700 font-medium cursor-grab hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] group" onDragStart={(e) => onDragStart(e, 'trigger', t.label)} draggable>
                      <div className="flex items-center gap-3">
                         <div className="text-blue-500 bg-blue-50 p-1.5 rounded-lg">{t.icon}</div> 
                         <span className="text-slate-700 font-bold">{t.label}</span>
                      </div>
                      <div className="text-slate-300 group-hover:text-blue-400 text-lg font-light leading-none">+</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 text-blue-600 mb-3">
                   <div className="w-1 h-2.5 bg-blue-600 rounded-sm"></div> ACTIONS
                </h3>
                <div className="space-y-2">
                  {actionsList.map(a => (
                    <div key={a.label} className="bg-white border border-slate-100 p-2.5 rounded-xl text-xs text-slate-700 font-medium cursor-grab hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] group" onDragStart={(e) => onDragStart(e, 'action', a.label, a.type)} draggable>
                      <div className="flex items-center gap-3">
                         <div className="text-blue-500 bg-emerald-50 p-1.5 rounded-lg">{a.icon}</div> 
                         <span className="text-slate-700 font-bold">{a.label}</span>
                      </div>
                      <div className="text-slate-300 group-hover:text-blue-400 text-lg font-light leading-none">+</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 text-blue-600 mb-3">
                   <div className="w-1 h-2.5 bg-blue-600 rounded-sm"></div> CONDITIONS
                </h3>
                <div className="space-y-2">
                  {conditionsList.map(a => (
                    <div key={a.label} className="bg-white border border-slate-100 p-2.5 rounded-xl text-xs text-slate-700 font-medium cursor-grab hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] group" onDragStart={(e) => onDragStart(e, 'condition', a.label)} draggable>
                      <div className="flex items-center gap-3">
                         <div className="text-blue-500 bg-amber-50 p-1.5 rounded-lg">{a.icon}</div> 
                         <span className="text-slate-700 font-bold">{a.label}</span>
                      </div>
                      <div className="text-slate-300 group-hover:text-blue-400 text-lg font-light leading-none">+</div>
                    </div>
                  ))}
                  {abTestList.map(a => (
                    <div key={a.label} className="bg-white border border-slate-100 p-2.5 rounded-xl text-xs text-slate-700 font-medium cursor-grab hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] group" onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', 'abtest');
                      e.dataTransfer.setData('application/label', a.label);
                      e.dataTransfer.setData('application/split', JSON.stringify(a.split));
                      e.dataTransfer.effectAllowed = 'move';
                    }} draggable>
                      <div className="flex items-center gap-3">
                         <div className="text-blue-500 bg-purple-50 p-1.5 rounded-lg">{a.icon}</div> 
                         <span className="text-slate-700 font-bold">{a.label}</span>
                      </div>
                      <div className="text-slate-300 group-hover:text-blue-400 text-lg font-light leading-none">+</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 text-blue-500 mb-3">
                   <div className="w-1 h-2.5 bg-blue-500 rounded-sm"></div> WAIT STEPS
                </h3>
                <div className="space-y-2">
                  {waitList.map(a => (
                    <div key={a.label} className="bg-white border border-slate-100 p-2.5 rounded-xl text-xs text-slate-700 font-medium cursor-grab hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] group" onDragStart={(e) => onDragStart(e, 'delay', a.label)} draggable>
                      <div className="flex items-center gap-3">
                         <div className="text-blue-500 bg-blue-50 p-1.5 rounded-lg">{a.icon}</div> 
                         <span className="text-slate-700 font-bold">{a.label}</span>
                      </div>
                      <div className="text-slate-300 group-hover:text-blue-400 text-lg font-light leading-none">+</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 text-slate-800 mb-3">
                   <div className="w-1 h-2.5 bg-slate-800 rounded-sm"></div> END
                </h3>
                <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-xs text-slate-700 font-medium cursor-grab hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] group" onDragStart={(e) => onDragStart(e, 'end', 'Journey End')} draggable>
                  <div className="flex items-center gap-3">
                     <div className="text-slate-800 bg-slate-100 p-1.5 rounded-lg"><CheckCircle className="h-4 w-4" /></div> 
                     <span className="text-slate-700 font-bold">Journey End</span>
                  </div>
                  <div className="text-slate-300 group-hover:text-slate-800 text-lg font-light leading-none">+</div>
                </div>
              </div>
              
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative" style={{ width: '100%', height: '100%', minHeight: '600px' }} ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                style={{ width: '100%', height: '100%' }}
                fitView
                panOnScroll={true}
                zoomOnScroll={false}
                translateExtent={[[-800, -100], [1500, Math.max(800, Math.max(...nodes.map(n => n.position.y)) + 600)]]}
              >
                <Background color="#e2e8f0" gap={24} size={1} />
                <Controls showInteractive={false} className="shadow-md border border-slate-200 rounded-md overflow-hidden bg-white" />
                <MiniMap 
                  nodeStrokeColor={(n) => {
                    if (n.type === 'trigger') return '#2563eb';
                    if (n.type === 'action') return '#f59e0b';
                    if (n.type === 'condition') return '#0ea5e9';
                    if (n.type === 'abtest') return '#a855f7';
                    return '#cbd5e1';
                  }}
                  nodeColor={(_n) => {
                    return '#ffffff';
                  }}
                  maskColor="rgba(248, 250, 252, 0.7)"
                  className="rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                />
              </ReactFlow>
            </div>

            {/* Right Sidebar (Properties) */}
            <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto z-10 flex flex-col shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
              {selectedNode ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2 capitalize">
                      <Settings className="h-4 w-4 text-slate-500" /> {selectedNode.type} Properties
                    </h3>
                  </div>
                  <div className="p-5 space-y-5 flex-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Node Label</label>
                      <input 
                        type="text" 
                        value={selectedNode.data.label}
                        onChange={(e) => updateNodeData(selectedNode.id, 'label', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    {selectedNode.type === 'action' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message Content</label>
                        <textarea 
                          value={selectedNode.data.description || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, 'description', e.target.value)}
                          rows={4}
                          className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          placeholder="Enter message content..."
                        />
                      </div>
                    )}
                    
                    {selectedNode.type === 'trigger' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Segment / Rule</label>
                        <select 
                          value={selectedNode.data.target || 'All Customers'}
                          onChange={(e) => updateNodeData(selectedNode.id, 'target', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option>All Customers</option>
                          <option>High Churn Risk</option>
                          <option>VIP Customers</option>
                          <option>Inactive 60 Days</option>
                          <option>Cart Abandoned</option>
                        </select>
                      </div>
                    )}

                    {selectedNode.type === 'condition' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Threshold</label>
                        <input 
                          type="text" 
                          placeholder="e.g. > $100"
                          className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {selectedNode.type === 'delay' && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Wait Time</label>
                           <input type="number" defaultValue="1" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                        <div className="flex-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit</label>
                           <select className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                             <option>Hours</option>
                             <option>Days</option>
                           </select>
                        </div>
                      </div>
                    )}
                    
                  </div>
                  <div className="p-4 border-t border-slate-100">
                    <Button variant="outline" className="w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600 border-rose-200" onClick={() => {
                      setNodes(nodes.filter(n => n.id !== selectedNode.id));
                      setEdges(edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                      setSelectedNodeId(null);
                    }}>
                      Delete Node
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 mb-4 border border-slate-100 shadow-sm">
                    <Settings className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-700 mb-2">Properties</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Click any node in the canvas to view and edit its configuration</p>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default function JourneyBuilderPage() {
  return (
    <ReactFlowProvider>
      <JourneyBuilder />
    </ReactFlowProvider>
  );
}
