import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, BusFront, CalendarDays, ChevronLeft, Clock3, MapPin,
  Menu, Search, ShieldCheck, X, Navigation, Info, ExternalLink
} from "lucide-react";
import "./styles.css";

const stands = [
  {
    id:"bhatkal",
    name:"Bhatkal Bus Stand",
    city:"Bhatkal, Uttara Kannada",
    state:"Karnataka",
    code:"BTK",
    status:"Open",
    note:"Main public bus stand",
    departures:[
      {time:"05:30 AM", destination:"Honnavar", service:"KSRTC", type:"Ordinary"},
      {time:"06:15 AM", destination:"Kumta", service:"KSRTC", type:"Express"},
      {time:"07:10 AM", destination:"Karwar", service:"KSRTC", type:"Express"},
      {time:"08:00 AM", destination:"Mangaluru", service:"KSRTC", type:"Express"},
      {time:"09:20 AM", destination:"Honnavar", service:"KSRTC", type:"Ordinary"},
      {time:"10:45 AM", destination:"Kumta", service:"KSRTC", type:"Ordinary"},
    ]
  },
  {
    id:"honnavar",
    name:"Honnavar Bus Stand",
    city:"Honnavar, Uttara Kannada",
    state:"Karnataka",
    code:"HNR",
    status:"Open",
    note:"Central bus stand",
    departures:[
      {time:"05:45 AM", destination:"Bhatkal", service:"KSRTC", type:"Ordinary"},
      {time:"06:30 AM", destination:"Kumta", service:"KSRTC", type:"Express"},
      {time:"07:35 AM", destination:"Karwar", service:"KSRTC", type:"Express"},
      {time:"08:40 AM", destination:"Mangaluru", service:"KSRTC", type:"Express"},
      {time:"10:00 AM", destination:"Bhatkal", service:"KSRTC", type:"Ordinary"},
      {time:"11:15 AM", destination:"Kumta", service:"KSRTC", type:"Ordinary"},
    ]
  },
  {
    id:"kumta",
    name:"Kumta Bus Stand",
    city:"Kumta, Uttara Kannada",
    state:"Karnataka",
    code:"KMT",
    status:"Open",
    note:"Town bus stand",
    departures:[
      {time:"05:20 AM", destination:"Honnavar", service:"KSRTC", type:"Ordinary"},
      {time:"06:00 AM", destination:"Gokarna", service:"KSRTC", type:"Express"},
      {time:"07:25 AM", destination:"Karwar", service:"KSRTC", type:"Express"},
      {time:"08:15 AM", destination:"Bhatkal", service:"KSRTC", type:"Ordinary"},
      {time:"09:45 AM", destination:"Gokarna", service:"KSRTC", type:"Ordinary"},
      {time:"11:00 AM", destination:"Honnavar", service:"KSRTC", type:"Express"},
    ]
  },
  {
    id:"karwar",
    name:"Karwar Bus Stand",
    city:"Karwar, Uttara Kannada",
    state:"Karnataka",
    code:"KWR",
    status:"Open",
    note:"Central bus stand",
    departures:[
      {time:"05:15 AM", destination:"Kumta", service:"KSRTC", type:"Express"},
      {time:"06:40 AM", destination:"Ankola", service:"KSRTC", type:"Ordinary"},
      {time:"07:30 AM", destination:"Gokarna", service:"KSRTC", type:"Express"},
      {time:"08:50 AM", destination:"Bhatkal", service:"KSRTC", type:"Express"},
      {time:"10:30 AM", destination:"Kumta", service:"KSRTC", type:"Ordinary"},
      {time:"12:00 PM", destination:"Honnavar", service:"KSRTC", type:"Express"},
    ]
  }
];

function App(){
  const [menuOpen,setMenuOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState(null);
  const [showAll,setShowAll]=useState(false);

  useEffect(()=>{
    const onKey=e=>{ if(e.key==="Escape"){setMenuOpen(false);setSelected(null)} };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[]);

  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q) return stands;
    return stands.filter(s=>[s.name,s.city,s.code,s.state].join(" ").toLowerCase().includes(q));
  },[query]);

  if(selected) return <StandPage stand={selected} onBack={()=>setSelected(null)} onMenu={()=>setMenuOpen(true)} menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>;

  return <div className="site-shell">
    <Header onMenu={()=>setMenuOpen(true)} />
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow"><span className="live-dot"/> PUBLIC BUS STAND INFORMATION</div>
          <h1>Know your stand.<br/><em>Know your next bus.</em></h1>
          <p className="hero-copy">Simple, public bus stand schedules for everyday travel. Find a stand and see its departures at a glance.</p>
          <div className="stand-search">
            <Search size={20}/>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a bus stand or town" aria-label="Search bus stand"/>
            {query && <button className="clear-search" onClick={()=>setQuery("")}><X size={17}/></button>}
          </div>
          <div className="search-hint"><MapPin size={14}/> Search by stand name, town or stand code</div>
        </div>
      </section>

      <section className="content-wrap" id="stands">
        <div className="section-head">
          <div><div className="section-kicker">DIRECTORY</div><h2>Bus stands</h2></div>
          <span className="result-count">{filtered.length} stands</span>
        </div>

        {filtered.length===0 ? <EmptyState query={query}/> :
        <div className="stand-grid">
          {(showAll?filtered:filtered.slice(0,4)).map(stand=><StandCard key={stand.id} stand={stand} onClick={()=>setSelected(stand)}/>)}
        </div>}

        {!query && filtered.length>4 && <button className="outline-button" onClick={()=>setShowAll(v=>!v)}>{showAll?"Show fewer":"View all bus stands"} <ArrowRight size={16}/></button>}
      </section>

      <section className="trust-band">
        <div className="trust-grid">
          <TrustItem icon={<Clock3/>} title="At a glance" text="Departure times are presented in a clear, timetable-first layout."/>
          <TrustItem icon={<MapPin/>} title="Stand focused" text="Find the bus stand first — not a route planner or bus search."/>
          <TrustItem icon={<ShieldCheck/>} title="Open to everyone" text="No account, login or personal details required."/>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-copy">
          <div className="section-kicker">BUILT FOR PEOPLE AT THE STAND</div>
          <h2>Less searching.<br/>More certainty.</h2>
          <p>buSnehi is designed around one public need: quickly checking what buses leave from a bus stand. The experience stays focused, readable and useful on both a large screen and a phone.</p>
        </div>
        <div className="principles">
          <div><strong>01</strong><span>Stand before route</span></div>
          <div><strong>02</strong><span>Timetable before noise</span></div>
          <div><strong>03</strong><span>Public before account</span></div>
        </div>
      </section>
    </main>
    <Footer/>
    {menuOpen && <MenuDrawer onClose={()=>setMenuOpen(false)}/>}
  </div>
}

function Header({onMenu}){
 return <header className="topbar">
   <div className="topbar-inner">
     <button className="menu-button" onClick={onMenu} aria-label="Open menu"><Menu size={22}/></button>
     <a className="brand" href="#" aria-label="buSnehi home"><span className="brand-mark"><BusFront size={19}/></span><span>buSnehi</span></a>
     <div className="topbar-note">PUBLIC BUS INFORMATION</div>
   </div>
 </header>
}

function StandCard({stand,onClick}){
 return <button className="stand-card" onClick={onClick}>
   <div className="card-top"><span className="stand-code">{stand.code}</span><span className="status"><i/>{stand.status}</span></div>
   <div className="stand-icon"><BusFront size={25}/></div>
   <h3>{stand.name}</h3>
   <p><MapPin size={14}/>{stand.city}</p>
   <div className="card-footer"><span>{stand.departures.length} departures shown</span><ArrowRight size={17}/></div>
 </button>
}

function StandPage({stand,onBack,onMenu,menuOpen,setMenuOpen}){
 const [filter,setFilter]=useState("All");
 const types=["All",...new Set(stand.departures.map(x=>x.type))];
 const rows=stand.departures.filter(x=>filter==="All"||x.type===filter);
 return <div className="site-shell">
   <Header onMenu={onMenu}/>
   <main className="detail-main">
     <div className="detail-wrap">
       <button className="back-button" onClick={onBack}><ChevronLeft size={17}/> All bus stands</button>
       <div className="detail-heading">
         <div>
           <div className="eyebrow dark"><span className="live-dot"/> {stand.status.toUpperCase()}</div>
           <h1>{stand.name}</h1>
           <p><MapPin size={16}/>{stand.city} · {stand.note}</p>
         </div>
         <div className="stand-code-large">{stand.code}</div>
       </div>
       <div className="schedule-toolbar">
         <div><div className="section-kicker">TODAY'S DEPARTURES</div><strong>{rows.length} services</strong></div>
         <div className="filter-pills">{types.map(t=><button className={filter===t?"active":""} key={t} onClick={()=>setFilter(t)}>{t}</button>)}</div>
       </div>
       <div className="schedule-card">
         <div className="schedule-head"><span>DEPARTURE</span><span>DESTINATION</span><span>SERVICE</span><span>TYPE</span></div>
         {rows.map((row,i)=><div className="schedule-row" key={i}>
           <strong>{row.time}</strong><span>{row.destination}</span><span className="service-name">{row.service}</span><span className="type-badge">{row.type}</span>
         </div>)}
       </div>
       <div className="data-note"><Info size={17}/><div><strong>Schedule information</strong><p>The timetable layer is intentionally separate from the website UI. Connect verified stand schedules to the data source before publishing live timings.</p></div></div>
     </div>
   </main>
   <Footer/>
   {menuOpen && <MenuDrawer onClose={()=>setMenuOpen(false)}/>}
 </div>
}

function TrustItem({icon,title,text}){return <div className="trust-item"><div className="trust-icon">{icon}</div><div><h3>{title}</h3><p>{text}</p></div></div>}
function EmptyState({query}){return <div className="empty-state"><Search size={24}/><h3>No bus stand found</h3><p>Nothing matched “{query}”. Try a town name or stand code.</p></div>}
function MenuDrawer({onClose}){
 return <div className="drawer-overlay" onClick={onClose}><aside className="drawer" onClick={e=>e.stopPropagation()}>
   <div className="drawer-head"><span className="brand"><span className="brand-mark"><BusFront size={19}/></span><span>buSnehi</span></span><button className="icon-button" onClick={onClose}><X size={21}/></button></div>
   <nav><a href="#stands" onClick={onClose}>Bus stands</a><a href="#about" onClick={onClose}>About buSnehi</a><a href="#footer" onClick={onClose}>Information</a></nav>
   <div className="drawer-note"><Navigation size={17}/><span>Public access. No account required.</span></div>
 </aside></div>
}
function Footer(){return <footer id="footer"><div className="footer-inner"><div><div className="brand footer-brand"><span className="brand-mark"><BusFront size={18}/></span><span>buSnehi</span></div><p>Public bus stand schedules, made easier to check.</p></div><div className="footer-links"><a href="#stands">Bus stands</a><a href="#about">About</a><span>Open public website</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} buSnehi</span><span>Built for clear public information</span></div></footer>}

createRoot(document.getElementById("root")).render(<App/>);