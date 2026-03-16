import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";

const USE_CASE_TYPES = ["Customer solicited", "Unsolicited", "Internal"];
const STATUS_OPTIONS = [
  "Use case finalization","Development","UST demo - completed",
  "Rework after UST demo","Client demo - completed","Rework after client demo",
  "On hold","Cancelled","SOW approved",
];
const TECH_STACK_OPTIONS = ["GPT-4","Claude","Gemini","LangChain","RAG","Fine-tuning","Custom ML","Azure OpenAI","AWS Bedrock","Vertex AI","Stable Diffusion","Whisper","Other"];
const STATUS_COLORS = {
  "Use case finalization":"#f59e0b","Development":"#3b82f6","UST demo - completed":"#8b5cf6",
  "Rework after UST demo":"#f97316","Client demo - completed":"#06b6d4","Rework after client demo":"#ec4899",
  "On hold":"#6b7280","Cancelled":"#ef4444","SOW approved":"#10b981",
};
const TYPE_COLORS = {"Customer solicited":"#3b82f6","Unsolicited":"#f59e0b","Internal":"#8b5cf6"};

const COLUMN_MAP = {
  "account":"account","project":"project","description":"description",
  "tech stack":"techStack","use case type":"useCaseType","status":"status",
  "use case logged date":"loggedDate","planned end date":"plannedEndDate",
  "ai tech lead":"aiTechLead","pod members":"podMembers",
  "use case owner":"useCaseOwner","use case leader":"useCaseLeader",
  "# pod members required":"podMembersRequired","# pod members assigned":"podMembersAssigned",
  "effort":"effort","comments":"comments",
};
const TEMPLATE_HEADERS = ["Account","Project","Description","Tech Stack","Use Case Type","Status","Use Case Logged Date","Planned End Date","AI Tech Lead","POD Members","Use Case Owner","Use Case Leader","# POD Members Required","# POD Members Assigned","Effort","Comments"];

const emptyForm = {
  account:"",project:"",description:"",techStack:[],useCaseType:"",status:"",
  loggedDate:new Date().toISOString().split("T")[0],plannedEndDate:"",
  aiTechLead:"",podMembers:"",useCaseOwner:"",useCaseLeader:"",
  podMembersRequired:"",podMembersAssigned:"",effort:"",comments:"",
};

function daysSince(d){if(!d)return 0;return Math.floor((new Date()-new Date(d))/86400000);}
function parseExcelDate(val){
  if(!val)return"";
  if(typeof val==="number"){const d=new Date((val-25569)*86400*1000);return d.toISOString().split("T")[0];}
  const s=String(val).trim();if(!s)return"";
  const d=new Date(s);return isNaN(d)?s:d.toISOString().split("T")[0];
}
function validateRow(row){
  const e=[];
  if(!row.account)e.push("Account required");
  if(!row.project)e.push("Project required");
  if(row.useCaseType&&!USE_CASE_TYPES.includes(row.useCaseType))e.push(`Invalid type: "${row.useCaseType}"`);
  if(row.status&&!STATUS_OPTIONS.includes(row.status))e.push(`Invalid status: "${row.status}"`);
  return e;
}

export default function App(){
  const [useCases,setUseCases]=useState([]);
  const [view,setView]=useState("dashboard");
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState(emptyForm);
  const [search,setSearch]=useState("");
  const [filterStatus,setFilterStatus]=useState("");
  const [filterType,setFilterType]=useState("");
  const [toast,setToast]=useState(null);
  const [sortField,setSortField]=useState("loggedDate");
  const [sortDir,setSortDir]=useState("desc");
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [showBulk,setShowBulk]=useState(false);
  const [bulkPreview,setBulkPreview]=useState(null);
  const [bulkMode,setBulkMode]=useState("append");
  const [isDragging,setIsDragging]=useState(false);
  const fileRef=useRef(null);

  useEffect(()=>{
    (async()=>{try{const r=await window.storage.get("ai_use_cases");if(r)setUseCases(JSON.parse(r.value));}catch{}})();
  },[]);

  const persist=async(data)=>{try{await window.storage.set("ai_use_cases",JSON.stringify(data));}catch{}};
  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),4000);};

  const downloadTemplate=()=>{
    const sampleRows=[
      ["Acme Corp","Invoice Automation","Automate invoice processing using LLMs","GPT-4, LangChain","Customer solicited","Development","2025-01-15","2025-03-31","John Smith","Alice, Bob","Jane Doe","Mike Lee","3","3","120 hrs","High priority"],
      ["GlobalBank","Risk Scoring","AI credit risk assessment","Custom ML","Internal","Use case finalization","2025-02-01","2025-04-15","Sarah K","Dave, Eve","Tom R","Sarah K","2","1","80 hrs","POD understaffed"],
    ];
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS,...sampleRows]);
    ws["!cols"]=TEMPLATE_HEADERS.map((_,i)=>({wch:[20,20,40,20,22,26,20,15,15,25,18,18,10,10,12,30][i]||20}));
    const valData=[["Use Case Type Options","Status Options"],...Array.from({length:Math.max(USE_CASE_TYPES.length,STATUS_OPTIONS.length)},(_,i)=>[USE_CASE_TYPES[i]||"",STATUS_OPTIONS[i]||""])];
    const ws2=XLSX.utils.aoa_to_sheet(valData);
    ws2["!cols"]=[{wch:25},{wch:32}];
    XLSX.utils.book_append_sheet(wb,ws,"Use Cases");
    XLSX.utils.book_append_sheet(wb,ws2,"Valid Options");
    XLSX.writeFile(wb,"AI_Use_Case_Template.xlsx");
    showToast("Template downloaded! Fill it and upload back.");
  };

  const parseFile=(file)=>{
    const reader=new FileReader();
    reader.onload=(e)=>{
      try{
        const data=new Uint8Array(e.target.result);
        const wb=XLSX.read(data,{type:"array",cellDates:false});
        const ws=wb.Sheets[wb.SheetNames[0]];
        const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
        if(raw.length<2){showToast("File appears empty","error");return;}
        const headers=raw[0].map(h=>String(h).toLowerCase().trim());
        const dataRows=raw.slice(1).filter(r=>r.some(c=>c!==""));
        const parsed=dataRows.map((row,idx)=>{
          const obj={};
          headers.forEach((h,i)=>{
            const field=COLUMN_MAP[h];
            if(field){
              let val=row[i]??"";;
              if(field==="techStack"){obj[field]=String(val).trim()?String(val).split(/[,;]/).map(s=>s.trim()).filter(Boolean):[];}
              else if(field==="loggedDate"||field==="plannedEndDate"){obj[field]=parseExcelDate(val);}
              else{obj[field]=String(val).trim();}
            }
          });
          if(!obj.loggedDate)obj.loggedDate=new Date().toISOString().split("T")[0];
          if(!obj.techStack)obj.techStack=[];
          const errors=validateRow(obj);
          return{...obj,_rowNum:idx+2,_errors:errors};
        });
        const valid=parsed.filter(r=>r._errors.length===0);
        const withErrors=parsed.filter(r=>r._errors.length>0);
        setBulkPreview({rows:parsed,valid,withErrors,fileName:file.name});
      }catch(err){showToast("Failed to parse: "+err.message,"error");}
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop=(e)=>{e.preventDefault();setIsDragging(false);const f=e.dataTransfer.files[0];if(f)parseFile(f);};
  const handleFileInput=(e)=>{const f=e.target.files[0];if(f)parseFile(f);e.target.value="";};

  const confirmImport=()=>{
    const validRows=bulkPreview.valid.map(({_rowNum,_errors,...rest})=>({...rest,id:Date.now().toString()+Math.random().toString(36).slice(2)}));
    const updated=bulkMode==="replace"?validRows:[...validRows,...useCases];
    setUseCases(updated);persist(updated);
    setShowBulk(false);setBulkPreview(null);
    showToast(`Imported ${validRows.length} use cases${bulkPreview.withErrors.length>0?` (${bulkPreview.withErrors.length} rows skipped)`:""}!`);
  };

  const handleSubmit=()=>{
    if(!form.account||!form.project||!form.status||!form.useCaseType){showToast("Fill required fields: Account, Project, Type, Status","error");return;}
    let updated;
    if(editId){updated=useCases.map(u=>u.id===editId?{...form,id:editId}:u);showToast("Use case updated!");}
    else{updated=[{...form,id:Date.now().toString()},...useCases];showToast("Use case added!");}
    setUseCases(updated);persist(updated);setShowForm(false);setEditId(null);setForm(emptyForm);
  };
  const handleEdit=(uc)=>{setForm({...uc});setEditId(uc.id);setShowForm(true);};
  const handleDelete=(id)=>{const u=useCases.filter(x=>x.id!==id);setUseCases(u);persist(u);setDeleteConfirm(null);showToast("Deleted","error");};

  const filtered=useMemo(()=>useCases
    .filter(u=>{
      const q=search.toLowerCase();
      return(!q||[u.account,u.project,u.description,u.useCaseOwner].some(v=>v?.toLowerCase().includes(q)))
        &&(!filterStatus||u.status===filterStatus)&&(!filterType||u.useCaseType===filterType);
    })
    .sort((a,b)=>{let av=a[sortField]||"",bv=b[sortField]||"";return sortDir==="asc"?av.localeCompare(bv):bv.localeCompare(av);})
  ,[useCases,search,filterStatus,filterType,sortField,sortDir]);

  const analytics=useMemo(()=>{
    const now=new Date(),wk=new Date(now-7*86400000);
    const byStatus={},byType={};
    STATUS_OPTIONS.forEach(s=>byStatus[s]=0);USE_CASE_TYPES.forEach(t=>byType[t]=0);
    useCases.forEach(u=>{if(u.status)byStatus[u.status]=(byStatus[u.status]||0)+1;if(u.useCaseType)byType[u.useCaseType]=(byType[u.useCaseType]||0)+1;});
    const terminal=["Client demo - completed","SOW approved","Cancelled"];
    const aging=useCases.filter(u=>!terminal.includes(u.status)&&daysSince(u.loggedDate)>30);
    return{
      total:useCases.length,
      newThisWeek:useCases.filter(u=>new Date(u.loggedDate)>=wk).length,
      stuckThisWeek:useCases.filter(u=>daysSince(u.loggedDate)>7&&!terminal.includes(u.status)).length,
      overdue:useCases.filter(u=>u.plannedEndDate&&new Date(u.plannedEndDate)<now&&!terminal.includes(u.status)).length,
      byStatus,byType,aging,
    };
  },[useCases]);

  const toggleSort=(f)=>{if(sortField===f)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortField(f);setSortDir("asc");}};

  return(
    <div style={{fontFamily:"'DM Mono',monospace",background:"#0a0a0f",minHeight:"100vh",color:"#e2e8f0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:#111;}::-webkit-scrollbar-thumb{background:#333;border-radius:3px;}
        .btn{cursor:pointer;border:none;border-radius:6px;padding:8px 16px;font-family:'DM Mono',monospace;font-size:13px;transition:all .2s;}
        .btn-primary{background:#4f46e5;color:#fff;}.btn-primary:hover{background:#4338ca;transform:translateY(-1px);box-shadow:0 4px 12px rgba(79,70,229,.4);}
        .btn-ghost{background:transparent;color:#94a3b8;border:1px solid #1e293b;}.btn-ghost:hover{border-color:#4f46e5;color:#e2e8f0;}
        .btn-danger{background:#7f1d1d;color:#fca5a5;}.btn-danger:hover{background:#991b1b;}
        .btn-success{background:#064e3b;color:#6ee7b7;border:1px solid #065f46;}.btn-success:hover{background:#065f46;}
        .btn-upload{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#a5b4fc;border:1px solid #4f46e5;}
        .btn-upload:hover{background:linear-gradient(135deg,#312e81,#3730a3);box-shadow:0 4px 16px rgba(79,70,229,.3);}
        .btn-sm{padding:5px 10px;font-size:11px;}
        input,select,textarea{background:#0f172a;border:1px solid #1e293b;color:#e2e8f0;border-radius:6px;padding:8px 12px;font-family:'DM Mono',monospace;font-size:13px;width:100%;outline:none;transition:border-color .2s;}
        input:focus,select:focus,textarea:focus{border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.1);}
        select option{background:#0f172a;}
        .card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;}
        .nav-link{cursor:pointer;padding:8px 16px;border-radius:6px;font-size:13px;transition:all .2s;color:#64748b;}
        .nav-link:hover{color:#e2e8f0;}.nav-link.active{background:#1e293b;color:#e2e8f0;}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;backdrop-filter:blur(6px);}
        .modal{background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:28px;width:100%;max-width:820px;max-height:90vh;overflow-y:auto;}
        .modal-wide{max-width:1020px;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .form-full{grid-column:1/-1;}
        .label{font-size:11px;color:#64748b;margin-bottom:6px;display:block;letter-spacing:.05em;text-transform:uppercase;}
        .stat-card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;position:relative;}
        .stat-number{font-family:'Syne',sans-serif;font-size:36px;font-weight:800;line-height:1;}
        .table-wrap{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th{text-align:left;padding:10px 12px;color:#64748b;font-weight:400;border-bottom:1px solid #1e293b;cursor:pointer;white-space:nowrap;}
        th:hover{color:#e2e8f0;}
        td{padding:10px 12px;border-bottom:1px solid #0f172a;vertical-align:top;}
        tr:hover td{background:#111827;}
        .bar{height:8px;border-radius:4px;background:#1e293b;overflow:hidden;margin-top:6px;}
        .bar-fill{height:100%;border-radius:4px;transition:width .6s;}
        .chip{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;border:1px solid;}
        .toast{position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:8px;font-size:13px;z-index:200;animation:slideIn .3s ease;max-width:400px;}
        @keyframes slideIn{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}
        .section-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;}
        .multi-select-wrap{position:relative;}
        .multi-select-opts{position:absolute;top:100%;left:0;right:0;background:#0f172a;border:1px solid #4f46e5;border-radius:6px;z-index:50;max-height:200px;overflow-y:auto;}
        .multi-select-opt{padding:8px 12px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:8px;}
        .multi-select-opt:hover{background:#1e293b;}
        .aging-badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;}
        .drop-zone{border:2px dashed #1e293b;border-radius:12px;padding:48px 24px;text-align:center;cursor:pointer;transition:all .2s;}
        .drop-zone:hover,.drop-zone.dragging{border-color:#4f46e5;background:rgba(79,70,229,.05);}
        .row-error td{background:rgba(239,68,68,.04)!important;}
        .row-ok td{background:rgba(16,185,129,.03)!important;}
        .error-pill{background:#7f1d1d;color:#fca5a5;padding:2px 6px;border-radius:4px;font-size:10px;display:inline-block;margin:2px;}
        .step-badge{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#4f46e5;color:#fff;font-size:11px;flex-shrink:0;}
        .import-mode-btn{flex:1;padding:12px;border-radius:8px;border:1px solid #1e293b;background:transparent;color:#64748b;cursor:pointer;font-family:'DM Mono',monospace;font-size:12px;text-align:left;transition:all .2s;}
        .import-mode-btn.sel{border-color:#4f46e5;background:rgba(79,70,229,.08);color:#a5b4fc;}
        .hdr-sticky{position:sticky;top:0;z-index:5;background:#090912;}
      `}</style>

      {/* NAV */}
      <div style={{borderBottom:"1px solid #1e293b",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#0a0a0f",zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,background:"linear-gradient(135deg,#4f46e5,#7c3aed)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>⚡</div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,letterSpacing:"-0.02em"}}>AI USE CASE TRACKER</div>
            <div style={{fontSize:10,color:"#4f46e5",letterSpacing:"0.1em"}}>{useCases.length} TOTAL RECORDS</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {["dashboard","log","report"].map(v=>(
            <span key={v} className={`nav-link${view===v?" active":""}`} onClick={()=>setView(v)}>
              {v==="dashboard"?"📊 Dashboard":v==="log"?"📋 Log":"📈 Report"}
            </span>
          ))}
          <button className="btn btn-upload" onClick={()=>{setShowBulk(true);setBulkPreview(null);}}>⬆ Bulk Upload</button>
          <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setEditId(null);setShowForm(true);}}>+ New</button>
        </div>
      </div>

      <div style={{padding:"24px",maxWidth:1400,margin:"0 auto"}}>

        {/* DASHBOARD */}
        {view==="dashboard"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:24}}>
              {[
                {label:"Total",value:analytics.total,color:"#4f46e5",icon:"📦"},
                {label:"New This Week",value:analytics.newThisWeek,color:"#10b981",icon:"✨"},
                {label:"Stuck 7+ days",value:analytics.stuckThisWeek,color:"#f59e0b",icon:"⏳"},
                {label:"Overdue",value:analytics.overdue,color:"#ef4444",icon:"🔴"},
                {label:"Aging 30+ days",value:analytics.aging.length,color:"#f97316",icon:"📅"},
              ].map(s=>(
                <div key={s.label} className="stat-card" style={{borderTop:`2px solid ${s.color}`}}>
                  <div style={{fontSize:22,marginBottom:8}}>{s.icon}</div>
                  <div className="stat-number" style={{color:s.color}}>{s.value}</div>
                  <div style={{fontSize:11,color:"#64748b",marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
              <div className="card">
                <div className="section-title" style={{marginBottom:16}}>By Status</div>
                {STATUS_OPTIONS.map(s=>{const c=analytics.byStatus[s]||0,p=analytics.total?Math.round(c/analytics.total*100):0;return(
                  <div key={s} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:"#94a3b8"}}>{s}</span>
                      <span style={{fontSize:12,color:STATUS_COLORS[s]||"#fff",fontWeight:500}}>{c}</span>
                    </div>
                    <div className="bar"><div className="bar-fill" style={{width:`${p}%`,background:STATUS_COLORS[s]||"#4f46e5"}}/></div>
                  </div>
                );})}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="card">
                  <div className="section-title" style={{marginBottom:16}}>By Type</div>
                  <div style={{display:"flex",gap:12}}>
                    {USE_CASE_TYPES.map(t=>(
                      <div key={t} style={{flex:1,textAlign:"center",padding:"16px 8px",background:"#0a0a0f",borderRadius:8,border:`1px solid ${TYPE_COLORS[t]}22`}}>
                        <div className="stat-number" style={{fontSize:28,color:TYPE_COLORS[t]}}>{analytics.byType[t]||0}</div>
                        <div style={{fontSize:10,color:"#64748b",marginTop:4}}>{t}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="section-title" style={{marginBottom:12}}>🔥 Aging Cases</div>
                  {analytics.aging.length===0?<div style={{color:"#10b981",fontSize:13}}>✓ None aging</div>
                    :analytics.aging.slice(0,5).map(u=>(
                      <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1e293b"}}>
                        <div><div style={{fontSize:13}}>{u.account} — {u.project}</div><div style={{fontSize:11,color:"#64748b"}}>{u.status}</div></div>
                        <span className="aging-badge" style={{background:"#7f1d1d",color:"#fca5a5"}}>{daysSince(u.loggedDate)}d</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{marginBottom:16}}>Recent Use Cases</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Account</th><th>Project</th><th>Type</th><th>Status</th><th>Logged</th><th>Owner</th></tr></thead>
                  <tbody>{useCases.slice(0,8).map(u=>(
                    <tr key={u.id}>
                      <td style={{color:"#e2e8f0",fontWeight:500}}>{u.account}</td>
                      <td style={{color:"#94a3b8"}}>{u.project}</td>
                      <td><span className="chip" style={{color:TYPE_COLORS[u.useCaseType]||"#fff",borderColor:TYPE_COLORS[u.useCaseType]||"#333"}}>{u.useCaseType}</span></td>
                      <td><span className="chip" style={{color:STATUS_COLORS[u.status]||"#fff",borderColor:STATUS_COLORS[u.status]||"#333"}}>{u.status}</span></td>
                      <td style={{color:"#64748b"}}>{u.loggedDate}</td>
                      <td style={{color:"#94a3b8"}}>{u.useCaseOwner}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LOG */}
        {view==="log"&&(
          <div>
            <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
              <input placeholder="Search account, project, owner..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:280}}/>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:200}}>
                <option value="">All Statuses</option>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
              </select>
              <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{width:180}}>
                <option value="">All Types</option>{USE_CASE_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
              <span style={{marginLeft:"auto",color:"#64748b",fontSize:13,alignSelf:"center"}}>{filtered.length} results</span>
            </div>
            <div className="table-wrap card" style={{padding:0,overflow:"hidden"}}>
              <table>
                <thead>
                  <tr style={{background:"#090912"}}>
                    {[["account","Account"],["project","Project"],["useCaseType","Type"],["status","Status"],["loggedDate","Logged"],["plannedEndDate","End Date"],["useCaseOwner","Owner"],["effort","Effort"]].map(([f,l])=>(
                      <th key={f} onClick={()=>toggleSort(f)}>{l}{sortField===f?(sortDir==="asc"?" ↑":" ↓"):""}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0&&<tr><td colSpan={9} style={{textAlign:"center",color:"#374151",padding:"40px",fontSize:13}}>No use cases found.</td></tr>}
                  {filtered.map(u=>(
                    <tr key={u.id}>
                      <td style={{fontWeight:500,color:"#e2e8f0",minWidth:120}}>{u.account}</td>
                      <td style={{color:"#94a3b8",minWidth:120}}>{u.project}</td>
                      <td><span className="chip" style={{color:TYPE_COLORS[u.useCaseType]||"#fff",borderColor:TYPE_COLORS[u.useCaseType]||"#333"}}>{u.useCaseType}</span></td>
                      <td>
                        <span className="chip" style={{color:STATUS_COLORS[u.status]||"#fff",borderColor:STATUS_COLORS[u.status]||"#333",whiteSpace:"nowrap"}}>{u.status}</span>
                        {daysSince(u.loggedDate)>30&&!["Client demo - completed","SOW approved","Cancelled"].includes(u.status)&&<span className="aging-badge" style={{background:"#7f1d1d",color:"#fca5a5",marginLeft:4}}>aging</span>}
                      </td>
                      <td style={{color:"#64748b",whiteSpace:"nowrap"}}>{u.loggedDate}</td>
                      <td style={{color:u.plannedEndDate&&new Date(u.plannedEndDate)<new Date()?"#ef4444":"#64748b",whiteSpace:"nowrap"}}>{u.plannedEndDate||"—"}</td>
                      <td style={{color:"#94a3b8"}}>{u.useCaseOwner}</td>
                      <td style={{color:"#64748b"}}>{u.effort}</td>
                      <td style={{whiteSpace:"nowrap"}}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>handleEdit(u)} style={{marginRight:4}}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>setDeleteConfirm(u.id)}>Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT */}
        {view==="report"&&(
          <div>
            <div className="section-title" style={{marginBottom:20,fontSize:24}}>📈 Weekly Progress Report</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
              {[{l:"New This Week",v:analytics.newThisWeek,c:"#10b981",s:"use cases added in last 7 days"},
                {l:"Stuck This Week",v:analytics.stuckThisWeek,c:"#f59e0b",s:"active with no recent progress"},
                {l:"Overdue",v:analytics.overdue,c:"#ef4444",s:"past planned end date"}].map(s=>(
                <div key={s.l} className="stat-card" style={{borderTop:`2px solid ${s.c}`}}>
                  <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>{s.l}</div>
                  <div className="stat-number" style={{color:s.c}}>{s.v}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:6}}>{s.s}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
              <div className="card">
                <div className="section-title" style={{marginBottom:16}}>Solicitation Breakdown</div>
                {USE_CASE_TYPES.map(t=>{const c=analytics.byType[t]||0,p=analytics.total?Math.round(c/analytics.total*100):0;return(
                  <div key={t} style={{marginBottom:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{color:TYPE_COLORS[t],fontWeight:500}}>{t}</span>
                      <span style={{color:"#e2e8f0"}}>{c} <span style={{color:"#64748b"}}>({p}%)</span></span>
                    </div>
                    <div className="bar" style={{height:12}}><div className="bar-fill" style={{width:`${p}%`,background:TYPE_COLORS[t]}}/></div>
                  </div>
                );})}
              </div>
              <div className="card">
                <div className="section-title" style={{marginBottom:16}}>Status Distribution</div>
                {STATUS_OPTIONS.map(s=>{const c=analytics.byStatus[s]||0,p=analytics.total?Math.round(c/analytics.total*100):0;if(!c)return null;return(
                  <div key={s} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:STATUS_COLORS[s]}}>{s}</span>
                      <span style={{fontSize:12}}>{c} ({p}%)</span>
                    </div>
                    <div className="bar"><div className="bar-fill" style={{width:`${p}%`,background:STATUS_COLORS[s]}}/></div>
                  </div>
                );})}
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{marginBottom:16}}>🔥 Aging Report — Active Cases 30+ Days</div>
              {analytics.aging.length===0?<div style={{color:"#10b981",fontSize:14,padding:"16px 0"}}>✓ No aging use cases!</div>:(
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Account</th><th>Project</th><th>Status</th><th>Owner</th><th>Logged</th><th>Age</th><th>End Date</th></tr></thead>
                    <tbody>{analytics.aging.map(u=>{const age=daysSince(u.loggedDate),ac=age>60?"#ef4444":age>45?"#f97316":"#f59e0b";return(
                      <tr key={u.id}>
                        <td style={{fontWeight:500}}>{u.account}</td>
                        <td style={{color:"#94a3b8"}}>{u.project}</td>
                        <td><span className="chip" style={{color:STATUS_COLORS[u.status],borderColor:STATUS_COLORS[u.status]}}>{u.status}</span></td>
                        <td style={{color:"#94a3b8"}}>{u.useCaseOwner}</td>
                        <td style={{color:"#64748b"}}>{u.loggedDate}</td>
                        <td><span className="aging-badge" style={{background:ac+"22",color:ac,border:`1px solid ${ac}44`}}>{age} days</span></td>
                        <td style={{color:u.plannedEndDate&&new Date(u.plannedEndDate)<new Date()?"#ef4444":"#64748b"}}>{u.plannedEndDate||"—"}</td>
                      </tr>
                    );})}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── BULK UPLOAD MODAL ── */}
      {showBulk&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&!bulkPreview&&setShowBulk(false)}>
          <div className={`modal${bulkPreview?" modal-wide":""}`}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800}}>⬆ Bulk Upload from Excel</div>
              <button className="btn btn-ghost" onClick={()=>{setShowBulk(false);setBulkPreview(null);}}>✕ Close</button>
            </div>

            {!bulkPreview?(
              <>
                {/* Step 1 */}
                <div className="card" style={{marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <span className="step-badge">1</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,marginBottom:6}}>Download the Excel template</div>
                      <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>
                        Pre-formatted with all column headers and 2 sample rows. A second sheet lists all valid options for Use Case Type and Status.
                      </div>
                      <button className="btn btn-ghost" onClick={downloadTemplate}>⬇ Download Template (.xlsx)</button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="card" style={{marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <span className="step-badge">2</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,marginBottom:6}}>Upload your filled file</div>
                      <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>Supports .xlsx, .xls, and .csv formats. Headers are matched case-insensitively.</div>
                      <div
                        className={`drop-zone${isDragging?" dragging":""}`}
                        onClick={()=>fileRef.current.click()}
                        onDragOver={e=>{e.preventDefault();setIsDragging(true);}}
                        onDragLeave={()=>setIsDragging(false)}
                        onDrop={handleDrop}
                      >
                        <div style={{fontSize:40,marginBottom:12}}>📂</div>
                        <div style={{color:"#94a3b8",marginBottom:4}}>Drag & drop your Excel / CSV file here</div>
                        <div style={{color:"#64748b",fontSize:12}}>or click to browse</div>
                        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={handleFileInput}/>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column reference */}
                <div className="card">
                  <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>📋 Expected column headers (case-insensitive):</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {TEMPLATE_HEADERS.map(h=>(
                      <span key={h} style={{background:"#0a0a0f",border:`1px solid ${["Account","Project"].includes(h)?"#4f46e5":"#1e293b"}`,borderRadius:4,padding:"3px 8px",fontSize:11,color:["Account","Project"].includes(h)?"#a5b4fc":"#64748b"}}>
                        {h}{["Account","Project"].includes(h)?" *":""}
                      </span>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:"#475569",marginTop:10}}>* Required</div>
                </div>
              </>
            ):(
              <>
                {/* Preview */}
                <div style={{display:"flex",gap:16,marginBottom:20}}>
                  {[{l:"Ready to Import",v:bulkPreview.valid.length,c:"#10b981"},{l:"Rows with Errors",v:bulkPreview.withErrors.length,c:"#ef4444"},{l:"Total Rows",v:bulkPreview.rows.length,c:"#94a3b8"}].map(s=>(
                    <div key={s.l} className="card" style={{flex:1,textAlign:"center"}}>
                      <div style={{fontSize:28,fontFamily:"'Syne',sans-serif",fontWeight:800,color:s.c}}>{s.v}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Mode */}
                <div style={{marginBottom:16}}>
                  <div className="label">Import Mode</div>
                  <div style={{display:"flex",gap:12}}>
                    <button className={`import-mode-btn${bulkMode==="append"?" sel":""}`} onClick={()=>setBulkMode("append")}>
                      <div style={{fontWeight:500,marginBottom:2}}>➕ Append</div>
                      <div style={{fontSize:11,opacity:.7}}>Add to existing {useCases.length} records</div>
                    </button>
                    <button className={`import-mode-btn${bulkMode==="replace"?" sel":""}`} onClick={()=>setBulkMode("replace")}>
                      <div style={{fontWeight:500,marginBottom:2}}>🔄 Replace All</div>
                      <div style={{fontSize:11,opacity:.7}}>Clear existing & import fresh</div>
                    </button>
                  </div>
                </div>

                {/* Table preview */}
                <div className="card" style={{padding:0,overflow:"hidden",marginBottom:16}}>
                  <div style={{padding:"10px 16px",borderBottom:"1px solid #1e293b",fontSize:12,color:"#64748b",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>📄 {bulkPreview.fileName}</span>
                    <span><span style={{color:"#10b981"}}>● OK</span> &nbsp; <span style={{color:"#ef4444"}}>● Error (will skip)</span></span>
                  </div>
                  <div style={{maxHeight:340,overflowY:"auto"}}>
                    <table>
                      <thead>
                        <tr className="hdr-sticky" style={{background:"#090912"}}>
                          <th>Row</th><th>Account</th><th>Project</th><th>Type</th><th>Status</th><th>Logged</th><th>Owner</th><th>Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkPreview.rows.map((r,i)=>(
                          <tr key={i} className={r._errors.length>0?"row-error":"row-ok"}>
                            <td style={{color:"#475569"}}>{r._rowNum}</td>
                            <td style={{fontWeight:500}}>{r.account||<span style={{color:"#ef4444"}}>—</span>}</td>
                            <td style={{color:"#94a3b8"}}>{r.project||<span style={{color:"#ef4444"}}>—</span>}</td>
                            <td>{r.useCaseType?<span className="chip" style={{color:TYPE_COLORS[r.useCaseType]||"#fca5a5",borderColor:TYPE_COLORS[r.useCaseType]||"#ef4444"}}>{r.useCaseType}</span>:<span style={{color:"#475569"}}>—</span>}</td>
                            <td>{r.status?<span className="chip" style={{color:STATUS_COLORS[r.status]||"#fca5a5",borderColor:STATUS_COLORS[r.status]||"#ef4444",whiteSpace:"nowrap"}}>{r.status}</span>:<span style={{color:"#475569"}}>—</span>}</td>
                            <td style={{color:"#64748b"}}>{r.loggedDate}</td>
                            <td style={{color:"#94a3b8"}}>{r.useCaseOwner}</td>
                            <td>
                              {r._errors.length===0
                                ?<span style={{color:"#10b981",fontSize:11}}>✓ OK</span>
                                :r._errors.map((e,ei)=><span key={ei} className="error-pill">{e}</span>)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {bulkMode==="replace"&&(
                  <div style={{background:"#450a0a",border:"1px solid #7f1d1d",borderRadius:8,padding:"12px 16px",marginBottom:16,fontSize:13,color:"#fca5a5"}}>
                    ⚠️ <strong>Warning:</strong> This will permanently delete all {useCases.length} existing records.
                  </div>
                )}

                <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
                  <button className="btn btn-ghost" onClick={()=>setBulkPreview(null)}>← Back</button>
                  <button className="btn btn-ghost" onClick={()=>{setShowBulk(false);setBulkPreview(null);}}>Cancel</button>
                  <button className="btn btn-success" onClick={confirmImport} disabled={bulkPreview.valid.length===0} style={{opacity:bulkPreview.valid.length===0?.5:1}}>
                    ✓ Import {bulkPreview.valid.length} Records
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800}}>{editId?"Edit Use Case":"New Use Case"}</div>
              <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>✕ Close</button>
            </div>
            <div className="form-grid">
              <div><label className="label">Account *</label><input value={form.account} onChange={e=>setForm({...form,account:e.target.value})} placeholder="Client / Account name"/></div>
              <div><label className="label">Project *</label><input value={form.project} onChange={e=>setForm({...form,project:e.target.value})} placeholder="Project name"/></div>
              <div className="form-full"><label className="label">Description</label><textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Brief description..."/></div>
              <div><label className="label">Use Case Type *</label><select value={form.useCaseType} onChange={e=>setForm({...form,useCaseType:e.target.value})}><option value="">Select type</option>{USE_CASE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label className="label">Status *</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="">Select status</option>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label className="label">Tech Stack</label><TechStackSelect value={form.techStack} onChange={v=>setForm({...form,techStack:v})}/></div>
              <div><label className="label">Effort</label><input value={form.effort} onChange={e=>setForm({...form,effort:e.target.value})} placeholder="e.g. 120 hrs"/></div>
              <div><label className="label">Logged Date</label><input type="date" value={form.loggedDate} onChange={e=>setForm({...form,loggedDate:e.target.value})}/></div>
              <div><label className="label">Planned End Date</label><input type="date" value={form.plannedEndDate} onChange={e=>setForm({...form,plannedEndDate:e.target.value})}/></div>
              <div><label className="label">AI Tech Lead</label><input value={form.aiTechLead} onChange={e=>setForm({...form,aiTechLead:e.target.value})} placeholder="Name"/></div>
              <div><label className="label">Use Case Owner</label><input value={form.useCaseOwner} onChange={e=>setForm({...form,useCaseOwner:e.target.value})} placeholder="Name"/></div>
              <div><label className="label">Use Case Leader</label><input value={form.useCaseLeader} onChange={e=>setForm({...form,useCaseLeader:e.target.value})} placeholder="Name"/></div>
              <div className="form-full"><label className="label">POD Members (comma separated)</label><input value={form.podMembers} onChange={e=>setForm({...form,podMembers:e.target.value})} placeholder="Name1, Name2"/></div>
              <div><label className="label"># POD Members Required</label><input type="number" value={form.podMembersRequired} onChange={e=>setForm({...form,podMembersRequired:e.target.value})} min={0}/></div>
              <div><label className="label"># POD Members Assigned</label><input type="number" value={form.podMembersAssigned} onChange={e=>setForm({...form,podMembersAssigned:e.target.value})} min={0}/></div>
              <div className="form-full"><label className="label">Comments</label><textarea rows={2} value={form.comments} onChange={e=>setForm({...form,comments:e.target.value})} placeholder="Additional notes..."/></div>
            </div>
            <div style={{display:"flex",gap:12,marginTop:24,justifyContent:"flex-end"}}>
              <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editId?"Update":"Add Use Case"}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}
      {deleteConfirm&&(
        <div className="modal-overlay">
          <div className="card" style={{maxWidth:400,width:"100%",textAlign:"center",padding:32}}>
            <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,marginBottom:8}}>Delete this use case?</div>
            <div style={{color:"#64748b",fontSize:13,marginBottom:24}}>This cannot be undone.</div>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button className="btn btn-ghost" onClick={()=>setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={()=>handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast&&(
        <div className="toast" style={{background:toast.type==="error"?"#7f1d1d":"#064e3b",color:toast.type==="error"?"#fca5a5":"#6ee7b7",border:`1px solid ${toast.type==="error"?"#991b1b":"#065f46"}`}}>
          {toast.type==="error"?"⚠️":"✓"} {toast.msg}
        </div>
      )}
    </div>
  );
}

function TechStackSelect({value=[],onChange}){
  const [open,setOpen]=useState(false);
  const toggle=t=>onChange(value.includes(t)?value.filter(x=>x!==t):[...value,t]);
  return(
    <div className="multi-select-wrap">
      <div onClick={()=>setOpen(!open)} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 12px",cursor:"pointer",fontSize:13,minHeight:38,display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
        {value.length===0?<span style={{color:"#475569"}}>Select tech stack...</span>:value.map(t=><span key={t} className="chip" style={{color:"#a5b4fc",borderColor:"#4f46e5",fontSize:10}}>{t}</span>)}
      </div>
      {open&&(
        <div className="multi-select-opts" onClick={e=>e.stopPropagation()}>
          {TECH_STACK_OPTIONS.map(t=>(
            <div key={t} className="multi-select-opt" onClick={()=>toggle(t)}>
              <span style={{color:value.includes(t)?"#4f46e5":"#374151"}}>■</span>
              <span style={{color:value.includes(t)?"#e2e8f0":"#64748b"}}>{t}</span>
            </div>
          ))}
          <div style={{padding:"8px 12px",borderTop:"1px solid #1e293b"}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
