"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Type, Image as ImageIcon, MousePointerClick, 
  Minus, DivideSquare, Tag, ShoppingBag, LayoutTemplate, 
  Smartphone, Monitor, Tablet, Save, Sparkles, X, RotateCcw, Upload
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// --- DUMMY COMPONENTS FOR RENDERER ---
const TextBlock = ({ content, onChange, readOnly }: { content: string, onChange?: (c: string) => void, readOnly?: boolean }) => (
  <div 
    className={`p-4 bg-white text-slate-800 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_p]:mb-2 ${!readOnly ? 'focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg cursor-text' : ''}`}
    dangerouslySetInnerHTML={{ __html: content }} 
    contentEditable={!readOnly}
    suppressContentEditableWarning
    onBlur={(e) => {
      if (onChange && e.currentTarget.innerHTML !== content) {
        onChange(e.currentTarget.innerHTML);
      }
    }}
  />
);
const ImageBlock = ({ content, readOnly, onChange }: { content: string, readOnly?: boolean, onChange?: (c: string) => void }) => {
  // Fix AI outputs: If it's not a URL, treat the text as an image prompt! If it is a URL, encode spaces.
  let imageUrl = content || "https://picsum.photos/seed/default/800/600";
  if (content && !content.startsWith('http') && !content.startsWith('data:image')) {
    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(content)}?width=800&height=400&nologo=true`;
  } else if (content) {
    imageUrl = content.replace(/ /g, '%20');
  }

  return (
  <div className="w-full flex justify-center py-4 bg-white relative group">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={imageUrl} alt="Template image" className="max-w-full h-auto border border-slate-200 shadow-sm" />
    
    {!readOnly && (
      <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
        <div className="bg-white text-slate-900 font-bold px-4 py-2 rounded-md shadow-lg flex items-center">
          <Upload className="w-4 h-4 mr-2" />
          Replace Image
        </div>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onChange) {
              const reader = new FileReader();
              reader.onload = (e) => onChange(e.target?.result as string);
              reader.readAsDataURL(file);
            }
          }}
        />
      </label>
    )}
  </div>
);
}
const ButtonBlock = ({ content }: { content: string }) => (
  <div className="flex justify-center py-6 bg-white">
    <button className="bg-slate-900 text-white px-8 py-3 rounded-md font-bold hover:bg-slate-800 transition-colors pointer-events-none">
      {content || "Click Here"}
    </button>
  </div>
);
const DividerBlock = () => (
  <div className="py-4 bg-white"><div className="w-full h-px bg-slate-200" /></div>
);
const SpacerBlock = () => (
  <div className="h-12 bg-transparent" />
);

export default function TemplateEditor() {
  const { id } = useParams();
  const router = useRouter();
  const isNew = id === "new";

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"properties" | "versions">("properties");
  
  // Template Data
  const [name, setName] = useState("Untitled Template");
  const [category, setCategory] = useState("Newsletter");
  const [subjectLine, setSubjectLine] = useState("");
  const [preheader, setPreheader] = useState("");
  const [sections, setSections] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  
  // Editor State
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);
  
  // AI Rewrite State
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState("");
  const [rewriteTone, setRewriteTone] = useState("Professional");

  const personalizationTokens = ["{{firstName}}", "{{lastOrderDate}}", "{{discountCode}}", "{{city}}", "{{recommendedProduct}}"];

  useEffect(() => {
    if (!isNew) {
      fetchTemplate();
    } else {
      setSections([
        { type: "text", content: "<h1 style='text-align:center; font-size: 24px; font-weight: bold; margin-bottom: 10px;'>Your Headline Here</h1><p style='text-align:center; color: #64748b;'>Start building your email template. Hi {{firstName}}!</p>" }
      ]);
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/templates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "Untitled");
        setCategory(data.category || "Newsletter");
        setSubjectLine(data.subject_line || "");
        setPreheader(data.preheader || "");
        setSections(data.json_content || []);
        setVersions(data.versions_json || []);
      } else {
        toast.error("Template not found");
        router.push("/templates");
      }
    } catch (err) {
      toast.error("Error loading template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (saveVersion = false) => {
    setIsSaving(true);
    
    // Protect master templates: If editing a standard category and hitting Save,
    // create a new copy in "Saved Image" rather than overwriting the master.
    const shouldCreateNewCopy = !isNew && category !== "Saved Image" && !saveVersion;
    
    const method = (isNew || shouldCreateNewCopy) ? "POST" : "PUT";
    const url = (isNew || shouldCreateNewCopy) ? "http://localhost:5000/api/templates/" : `http://localhost:5000/api/templates/${id}`;
    
    const categoryToSave = shouldCreateNewCopy ? "Saved Image" : category;
    
    // Automatically set thumbnail to the first image block if it exists
    const firstImageBlock = sections.find(s => s.type === 'image');
    const newThumbnail = firstImageBlock ? firstImageBlock.content : "https://picsum.photos/seed/default/800/600";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shouldCreateNewCopy ? `${name} (Copy)` : name,
          category: categoryToSave,
          subject_line: subjectLine,
          preheader: preheader,
          thumbnail: newThumbnail,
          json_content: sections,
          save_version: saveVersion
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(saveVersion ? "New version saved" : "Template saved successfully");
        if (isNew || shouldCreateNewCopy) {
          router.replace(`/templates/${data.id}`);
        } else if (saveVersion) {
          fetchTemplate(); // Refresh versions
        }
      }
    } catch (err) {
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const restoreVersion = (versionData: any) => {
    if (!confirm("Restore this version? Unsaved changes will be lost.")) return;
    setName(versionData.name || "Untitled");
    setSubjectLine(versionData.subject_line || "");
    setPreheader(versionData.preheader || "");
    setSections(versionData.json_content || []);
    toast.success("Version restored. Click Save to finalize.");
  };

  const addSection = (type: string) => {
    const newSection = { type, content: "" };
    if (type === "text") newSection.content = "<p>New text block...</p>";
    if (type === "button") newSection.content = "Shop Now";
    if (type === "image") newSection.content = "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=800";
    if (type === "coupon") newSection.content = "SUMMER20";
    
    setSections([...sections, newSection]);
    setActiveSectionIdx(sections.length);
  };

  const updateSection = (idx: number, content: string) => {
    const updated = [...sections];
    updated[idx].content = content;
    setSections(updated);
  };

  const removeSection = (idx: number) => {
    const updated = [...sections];
    updated.splice(idx, 1);
    setSections(updated);
    setActiveSectionIdx(null);
  };

  const insertToken = (token: string) => {
    if (activeSectionIdx === null || sections[activeSectionIdx].type !== 'text') return;
    const content = sections[activeSectionIdx].content;
    updateSection(activeSectionIdx, content + " " + token);
  };

  const handleAIRewrite = async () => {
    if (activeSectionIdx === null || !rewritePrompt.trim()) return;
    
    setIsRewriting(true);
    const toastId = toast.loading("Gemini is rewriting your copy...");
    
    try {
      const res = await fetch("http://localhost:5000/api/templates/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: sections[activeSectionIdx].content, 
          instructions: rewritePrompt,
          tone: rewriteTone
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        updateSection(activeSectionIdx, data.content);
        toast.success("Rewrite complete", { id: toastId });
        setRewritePrompt("");
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      toast.error("Failed to rewrite", { id: toastId });
    } finally {
      setIsRewriting(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center text-slate-500">Loading editor...</div>;

  const activeSection = activeSectionIdx !== null ? sections[activeSectionIdx] : null;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100 overflow-hidden">
      {/* Editor Header */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/templates">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="text-sm font-bold text-slate-900 border-none p-0 focus:ring-0 w-64 bg-transparent outline-none"
            />
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-xs text-slate-500 font-medium border-none p-0 focus:ring-0 bg-transparent outline-none -ml-1 mt-0.5"
            >
              <option value="Newsletter">Newsletter</option>
              <option value="Win Back">Win Back</option>
              <option value="VIP">VIP</option>
              <option value="Promotional">Promotional</option>
              <option value="Cart Recovery">Cart Recovery</option>
              <option value="Cross Sell">Cross Sell</option>
              <option value="Product Launch">Product Launch</option>
              <option value="Seasonal">Seasonal</option>
              <option value="Birthday">Birthday</option>
              <option value="Saved Image">Saved Image</option>
            </select>
          </div>
        </div>

        {/* View Toggles */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded-md ${previewMode === 'desktop' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <Monitor className="h-4 w-4" />
          </button>
          <button onClick={() => setPreviewMode('tablet')} className={`p-1.5 rounded-md ${previewMode === 'tablet' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <Tablet className="h-4 w-4" />
          </button>
          <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded-md ${previewMode === 'mobile' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {!isNew && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={isSaving} className="h-9">
              Save as Version
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={isSaving} className="bg-slate-900 text-white font-bold h-9">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Elements */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Blocks</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
            <button onClick={() => addSection('text')} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-slate-600 transition-colors gap-2">
              <Type className="h-5 w-5" />
              <span className="text-xs font-bold">Text</span>
            </button>
            <button onClick={() => addSection('image')} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-slate-600 transition-colors gap-2">
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs font-bold">Image</span>
            </button>
            <button onClick={() => addSection('button')} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-slate-600 transition-colors gap-2">
              <MousePointerClick className="h-5 w-5" />
              <span className="text-xs font-bold">Button</span>
            </button>
            <button onClick={() => addSection('divider')} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-slate-600 transition-colors gap-2">
              <Minus className="h-5 w-5" />
              <span className="text-xs font-bold">Divider</span>
            </button>
            <button onClick={() => addSection('spacer')} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-slate-600 transition-colors gap-2">
              <DivideSquare className="h-5 w-5" />
              <span className="text-xs font-bold">Spacer</span>
            </button>
            <button onClick={() => addSection('coupon')} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-slate-600 transition-colors gap-2">
              <Tag className="h-5 w-5" />
              <span className="text-xs font-bold">Coupon</span>
            </button>
          </div>
        </div>

        {/* CENTER PANEL: Canvas */}
        <div className="flex-1 overflow-y-auto bg-slate-100 flex flex-col items-center py-8 relative">
          
          {/* Email Meta Envelope */}
          <div className={`mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4 transition-all duration-300
            ${previewMode === 'desktop' ? 'w-[600px]' : previewMode === 'tablet' ? 'w-[480px]' : 'w-[320px]'}
          `}>
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject Line</label>
              <input 
                type="text" 
                placeholder="Enter subject line..."
                value={subjectLine}
                onChange={e => setSubjectLine(e.target.value)}
                className="w-full text-sm border-b border-slate-200 pb-1 focus:outline-none focus:border-purple-500 font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preheader Text</label>
              <input 
                type="text" 
                placeholder="Enter preview text..."
                value={preheader}
                onChange={e => setPreheader(e.target.value)}
                className="w-full text-sm border-b border-slate-200 pb-1 focus:outline-none focus:border-purple-500 text-slate-600"
              />
            </div>
          </div>

          {/* Email Body */}
          <div 
            className={`bg-white shadow-xl transition-all duration-300 min-h-[600px] border border-slate-200
              ${previewMode === 'desktop' ? 'w-[600px]' : previewMode === 'tablet' ? 'w-[480px]' : 'w-[320px]'}
            `}
          >
            {sections.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center min-h-[600px]">
                <LayoutTemplate className="h-16 w-16 mb-4 text-slate-200" />
                <p className="text-sm font-medium">Your template is empty.<br/>Click blocks on the left to add them here.</p>
              </div>
            ) : (
              <div className="flex flex-col w-full pb-20">
                {sections.map((section, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => { setActiveTab('properties'); setActiveSectionIdx(idx); }}
                    className={`relative w-full cursor-pointer transition-all border-2
                      ${activeSectionIdx === idx ? 'border-blue-500 z-10 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'border-transparent hover:border-blue-200'}
                    `}
                  >
                    {/* Block Render */}
                    {section.type === 'text' && (
                      <TextBlock 
                        content={section.content} 
                        readOnly={activeSectionIdx !== idx}
                        onChange={(newContent) => updateSection(idx, newContent)}
                      />
                    )}
                    {section.type === 'image' && (
                      <ImageBlock 
                        content={section.content} 
                        readOnly={activeSectionIdx !== idx}
                        onChange={(newContent) => updateSection(idx, newContent)}
                      />
                    )}
                    {section.type === 'button' && <ButtonBlock content={section.content} />}
                    {section.type === 'divider' && <DividerBlock />}
                    {section.type === 'spacer' && <SpacerBlock />}
                    {section.type === 'coupon' && (
                      <div className="py-6 bg-white flex justify-center">
                        <div className="border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-3 rounded-lg text-center">
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Use Code</p>
                          <p className="text-2xl font-black tracking-wider text-slate-900">{section.content}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Delete overlay button if active */}
                    {activeSectionIdx === idx && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                        className="absolute right-2 top-2 h-7 w-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md z-20 hover:bg-red-600 transition-transform hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Properties & AI */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('properties')}
              className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'properties' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Properties
            </button>
            <button 
              onClick={() => setActiveTab('versions')}
              className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${activeTab === 'versions' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/30' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              Versions ({versions.length})
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'properties' ? (
              activeSection ? (
                <div className="space-y-6">
                  
                  {/* AI REWRITE TOOL - Only show for Text */}
                  {activeSection.type === 'text' && (
                    <div className="bg-gradient-to-b from-purple-50 to-white border border-purple-100 rounded-xl p-4 shadow-sm mb-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2">
                        <Sparkles className="h-12 w-12 text-purple-200/50 -mr-4 -mt-4 rotate-12" />
                      </div>
                      <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-1.5 relative z-10">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        AI Rewrite
                      </h4>
                      <select 
                        value={rewriteTone}
                        onChange={e => setRewriteTone(e.target.value)}
                        className="w-full text-xs font-medium border border-purple-200 rounded-md p-2 focus:ring-2 focus:ring-purple-500 mb-2 relative z-10 bg-white"
                      >
                        <option value="Professional">Tone: Professional</option>
                        <option value="Luxury">Tone: Luxury</option>
                        <option value="Friendly">Tone: Friendly</option>
                        <option value="Urgent">Tone: Urgent</option>
                        <option value="Festive">Tone: Festive</option>
                      </select>
                      <textarea 
                        placeholder="e.g. Make it sound more urgent and persuasive..."
                        className="w-full h-16 text-sm border border-purple-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm placeholder:text-purple-300 mb-3 relative z-10"
                        value={rewritePrompt}
                        onChange={e => setRewritePrompt(e.target.value)}
                      />
                      <Button 
                        onClick={handleAIRewrite} 
                        disabled={isRewriting || !rewritePrompt.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold relative z-10 h-9"
                      >
                        {isRewriting ? "Rewriting..." : "Rewrite Text"}
                      </Button>
                    </div>
                  )}
                  
                  {/* STANDARD PROPERTIES */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {activeSection.type === 'image' ? "Image URL" : activeSection.type === 'coupon' ? "Coupon Code" : "Content"}
                      </label>
                      {activeSection.type === 'text' && (
                        <select 
                          className="text-[10px] bg-slate-100 border-none rounded py-1 px-2 text-slate-600 font-bold focus:ring-0"
                          onChange={(e) => {
                            if(e.target.value) insertToken(e.target.value);
                            e.target.value = "";
                          }}
                        >
                          <option value="">+ Token</option>
                          {personalizationTokens.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      )}
                    </div>
                    {activeSection.type === 'text' ? (
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">You can also edit text directly on the canvas</p>
                        <textarea
                          value={activeSection.content}
                          onChange={(e) => updateSection(activeSectionIdx!, e.target.value)}
                          className="w-full h-64 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                      </div>
                    ) : activeSection.type === 'image' ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={activeSection.content}
                          onChange={(e) => updateSection(activeSectionIdx!, e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="https://..."
                        />
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => updateSection(activeSectionIdx!, e.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button variant="outline" className="w-full font-bold">
                            Upload Custom Image
                          </Button>
                        </div>
                      </div>
                    ) : activeSection.type === 'button' || activeSection.type === 'coupon' ? (
                      <input
                        type="text"
                        value={activeSection.content}
                        onChange={(e) => updateSection(activeSectionIdx!, e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={activeSection.type === 'coupon' ? "Code..." : "Button text..."}
                      />
                    ) : (
                      <div className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                        No configurable properties for {activeSection.type}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                  <MousePointerClick className="h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Select a block on the canvas<br/>to edit its properties</p>
                </div>
              )
            ) : (
              // VERSIONS TAB
              <div className="space-y-3">
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 mb-4">
                  <p className="font-medium">Version history is created whenever you click "Save as Version".</p>
                </div>
                
                {versions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No saved versions yet.</div>
                ) : (
                  [...versions].reverse().map((v, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-900">V{versions.length - i}</p>
                          <p className="text-[10px] text-slate-500">{new Date(v.timestamp).toLocaleString()}</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => restoreVersion(v)}>
                          Restore
                        </Button>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{v.subject_line || v.name}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
