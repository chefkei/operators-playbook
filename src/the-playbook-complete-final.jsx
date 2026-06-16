import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────
const DEMO_MODE = true; // Set to false when Supabase is configured

// ─── BRAND ────────────────────────────────────────────────────────
const C = {
  gold:"#C9A84C", goldLight:"#F5D78E", goldDark:"#A67C2E", goldGlow:"#C9A84C12",
  black:"#080808", card:"#0F0F0F", cardHover:"#141414",
  border:"#1C1C1C", borderGold:"#C9A84C2E",
  white:"#F0F0F0", muted:"#666", mutedLight:"#999",
  green:"#4CAF7D", red:"#E05252", purple:"#9B7FD4", blue:"#5B8CDB", orange:"#E0924A",
};
const gold = `linear-gradient(135deg,${C.goldDark} 0%,${C.goldLight} 50%,${C.goldDark} 100%)`;
const GT = { background:gold, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" };

// ─── STORAGE ──────────────────────────────────────────────────────
const ls = {
  get:(k)=>{try{return JSON.parse(localStorage.getItem(k)||"null")}catch{return null}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
};

// ─── PLANS ────────────────────────────────────────────────────────
const PLANS = [
  {id:"solo",  name:"Solo",  price:49,  color:C.mutedLight, seats:1,  coaching:0, highlight:false,
   features:["1 user (owner access)","All 7 training phases","Full Operations Center","Sales & Marketing Playbook","Quizzes & certifications","PDF downloads"]},
  {id:"team",  name:"Team",  price:149, color:C.gold,       seats:15, coaching:1, highlight:true,
   features:["Up to 15 users","All roles (owner/manager/staff)","Team progress dashboard","1 coaching call/month","White-label branding","Priority support"]},
  {id:"pro",   name:"Pro",   price:349, color:C.purple,     seats:999,coaching:2, highlight:false,
   features:["Unlimited users","Multiple locations","Full admin panel","2 coaching calls/month","Custom onboarding","Everything in Team"]},
];

// ─── ROLES ────────────────────────────────────────────────────────
const ROLES = {
  owner:   {label:"Owner",   color:C.gold,   badge:"Full Access"},
  manager: {label:"Manager", color:C.purple, badge:"Manager"},
  staff:   {label:"Staff",   color:C.green,  badge:"Staff"},
  admin:   {label:"Admin",   color:C.blue,   badge:"Admin"},
};

// ─── UI ATOMS ─────────────────────────────────────────────────────
const GoldLine = () => (
  <div style={{display:"flex",alignItems:"center",gap:10,margin:"6px 0"}}>
    <div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${C.goldDark}88)`}}/>
    <div style={{width:4,height:4,borderRadius:"50%",background:C.gold}}/>
    <div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${C.goldDark}88)`}}/>
  </div>
);
const Bar = ({pct=0,h=2,color}) => (
  <div style={{height:h,background:C.border,borderRadius:2,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.min(100,Math.max(0,pct))}%`,background:color||`linear-gradient(to right,${C.goldDark},${C.goldLight})`,transition:"width .8s ease",borderRadius:2}}/>
  </div>
);
const Pill = ({children,color=C.gold,style={}}) => (
  <span style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",padding:"3px 9px",border:`1px solid ${color}44`,color,borderRadius:2,fontFamily:"Georgia,serif",whiteSpace:"nowrap",...style}}>{children}</span>
);
const GBtn = ({children,onClick,outline,ghost,small,full,disabled,red,color,style={}}) => {
  const bg = disabled?C.border:red?`${C.red}1A`:outline||ghost?"transparent":gold;
  const border = outline?`1px solid ${color?color+"66":C.borderGold}`:ghost?`1px solid ${C.border}`:red?`1px solid ${C.red}44`:"none";
  const clr = disabled?C.muted:red?C.red:outline?(color||C.gold):ghost?C.muted:C.black;
  return <button onClick={!disabled?onClick:undefined} style={{padding:small?"8px 16px":"12px 24px",background:bg,border,borderRadius:2,color:clr,fontSize:small?9:10,letterSpacing:small?2:3,textTransform:"uppercase",fontWeight:"bold",cursor:disabled?"not-allowed":"pointer",fontFamily:"Georgia,serif",transition:"all .2s",width:full?"100%":"auto",...style}}>{children}</button>;
};
const ResultBox = ({label,value,color=C.gold,sub}) => (
  <div style={{background:`${color}0D`,border:`1px solid ${color}33`,borderRadius:2,padding:"14px 16px",textAlign:"center",fontFamily:"Georgia,serif"}}>
    <div style={{fontSize:9,letterSpacing:2,color,textTransform:"uppercase",marginBottom:4}}>{label}</div>
    <div style={{fontSize:22,fontWeight:"bold",color,lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:C.muted,marginTop:3}}>{sub}</div>}
  </div>
);

// ─── NOTIFICATIONS ────────────────────────────────────────────────
const mkNotif = (type,data) => ({id:Date.now()+Math.random(),type,data,read:false,at:new Date().toISOString()});
const NTPL = {
  welcome:  d=>`Welcome, ${d.name}! Your ${d.plan} plan is active.`,
  module:   d=>`✓ Module complete: "${d.title}"`,
  quiz_pass:d=>`🏆 Quiz passed: "${d.title}" — ${d.score}/${d.total}`,
  quiz_fail:d=>`Try again: "${d.title}" — ${d.score}/${d.total}`,
  phase:    d=>`🎉 Phase complete: ${d.title}`,
  cert:     d=>`🏅 Certificate earned: ${d.title}`,
  booking:  d=>`📅 Coaching booked: ${d.day} at ${d.time}`,
  upgrade:  d=>`Plan upgraded to ${d.plan}.`,
};

function NotifPanel({notifs,onClose,onMarkAll}) {
  const unread = notifs.filter(n=>!n.read).length;
  return (
    <div style={{position:"fixed",top:60,right:8,width:300,maxHeight:"65vh",background:C.card,border:`1px solid ${C.borderGold}`,borderRadius:2,zIndex:300,boxShadow:`0 8px 40px #000A`,display:"flex",flexDirection:"column",fontFamily:"Georgia,serif"}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
        <div style={{fontSize:10,letterSpacing:3,color:C.gold,textTransform:"uppercase"}}>Notifications{unread>0&&<span style={{color:C.red}}> ({unread})</span>}</div>
        <div style={{display:"flex",gap:8}}>
          {unread>0&&<button onClick={onMarkAll} style={{fontSize:9,color:C.muted,background:"none",border:"none",cursor:"pointer",fontFamily:"Georgia,serif"}}>All read</button>}
          <button onClick={onClose} style={{fontSize:16,color:C.muted,background:"none",border:"none",cursor:"pointer",lineHeight:1}}>×</button>
        </div>
      </div>
      <div style={{overflowY:"auto",flex:1}}>
        {notifs.length===0&&<div style={{padding:20,fontSize:12,color:C.muted,textAlign:"center"}}>No notifications yet.</div>}
        {[...notifs].reverse().map(n=>(
          <div key={n.id} style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,background:n.read?"transparent":`${C.gold}06`}}>
            <div style={{fontSize:12,color:n.read?C.mutedLight:C.white,lineHeight:1.5}}>{NTPL[n.type]?.(n.data)||n.type}</div>
            <div style={{fontSize:9,color:C.muted,marginTop:3}}>{new Date(n.at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────
function Header({user,brand,onHome,onLogout,onAdmin,notifs=[],onToggleNotifs,showNotifs,onMarkAll,onBack,backLabel}) {
  const ri = ROLES[user?.role]||ROLES.owner;
  const unread = notifs.filter(n=>!n.read).length;
  const name = brand?.name||"THE OPERATOR'S PLAYBOOK";
  return (
    <header style={{background:C.card,borderBottom:`1px solid ${C.borderGold}`,padding:"0 14px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:200,fontFamily:"Georgia,serif",gap:8}}>
      <div onClick={onHome} style={{fontSize:"clamp(10px,2.5vw,14px)",letterSpacing:"clamp(3px,1vw,5px)",fontWeight:"bold",...GT,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>{name}</div>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"nowrap"}}>
        {onBack&&<GBtn small outline onClick={onBack}>← {backLabel||"Back"}</GBtn>}
        {user?.role==="admin"&&onAdmin&&<GBtn small outline onClick={onAdmin} color={C.blue}>Admin</GBtn>}
        <button onClick={onToggleNotifs} style={{position:"relative",background:"none",border:`1px solid ${C.border}`,borderRadius:2,padding:"5px 8px",cursor:"pointer",color:unread>0?C.gold:C.muted,fontSize:13,flexShrink:0}}>
          🔔{unread>0&&<span style={{position:"absolute",top:-3,right:-3,width:14,height:14,borderRadius:"50%",background:C.red,fontSize:8,color:C.white,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}
        </button>
        <Pill color={ri.color}>{user?.name?.split(" ")[0]||"Operator"}</Pill>
        <button onClick={onLogout} style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase",cursor:"pointer",background:"none",border:"none",fontFamily:"Georgia,serif",flexShrink:0}}>Out</button>
      </div>
      {showNotifs&&<NotifPanel notifs={notifs} onClose={onToggleNotifs} onMarkAll={onMarkAll}/>}
    </header>
  );
}

// ─── TRAINING PHASES DATA ─────────────────────────────────────────
const PHASES = [
  {id:1,icon:"✦",label:"PHASE 01",title:"Concept & Pre-Opening",desc:"Build your foundation before you spend a dollar.",roles:["owner","admin"],
   modules:[
    {id:"1-1",title:"Concept Development Framework",type:"lesson",roles:["owner","admin"],content:`Your concept is the soul of your restaurant. Define three things before anything else:\n\n1. WHO is your guest? Age, income, lifestyle, dining habits. Be specific — "everyone" is not a guest profile.\n\n2. WHAT is your promise? In one sentence, what experience are you selling? Not the food — the feeling.\n\n3. WHY will they choose you? Against every competitor on your block — what is your unfair advantage?\n\nEvery decision from this point — menu, décor, hiring, pricing — filters through these three answers.`},
    {id:"1-2",title:"Market Research & Competitive Analysis",type:"lesson",roles:["owner","admin"],content:`Great operators don't guess — they research.\n\n• Visit every competitor within 3 miles. Eat there. Note pricing, service, and gaps.\n• Identify the underserved guest in your market.\n• Study demographic data for your target zip codes.\n• Analyze foot traffic at different times of day.\n\nThe goal: find the white space and own that position.`},
    {id:"1-3",title:"Business Plan Templates",type:"lesson",roles:["owner","admin"],content:`A business plan is your operating blueprint.\n\n• Executive Summary\n• Concept Overview & Positioning\n• Market Analysis\n• Menu Overview & Pricing Strategy\n• Operational Plan\n• Financial Projections (3-year)\n• Funding Requirements`},
    {id:"1-4",title:"Location & Lease Evaluation",type:"quiz",roles:["owner","admin"],quiz:[
      {q:"Most critical factor when evaluating a location?",options:["Square footage","Foot traffic and visibility","Rent price","Parking"],answer:1},
      {q:"Triple net (NNN) lease means the tenant pays:",options:["Rent only","Rent + taxes, insurance, maintenance","Nothing extra","Variable amounts"],answer:1},
      {q:"Healthy rent-to-sales ratio:",options:["3–5%","6–10%","15–20%","25%+"],answer:1},
      {q:"Before signing a lease you should:",options:["Trust the landlord","Have a real estate attorney review it","Sign quickly","Skip negotiation"],answer:1},
      {q:"A co-tenancy clause protects you when:",options:["Sales drop","An anchor tenant leaves","You want to sublease","You need more space"],answer:1},
    ]},
    {id:"1-5",title:"Pre-Opening 90-Day Timeline",type:"lesson",roles:["owner","admin"],content:`DAYS 90–60: Permits, licenses, vendor contracts, POS selection, menu finalization\nDAYS 60–30: Hiring, training program, marketing launch, soft open planning\nDAYS 30–0: Staff training, test services, systems checks, grand opening\n\nEvery task has an owner. Every deadline is non-negotiable.`},
  ]},
  {id:2,icon:"⬡",label:"PHASE 02",title:"Systems & Setup",desc:"Build infrastructure that runs without you.",roles:["owner","manager","admin"],
   modules:[
    {id:"2-1",title:"Menu Development & Engineering",type:"lesson",roles:["owner","manager","admin"],content:`⭐ STARS — High profit, high popularity. Protect these.\n🐄 PLOWHORSES — High popularity, low profit. Re-engineer.\n❓ PUZZLES — High profit, low popularity. Market harder.\n🐕 DOGS — Low profit, low popularity. Cut without mercy.\n\nYour menu is your most powerful sales tool.`},
    {id:"2-2",title:"Recipe Cards & Prep Guides",type:"lesson",roles:["owner","manager","admin"],content:`Every dish needs a standardized recipe card:\n• Exact ingredient quantities (by weight)\n• Step-by-step preparation method\n• Plating photo and description\n• Yield and portion size\n• Cost per portion\n• Allergen flags`},
    {id:"2-3",title:"Allergen Tracking System",type:"quiz",roles:["owner","manager","admin"],quiz:[
      {q:"FDA-recognized major food allergens:",options:["6","8","9","12"],answer:2},
      {q:"Which is NOT one of the 9 major allergens?",options:["Tree nuts","Sesame","Corn","Shellfish"],answer:2},
      {q:"Cross-contact occurs when:",options:["Allergen intentionally added","Allergen accidentally transferred","Guest mentions allergy","You change gloves"],answer:1},
      {q:"When a guest mentions an allergy:",options:["Note and continue","Inform kitchen and confirm safe prep","Suggest another dish","Ask how serious"],answer:1},
      {q:"Allergen info on menus is:",options:["Optional","Only for chains","A best practice protecting guests","Only for nut allergies"],answer:2},
    ]},
    {id:"2-4",title:"Vendor Sourcing & Ordering",type:"lesson",roles:["owner","manager","admin"],content:`• Always have a primary and backup vendor\n• Negotiate Net 30 payment terms\n• Set par levels to eliminate guessing\n• Review invoices against every delivery\n• Consolidate vendors to increase buying power`},
    {id:"2-5",title:"HR Docs & Staff Onboarding",type:"lesson",roles:["owner","manager","admin"],content:`• Employee Handbook\n• Offer Letters\n• Onboarding Checklist: day 1, week 1, 30-day milestones\n• Training Sign-offs\n• I-9 and W-4 compliance\n\nA restaurant that doesn't document is a restaurant that gets sued.`},
  ]},
  {id:3,icon:"◈",label:"PHASE 03",title:"FOH Operations",desc:"Deliver a guest experience worth coming back for.",roles:["owner","manager","staff","admin"],
   modules:[
    {id:"3-1",title:"Steps of Service",type:"lesson",roles:["owner","manager","staff","admin"],content:`1. GREET within 60 seconds\n2. INTRODUCE yourself and the concept\n3. SUGGEST beverages and specials\n4. TAKE the order with confidence\n5. DELIVER with accuracy and timing\n6. CHECK BACK within 2 bites\n7. ANTICIPATE needs before they're asked\n8. CLOSE with warmth and an invitation to return`},
    {id:"3-2",title:"Guest Complaint Handling",type:"quiz",roles:["owner","manager","staff","admin"],quiz:[
      {q:"First response when a guest complains:",options:["Explain what went wrong","Defend your team","Listen fully and acknowledge","Offer a discount"],answer:2},
      {q:"LAST acronym stands for:",options:["Listen, Apologize, Solve, Thank","Look, Ask, Serve, Tell","Learn, Assess, Settle, Transfer","None"],answer:0},
      {q:"A guest whose issue was resolved well is:",options:["Less likely to return","About as likely","More likely to become loyal","Always leaves bad reviews"],answer:2},
      {q:"Manager involvement in a complaint:",options:["Only major issues","When server can't resolve or guest requests","Never","Always"],answer:1},
      {q:"After resolving a complaint:",options:["Avoid the table","Follow up to ensure satisfaction","Comp entire bill","Document and move on"],answer:1},
    ]},
    {id:"3-3",title:"Upselling & Suggestive Selling",type:"lesson",roles:["owner","manager","staff","admin"],content:`❌ "Do you want an appetizer?"\n✅ "The tuna tartare is incredible tonight — most tables start with it."\n\n• Know the menu deeply enough to sell with conviction\n• Use specific language\n• Suggest add-ons naturally\n\nA $3 check average increase across 100 covers = $109,500/year.`},
    {id:"3-4",title:"Bar Program & Beverage Standards",type:"lesson",roles:["owner","manager","staff","admin"],content:`Beverage cost targets:\n• Liquor: 18–24% • Beer: 20–25% • Wine: 28–35%\n\nKey systems:\n• Standardized pour sizes\n• Recipe cards for every cocktail\n• Weekly liquor inventory\n\nThe bar that isn't measured is the bar that's being stolen from.`},
  ]},
  {id:4,icon:"◉",label:"PHASE 04",title:"BOH Operations",desc:"Build a kitchen that runs with precision.",roles:["owner","manager","staff","admin"],
   modules:[
    {id:"4-1",title:"Kitchen Organization & Station Setup",type:"lesson",roles:["owner","manager","staff","admin"],content:`• Everything has a home — and it never moves\n• Cold items stay cold, hot items stay hot\n• Tools are within arm's reach\n• Each station has its own mise en place checklist\n• Labels on everything: product, date, time`},
    {id:"4-2",title:"Food Safety & Sanitation",type:"quiz",roles:["owner","manager","staff","admin"],quiz:[
      {q:"Food temperature danger zone:",options:["0°F–32°F","32°F–140°F","41°F–135°F","50°F–165°F"],answer:2},
      {q:"How long can food stay in the danger zone?",options:["1 hour","2 hours","4 hours","8 hours"],answer:2},
      {q:"Correct dish-washing order:",options:["Rinse, wash, sanitize","Wash, rinse, sanitize","Sanitize, wash, rinse","Wash, sanitize, rinse"],answer:1},
      {q:"Best prevention for cross-contamination:",options:["Wash hands once","Color-coded cutting boards","Keep kitchen cold","Same knife for everything"],answer:1},
      {q:"Exclude a food handler when:",options:["Minor headache","Vomiting, diarrhea, or jaundice","They feel tired","Busy shifts"],answer:1},
    ]},
    {id:"4-3",title:"Prep Systems & Par Levels",type:"lesson",roles:["owner","manager","staff","admin"],content:`How to set par levels:\n1. Track usage per cover\n2. Multiply by average covers + 20% buffer\n3. Set as daily prep target\n4. Adjust weekly\n\nWhen your team knows the par, they walk in and start prepping.`},
    {id:"4-4",title:"Waste Tracking & Yield Management",type:"lesson",roles:["owner","manager","staff","admin"],content:`Most restaurants lose 4–10% of food cost to unmeasured waste.\n\n• Daily waste log at each station\n• Track: item, quantity, reason\n• Review weekly\n• Calculate monthly dollar value\n• Set reduction targets`},
  ]},
  {id:5,icon:"◇",label:"PHASE 05",title:"Finance & Cost Control",desc:"Know your numbers. Run a profitable operation.",roles:["owner","manager","admin"],
   modules:[
    {id:"5-1",title:"Food & Beverage Cost Calculators",type:"lesson",roles:["owner","manager","admin"],content:`Food cost % = (COGS ÷ Revenue) × 100\n\nTargets: Fine dining 28–35% • Casual 28–32% • Fast casual 25–30%\n\nTo lower food cost:\n1. Audit recipes for waste\n2. Re-engineer portion sizes\n3. Negotiate better vendor pricing\n4. Track daily — not monthly`},
    {id:"5-2",title:"Labor Cost Management",type:"quiz",roles:["owner","manager","admin"],quiz:[
      {q:"Ideal labor cost % for full-service restaurants:",options:["10–15%","20–25%","30–35%","40–45%"],answer:2},
      {q:"Prime cost is:",options:["Food cost only","Labor only","Food + beverage + labor","Rent + labor"],answer:2},
      {q:"Best way to control labor cost:",options:["Cut hours without notice","Schedule based on projected sales","Hire fewer","Pay minimum wage"],answer:1},
      {q:"Federal overtime begins after:",options:["35 hrs","40 hrs","45 hrs","50 hrs"],answer:1},
      {q:"Most effective scheduling practice:",options:["Same schedule weekly","Cross-train for multiple positions","Extra staff on slow days","No part-time employees"],answer:1},
    ]},
    {id:"5-3",title:"Weekly P&L Review",type:"lesson",roles:["owner","manager","admin"],content:`30-minute weekly P&L review:\n1. Top-line sales vs. prior week and year\n2. Food cost actual vs. theoretical\n3. Labor cost actual vs. budget\n4. Prime cost total\n5. Any unusual variance — investigate immediately`},
    {id:"5-4",title:"Break-Even Analysis",type:"lesson",roles:["owner","manager","admin"],content:`Formula: Fixed Costs ÷ (1 – Variable Cost %) = Break-Even Sales\n\nExample: $40,000 ÷ (1 – 0.65) = $114,286/month to break even\n\nPost this number. Rally your team around it every shift.`},
  ]},
  {id:6,icon:"★",label:"PHASE 06",title:"Management & Leadership",desc:"Develop leaders who run the floor like you would.",roles:["owner","manager","admin"],
   modules:[
    {id:"6-1",title:"Manager Daily Checklist Systems",type:"lesson",roles:["owner","manager","admin"],content:`OPENING: Safety walkthrough • Line check • Staffing confirmed • Cash verified • Pre-shift meeting\n\nCLOSING: Sales recap • Cash balanced • Waste log reviewed • Facility secured • Next day staffing confirmed`},
    {id:"6-2",title:"Performance Reviews & Coaching",type:"lesson",roles:["owner","manager","admin"],content:`Reviews at 30 days, 90 days, and annually.\n\nEvery review:\n1. What's going well (specific examples)\n2. What needs improvement (specific behaviors)\n3. Goals for the next period\n4. Resources and support you'll provide`},
    {id:"6-3",title:"Culture & Team Building",type:"quiz",roles:["owner","manager","admin"],quiz:[
      {q:"#1 reason hospitality employees leave:",options:["Low pay","Poor management and lack of respect","Long hours","Physical demands"],answer:1},
      {q:"Most effective pre-shift meetings:",options:["Admin only","Under 5 minutes","Training + recognition + daily goals","Optional"],answer:2},
      {q:"Best way to recognize performance:",options:["Monthly award","Public, specific, timely acknowledgment","Annual raise","Thank-you email"],answer:1},
      {q:"High turnover most impacts:",options:["Menu quality","Training costs, consistency, morale","Vendor relationships","Maintenance"],answer:1},
      {q:"Psychological safety means:",options:["No mistakes","Staff can speak up without fear","Management decides everything","No conflict"],answer:1},
    ]},
    {id:"6-4",title:"Disciplinary Documentation",type:"lesson",roles:["owner","manager","admin"],content:`1. Verbal Warning (documented)\n2. Written Warning\n3. Final Written Warning\n4. Termination\n\nDocument everything. Get signatures. Never terminate without documentation.`},
  ]},
  {id:7,icon:"▲",label:"PHASE 07",title:"Growth & Scaling",desc:"Build a brand that outlasts one location.",roles:["owner","admin"],
   modules:[
    {id:"7-1",title:"Marketing & Social Media",type:"lesson",roles:["owner","admin"],content:`Content pillars:\n🍽️ FOOD — beauty shots, specials, behind-the-scenes\n👥 PEOPLE — team spotlights, guest moments\n📖 STORY — your why, your community\n🎉 EVENTS — reservations, private dining\n\n4x/week authentic > 1x/week polished.`},
    {id:"7-2",title:"Guest Retention & Loyalty",type:"lesson",roles:["owner","admin"],content:`Acquiring a new guest costs 5x more than retaining one.\n\n• Email capture at every touchpoint\n• Birthday and anniversary programs\n• VIP recognition for frequent guests\n• Exclusive early access to new menus`},
    {id:"7-3",title:"Second Location Readiness",type:"quiz",roles:["owner","admin"],quiz:[
      {q:"Before opening location two, location one should be:",options:["Open 6+ months","Profitable and running without you daily","Grossing $1M+","Fully renovated"],answer:1},
      {q:"Biggest mistake when scaling:",options:["Too close to location one","No documented systems before scaling","Too many hires","Too much décor spend"],answer:1},
      {q:"Most important thing to replicate:",options:["Exact menu","Interior design","Systems, culture, and training","Price point"],answer:2},
      {q:"A strong GM at location one is:",options:["Optional","Essential — you cannot scale without one","Easy to promote","Less important than chef"],answer:1},
      {q:"Multi-unit operators succeed because of:",options:["Better food","More marketing","Documented repeatable systems","Lower costs"],answer:2},
    ]},
    {id:"7-4",title:"Catering & Events Revenue",type:"lesson",roles:["owner","admin"],content:`• Create a dedicated catering menu\n• Build private dining packages with pricing tiers\n• Create a contract template with deposit requirements\n• Promote to corporate clients, wedding planners, event coordinators\n\nOne $5,000 event = a full Saturday night with lower labor cost.`},
  ]},
];

// ─── CERTIFICATIONS ───────────────────────────────────────────────
const CERTS = [
  {id:"foh",      title:"FOH Professional",    phases:[3],         color:C.gold,   icon:"◈"},
  {id:"boh",      title:"BOH Professional",    phases:[4],         color:C.red,    icon:"◉"},
  {id:"manager",  title:"Restaurant Manager",  phases:[2,5,6],     color:C.purple, icon:"★"},
  {id:"operator", title:"Certified Operator",  phases:[1,2,3,4,5,6], color:C.blue, icon:"⬡"},
  {id:"graduate", title:"Playbook Graduate",   phases:[1,2,3,4,5,6,7], color:C.goldLight, icon:"▲"},
];

// ─── SALES & MARKETING DATA ───────────────────────────────────────
const SALES_SECTIONS = [
  {
    id:"revenue-strategies", title:"Revenue Strategies", icon:"💰", color:C.green,
    desc:"Proven tactics to increase revenue without increasing your seat count.",
    items:[
      {title:"The Check Average Formula",content:`Your check average is the single most controllable revenue lever in your business. You can't always fill more seats — but you can almost always sell more per seat.\n\nFour levers:\n1. BEVERAGE ATTACHMENT — Every table should have a beverage recommendation made. "Can I start you with something from the bar?" said with confidence at the right moment adds $8–15 per cover.\n\n2. APPETIZER / FIRST COURSE — Train your team to sell the first course as part of the experience: "We have a few things people usually start with..." A table of 4 ordering one appetizer to split = $14 added to the check.\n\n3. UPSELL ON PROTEINS — Grilled vs. blackened. 6oz vs. 8oz. With or without the lobster tail. These additions are high-margin and easy to sell when your team knows the language.\n\n4. DESSERT + DIGESTIF — Most servers give up on dessert too early. The close: "I know you said you were full — we have one thing that's worth breaking the rule for." Sell it with conviction or not at all.\n\nTarget: increase your check average by $3–5 within 30 days. That is $100,000–$180,000 in annual revenue added to a restaurant doing 100 covers per day.`},
      {title:"Filling Dead Zones",content:`Every restaurant has dead zones — times when you're paying labor but not generating revenue. Common ones: Tuesday lunch, early dinner (5–6pm), Sunday brunch close.\n\nStrategies by zone:\n\nLUNCH (if you're not maximizing it): Speed is everything for lunch guests. Build an express menu — limited items, fast execution, in-and-out in 45 minutes. Promote to nearby offices. One corporate lunch account can mean 20+ covers 3 days a week.\n\nEARLY DINNER (5–6pm): Happy hour is the most profitable hour if executed correctly. Not deep discounts — add value instead. Complimentary amuse-bouche with a cocktail. Specific items at reduced price only during that window. Create urgency and exclusivity.\n\nSLOW WEEKDAYS: Think about who is available Tuesday at 7pm — couples, empty nesters, regulars. Build a Tuesday experience: chef's tasting, wine dinner, themed evening. These nights often become your most profitable per-cover because they're intentional.\n\nThe rule: never discount out of desperation. Create an experience instead.`},
      {title:"Private Dining & Events Revenue",content:`Private dining is the highest-margin revenue stream available to most restaurants — and most operators leave it completely on the table.\n\nHere's why it's powerful:\n• Guaranteed revenue — you know what you're making before the night starts\n• Lower labor cost — fewer decisions, more efficiency\n• Higher average spend — guests at events spend more per person\n• Marketing value — every guest who attends is a future regular\n\nBuilding your private dining program:\n1. Identify your private space — even a section of your dining room can work with the right setup\n2. Build 2–3 packages: a basic package (room + standard menu), a premium package (custom menu + full buyout), a custom package (full chef collaboration)\n3. Create a one-page proposal document with photos, pricing, minimum spend requirements, and deposit terms\n4. Designate one person (you or a manager) as the sales contact — inquiries die when no one owns them\n5. Promote: wedding websites, corporate event planners, local business associations, Instagram\n\nPricing: minimum spend of $1,500–$3,000 for a semi-private space. Full buyout: $5,000–$15,000+ depending on your concept. Require a 25–50% deposit to hold the date.`},
      {title:"Catering Revenue Stream",content:`Catering allows you to generate revenue from your existing kitchen and team with minimal additional overhead.\n\nGetting started:\n1. Build a catering menu that is a simplified version of your restaurant menu — items that travel well, are easy to scale, and require minimal on-site setup\n2. Define your service area and minimums — most restaurants start with a 10–15 mile radius and a $500 minimum order\n3. Create a catering contract that covers: deposit (50% upfront), cancellation policy, delivery fee, setup fee if applicable, and payment terms\n4. Decide: delivery only or full-service catering (with staff)? Start with delivery — lower labor cost, simpler execution\n5. Build your client list: reach out to local corporate offices, schools, real estate agencies, and event planners\n\nMarketing your catering:\n• Add a catering page to your website\n• Announce on social media\n• Leave menus at neighboring businesses\n• Ask your best regular guests if their company does catering\n\nGoal: 4–6 catering orders per month at $800 average = $3,200–$4,800 in additional monthly revenue with minimal added cost.`},
    ],
  },
  {
    id:"social-media", title:"Social Media Playbook", icon:"📱", color:C.blue,
    desc:"What to post, when to post it, and how to build an audience that fills seats.",
    items:[
      {title:"The 4 Content Pillars",content:`Every post you make should fit into one of four categories. If it doesn't, don't post it.\n\n🍽️ FOOD (40% of your content)\nThis is what people expect — and done right, it works. The key: make people hungry. Not just a photo of the dish — the sizzle, the steam, the pour, the cut. Video outperforms photos by 3:1 for food content. Reel of a steak being sliced > photo of the same steak plated.\n\nWhat to post: New menu items, specials, behind-the-scenes prep, plating process, closeups of your best dishes.\n\n👥 PEOPLE (30% of your content)\nPeople connect with people, not logos. This is the content that builds a loyal following.\n\nWhat to post: Staff spotlights, chef features, guest moments (with permission), milestone celebrations, team in action.\n\n📖 STORY (20% of your content)\nYour why. Your journey. Your community. This is what makes people feel like insiders.\n\nWhat to post: Behind-the-scenes of your operation, sourcing stories (where your ingredients come from), the history of a dish, what a day in your restaurant actually looks like.\n\n🎉 EVENTS (10% of your content)\nDirect promotional content — but make it feel exclusive, not desperate.\n\nWhat to post: Reservation announcements, special events, private dining availability, holiday menus, new menu launches.`},
      {title:"Posting Schedule & Cadence",content:`The most common social media mistake restaurants make: inconsistency.\n\nPosting 7 days one week and nothing for two weeks confuses the algorithm and your audience. Consistency beats perfection every time.\n\nRECOMMENDED CADENCE:\n• Instagram: 4–5 posts per week (2–3 Reels, 2 static posts)\n• Facebook: 3–4 posts per week (share your Instagram posts + local event promotion)\n• TikTok (if you have capacity): 1–2 short videos per week\n\nBEST TIMES TO POST:\n• Tuesday–Thursday: 11am–1pm and 7–9pm\n• Friday: 11am–12pm (people planning their weekend)\n• Sunday: 10am–12pm\n\nBATCH YOUR CONTENT: Set aside 2 hours one day per week to create all content for the week. One photo/video session can produce 5–7 pieces of content. Use a scheduling tool (Later, Buffer, or Meta Business Suite) to schedule everything at once.\n\nNEVER post just to post. If you don't have something worth sharing, share nothing. One strong post beats three weak ones every time.`},
      {title:"Review Response Playbook",content:`Your review responses are marketing. Every potential guest reads them before deciding whether to visit.\n\nGOLDEN RULES:\n• Respond to every review — positive and negative — within 24 hours\n• Never argue or get defensive in a public response\n• Keep responses genuine — not templated\n• For negative reviews: acknowledge, apologize, invite them back\n\nPOSITIVE REVIEW TEMPLATE:\n"Thank you so much, [Name]! We're thrilled you enjoyed [specific dish or experience they mentioned]. Comments like yours mean everything to our team. We look forward to seeing you again soon."\n\nNEGATIVE REVIEW TEMPLATE:\n"Thank you for sharing your experience, [Name]. I'm genuinely sorry we fell short — [specific issue] is something we take seriously and I'd like the opportunity to make it right. Please reach out to me directly at [email or phone]. I hope to have the chance to restore your faith in us."\n\nNEVER DO:\n• Get defensive or explain why they're wrong\n• Offer a free meal publicly (sends the message that complaining = free food)\n• Copy-paste the same response to every review\n• Leave negative reviews unanswered\n\nA well-handled negative review response often converts a 1-star into a return visit — and shows every other potential guest that you care.`},
      {title:"Instagram & TikTok Best Practices",content:`INSTAGRAM REELS are the highest-reach format available to restaurants right now. If you post nothing else, post Reels.\n\nWhat performs best:\n• "Day in the life" content — your team prepping, the rush, the behind-the-scenes\n• Food transformation videos — raw ingredients to finished plate\n• Staff introductions — put faces to your brand\n• "This week's special" videos with a voiceover or text overlay\n• Customer reactions (get permission)\n\nTECHNICAL TIPS:\n• Shoot vertical (9:16 ratio) — always\n• First 3 seconds determine if someone watches — lead with the most visually compelling moment\n• Use trending audio when it fits your brand\n• Add captions — most people watch without sound\n• Keep Reels under 30 seconds for best performance\n\nTIKTOK (if you're building a new audience):\nTikTok has the highest organic reach of any platform for new accounts. A first post can reach 10,000 people. The same content rules apply — authentic, behind-the-scenes, food-forward content wins.\n\nThe biggest mistake: waiting until things look perfect. Authenticity outperforms polish on both platforms consistently.`},
    ],
  },
  {
    id:"email-marketing", title:"Email Marketing", icon:"✉️", color:C.purple,
    desc:"Your email list is your most valuable marketing asset. Build it from day one.",
    items:[
      {title:"Why Email Is Your #1 Channel",content:`Social media algorithms change constantly. Your follower count can drop overnight. Your email list is something you own — no algorithm between you and your guest.\n\nA restaurant email list of 1,000 people is worth more than 10,000 Instagram followers because:\n• Email open rates for restaurants average 25–40%\n• People who opt in to your email list are your most loyal guests\n• You control exactly when and what they see\n• Email drives reservations, event sales, and catering orders directly\n\nStart building from day one. Never stop.\n\nHOW TO COLLECT EMAILS:\n• POS receipt opt-in — "Would you like to receive our weekly specials by email?"\n• Table cards with QR code linking to a sign-up form\n• Wi-Fi sign-in that captures email\n• Instagram bio link to a sign-up page\n• Private dining inquiry form that captures email\n• Reservation system — most capture email automatically\n\nOffer something in return: "Join our list for early access to our new seasonal menu."`},
      {title:"What to Send & When",content:`The biggest email marketing mistake: sending only when you want something from your guests.\n\nBuild a relationship first. Promotional emails perform best when they come from a brand people already feel connected to.\n\nMONTHLY EMAIL CALENDAR:\n\nWeek 1 — Story/Brand email: Behind the scenes. A new team member. Where your produce comes from. What inspired this season's menu. No ask.\n\nWeek 2 — Promotional email: This week's specials. New cocktail. Upcoming event. Reservation availability. One clear call-to-action.\n\nWeek 3 — Educational/Value email: A recipe (a simpler version of one of your dishes). Wine pairing tips. How to recreate a cocktail at home. Positions you as an expert without selling anything.\n\nWeek 4 — Event/Announcement email: Private dining availability. Holiday menu preview. Upcoming wine dinner. Monthly specials preview.\n\nSUBJECT LINE RULES:\n• Keep it under 40 characters\n• Be specific: "This week's new dish is our best yet" beats "Newsletter - June"\n• Create curiosity or urgency: "Last 4 tables left for Friday"\n• Never mislead — your guests will stop opening emails`},
    ],
  },
  {
    id:"tools-tracker", title:"Sales Tracking Tools", icon:"📊", color:C.orange,
    desc:"Track the numbers that drive revenue decisions.",
    items:[],
    hasTools:true,
  },
  {
    id:"templates", title:"Done-For-You Templates", icon:"📄", color:C.gold,
    desc:"Copy, customize, and use. No writing from scratch.",
    items:[
      {title:"Private Dining Proposal Template",content:`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[RESTAURANT NAME]
PRIVATE DINING & EVENTS

Bringing people together over exceptional food and service.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ABOUT US
[2–3 sentence description of your restaurant, cuisine, and atmosphere]

PRIVATE DINING OPTIONS

SEMI-PRIVATE DINING
• Capacity: up to [X] guests
• Minimum spend: $[amount]
• Space: [describe the space]
• Customizable menu available
• Dedicated server

FULL BUYOUT
• Capacity: up to [X] guests
• Minimum spend: $[amount]
• Exclusive use of the entire restaurant
• Fully custom menu with chef consultation
• Full service team

OUR PACKAGES

CLASSIC PACKAGE — $[price] per person
• Three-course dinner
• Includes first course, entrée, and dessert
• Beverage packages available

PREMIUM PACKAGE — $[price] per person
• Five-course tasting menu
• Wine pairing available
• Custom menu consultation with our chef
• Preferred table setup and décor

BEVERAGE OPTIONS
• Hosted bar (per consumption): [pricing]
• Beer & wine package: $[price] per person / 2 hours
• Full open bar: $[price] per person / 3 hours
• Non-alcoholic package: $[price] per person

BOOKING DETAILS
• A deposit of 50% is required to confirm your reservation
• Final guest count due 72 hours before the event
• Cancellations within 48 hours forfeit the deposit

CONTACT US
[Name] — [Title]
[Email] | [Phone]
[Restaurant address]

We look forward to creating an unforgettable experience for you and your guests.`},
      {title:"Catering Menu Template",content:`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[RESTAURANT NAME] CATERING

Bringing the [restaurant name] experience to you.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORDERING INFORMATION
• Minimum order: $[amount]
• Delivery radius: [X] miles
• Delivery fee: $[amount]
• 48-hour advance notice required
• 50% deposit required at booking

BREAKFAST / BRUNCH (minimum [X] guests)
[Item name] — $[price] per person
  [Brief description]
[Item name] — $[price] per person
  [Brief description]

LUNCH / DINNER (minimum [X] guests)
[Item name] — $[price] per person
  [Brief description]
[Item name] — $[price] per person
  [Brief description]

APPETIZERS / PASSED HORS D'OEUVRES
(priced per dozen)
[Item name] — $[price]/dz
[Item name] — $[price]/dz

DESSERT
[Item name] — $[price] per person
[Item name] — $[price] per person

ADD-ONS
• Serving staff: $[price]/hour per server (2 hr minimum)
• Full setup and breakdown: $[price]
• Rental coordination: available upon request

ALLERGEN NOTICE
Please inform us of any dietary restrictions or allergies at time of booking. We accommodate [list accommodations] with advance notice.

TO BOOK
[Name] | [Email] | [Phone]`},
      {title:"Weekly Social Media Calendar Template",content:`WEEK OF: _______________
GOAL: $____________ in reservations / $____________ check average
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MONDAY
Platform: Instagram Reel
Topic: [Behind the scenes — prep/kitchen]
Caption concept: [What's the story?]
CTA: [Tag a friend / Link in bio / Book now]
Who shoots it: _______________

TUESDAY
Platform: Instagram + Facebook
Topic: [This week's special / new menu item]
Caption concept: [Describe the dish — make them hungry]
CTA: [Reservation link / "Come in this week"]
Who shoots it: _______________

WEDNESDAY
Platform: TikTok / Instagram Reel
Topic: [Staff spotlight / Day in the life]
Caption concept: [Introduce a team member / tell their story]
CTA: [Follow for more / come meet them]
Who shoots it: _______________

THURSDAY
Platform: Instagram
Topic: [Throwback / Story content / Behind the brand]
Caption concept: [Why you opened / where an ingredient comes from]
CTA: [Share with someone who would love this]
Who shoots it: _______________

FRIDAY
Platform: Instagram + Facebook + Stories
Topic: [Weekend reservation push]
Caption concept: ["Spots are filling up this weekend..."]
CTA: [BOOK NOW — link in bio]
Who shoots it: _______________

CONTENT BATCH DAY: _______________
SCHEDULE IN ADVANCE BY: _______________
ENGAGEMENT CHECK (respond to all comments): Daily, 9am and 7pm`},
      {title:"Grand Opening Marketing Plan",content:`GRAND OPENING MARKETING CHECKLIST
60 Days Out Through Opening Week
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

60 DAYS OUT
☐ Create all social media accounts and begin posting "coming soon" content
☐ Announce opening date across all channels
☐ Build your email list — use a landing page with a sign-up incentive
☐ Reach out to local food bloggers and journalists — offer preview tastings
☐ Submit to local "new restaurant opening" roundups and websites
☐ Set up Google Business Profile and ensure all info is current

30 DAYS OUT
☐ Announce soft open dates to email list first (makes them feel like insiders)
☐ Begin paid social advertising targeting your zip code and demographic
☐ Send press release to local media
☐ Begin taking reservations for opening week
☐ Reach out to neighboring businesses about cross-promotion
☐ Post daily countdown content

2 WEEKS OUT
☐ Confirm all media guests for preview dinner
☐ Send "We're almost open" email to your list
☐ Post your menu and pricing on all platforms
☐ Confirm reservation system is working correctly
☐ Brief your team on how to handle media and first-time guests

OPENING WEEK
☐ Post every day — Reels, stories, behind-the-scenes
☐ Personally greet every table during service
☐ Ask happy guests to leave a Google review (not Yelp — against their TOS)
☐ Send a thank-you email to your list after the first week
☐ Document everything — photos, videos, reactions — for future content

THE GOAL OF OPENING WEEK: Create enough memorable experiences that your opening guests become regulars and ambassadors. The food and service have to be there — but so does the feeling that something special is happening here.`},
    ],
  },
];

// Sales Tracker Component
function SalesTracker() {
  const [data, setData] = useState([
    {id:1,server:"Maria G.",covers:42,checkAvg:"54.20",bev:"18.50"},
    {id:2,server:"James T.",covers:38,checkAvg:"48.80",bev:"14.20"},
    {id:3,server:"Sofia R.",covers:45,checkAvg:"61.40",bev:"22.80"},
    {id:4,server:"Derek H.",covers:31,checkAvg:"44.60",bev:"11.40"},
  ]);
  const [salesGoal, setSalesGoal] = useState("8500");
  const [actualSales, setActualSales] = useState("7240");
  const [newRow, setNewRow] = useState({server:"",covers:"",checkAvg:"",bev:""});

  const topServer = [...data].sort((a,b)=>parseFloat(b.checkAvg)-parseFloat(a.checkAvg))[0];
  const avgCheck = data.reduce((a,d)=>a+parseFloat(d.checkAvg||0),0)/data.length;
  const goalPct = salesGoal > 0 ? (parseFloat(actualSales)/parseFloat(salesGoal))*100 : 0;

  return (
    <div style={{fontFamily:"Georgia,serif"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
        <div>
          <label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:6}}>Weekly Sales Goal ($)</label>
          <input value={salesGoal} onChange={e=>setSalesGoal(e.target.value)} type="number" style={{width:"100%",boxSizing:"border-box",background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"10px 12px",color:C.white,fontSize:13,fontFamily:"Georgia,serif",outline:"none"}}/>
        </div>
        <div>
          <label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:6}}>Actual Sales ($)</label>
          <input value={actualSales} onChange={e=>setActualSales(e.target.value)} type="number" style={{width:"100%",boxSizing:"border-box",background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"10px 12px",color:C.white,fontSize:13,fontFamily:"Georgia,serif",outline:"none"}}/>
        </div>
      </div>

      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase"}}>Weekly Goal Progress</span>
          <span style={{fontSize:9,color:goalPct>=100?C.green:goalPct>=80?C.gold:C.red}}>{goalPct.toFixed(1)}%</span>
        </div>
        <Bar pct={goalPct} h={6} color={goalPct>=100?`linear-gradient(to right,${C.green},${C.green}AA)`:undefined}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:24}}>
        <ResultBox label="Avg Check" value={`$${avgCheck.toFixed(2)}`}/>
        <ResultBox label="Top Server" value={topServer?.server?.split(" ")[0]||"—"} color={C.green} sub={`$${topServer?.checkAvg} avg`}/>
        <ResultBox label="Sales vs Goal" value={`$${(parseFloat(actualSales)-parseFloat(salesGoal)).toLocaleString()}`} color={parseFloat(actualSales)>=parseFloat(salesGoal)?C.green:C.red} sub={parseFloat(actualSales)>=parseFloat(salesGoal)?"Over":"Under"}/>
      </div>

      <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:12}}>Check Average by Server</div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:8}}>
        {["Server","Covers","Avg Check","Bev/Cover",""].map((h,i)=><div key={i} style={{fontSize:8,letterSpacing:2,color:C.muted,textTransform:"uppercase"}}>{h}</div>)}
      </div>
      {[...data].sort((a,b)=>parseFloat(b.checkAvg)-parseFloat(a.checkAvg)).map((row,i)=>(
        <div key={row.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:13,color:i===0?C.gold:C.white,fontWeight:i===0?"bold":"normal"}}>{row.server}{i===0&&" 🏆"}</span>
          <span style={{fontSize:12,color:C.mutedLight}}>{row.covers}</span>
          <span style={{fontSize:13,color:parseFloat(row.checkAvg)>=avgCheck?C.green:C.mutedLight,fontWeight:"bold"}}>${parseFloat(row.checkAvg).toFixed(2)}</span>
          <span style={{fontSize:12,color:C.mutedLight}}>${parseFloat(row.bev).toFixed(2)}</span>
          <button onClick={()=>setData(p=>p.filter(x=>x.id!==row.id))} style={{background:"none",border:`1px solid ${C.red}33`,borderRadius:2,padding:"3px 7px",color:C.red,fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
        </div>
      ))}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginTop:10,alignItems:"center"}}>
        {["server","covers","checkAvg","bev"].map(k=><input key={k} value={newRow[k]} onChange={e=>setNewRow(p=>({...p,[k]:e.target.value}))} placeholder={k==="server"?"Server name":"0"} style={{background:"#0C0C0C",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"7px 8px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}/>)}
        <button onClick={()=>{if(newRow.server){setData(p=>[...p,{...newRow,id:Date.now()}]);setNewRow({server:"",covers:"",checkAvg:"",bev:""});}}} style={{background:gold,border:"none",borderRadius:2,padding:"7px 11px",color:C.black,fontSize:11,fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>+</button>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────
function Login({onLogin,onNewUser,onPricing,loading,error}) {
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const inp={width:"100%",boxSizing:"border-box",background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"12px 13px",color:C.white,fontSize:13,fontFamily:"Georgia,serif",outline:"none",marginBottom:16};
  return (
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 50% -10%,#1f1500 0%,${C.black} 55%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 16px",fontFamily:"Georgia,serif"}}>
      <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:600,height:300,background:`radial-gradient(ellipse,${C.gold}12 0%,transparent 65%)`,pointerEvents:"none"}}/>
      <div style={{textAlign:"center",marginBottom:8}}>
        <div style={{fontSize:"clamp(32px,8vw,68px)",fontWeight:"bold",letterSpacing:8,...GT,lineHeight:1}}>THE OPERATOR'S PLAYBOOK</div>
        <div style={{fontSize:10,letterSpacing:4,color:C.muted,textTransform:"uppercase",marginTop:8}}>Chef Keiona Jackson Hospitality Consulting</div>
      </div>
      <GoldLine/>
      <div style={{fontSize:9,letterSpacing:4,color:`${C.gold}AA`,textTransform:"uppercase",margin:"10px 0 28px"}}>Built by Operators. For Operators.</div>
      {DEMO_MODE&&<div style={{background:`${C.blue}14`,border:`1px solid ${C.blue}33`,borderRadius:2,padding:"9px 14px",marginBottom:14,fontSize:11,color:C.blue,maxWidth:340,textAlign:"center",lineHeight:1.6}}>🔧 Demo Mode — any email & password<br/>Try admin@playbook.com for full access</div>}
      <div style={{background:C.card,border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"28px 26px",width:"100%",maxWidth:360}}>
        <label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:7}}>Email Address</label>
        <input style={inp} type="email" placeholder="your@restaurant.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onLogin(email,pass)}/>
        <label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:7}}>Password</label>
        <input style={inp} type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onLogin(email,pass)}/>
        {error&&<div style={{fontSize:11,color:C.red,marginBottom:12}}>{error}</div>}
        <GBtn full onClick={()=>onLogin(email,pass)} disabled={loading} style={{padding:13}}>{loading?"Signing in…":"Access The Playbook"}</GBtn>
        <div style={{borderTop:`1px solid ${C.border}`,marginTop:16,paddingTop:14,display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={onNewUser} style={{background:"none",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"9px",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",width:"100%"}}>New User? Start Here →</button>
          <button onClick={onPricing} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:2,padding:"9px",color:C.muted,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",width:"100%"}}>View Plans & Pricing</button>
        </div>
      </div>
      <div style={{marginTop:18,fontSize:10,color:C.muted,textAlign:"center"}}>Don't have access? &nbsp;<span style={{color:C.gold,cursor:"pointer"}} onClick={onPricing}>See Plans →</span></div>
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────
function Onboarding({onComplete}) {
  const [step,setStep]=useState(0);
  const [role,setRole]=useState("owner");
  const [name,setName]=useState("");
  const [plan,setPlan]=useState("team");
  const steps=["Welcome","Role","Name","Plan","Ready"];
  const finish=()=>onComplete({role,name:name.trim()||"Operator",plan});
  return (
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 50% -10%,#1f1500 0%,${C.black} 55%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 16px",fontFamily:"Georgia,serif",overflowY:"auto"}}>
      <div style={{display:"flex",gap:8,marginBottom:36}}>
        {steps.map((_,i)=><div key={i} style={{width:i===step?26:8,height:8,borderRadius:4,background:i<=step?C.gold:C.border,transition:"all .3s"}}/>)}
      </div>
      <div style={{maxWidth:520,width:"100%",textAlign:"center"}}>
        {step===0&&<><div style={{fontSize:"clamp(24px,6vw,48px)",fontWeight:"bold",...GT,lineHeight:1.1,marginBottom:16}}>Welcome to<br/>The Operator's Playbook.</div><GoldLine/><p style={{fontSize:14,color:C.mutedLight,lineHeight:1.9,marginTop:16}}>Your complete restaurant operating system — training, tools, SOPs, step-by-step guides, and a full sales & marketing playbook. Everything you need. Nothing you don't.</p></>}
        {step===1&&<><div style={{fontSize:"clamp(20px,5vw,36px)",fontWeight:"bold",...GT,marginBottom:16}}>What's your role?</div><GoldLine/><div style={{display:"flex",flexDirection:"column",gap:10,marginTop:20,textAlign:"left"}}>{Object.entries(ROLES).filter(([k])=>k!=="admin").map(([k,v])=><div key={k} onClick={()=>setRole(k)} style={{padding:"14px 18px",border:`1px solid ${role===k?v.color+"88":C.border}`,borderRadius:2,background:role===k?`${v.color}0D`:C.card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}><div><div style={{fontSize:14,fontWeight:"bold",color:role===k?v.color:C.white,marginBottom:2}}>{v.label}</div><div style={{fontSize:11,color:C.muted}}>{v.badge}</div></div><div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${role===k?v.color:C.border}`,background:role===k?v.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.black}}>{role===k?"✓":""}</div></div>)}</div></>}
        {step===2&&<><div style={{fontSize:"clamp(20px,5vw,36px)",fontWeight:"bold",...GT,marginBottom:16}}>What should we call you?</div><GoldLine/><p style={{fontSize:13,color:C.mutedLight,margin:"14px 0 18px"}}>Personalize your Playbook.</p><input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setStep(3)} placeholder="Your name" style={{width:"100%",boxSizing:"border-box",background:C.card,border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"14px 16px",color:C.white,fontSize:18,fontFamily:"Georgia,serif",outline:"none",textAlign:"center",letterSpacing:2}}/></>}
        {step===3&&<><div style={{fontSize:"clamp(20px,5vw,36px)",fontWeight:"bold",...GT,marginBottom:16}}>Choose Your Plan</div><GoldLine/><div style={{display:"flex",flexDirection:"column",gap:10,marginTop:20,textAlign:"left"}}>{PLANS.map(p=><div key={p.id} onClick={()=>setPlan(p.id)} style={{padding:"14px 18px",border:`1px solid ${plan===p.id?p.color+"88":C.border}`,borderRadius:2,background:plan===p.id?`${p.color}0D`:C.card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}><div><div style={{fontSize:14,fontWeight:"bold",color:plan===p.id?p.color:C.white,marginBottom:2}}>{p.name} — ${p.price}/mo</div><div style={{fontSize:11,color:C.muted}}>{p.features[0]}</div></div><div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${plan===p.id?p.color:C.border}`,background:plan===p.id?p.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.black}}>{plan===p.id?"✓":""}</div></div>)}</div></>}
        {step===4&&<><div style={{fontSize:"clamp(20px,5vw,36px)",fontWeight:"bold",...GT,marginBottom:16}}>The Standard.</div><GoldLine/><p style={{fontSize:14,color:C.mutedLight,lineHeight:1.9,marginTop:16}}>{"The Operator's Playbook isn't a reference guide — it's a commitment.\n\nFollow every phase. Use every tool. Apply every guide.\n\nThe only reason you'll need 1-on-1 coaching is to go faster. Everything else is here.\n\nAre you ready?"}</p></>}
        <div style={{marginTop:28,display:"flex",flexDirection:"column",gap:10}}>
          <GBtn full onClick={step<steps.length-1?()=>setStep(s=>s+1):finish} style={{padding:14}}>{step===steps.length-1?"Open My Playbook →":"Continue →"}</GBtn>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{background:"none",border:"none",color:C.muted,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:2}}>← Back</button>}
        </div>
      </div>
    </div>
  );
}

// ─── PRICING ─────────────────────────────────────────────────────
function PricingPage({onSelect,currentPlan,onBack}) {
  const [billing,setBilling]=useState("monthly");
  return (
    <div style={{background:C.black,minHeight:"100vh",fontFamily:"Georgia,serif"}}>
      <header style={{background:C.card,borderBottom:`1px solid ${C.borderGold}`,padding:"0 16px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{fontSize:16,letterSpacing:6,fontWeight:"bold",...GT}}>THE OPERATOR'S PLAYBOOK</div>
        <GBtn small outline onClick={onBack}>← {currentPlan?"Dashboard":"Login"}</GBtn>
      </header>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"48px 16px 80px",textAlign:"center"}}>
        <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:12}}>✦ &nbsp; Choose Your Playbook</div>
        <h2 style={{fontSize:"clamp(26px,5vw,48px)",fontWeight:"bold",color:C.white,margin:"0 0 16px",lineHeight:1.1}}>Invest in Your<br/><span style={GT}>Restaurant's Future.</span></h2>
        <div style={{display:"inline-flex",border:`1px solid ${C.borderGold}`,borderRadius:2,overflow:"hidden",marginBottom:40}}>
          {["monthly","annual"].map(b=><button key={b} onClick={()=>setBilling(b)} style={{padding:"8px 18px",background:billing===b?gold:"transparent",border:"none",color:billing===b?C.black:C.muted,fontSize:9,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",fontWeight:"bold"}}>{b==="monthly"?"Monthly":"Annual (Save 20%)"}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginBottom:48,textAlign:"left"}}>
          {PLANS.map(plan=>{
            const price=billing==="annual"?Math.round(plan.price*.8):plan.price;
            const isCurrent=currentPlan===plan.id;
            return (
              <div key={plan.id} style={{background:plan.highlight?`linear-gradient(160deg,#0E0A00,#160E00)`:C.card,border:`1px solid ${plan.highlight?C.borderGold:C.border}`,borderRadius:2,padding:24,position:"relative"}}>
                {plan.highlight&&<div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",background:gold,padding:"3px 14px",borderRadius:"0 0 4px 4px",fontSize:8,letterSpacing:3,color:C.black,fontWeight:"bold",textTransform:"uppercase",fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>Most Popular</div>}
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${plan.color},transparent)`}}/>
                <div style={{fontSize:9,letterSpacing:3,color:plan.color,textTransform:"uppercase",marginBottom:6,marginTop:plan.highlight?10:0}}>{plan.name}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:14}}><span style={{fontSize:36,fontWeight:"bold",...GT}}>${price}</span><span style={{fontSize:11,color:C.muted}}>/ {plan.period||"mo"}</span></div>
                <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>
                  {plan.features.map((f,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:12,color:C.mutedLight}}><span style={{color:C.gold,flexShrink:0}}>✓</span>{f}</div>)}
                </div>
                {isCurrent?<div style={{padding:10,background:`${C.green}0D`,border:`1px solid ${C.green}44`,borderRadius:2,textAlign:"center",fontSize:9,letterSpacing:2,color:C.green,textTransform:"uppercase"}}>✓ Current Plan</div>
                  :<GBtn full onClick={()=>onSelect(plan.id)} outline={!plan.highlight}>{plan.id==="solo"?"Start Solo":plan.id==="team"?"Start Team":"Start Pro"}</GBtn>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────
function MainDashboard({user,plan,brand,progress,notifs,onSection,onLogout,onAdmin,onPricing,onToggleNotifs,showNotifs,onMarkAll,addNotif}) {
  const planInfo = PLANS.find(p=>p.id===plan)||PLANS[1];
  const ri = ROLES[user.role]||ROLES.owner;
  const accessible = PHASES.filter(p=>p.roles.includes(user.role));
  const totalMods = accessible.reduce((a,p)=>a+p.modules.filter(m=>m.roles.includes(user.role)).length,0);
  const done = accessible.reduce((a,p)=>a+p.modules.filter(m=>m.roles.includes(user.role)&&progress[m.id]).length,0);
  const pct = totalMods>0?Math.round((done/totalMods)*100):0;
  const earnedCerts = CERTS.filter(cert=>{
    const needed=PHASES.filter(p=>cert.phases.includes(p.id)).flatMap(p=>p.modules.filter(m=>m.roles.includes(user.role)));
    return needed.length>0&&needed.every(m=>progress[m.id]);
  });

  const APP_SECTIONS = [
    {id:"training",  label:"Training Platform", icon:"🎓", color:C.gold,   desc:"7 phases, 40+ modules, quizzes, and certifications."},
    {id:"operations",label:"Operations Center",  icon:"⚙️", color:C.blue,   desc:"Tools, SOPs, and step-by-step guides for every situation."},
    {id:"sales",     label:"Sales & Marketing",  icon:"📈", color:C.green,  desc:"Revenue strategies, social media playbook, and templates."},
    {id:"coaching",  label:"Book Coaching",       icon:"📅", color:C.purple, desc:"1-on-1 with Chef Keiona Jackson. $250/session."},
    {id:"certs",     label:"My Certificates",    icon:"🏅", color:C.orange, desc:`${earnedCerts.length} earned. Complete phases to unlock more.`},
  ];

  return (
    <div style={{fontFamily:"Georgia,serif"}}>
      <Header user={user} brand={brand} onHome={()=>{}} onLogout={onLogout} onAdmin={onAdmin} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"36px 16px 28px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:14,marginBottom:20}}>
          <div>
            <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:10}}>✦ &nbsp; Welcome back, {user.name}</div>
            <h1 style={{fontSize:"clamp(22px,5vw,44px)",fontWeight:"bold",lineHeight:1.1,margin:"0 0 10px",color:C.white}}>The Complete<br/><span style={GT}>Restaurant Playbook.</span></h1>
            <p style={{fontSize:13,color:C.mutedLight,maxWidth:440,lineHeight:1.7,margin:0}}>Training. Tools. SOPs. Guides. Sales & Marketing. Everything an operator needs — in one place.</p>
          </div>
          <div style={{background:`${planInfo.color}0D`,border:`1px solid ${planInfo.color}44`,borderRadius:2,padding:"14px 18px",textAlign:"center",flexShrink:0}}>
            <div style={{fontSize:9,letterSpacing:3,color:planInfo.color,textTransform:"uppercase",marginBottom:3}}>{planInfo.name} Plan</div>
            <div style={{fontSize:20,fontWeight:"bold",color:planInfo.color}}>${planInfo.price}<span style={{fontSize:10,color:C.muted}}>/mo</span></div>
            <button onClick={onPricing} style={{marginTop:8,background:"none",border:`1px solid ${planInfo.color}33`,borderRadius:2,padding:"4px 10px",color:planInfo.color,fontSize:8,letterSpacing:2,cursor:"pointer",fontFamily:"Georgia,serif",textTransform:"uppercase"}}>Manage</button>
          </div>
        </div>
        <div style={{maxWidth:480,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase"}}>Training Progress</span><span style={{fontSize:9,color:C.gold}}>{pct}%</span></div>
          <Bar pct={pct} h={3}/>
        </div>
        <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
          {[[String(PHASES.filter(p=>p.roles.includes(user.role)).length),"Training Phases"],[String(totalMods),"Modules"],[String(done),"Completed"],[String(earnedCerts.length),"Certificates"]].map(([n,l])=>(
            <div key={l}><div style={{fontSize:n.length>5?14:26,fontWeight:"bold",...GT,lineHeight:1}}>{n}</div><div style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase",marginTop:3}}>{l}</div></div>
          ))}
        </div>
      </div>

      <main style={{maxWidth:1100,margin:"0 auto",padding:"32px 16px 80px"}}>
        <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>Your Playbook<div style={{flex:1,height:1,background:`linear-gradient(to right,${C.gold}44,transparent)`}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:13,marginBottom:48}}>
          {APP_SECTIONS.map(sec=>(
            <div key={sec.id} onClick={()=>onSection(sec.id)}
              style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"22px 22px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=sec.color+"44";e.currentTarget.style.background=C.cardHover;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
              <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${sec.color},transparent)`}}/>
              <div style={{fontSize:28,marginBottom:12}}>{sec.icon}</div>
              <div style={{fontSize:15,fontWeight:"bold",color:C.white,marginBottom:7,fontFamily:"Georgia,serif"}}>{sec.label}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.6,fontFamily:"Georgia,serif"}}>{sec.desc}</div>
              <div style={{marginTop:14,fontSize:9,letterSpacing:2,color:sec.color,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>Open →</div>
            </div>
          ))}
        </div>
        <div style={{background:"linear-gradient(135deg,#0E0A00,#140E00)",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:28,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,background:`radial-gradient(circle,${C.gold}18,transparent 70%)`,pointerEvents:"none"}}/>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:10}}>✦ &nbsp; Still Have Questions?</div>
          <div style={{fontSize:"clamp(16px,3vw,24px)",fontWeight:"bold",color:C.white,marginBottom:10,lineHeight:1.2}}>This platform answers every question before you ask it.</div>
          <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,maxWidth:420,marginBottom:18}}>If after using every tool and guide you still need help — that's what private coaching is for. Chef Keiona Jackson, applied to your specific operation.</p>
          <GBtn small onClick={()=>onSection("coaching")}>Book a Coaching Session — $250 →</GBtn>
        </div>
      </main>
    </div>
  );
}

// ─── TRAINING SECTION ─────────────────────────────────────────────
function TrainingSection({user,brand,progress,onProgress,onBack,onLogout,notifs,onToggleNotifs,showNotifs,onMarkAll,addNotif}) {
  const [phase,setPhase]=useState(null);
  const [activeMod,setActiveMod]=useState(null);

  const handleComplete = useCallback((modId)=>{
    onProgress(modId);
    const m = PHASES.flatMap(p=>p.modules).find(x=>x.id===modId);
    if(m) addNotif(mkNotif("module",{title:m.title}));
  },[onProgress,addNotif]);

  if(activeMod) {
    const mod = PHASES.flatMap(p=>p.modules).find(m=>m.id===activeMod);
    if(!mod) return null;
    return (
      <div style={{fontFamily:"Georgia,serif"}}>
        <Header user={user} brand={brand} onBack={()=>setActiveMod(null)} backLabel="Phase" onLogout={onLogout} onHome={()=>{setActiveMod(null);setPhase(null);}} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
        <main style={{maxWidth:820,margin:"0 auto",padding:"36px 16px 80px"}}>
          <div style={{fontSize:9,letterSpacing:3,color:mod.type==="quiz"?C.purple:C.gold,textTransform:"uppercase",marginBottom:9}}>{mod.type==="quiz"?"◈ Knowledge Check":"✦ Lesson"}</div>
          <h2 style={{fontSize:"clamp(18px,4vw,32px)",fontWeight:"bold",color:C.white,margin:"0 0 20px"}}>{mod.title}</h2>
          {mod.type==="lesson"&&<LessonView mod={mod} completed={!!progress[mod.id]} onComplete={()=>handleComplete(mod.id)}/>}
          {mod.type==="quiz"&&<QuizView mod={mod} completed={!!progress[mod.id]} onComplete={()=>handleComplete(mod.id)} addNotif={addNotif}/>}
        </main>
      </div>
    );
  }

  if(phase!==null) {
    const ph = PHASES.find(p=>p.id===phase);
    const mods = ph.modules.filter(m=>m.roles.includes(user.role));
    const comp = mods.filter(m=>progress[m.id]).length;
    const pct = mods.length>0?Math.round((comp/mods.length)*100):0;
    return (
      <div style={{fontFamily:"Georgia,serif"}}>
        <Header user={user} brand={brand} onBack={()=>setPhase(null)} backLabel="Training" onLogout={onLogout} onHome={()=>setPhase(null)} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
        <main style={{maxWidth:900,margin:"0 auto",padding:"36px 16px 80px"}}>
          <div style={{borderBottom:`1px solid ${C.border}`,paddingBottom:22,marginBottom:22}}>
            <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:7}}>{ph.label}</div>
            <h2 style={{fontSize:"clamp(20px,4vw,36px)",fontWeight:"bold",color:C.white,margin:"0 0 7px"}}>{ph.title}</h2>
            <p style={{fontSize:13,color:C.mutedLight,margin:"0 0 16px"}}>{ph.desc}</p>
            <div style={{maxWidth:400}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>Phase Progress</span><span style={{fontSize:9,color:C.gold}}>{comp}/{mods.length}</span></div><Bar pct={pct} h={3}/></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {mods.map((m,i)=>(
              <div key={m.id} onClick={()=>setActiveMod(m.id)}
                style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"15px 20px",display:"flex",alignItems:"center",gap:13,cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderGold}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{width:30,height:30,borderRadius:2,background:progress[m.id]?`${C.green}18`:`${C.gold}0D`,border:`1px solid ${progress[m.id]?C.green+"44":C.borderGold}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:progress[m.id]?C.green:C.gold,flexShrink:0}}>
                  {progress[m.id]?"✓":String(i+1).padStart(2,"0")}
                </div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:"bold",color:C.white}}>{m.title}</div></div>
                <div style={{display:"flex",gap:7}}><Pill color={m.type==="quiz"?C.purple:C.gold}>{m.type==="quiz"?"Quiz":"Lesson"}</Pill><Pill color={progress[m.id]?C.green:C.muted}>{progress[m.id]?"Done":"Start →"}</Pill></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const accessible = PHASES.filter(p=>p.roles.includes(user.role));
  return (
    <div style={{fontFamily:"Georgia,serif"}}>
      <Header user={user} brand={brand} onBack={onBack} backLabel="Dashboard" onLogout={onLogout} onHome={onBack} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
      <main style={{maxWidth:1100,margin:"0 auto",padding:"36px 16px 80px"}}>
        <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:12}}>🎓 &nbsp; Training Platform</div>
        <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Your Training Phases</h2>
        <p style={{fontSize:13,color:C.mutedLight,marginBottom:32}}>Complete every phase in order. Each module builds on the last.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:13}}>
          {PHASES.map(ph=>{
            const unlocked=ph.roles.includes(user.role);
            const mods=ph.modules.filter(m=>m.roles.includes(user.role));
            const comp=mods.filter(m=>progress[m.id]).length;
            const p=mods.length>0?Math.round((comp/mods.length)*100):0;
            return (
              <div key={ph.id} onClick={()=>unlocked&&setPhase(ph.id)}
                style={{background:C.card,border:`1px solid ${(p>0)&&unlocked?C.borderGold:C.border}`,borderRadius:2,padding:20,cursor:unlocked?"pointer":"default",position:"relative",overflow:"hidden",transition:"all .2s",opacity:unlocked?1:.45}}
                onMouseEnter={e=>{if(unlocked){e.currentTarget.style.borderColor=C.borderGold;e.currentTarget.style.background=C.cardHover;}}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=(p>0&&unlocked)?C.borderGold:C.border;e.currentTarget.style.background=C.card;}}>
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${C.gold},transparent)`}}/>
                <div style={{position:"absolute",top:14,right:14,fontSize:17,color:`${C.gold}1E`}}>{ph.icon}</div>
                {!unlocked&&<div style={{position:"absolute",top:11,right:11,color:C.muted}}>🔒</div>}
                <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:5}}>{ph.label}</div>
                <div style={{fontSize:15,fontWeight:"bold",color:C.white,marginBottom:7,lineHeight:1.3,paddingRight:22}}>{ph.title}</div>
                <div style={{fontSize:11,color:C.muted,marginBottom:13,lineHeight:1.5}}>{unlocked?ph.desc:"Not available at your access level."}</div>
                {unlocked&&<><Bar pct={p}/><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>{comp}/{mods.length}</span><span style={{fontSize:9,color:p>0?C.gold:C.muted}}>{p}%</span></div></>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function LessonView({mod,completed,onComplete}) {
  const [played,setPlayed]=useState(false);
  return (
    <div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,overflow:"hidden",marginBottom:22,position:"relative",paddingTop:"56.25%"}}>
        {played?<iframe src={(mod.video||"https://www.youtube.com/embed/dQw4w9WgXcQ")+"?autoplay=1"} style={{position:"absolute",inset:0,width:"100%",height:"100%",border:"none"}} allow="autoplay;encrypted-media" allowFullScreen title={mod.title}/>
          :<div onClick={()=>setPlayed(true)} style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"linear-gradient(135deg,#0D0A00,#0A0800)",gap:10}}>
            <div style={{width:58,height:58,borderRadius:"50%",background:`${C.gold}18`,border:`1px solid ${C.borderGold}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:C.gold}}>▶</div>
            <div style={{fontSize:10,letterSpacing:3,color:C.gold,textTransform:"uppercase"}}>Play Lesson Video</div>
          </div>}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:24}}>
        <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:13}}>✦ &nbsp; Lesson Notes</div>
        {mod.content.split("\n\n").map((b,i)=><p key={i} style={{fontSize:13,color:C.white,lineHeight:1.9,margin:"0 0 15px",whiteSpace:"pre-line",fontFamily:"Georgia,serif"}}>{b}</p>)}
      </div>
      {!completed?<GBtn full onClick={onComplete} style={{marginTop:22,padding:14}}>Mark as Complete ✓</GBtn>
        :<div style={{marginTop:22,padding:13,background:`${C.green}0D`,border:`1px solid ${C.green}44`,borderRadius:2,textAlign:"center",fontSize:10,letterSpacing:3,color:C.green,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>✓ Module Completed</div>}
    </div>
  );
}

function QuizView({mod,completed,onComplete,addNotif}) {
  const [answers,setAnswers]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const [score,setScore]=useState(0);
  const submit=()=>{
    let s=0; mod.quiz.forEach((q,i)=>{if(answers[i]===q.answer)s++;});
    setScore(s); setSubmitted(true);
    if(s===mod.quiz.length){if(!completed)onComplete(); addNotif&&addNotif(mkNotif("quiz_pass",{title:mod.title,score:s,total:mod.quiz.length}));}
    else addNotif&&addNotif(mkNotif("quiz_fail",{title:mod.title,score:s,total:mod.quiz.length}));
  };
  const reset=()=>{setAnswers({});setSubmitted(false);setScore(0);};
  const allDone=Object.keys(answers).length===mod.quiz.length;
  const passed=score===mod.quiz.length;
  return (
    <div>
      {submitted&&<div style={{background:passed?`${C.green}0D`:`${C.red}0A`,border:`1px solid ${passed?C.green:C.red}44`,borderRadius:2,padding:"16px 20px",marginBottom:22,textAlign:"center",fontFamily:"Georgia,serif"}}>
        <div style={{fontSize:28,fontWeight:"bold",...(passed?GT:{color:C.red}),marginBottom:4}}>{score}/{mod.quiz.length}</div>
        <div style={{fontSize:10,letterSpacing:3,color:passed?C.green:C.red,textTransform:"uppercase"}}>{passed?"✓ Passed — Module Complete":"Review and try again"}</div>
      </div>}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {mod.quiz.map((q,qi)=>(
          <div key={qi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"18px 20px",fontFamily:"Georgia,serif"}}>
            <div style={{fontSize:9,letterSpacing:2,color:C.gold,textTransform:"uppercase",marginBottom:8}}>Question {qi+1}</div>
            <div style={{fontSize:14,color:C.white,fontWeight:"bold",marginBottom:13,lineHeight:1.5}}>{q.q}</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {q.options.map((opt,oi)=>{
                const sel=answers[qi]===oi,correct=submitted&&oi===q.answer,wrong=submitted&&sel&&oi!==q.answer;
                return <div key={oi} onClick={()=>!submitted&&setAnswers(a=>({...a,[qi]:oi}))}
                  style={{padding:"10px 14px",borderRadius:2,cursor:submitted?"default":"pointer",border:`1px solid ${correct?C.green+"88":wrong?C.red+"88":sel?C.borderGold:C.border}`,background:correct?`${C.green}0D`:wrong?`${C.red}08`:sel?C.goldGlow:"transparent",fontSize:13,color:correct?C.green:wrong?C.red:sel?C.gold:C.mutedLight,transition:"all .15s",display:"flex",alignItems:"center",gap:9}}>
                  <span style={{width:17,height:17,borderRadius:2,border:`1px solid ${correct?C.green:wrong?C.red:sel?C.gold:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0,color:correct?C.green:wrong?C.red:sel?C.gold:C.muted}}>
                    {correct?"✓":wrong?"✗":sel?"●":String.fromCharCode(65+oi)}
                  </span>{opt}
                </div>;
              })}
            </div>
          </div>
        ))}
      </div>
      {!submitted?<GBtn full onClick={submit} disabled={!allDone} style={{marginTop:20,padding:13}}>Submit Answers</GBtn>
        :!passed?<GBtn full outline onClick={reset} style={{marginTop:20,padding:13}}>Try Again</GBtn>
        :<div style={{marginTop:20,padding:13,background:`${C.green}0D`,border:`1px solid ${C.green}44`,borderRadius:2,textAlign:"center",fontSize:10,letterSpacing:3,color:C.green,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>✓ Quiz Passed</div>}
    </div>
  );
}

// ─── SALES & MARKETING SECTION ────────────────────────────────────
function SalesSection({user,brand,onBack,onLogout,notifs,onToggleNotifs,showNotifs,onMarkAll}) {
  const [activeSection,setActiveSection]=useState(null);
  const [activeItem,setActiveItem]=useState(null);

  const sec = SALES_SECTIONS.find(s=>s.id===activeSection);
  const item = sec?.items?.find((_,i)=>i===activeItem);

  if(item) return (
    <div style={{background:C.black,minHeight:"100vh",fontFamily:"Georgia,serif"}}>
      <Header user={user} brand={brand} onBack={()=>setActiveItem(null)} backLabel={sec.title} onLogout={onLogout} onHome={()=>{setActiveItem(null);setActiveSection(null);}} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
      <main style={{maxWidth:820,margin:"0 auto",padding:"36px 16px 80px"}}>
        <div style={{fontSize:9,letterSpacing:3,color:sec.color,textTransform:"uppercase",marginBottom:9}}>{sec.icon} &nbsp; {sec.title}</div>
        <h3 style={{fontSize:"clamp(18px,3vw,28px)",fontWeight:"bold",color:C.white,margin:"0 0 24px"}}>{item.title}</h3>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:26}}>
          {item.content.split("\n\n").map((b,i)=><p key={i} style={{fontSize:13,color:C.white,lineHeight:1.9,margin:"0 0 16px",whiteSpace:"pre-line",fontFamily:"Georgia,serif"}}>{b}</p>)}
        </div>
      </main>
    </div>
  );

  if(sec) return (
    <div style={{background:C.black,minHeight:"100vh",fontFamily:"Georgia,serif"}}>
      <Header user={user} brand={brand} onBack={()=>setActiveSection(null)} backLabel="Sales & Marketing" onLogout={onLogout} onHome={()=>setActiveSection(null)} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
      <main style={{maxWidth:900,margin:"0 auto",padding:"36px 16px 80px"}}>
        <div style={{fontSize:9,letterSpacing:4,color:sec.color,textTransform:"uppercase",marginBottom:10}}>{sec.icon} &nbsp; {sec.title}</div>
        <h2 style={{fontSize:"clamp(20px,4vw,36px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>{sec.title}</h2>
        <p style={{fontSize:13,color:C.mutedLight,marginBottom:28}}>{sec.desc}</p>
        {sec.hasTools&&<div style={{marginBottom:24}}><SalesTracker/></div>}
        {sec.items.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sec.items.map((item,i)=>(
              <div key={i} onClick={()=>setActiveItem(i)}
                style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"16px 20px",cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=sec.color+"44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:"bold",color:C.white,marginBottom:4,fontFamily:"Georgia,serif"}}>{item.title}</div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:"Georgia,serif"}}>{item.content.substring(0,80)}…</div>
                  </div>
                  <span style={{color:sec.color,fontSize:14,flexShrink:0}}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  return (
    <div style={{background:C.black,minHeight:"100vh",fontFamily:"Georgia,serif"}}>
      <Header user={user} brand={brand} onBack={onBack} backLabel="Dashboard" onLogout={onLogout} onHome={onBack} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
      <main style={{maxWidth:1000,margin:"0 auto",padding:"36px 16px 80px"}}>
        <div style={{fontSize:9,letterSpacing:4,color:C.green,textTransform:"uppercase",marginBottom:12}}>📈 &nbsp; Sales & Marketing</div>
        <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Fill Seats. Build Revenue.</h2>
        <p style={{fontSize:13,color:C.mutedLight,marginBottom:32}}>Proven strategies, a complete social media playbook, email marketing guide, and done-for-you templates.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:13}}>
          {SALES_SECTIONS.map(sec=>(
            <div key={sec.id} onClick={()=>setActiveSection(sec.id)}
              style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"20px 22px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=sec.color+"44";e.currentTarget.style.background=C.cardHover;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
              <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${sec.color},transparent)`}}/>
              <div style={{fontSize:28,marginBottom:10}}>{sec.icon}</div>
              <div style={{fontSize:15,fontWeight:"bold",color:C.white,marginBottom:7,fontFamily:"Georgia,serif"}}>{sec.title}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.6,fontFamily:"Georgia,serif",marginBottom:12}}>{sec.desc}</div>
              <div style={{fontSize:9,letterSpacing:2,color:sec.color,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>{sec.hasTools?"Open Tool →":sec.items.length>0?`${sec.items.length} guides →`:"Open →"}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── COACHING BOOKING ─────────────────────────────────────────────
function CoachingSection({user,brand,onBack,onLogout,notifs,onToggleNotifs,showNotifs,onMarkAll,addNotif}) {
  const generateSlots=()=>{const s=[];const days=["Mon","Tue","Wed","Thu","Fri"];const times=["9:00 AM","10:30 AM","1:00 PM","2:30 PM","4:00 PM"];let id=1;for(let w=0;w<2;w++){days.forEach(d=>{times.forEach(t=>{if(Math.random()>.4){s.push({id:String(id++),day:d,time:t,week:w===0?"This Week":"Next Week"});}})})}return s;};
  const [slots]=useState(generateSlots);
  const [selected,setSelected]=useState(null);
  const [topic,setTopic]=useState("");
  const [booked,setBooked]=useState(false);
  const [bookedSlot,setBookedSlot]=useState(null);
  const byWeek={};
  slots.forEach(s=>{if(!byWeek[s.week])byWeek[s.week]=[];byWeek[s.week].push(s);});

  const confirm=()=>{
    if(!selected)return;
    const sl=slots.find(s=>s.id===selected);
    setBookedSlot(sl); setBooked(true);
    addNotif(mkNotif("booking",{day:sl.day,time:sl.time}));
  };

  if(booked&&bookedSlot) return (
    <div style={{background:C.black,minHeight:"100vh",fontFamily:"Georgia,serif"}}>
      <div style={{maxWidth:600,margin:"0 auto",padding:"80px 20px",textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:16}}>📅</div>
        <div style={{fontSize:"clamp(22px,4vw,36px)",fontWeight:"bold",...GT,marginBottom:12}}>Session Booked.</div>
        <GoldLine/>
        <p style={{fontSize:14,color:C.mutedLight,lineHeight:1.8,margin:"20px 0 8px"}}>Your coaching session with Chef Keiona Jackson is confirmed.</p>
        <div style={{background:C.card,border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"22px 28px",margin:"24px auto",maxWidth:320}}>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:10}}>Session Details</div>
          <div style={{fontSize:22,fontWeight:"bold",color:C.white,marginBottom:4}}>{bookedSlot.day} — {bookedSlot.time}</div>
          <div style={{fontSize:12,color:C.muted}}>{bookedSlot.week}</div>
        </div>
        <GBtn onClick={onBack}>← Back to Dashboard</GBtn>
      </div>
    </div>
  );

  return (
    <div style={{background:C.black,minHeight:"100vh",fontFamily:"Georgia,serif"}}>
      <Header user={user} brand={brand} onBack={onBack} backLabel="Dashboard" onLogout={onLogout} onHome={onBack} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
      <main style={{maxWidth:800,margin:"0 auto",padding:"40px 16px 80px"}}>
        <div style={{fontSize:9,letterSpacing:4,color:C.purple,textTransform:"uppercase",marginBottom:10}}>📅 &nbsp; Private Coaching</div>
        <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Book a Session with Chef Keiona</h2>
        <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,maxWidth:480,marginBottom:28}}>1-on-1 coaching tailored to your restaurant. Implementation, troubleshooting, cost control, culture — whatever you need most right now. $250/session.</p>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"18px 22px",marginBottom:28}}>
          <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:10}}>What do you want to work on?</div>
          <textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Food cost is running 38% and I can't figure out why. Or: We're opening a second location and need a systems review..." style={{width:"100%",boxSizing:"border-box",background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"11px 13px",color:C.white,fontSize:13,fontFamily:"Georgia,serif",outline:"none",resize:"vertical",minHeight:80}}/>
        </div>
        {Object.entries(byWeek).map(([week,wSlots])=>(
          <div key={week} style={{marginBottom:28}}>
            <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>{week}<div style={{flex:1,height:1,background:`linear-gradient(to right,${C.gold}44,transparent)`}}/></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
              {wSlots.map(sl=>(
                <div key={sl.id} onClick={()=>setSelected(sl.id)} style={{padding:"13px 10px",background:selected===sl.id?`${C.gold}12`:C.card,border:`1px solid ${selected===sl.id?C.gold+"66":C.border}`,borderRadius:2,cursor:"pointer",textAlign:"center",transition:"all .2s"}}>
                  <div style={{fontSize:12,fontWeight:"bold",color:selected===sl.id?C.gold:C.white,marginBottom:3}}>{sl.day}</div>
                  <div style={{fontSize:11,color:C.muted}}>{sl.time}</div>
                  {selected===sl.id&&<div style={{fontSize:8,color:C.gold,marginTop:5,letterSpacing:2}}>SELECTED</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:22,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div><div style={{fontSize:13,color:C.mutedLight}}>Session fee: <span style={{color:C.gold,fontWeight:"bold"}}>$250</span></div>{selected&&<div style={{fontSize:11,color:C.green,marginTop:4}}>✓ {slots.find(s=>s.id===selected)?.day} at {slots.find(s=>s.id===selected)?.time}</div>}</div>
          <GBtn onClick={confirm} disabled={!selected}>Confirm Booking →</GBtn>
        </div>
      </main>
    </div>
  );
}

// ─── CERTIFICATES ─────────────────────────────────────────────────
function CertsSection({user,brand,progress,onBack,onLogout,notifs,onToggleNotifs,showNotifs,onMarkAll}) {
  const [printing,setPrinting]=useState(null);
  const earnedIds = CERTS.filter(cert=>{
    const needed=PHASES.filter(p=>cert.phases.includes(p.id)).flatMap(p=>p.modules.filter(m=>m.roles.includes(user.role)));
    return needed.length>0&&needed.every(m=>progress[m.id]);
  }).map(c=>c.id);

  if(printing) return (
    <div style={{background:"white",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:40}}>
      <div style={{width:700,border:`3px solid ${C.goldDark}`,padding:"48px 60px",textAlign:"center",position:"relative"}}>
        <div style={{position:"absolute",inset:8,border:`1px solid ${C.gold}44`,pointerEvents:"none"}}/>
        <div style={{fontSize:10,letterSpacing:6,color:C.goldDark,textTransform:"uppercase",marginBottom:12}}>{brand?.name||"The Operator's Playbook"} · Chef Keiona Jackson Hospitality Consulting</div>
        <div style={{height:1,background:`linear-gradient(to right,transparent,${C.goldDark},transparent)`,marginBottom:24}}/>
        <div style={{fontSize:13,letterSpacing:4,color:"#555",textTransform:"uppercase",marginBottom:8}}>Certificate of Completion</div>
        <div style={{fontSize:13,color:"#777",marginBottom:20}}>This certifies that</div>
        <div style={{fontSize:36,fontWeight:"bold",color:"#111",marginBottom:20,letterSpacing:2}}>{user.name}</div>
        <div style={{fontSize:13,color:"#777",marginBottom:8}}>has successfully completed all required training for</div>
        <div style={{fontSize:28,fontWeight:"bold",color:C.goldDark,marginBottom:8}}>{printing.title}</div>
        <div style={{fontSize:12,color:"#999",maxWidth:400,margin:"0 auto 28px",lineHeight:1.6}}>{CERTS.find(c=>c.id===printing.id)?.title}</div>
        <div style={{height:1,background:`linear-gradient(to right,transparent,${C.goldDark},transparent)`,marginBottom:24}}/>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <div style={{textAlign:"center"}}><div style={{borderTop:`1px solid #999`,paddingTop:8,fontSize:11,color:"#777",width:180}}>Date: {new Date().toLocaleDateString()}</div></div>
          <div style={{textAlign:"center"}}><div style={{borderTop:`1px solid #999`,paddingTop:8,fontSize:11,color:"#777",width:180}}>Chef Keiona Jackson</div></div>
        </div>
        <div style={{marginTop:24}}><button onClick={()=>window.print()} style={{background:C.goldDark,border:"none",padding:"12px 28px",color:"white",fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",borderRadius:2}}>Print Certificate</button></div>
      </div>
    </div>
  );

  return (
    <div style={{background:C.black,minHeight:"100vh",fontFamily:"Georgia,serif"}}>
      <Header user={user} brand={brand} onBack={onBack} backLabel="Dashboard" onLogout={onLogout} onHome={onBack} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
      <main style={{maxWidth:900,margin:"0 auto",padding:"36px 16px 80px"}}>
        <div style={{fontSize:9,letterSpacing:4,color:C.orange,textTransform:"uppercase",marginBottom:12}}>🏅 &nbsp; Certifications</div>
        <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Your Certificates</h2>
        <p style={{fontSize:13,color:C.mutedLight,marginBottom:32}}>Complete all required modules in a phase group to earn a certificate. Printable and shareable.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {CERTS.map(cert=>{
            const earned=earnedIds.includes(cert.id);
            const needed=PHASES.filter(p=>cert.phases.includes(p.id)).flatMap(p=>p.modules.filter(m=>m.roles.includes(user.role)));
            const done=needed.filter(m=>progress[m.id]).length;
            const pct=needed.length>0?Math.round((done/needed.length)*100):0;
            return (
              <div key={cert.id} style={{background:earned?`linear-gradient(135deg,#0E0A00,#180E00)`:C.card,border:`1px solid ${earned?cert.color+"55":C.border}`,borderRadius:2,padding:22,position:"relative",overflow:"hidden"}}>
                {earned&&<div style={{position:"absolute",top:-30,right:-30,width:100,height:100,background:`radial-gradient(circle,${cert.color}22,transparent 70%)`,pointerEvents:"none"}}/>}
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${cert.color},transparent)`}}/>
                <div style={{fontSize:28,marginBottom:8,color:cert.color}}>{cert.icon}</div>
                <div style={{fontSize:15,fontWeight:"bold",color:earned?cert.color:C.white,marginBottom:6}}>{cert.title}</div>
                {!earned&&<><Bar pct={pct} color={`linear-gradient(to right,${cert.color}88,${cert.color})`}/><div style={{fontSize:9,color:C.muted,marginTop:6}}>{done}/{needed.length} modules</div></>}
                {earned&&<div style={{marginTop:8}}><div style={{fontSize:9,letterSpacing:2,color:cert.color,textTransform:"uppercase",marginBottom:10}}>✓ Earned</div><GBtn small onClick={()=>setPrinting(cert)} style={{background:`${cert.color}0D`,border:`1px solid ${cert.color}44`,color:cert.color}}>Print Certificate →</GBtn></div>}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ─── OPERATIONS SECTION ───────────────────────────────────────────
const TOOLS_LIST = [
  {id:"food-cost",  title:"Food Cost Calculator",   icon:"🧮", color:C.gold,   desc:"Calculate plate cost, food cost %, and ideal menu price for any dish."},
  {id:"menu-price", title:"Menu Price Calculator",  icon:"💵", color:C.green,  desc:"Set menu prices based on your cost and target food cost percentage."},
  {id:"labor",      title:"Labor Cost Calculator",  icon:"👷", color:C.purple, desc:"Track every position's hours and wages against projected weekly sales."},
  {id:"break-even", title:"Break-Even Calculator",  icon:"📉", color:C.red,    desc:"Know exactly what you need to sell every day before you make a dollar."},
  {id:"pl-tracker", title:"Weekly P&L Tracker",     icon:"📊", color:C.blue,   desc:"Enter your weekly numbers and see your full P&L with prime cost analysis."},
  {id:"waste-log",  title:"Waste Log",              icon:"🗑️", color:C.orange, desc:"Track daily waste by station and reason to identify and eliminate loss."},
];

const SOPS_DATA = [
  {id:"opening-foh", title:"Opening Procedures — FOH", icon:"🌅", color:C.gold,
   sections:[
    {title:"Arrive & Secure the Floor", steps:["Arrive 45 minutes before open","Check all tables are properly set — silverware, glassware, napkins","Walk every table and chair for wobbles, damage, or dirt","Check all menus are clean and current","Ensure host stand is stocked — menus, pens, reservation book or tablet"]},
    {title:"Beverage Station Setup", steps:["Stock coffee station — filters, cups, condiments","Check all ice bins are full","Verify all beer taps are pouring clean","Check wine is properly stored and at correct temperature","Stock all servers' side stations with supplies"]},
    {title:"Technology & Systems", steps:["Power on all POS terminals and verify they're functioning","Print the reservation list and review with host team","Check that all tablets or handheld devices are charged","Verify credit card terminals are processing","Test any digital menu boards or music systems"]},
    {title:"Pre-Shift Meeting", steps:["Gather all FOH staff 15 minutes before open","Review the day's specials — taste them if possible","Cover 86'd items and any allergy alerts","Acknowledge top performer from last shift","Set the daily sales goal — share the break-even number","Assign sections, tables, and side work responsibilities"]},
    {title:"Final Walk Before Open", steps:["Manager does a full floor walk","All lights at correct levels","Music at appropriate volume","Restrooms clean, stocked, and smelling fresh","All staff in uniform and in position","Doors open on time — no exceptions"]},
  ]},
  {id:"closing-foh", title:"Closing Procedures — FOH", icon:"🌙", color:C.purple,
   sections:[
    {title:"Last Guests Out", steps:["Last table acknowledged, check dropped, payment complete","Politely encourage departure once dining is complete","No staff visibly cleaning around seated guests","Thank every departing guest personally"]},
    {title:"Floor & Furniture", steps:["All tables cleared, wiped, and reset","Chairs wiped and pushed in properly","Booths wiped down and sanitized","Host stand cleared and organized","Check under every booth and table for items left behind"]},
    {title:"POS & Cash Close", steps:["Server checkouts completed — all cash and cards accounted for","Run end-of-day sales reports and file them","Count and verify all cash drawers","Safe is locked and combination is secured","All voids and comps documented with manager signature"]},
    {title:"Facilities", steps:["All restrooms cleaned, sanitized, and stocked","Trash emptied and bags replaced","Mop entrance and high-traffic areas","Lights set to security level or off","All exterior doors locked and verified"]},
  ]},
  {id:"opening-boh", title:"Opening Procedures — BOH", icon:"🔪", color:C.orange,
   sections:[
    {title:"Arrive & Safety Check", steps:["Arrive 1 hour before service","Turn on all equipment — ovens, fryers, grill, steam table","Check all refrigeration temps — must be 41°F or below","Check freezer temps — must be 0°F or below","Inspect all equipment for damage or malfunction"]},
    {title:"Line Check", steps:["Walk every station with the chef or lead cook","Taste every sauce, soup, and prep item made yesterday","Check temps on all hot and cold holds","Verify par levels for every station","Cross-reference with today's reservation count","Sign the line check sheet — manager reviews it"]},
    {title:"Mise en Place Setup", steps:["Each station sets up to their checklist — nothing from memory","All containers labeled with item, date, and time","Prep list posted and checked off as completed","All allergen items stored separately and clearly labeled","Knives sanitized, sharpened, and at station"]},
    {title:"Deliveries & Receiving", steps:["Check all deliveries against purchase order before signing","Inspect every item — reject anything that doesn't meet spec","Immediately date and label all received items","Store by FIFO — first in, first out, always","Log any substitutions or shortages for the chef"]},
  ]},
  {id:"closing-boh", title:"Closing Procedures — BOH", icon:"🧼", color:C.blue,
   sections:[
    {title:"Line Breakdown", steps:["Cool all hot food to 70°F within 2 hours, then to 41°F within 4 more","Label, date, and cover all stored items — every single one","Drain and clean all steam table wells","Break down all cutting boards, sanitize, and air dry","Clean and sanitize all prep surfaces with approved solution"]},
    {title:"Equipment Cleaning", steps:["Clean and sanitize all grills, flat tops, and ranges","Empty and clean all fryers — filter or change oil per schedule","Clean inside of all ovens","Wipe down all reach-ins inside and out","Clean all floor mats and place them to dry upright"]},
    {title:"Floors & Drains", steps:["Floors swept and mopped with sanitizer solution","All floor drains cleaned — never leave food debris in drains","Under equipment mopped","Walk-in floors swept and mopped","Check walk-in door gaskets for damage or mold"]},
    {title:"Final Manager Walkthrough", steps:["Manager inspects every station before staff leaves","All refrigeration units confirmed closed and alarmed","Gas and equipment turned off per closing list","Back door locked and tested","Closing checklist signed and filed"]},
  ]},
  {id:"line-check", title:"Line Check Form", icon:"✅", color:C.green,
   sections:[
    {title:"Temperature Log", steps:["Walk-in cooler: ___°F (must be ≤41°F)","Walk-in freezer: ___°F (must be ≤0°F)","Reach-in #1: ___°F","Reach-in #2: ___°F","Hot hold (steam table): ___°F (must be ≥135°F)","Cold hold (prep table): ___°F (must be ≤41°F)"]},
    {title:"Product Quality Checks", steps:["All sauces tasted and approved: YES / NO","Soups tasted and approved: YES / NO","All proteins at correct temp: YES / NO","Garnishes fresh and prepped: YES / NO","Allergen items properly labeled and separated: YES / NO"]},
    {title:"Sign Off", steps:["Line Cook Sign-off: _______________ Time: ___","Chef / Lead Sign-off: _______________ Time: ___","Manager Sign-off: _______________ Time: ___","Issues noted: _______________","Corrective action taken: _______________"]},
  ]},
  {id:"pre-shift", title:"Pre-Shift Meeting Guide", icon:"📋", color:C.gold,
   sections:[
    {title:"The Structure (Every Shift)", steps:["OPEN (2 min): Acknowledge something good — a win, a shout-out from last shift","NUMBERS (2 min): Share reservation count and the daily sales goal","FOOD (3 min): Walk through specials. Describe them specifically. Make your team taste them.","86s & ALERTS (2 min): What's not available. Any allergy alerts for tonight's reservations.","FOCUS (3 min): One training topic — a service technique, an upsell strategy. One thing.","CLOSE (1 min): Fire them up. End on energy. Every single time."]},
    {title:"Common Mistakes to Avoid", steps:["Making it too long — 15 minutes maximum, no exceptions","Turning it into a complaint session","Skipping it on busy nights — that's exactly when you need it most","Letting it become routine without new content","Not following up on what you covered"]},
  ]},
  {id:"server-sidework", title:"Server Sidework Checklist", icon:"🍽️", color:C.mutedLight,
   sections:[
    {title:"Opening Side Work", steps:["Stock all salt and pepper shakers — full","Fill all condiment caddy items","Roll silverware to par","Polish water glasses at your station — no spots","Restock all napkins at service station","Check linen on all tables — replace anything stained or rumpled"]},
    {title:"During Service", steps:["Keep your section bussed — do not let dishes stack","Check water levels at every pass","Be aware of your tables' status at all times","Keep your service station clean and stocked","Never walk the floor empty-handed"]},
    {title:"Closing Side Work", steps:["Break down your section — wipe all tables and chairs","Restock all condiments, sugars, and napkins to opening par","Roll silverware to closing par for next shift","Clean and sanitize your service station completely","Sweep your section — under tables and booths","Clock out only after manager sign-off on side work"]},
  ]},
  {id:"health-inspection", title:"Health Inspection Prep Guide", icon:"🏥", color:C.red,
   sections:[
    {title:"The Inspector's Top Priorities", steps:["Temperature control — they will check every cooler, every hold, every product","Employee hygiene — hand washing stations stocked, gloves used correctly","Cross-contamination prevention — raw proteins stored below ready-to-eat foods always","Date labeling — every item in your walk-in must be dated. No exceptions.","Pest control — evidence of rodents or insects is an automatic critical violation","Employee health policy — written policy on file, employees trained"]},
    {title:"What to Have Ready at All Times", steps:["Current food handler certifications for all kitchen staff — posted or available","Written allergen policy — posted in kitchen","Most recent inspection report — posted in view of guests","Pest control service records — last 12 months","Equipment calibration records — thermometers especially"]},
    {title:"Daily Non-Negotiables", steps:["Every item in cooler labeled with item name AND date made","Walk-in organized — raw proteins on bottom, ready-to-eat on top","All sanitizer buckets mixed correctly and accessible","Hand washing sink — nothing blocking it, always stocked","All staff washing hands after handling raw protein","Cutting boards — no deep scoring, clean, sanitized between uses"]},
    {title:"If an Inspector Arrives", steps:["Greet them professionally — they are doing their job","Do not argue or get defensive","Walk with them and take notes on everything they observe","If a violation is noted, correct it immediately if possible","Sign the report — your signature means you received it, not that you agree","Correct all violations before the reinspection date"]},
  ]},
];

const GUIDES_DATA = [
  {id:"open-restaurant", title:"How to Open a Restaurant", icon:"🏗️", color:C.gold,
   desc:"The complete 90-day pre-opening playbook. Follow every step in order.",
   phases:[
    {phase:"Days 90–75: Foundation", color:C.red, steps:[
      {n:1,title:"Define Your Concept",detail:"Write one paragraph describing your restaurant: who the guest is, what the experience feels like, and what makes you different. This paragraph guides every decision for the next 90 days."},
      {n:2,title:"Validate Your Market",detail:"Visit 10 restaurants in your target area in the next 2 weeks. Take notes on pricing, service, gaps. You are looking for white space — not confirmation that your idea is good."},
      {n:3,title:"Build Your Financial Model",detail:"Before you sign a lease or spend a dollar, build a 3-year P&L projection. Include startup costs, monthly fixed costs, projected revenue at 50%, 70%, and 100% capacity."},
      {n:4,title:"Secure Your Funding",detail:"Calculate total startup costs plus 6 months of operating capital. Sources: personal savings, SBA loan, investors, or restaurant-specific lenders. Do not open undercapitalized."},
      {n:5,title:"Form Your Legal Entity",detail:"Register your business (LLC recommended). Get your EIN from the IRS. Open a dedicated business bank account. Never mix personal and business finances."},
    ]},
    {phase:"Days 75–45: Location & Build", color:C.orange, steps:[
      {n:6,title:"Define Your Location Criteria",detail:"Write down your non-negotiables: square footage range, parking requirements, hood system present, grease trap in place, target neighborhoods, maximum rent."},
      {n:7,title:"Evaluate Potential Spaces",detail:"For every space you visit, complete a Location Evaluation Checklist: foot traffic counts, visibility from street, neighboring businesses, loading access, existing infrastructure."},
      {n:8,title:"Negotiate Your Lease",detail:"Never accept the first offer. Negotiate: free rent during build-out, tenant improvement allowance, renewal options with capped rent increases. Always have an attorney review."},
      {n:9,title:"Apply for Permits & Licenses",detail:"Submit applications immediately after signing — they take time. You need: business license, food service permit, liquor license, certificate of occupancy, health department approval."},
      {n:10,title:"Hire a Restaurant-Experienced Contractor",detail:"Get at least 3 bids. Ask for references from other restaurant builds. Define a detailed scope of work before any contract is signed. Build 3 weeks of buffer into your timeline."},
    ]},
    {phase:"Days 45–0: Systems & Launch", color:C.green, steps:[
      {n:11,title:"Finalize Your Menu",detail:"Menu should be finalized 30 days before opening. Run every dish through your food cost calculator. Every item should have a standardized recipe card."},
      {n:12,title:"Set Up Your POS System",detail:"Select and configure your POS. Build your full menu into the system. Set up all revenue centers. Configure modifier groups, voids, and comp codes."},
      {n:13,title:"Build Your Training Program",detail:"Write your employee handbook. Build your training schedule for each position. Create your steps of service document. Minimum 2 weeks of structured training before opening."},
      {n:14,title:"Run Your Soft Open",detail:"Invite friends and family. Run service as if it were real. Take detailed notes on every failure. The purpose of a soft open is to break things in a safe environment."},
      {n:15,title:"Open Your Doors",detail:"Open on time. No exceptions. Be present on the floor. Greet every guest. Your job on opening day is to be the calm in the storm. Smile. You built this."},
    ]},
  ]},
  {id:"build-menu", title:"How to Build Your Menu", icon:"🍽️", color:C.purple,
   desc:"From concept to final printed menu — the complete menu development process.",
   phases:[
    {phase:"Step 1: Strategy", color:C.gold, steps:[
      {n:1,title:"Define Your Menu's Job",detail:"Your menu is a sales tool, a cost control system, and a brand statement simultaneously. Before you write a single dish, answer: What is the highest-margin category? What 3 dishes do I want every guest to order?"},
      {n:2,title:"Determine Your Menu Size",detail:"Smaller menus are almost always better. 6–8 starters, 8–12 entrees, 4–6 desserts is more than enough. A focused menu means better quality control, lower food cost, less waste."},
      {n:3,title:"Set Your Price Positioning",detail:"Research your competitors. Know the lowest and highest price points in your market. Price anchoring: put your most expensive item first to make everything else seem reasonable."},
    ]},
    {phase:"Step 2: Engineering & Recipes", color:C.blue, steps:[
      {n:4,title:"Cost Every Dish First",detail:"Use the food cost calculator for every single item. No dish gets on the menu without knowing its food cost percentage. Target: 28–32% for food, 18–22% for cocktails."},
      {n:5,title:"Classify Every Item",detail:"Stars (high profit, high popularity), Plowhorses (popular but low margin), Puzzles (high margin but underordered), Dogs (low margin, low popularity). Stars go in prime real estate. Dogs get cut."},
      {n:6,title:"Write Standardized Recipes",detail:"Every dish needs: exact ingredient quantities by weight, step-by-step preparation, plating photo, yield and portion size, cost per portion, allergen flags. No recipe card = no dish on the menu."},
    ]},
  ]},
  {id:"hire-staff", title:"How to Hire & Onboard Staff", icon:"👥", color:C.green,
   desc:"Hire slow, fire fast. Build a team that stays.",
   phases:[
    {phase:"Step 1: Before You Post", color:C.gold, steps:[
      {n:1,title:"Write a Real Job Description",detail:"Write a job description that describes your culture, your standards, and what makes your restaurant different. The right candidate should feel excited reading it."},
      {n:2,title:"Define Your Non-Negotiables",detail:"Before interviewing anyone, write down 3–5 non-negotiables for the role. Interview to these standards, not to likability."},
      {n:3,title:"Know Your Compensation",detail:"Post the wage range. Candidates who don't see compensation waste both their time and yours. Low wages attract high turnover."},
    ]},
    {phase:"Step 2: Interview & Hire", color:C.purple, steps:[
      {n:4,title:"The Phone Screen (10 min)",detail:"Before bringing anyone in, do a 10-minute phone screen. Listen for: Are they on time? Do they sound engaged? Can they articulate why they want this job?"},
      {n:5,title:"Behavioral Interview Questions",detail:"Ask 'Tell me about a time when...' not 'What would you do if...' Listen for accountability, communication, and self-awareness."},
      {n:6,title:"The Working Interview",detail:"For kitchen staff — always. For experienced FOH — highly recommended. A 2–3 hour working interview tells you more than any conversation."},
    ]},
    {phase:"Step 3: Onboarding", color:C.blue, steps:[
      {n:7,title:"Day One Sets the Tone",detail:"Have their paperwork ready. Give them a tour. Introduce them to every person they'll work with. Make them feel like they belong here."},
      {n:8,title:"Structured Training Schedule",detail:"Every new hire gets a written training schedule for their first 2 weeks. Day by day, what they're learning, who they're training with, what they need to pass."},
      {n:9,title:"30-Day Check-In",detail:"At 30 days, every new hire gets a formal check-in. How are they feeling? What's going well? What's confusing? Most employees leave in the first 90 days — this is how you find out why before they go."},
    ]},
  ]},
  {id:"weekly-inventory", title:"How to Run Weekly Inventory", icon:"📦", color:C.orange,
   desc:"Inventory is the only way to know your actual food and beverage cost. Do it weekly.",
   phases:[
    {phase:"Step 1: Set Up Your System", color:C.gold, steps:[
      {n:1,title:"Build Your Inventory Sheet",detail:"Your inventory sheet should mirror your storage areas — walk-in, dry storage, freezer, bar, prep. List every item, its unit of measure, and current cost per unit."},
      {n:2,title:"Establish Count Frequency",detail:"Weekly: all high-cost proteins, seafood, premium spirits, and produce. Bi-weekly: dry goods and canned items. Monthly: paper goods and cleaning supplies."},
      {n:3,title:"Assign Count Ownership",detail:"Chef counts BOH, Bar Manager counts bar, Manager supervises. Separate count and verification — the person who orders should not be the only person who counts."},
    ]},
    {phase:"Step 2: Count & Analyze", color:C.purple, steps:[
      {n:4,title:"Count at the Same Time Every Week",detail:"Best practice: Sunday close or Monday morning before delivery. Consistency matters — you're measuring the same window of time every week."},
      {n:5,title:"Calculate Your Actual Food Cost",detail:"Formula: (Beginning Inventory + Purchases) − Ending Inventory = COGS. Divide COGS by your sales = actual food cost %. A variance of more than 2–3% requires investigation."},
      {n:6,title:"Investigate Variances",detail:"High variance means one of three things: over-portioning, waste, or theft. Check in that order. If variance is consistent and unexplained, you have a theft problem."},
    ]},
  ]},
  {id:"read-pl", title:"How to Read Your P&L", icon:"📊", color:C.blue,
   desc:"Your P&L is your scoreboard. If you can't read it, you can't manage your business.",
   phases:[
    {phase:"Understanding the Structure", color:C.gold, steps:[
      {n:1,title:"The P&L Has Three Parts",detail:"1. Revenue (top line) — everything you sold. 2. Cost of Goods Sold — food cost + beverage cost. 3. Operating Expenses — labor, rent, utilities. What's left is your net profit or loss."},
      {n:2,title:"Understand Percentages, Not Just Dollars",detail:"A food cost of $8,000 tells you nothing without context. A food cost of 32% of sales tells you exactly where you stand. Always convert dollar amounts to percentages of sales."},
      {n:3,title:"Know Your Benchmarks",detail:"Food cost: 28–32%. Beverage cost: 18–22%. Labor: 30–35%. Prime cost: 55–65%. Rent: 6–10% of sales. Net profit: 5–15% for a healthy full-service restaurant."},
    ]},
    {phase:"Reading It Weekly", color:C.purple, steps:[
      {n:4,title:"The Weekly Review Ritual",detail:"Block 30 minutes every Monday morning. Review in this order: 1) Sales vs. prior week. 2) Food cost actual vs. theoretical. 3) Labor cost actual vs. schedule. 4) Prime cost total."},
      {n:5,title:"The Most Important Number Nobody Tracks",detail:"Your prime cost — food cost + beverage cost + labor — is the single most important number on your P&L. Under 60% is excellent. 60–65% is sustainable. Over 65% and you are working to pay other people."},
      {n:6,title:"Never Let a Bad Week Pass Without a Plan",detail:"If your P&L shows a problem, address it in writing before that week is over. What happened? What will change? Who owns the change? What will you measure next week?"},
    ]},
  ]},
  {id:"bar-program", title:"How to Set Up Your Bar Program", icon:"🍸", color:C.purple,
   desc:"A great bar program can be your highest-margin revenue center. Build it right.",
   phases:[
    {phase:"Step 1: Concept & Menu", color:C.gold, steps:[
      {n:1,title:"Define Your Bar Identity",detail:"Your bar should reflect your restaurant's concept. Define: What are 3–5 words that describe your bar? What price range? What's your signature cocktail?"},
      {n:2,title:"Build a Focused Cocktail Menu",detail:"Start with 8–12 cocktails maximum. Cost every cocktail. Target: 18–22% beverage cost. Price them confidently — guests pay for experience, not just ingredients."},
      {n:3,title:"Set Up Your Well, Call, and Premium Tiers",detail:"Train your team to suggest call and premium: 'Would you like that with Tito's or our well vodka?' That question alone moves check averages significantly."},
    ]},
    {phase:"Step 2: Systems & Training", color:C.orange, steps:[
      {n:4,title:"Standardize Every Pour",detail:"Write a recipe card for every cocktail: exact spirit amount, every modifier and amount, ice type, glassware, garnish, and estimated cost. A bartender guessing at pours is giving away margin."},
      {n:5,title:"Set Up Weekly Liquor Inventory",detail:"Count every bottle every week. Variance between what you poured (per POS) and what you used (per inventory) tells you if you have a problem. Acceptable variance: under 3%."},
      {n:6,title:"Certify Every Bartender on the Menu",detail:"Before any bartender works independently, they must make every cocktail to spec, recite the spirit list and price tiers, and pass a tasting of house cocktails."},
    ]},
  ]},
];

// Food Cost Calculator
function FoodCostTool() {
  const [ingredients, setIngredients] = useState([
    {id:1,name:"Chicken Breast",unit:"oz",qty:"6",cost:"0.45"},
    {id:2,name:"Mixed Greens",unit:"oz",qty:"3",cost:"0.18"},
    {id:3,name:"Olive Oil",unit:"oz",qty:"0.5",cost:"0.22"},
  ]);
  const [menuPrice, setMenuPrice] = useState("18.00");
  const [portions, setPortions] = useState("1");
  const [newIng, setNewIng] = useState({name:"",unit:"oz",qty:"",cost:""});
  const totalCost = ingredients.reduce((a,i)=>a+(parseFloat(i.qty)||0)*(parseFloat(i.cost)||0),0);
  const cpp = totalCost/(parseFloat(portions)||1);
  const fcPct = parseFloat(menuPrice)>0?(cpp/parseFloat(menuPrice))*100:0;
  const idealPrice = cpp/0.30;
  const profit = parseFloat(menuPrice)-cpp;
  const statusColor = fcPct<=28?C.green:fcPct<=35?C.gold:C.red;
  const statusLabel = fcPct<=28?"Excellent":fcPct<=35?"Acceptable":"Too High";
  const inp = {background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"};
  return (
    <div style={{fontFamily:"Georgia,serif"}}>
      <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,marginBottom:20}}>Enter every ingredient in a dish to calculate your food cost percentage, ideal menu price, and profit per plate.</p>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:8}}>
        {["Ingredient","Unit","Qty","$/Unit",""].map((h,i)=><div key={i} style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase"}}>{h}</div>)}
      </div>
      {ingredients.map(ing=>(
        <div key={ing.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:6,alignItems:"center"}}>
          <input value={ing.name} onChange={e=>setIngredients(p=>p.map(x=>x.id===ing.id?{...x,name:e.target.value}:x))} style={inp}/>
          <select value={ing.unit} onChange={e=>setIngredients(p=>p.map(x=>x.id===ing.id?{...x,unit:e.target.value}:x))} style={{...inp,padding:"8px"}}>
            {["oz","lb","g","kg","cup","tbsp","tsp","each"].map(u=><option key={u}>{u}</option>)}
          </select>
          <input value={ing.qty} onChange={e=>setIngredients(p=>p.map(x=>x.id===ing.id?{...x,qty:e.target.value}:x))} type="number" style={inp}/>
          <input value={ing.cost} onChange={e=>setIngredients(p=>p.map(x=>x.id===ing.id?{...x,cost:e.target.value}:x))} type="number" style={inp}/>
          <button onClick={()=>setIngredients(p=>p.filter(x=>x.id!==ing.id))} style={{background:"none",border:`1px solid ${C.red}33`,borderRadius:2,padding:"6px 10px",color:C.red,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
        </div>
      ))}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginTop:10,alignItems:"center"}}>
        <input value={newIng.name} onChange={e=>setNewIng(p=>({...p,name:e.target.value}))} placeholder="New ingredient" style={{...inp,border:`1px solid ${C.borderGold}`}}/>
        <select value={newIng.unit} onChange={e=>setNewIng(p=>({...p,unit:e.target.value}))} style={{...inp,padding:"8px"}}>{["oz","lb","g","kg","cup","tbsp","tsp","each"].map(u=><option key={u}>{u}</option>)}</select>
        <input value={newIng.qty} onChange={e=>setNewIng(p=>({...p,qty:e.target.value}))} type="number" placeholder="0" style={inp}/>
        <input value={newIng.cost} onChange={e=>setNewIng(p=>({...p,cost:e.target.value}))} type="number" placeholder="0.00" style={inp}/>
        <button onClick={()=>{if(newIng.name){setIngredients(p=>[...p,{...newIng,id:Date.now()}]);setNewIng({name:"",unit:"oz",qty:"",cost:""});}}} style={{background:gold,border:"none",borderRadius:2,padding:"8px 12px",color:C.black,fontSize:11,fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>+</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
        <div><label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:6}}>Menu Price ($)</label><input value={menuPrice} onChange={e=>setMenuPrice(e.target.value)} type="number" style={{...inp,width:"100%",boxSizing:"border-box"}}/></div>
        <div><label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:6}}>Portions from Recipe</label><input value={portions} onChange={e=>setPortions(e.target.value)} type="number" style={{...inp,width:"100%",boxSizing:"border-box"}}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,marginTop:20}}>
        {[[`$${totalCost.toFixed(2)}`,"Recipe Cost",C.gold],[`$${cpp.toFixed(2)}`,"Cost/Portion",C.gold],[`${fcPct.toFixed(1)}%`,"Food Cost %",statusColor,statusLabel],[`$${profit.toFixed(2)}`,"Profit/Plate",C.green],[`$${idealPrice.toFixed(2)}`,"Ideal Price",C.purple,"at 30% FC"]].map(([v,l,c,s])=>(
          <div key={l} style={{background:`${c}0D`,border:`1px solid ${c}33`,borderRadius:2,padding:"12px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,letterSpacing:2,color:c,textTransform:"uppercase",marginBottom:4}}>{l}</div>
            <div style={{fontSize:20,fontWeight:"bold",color:c,lineHeight:1}}>{v}</div>
            {s&&<div style={{fontSize:9,color:C.muted,marginTop:3}}>{s}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Break Even Calculator
function BreakEvenTool() {
  const [fixed, setFixed] = useState([
    {id:1,name:"Rent",amount:"8500"},{id:2,name:"Utilities",amount:"1200"},
    {id:3,name:"Insurance",amount:"800"},{id:4,name:"Loan Payment",amount:"2200"},
  ]);
  const [varPct, setVarPct] = useState("65");
  const [avgCheck, setAvgCheck] = useState("42");
  const [newFixed, setNewFixed] = useState({name:"",amount:""});
  const totalFixed = fixed.reduce((a,f)=>a+(parseFloat(f.amount)||0),0);
  const beS = totalFixed/(1-parseFloat(varPct)/100);
  const beC = beS/(parseFloat(avgCheck)||1);
  const inp = {background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"};
  return (
    <div style={{fontFamily:"Georgia,serif"}}>
      <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,marginBottom:20}}>Enter your fixed monthly costs. The calculator shows exactly how much you need to sell every day before you make a dollar of profit.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div><label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:6}}>Variable Cost % (food+labor)</label><input value={varPct} onChange={e=>setVarPct(e.target.value)} type="number" style={{...inp,width:"100%",boxSizing:"border-box"}}/></div>
        <div><label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:6}}>Average Check Per Guest ($)</label><input value={avgCheck} onChange={e=>setAvgCheck(e.target.value)} type="number" style={{...inp,width:"100%",boxSizing:"border-box"}}/></div>
      </div>
      <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:10}}>Monthly Fixed Costs</div>
      {fixed.map(f=>(
        <div key={f.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginBottom:6,alignItems:"center"}}>
          <input value={f.name} onChange={e=>setFixed(p=>p.map(x=>x.id===f.id?{...x,name:e.target.value}:x))} style={inp}/>
          <input value={f.amount} onChange={e=>setFixed(p=>p.map(x=>x.id===f.id?{...x,amount:e.target.value}:x))} type="number" style={inp}/>
          <button onClick={()=>setFixed(p=>p.filter(x=>x.id!==f.id))} style={{background:"none",border:`1px solid ${C.red}33`,borderRadius:2,padding:"6px 10px",color:C.red,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
        </div>
      ))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginTop:10,alignItems:"center"}}>
        <input value={newFixed.name} onChange={e=>setNewFixed(p=>({...p,name:e.target.value}))} placeholder="Cost name" style={{...inp,border:`1px solid ${C.borderGold}`}}/>
        <input value={newFixed.amount} onChange={e=>setNewFixed(p=>({...p,amount:e.target.value}))} type="number" placeholder="0.00" style={inp}/>
        <button onClick={()=>{if(newFixed.name&&newFixed.amount){setFixed(p=>[...p,{...newFixed,id:Date.now()}]);setNewFixed({name:"",amount:""});}}} style={{background:gold,border:"none",borderRadius:2,padding:"8px 12px",color:C.black,fontSize:11,fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>+</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginTop:24}}>
        {[[`$${totalFixed.toLocaleString()}`,"Fixed Costs/Mo",C.gold],[`$${Math.round(beS).toLocaleString()}`,"Break-Even Sales/Mo",C.red],[`$${Math.round(beS/30).toLocaleString()}`,"Break-Even/Day",C.orange],[String(Math.round(beC/30)),"Covers Needed/Day",C.purple]].map(([v,l,c])=>(
          <div key={l} style={{background:`${c}0D`,border:`1px solid ${c}33`,borderRadius:2,padding:"12px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,letterSpacing:2,color:c,textTransform:"uppercase",marginBottom:4}}>{l}</div>
            <div style={{fontSize:20,fontWeight:"bold",color:c,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,padding:"14px 18px",background:`${C.gold}0A`,border:`1px solid ${C.borderGold}`,borderRadius:2}}>
        <div style={{fontSize:11,fontWeight:"bold",color:C.gold,marginBottom:6}}>📌 Post This Number Every Shift</div>
        <div style={{fontSize:13,color:C.white,lineHeight:1.7}}>You need <strong style={{color:C.gold}}>${Math.round(beS/30).toLocaleString()}</strong> in daily sales and <strong style={{color:C.gold}}>{Math.round(beC/30)} covers</strong> every day before you make one dollar of profit.</div>
      </div>
    </div>
  );
}

// SOP Viewer
function SOPViewer({sop,onBack}) {
  const [checked,setChecked]=useState({});
  const total = sop.sections.reduce((a,s)=>a+s.steps.length,0);
  const done = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((done/total)*100);
  return (
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:20}}>← Back to SOPs</button>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:28,marginBottom:8}}>{sop.icon}</div>
        <h3 style={{fontSize:"clamp(18px,3vw,28px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>{sop.title}</h3>
        <div style={{maxWidth:300}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>Completion</span><span style={{fontSize:9,color:sop.color,fontFamily:"Georgia,serif"}}>{done}/{total}</span></div>
          <Bar pct={pct} color={`linear-gradient(to right,${sop.color}88,${sop.color})`}/>
        </div>
      </div>
      {sop.sections.map((section,si)=>(
        <div key={si} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"18px 20px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:"bold",color:sop.color,marginBottom:14,letterSpacing:1,fontFamily:"Georgia,serif",textTransform:"uppercase"}}>{String(si+1).padStart(2,"0")} — {section.title}</div>
          {section.steps.map((step,si2)=>{
            const key=`${si}-${si2}`;
            return (
              <div key={si2} onClick={()=>setChecked(p=>({...p,[key]:!p[key]}))} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"9px 0",borderBottom:si2<section.steps.length-1?`1px solid ${C.border}`:"none",cursor:"pointer"}}>
                <div style={{width:20,height:20,borderRadius:2,border:`1px solid ${checked[key]?sop.color:C.border}`,background:checked[key]?`${sop.color}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:sop.color,flexShrink:0,marginTop:1}}>{checked[key]?"✓":""}</div>
                <span style={{fontSize:13,color:checked[key]?C.muted:C.white,lineHeight:1.6,textDecoration:checked[key]?"line-through":"none",fontFamily:"Georgia,serif",transition:"all .2s"}}>{step}</span>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <GBtn small outline onClick={()=>setChecked({})}>Reset Checklist</GBtn>
        {pct===100&&<div style={{padding:"8px 16px",background:`${C.green}0D`,border:`1px solid ${C.green}44`,borderRadius:2,fontSize:9,letterSpacing:3,color:C.green,textTransform:"uppercase",fontFamily:"Georgia,serif",display:"flex",alignItems:"center"}}>✓ Complete</div>}
      </div>
    </div>
  );
}

// Guide Viewer
function GuideViewer({guide,onBack}) {
  const [openPhase,setOpenPhase]=useState(0);
  const [openStep,setOpenStep]=useState(null);
  return (
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:20}}>← Back to Guides</button>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:32,marginBottom:8}}>{guide.icon}</div>
        <h3 style={{fontSize:"clamp(18px,3vw,28px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>{guide.title}</h3>
        <p style={{fontSize:13,color:C.mutedLight,margin:"0 0 8px"}}>{guide.desc}</p>
        <div style={{fontSize:11,color:C.muted,fontFamily:"Georgia,serif"}}>{guide.phases.reduce((a,p)=>a+p.steps.length,0)} steps · Follow in order</div>
      </div>
      {guide.phases.map((phase,pi)=>(
        <div key={pi} style={{marginBottom:10}}>
          <div onClick={()=>setOpenPhase(openPhase===pi?null:pi)} style={{background:C.card,border:`1px solid ${openPhase===pi?phase.color+"55":C.border}`,borderRadius:2,padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:3,height:24,background:phase.color,borderRadius:2,flexShrink:0}}/>
              <div>
                <div style={{fontSize:11,fontWeight:"bold",color:phase.color,letterSpacing:1,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>{phase.phase}</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:"Georgia,serif"}}>{phase.steps.length} steps</div>
              </div>
            </div>
            <span style={{color:C.muted,fontSize:16}}>{openPhase===pi?"▲":"▼"}</span>
          </div>
          {openPhase===pi&&(
            <div style={{border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 2px 2px",overflow:"hidden"}}>
              {phase.steps.map((step,si)=>(
                <div key={si}>
                  <div onClick={()=>setOpenStep(openStep===`${pi}-${si}`?null:`${pi}-${si}`)} style={{padding:"14px 18px",background:openStep===`${pi}-${si}`?C.cardHover:C.card,borderBottom:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .2s"}}>
                    <div style={{width:28,height:28,borderRadius:2,background:`${phase.color}18`,border:`1px solid ${phase.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:"bold",color:phase.color,flexShrink:0,fontFamily:"Georgia,serif"}}>{step.n}</div>
                    <div style={{flex:1,fontSize:14,fontWeight:"bold",color:C.white,fontFamily:"Georgia,serif"}}>{step.title}</div>
                    <span style={{color:C.muted,fontSize:14}}>{openStep===`${pi}-${si}`?"−":"+"}</span>
                  </div>
                  {openStep===`${pi}-${si}`&&(
                    <div style={{padding:"16px 18px 16px 60px",background:`${phase.color}06`,borderBottom:`1px solid ${C.border}`}}>
                      <p style={{fontSize:13,color:C.white,lineHeight:1.8,margin:0,fontFamily:"Georgia,serif"}}>{step.detail}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function OperationsSection({user,brand,onBack,onLogout,notifs,onToggleNotifs,showNotifs,onMarkAll}) {
  const [view,setView]=useState("home"); // home | tools | sops | guides
  const [activeTool,setActiveTool]=useState(null);
  const [activeSOP,setActiveSOP]=useState(null);
  const [activeGuide,setActiveGuide]=useState(null);

  const goHome=()=>{setView("home");setActiveTool(null);setActiveSOP(null);setActiveGuide(null);};

  const SECTIONS=[
    {id:"tools",  label:"Working Tools",        icon:"🧮", color:C.gold,   desc:"6 calculators — food cost, labor, break-even, P&L, and more."},
    {id:"sops",   label:"SOP Library",          icon:"📋", color:C.purple, desc:"8 ready-to-use checklists for every shift."},
    {id:"guides", label:"Step-by-Step Guides",  icon:"📖", color:C.blue,   desc:"6 complete playbooks covering every major operational challenge."},
  ];

  return (
    <div style={{background:C.black,minHeight:"100vh",fontFamily:"Georgia,serif"}}>
      <Header user={user} brand={brand} onBack={view==="home"?onBack:goHome} backLabel={view==="home"?"Dashboard":"Operations"} onLogout={onLogout} onHome={view==="home"?onBack:goHome} notifs={notifs} onToggleNotifs={onToggleNotifs} showNotifs={showNotifs} onMarkAll={onMarkAll}/>
      <main style={{maxWidth:1000,margin:"0 auto",padding:"36px 16px 80px"}}>

        {/* HOME */}
        {view==="home"&&<>
          <div style={{fontSize:9,letterSpacing:4,color:C.blue,textTransform:"uppercase",marginBottom:12}}>⚙️ &nbsp; Operations Center</div>
          <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Tools, SOPs & Guides</h2>
          <p style={{fontSize:13,color:C.mutedLight,marginBottom:32}}>Everything you need to run a tight operation — no guesswork.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:13}}>
            {SECTIONS.map(sec=>(
              <div key={sec.id} onClick={()=>setView(sec.id)}
                style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"22px 22px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=sec.color+"44";e.currentTarget.style.background=C.cardHover;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.card;}}>
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${sec.color},transparent)`}}/>
                <div style={{fontSize:28,marginBottom:10}}>{sec.icon}</div>
                <div style={{fontSize:15,fontWeight:"bold",color:C.white,marginBottom:7}}>{sec.label}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:12}}>{sec.desc}</div>
                <div style={{fontSize:9,letterSpacing:2,color:sec.color,textTransform:"uppercase"}}>Open →</div>
              </div>
            ))}
          </div>
        </>}

        {/* TOOLS */}
        {view==="tools"&&!activeTool&&<>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:12}}>🧮 &nbsp; Working Tools</div>
          <h2 style={{fontSize:"clamp(20px,4vw,34px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Calculators</h2>
          <p style={{fontSize:13,color:C.mutedLight,marginBottom:28}}>Real tools that do the math for you.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:13}}>
            {TOOLS_LIST.map(tool=>(
              <div key={tool.id} onClick={()=>setActiveTool(tool.id)}
                style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"20px 22px",cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=tool.color+"44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${tool.color},transparent)`}}/>
                <div style={{fontSize:28,marginBottom:10}}>{tool.icon}</div>
                <div style={{fontSize:15,fontWeight:"bold",color:C.white,marginBottom:7}}>{tool.title}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:12}}>{tool.desc}</div>
                <div style={{fontSize:9,letterSpacing:2,color:tool.color,textTransform:"uppercase"}}>Open Tool →</div>
              </div>
            ))}
          </div>
        </>}

        {view==="tools"&&activeTool&&<>
          <button onClick={()=>setActiveTool(null)} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:20}}>← Back to Tools</button>
          <h2 style={{fontSize:"clamp(20px,4vw,32px)",fontWeight:"bold",color:C.white,margin:"0 0 20px"}}>{TOOLS_LIST.find(t=>t.id===activeTool)?.title}</h2>
          {activeTool==="food-cost"&&<FoodCostTool/>}
          {activeTool==="break-even"&&<BreakEvenTool/>}
          {(activeTool==="menu-price"||activeTool==="labor"||activeTool==="pl-tracker"||activeTool==="waste-log")&&(
            <div style={{padding:24,background:C.card,border:`1px solid ${C.border}`,borderRadius:2,color:C.mutedLight,fontSize:13,lineHeight:1.7}}>
              This calculator is available in the full platform. It covers: {activeTool==="menu-price"?"setting menu prices based on your cost and target food cost %":activeTool==="labor"?"tracking every position's hours and wages against projected weekly sales":activeTool==="pl-tracker"?"entering your weekly numbers to see your full P&L with prime cost analysis":"tracking daily waste by station and reason to identify and eliminate loss"}.
            </div>
          )}
        </>}

        {/* SOPS */}
        {view==="sops"&&!activeSOP&&<>
          <div style={{fontSize:9,letterSpacing:4,color:C.purple,textTransform:"uppercase",marginBottom:12}}>📋 &nbsp; SOP Library</div>
          <h2 style={{fontSize:"clamp(20px,4vw,34px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Standard Operating Procedures</h2>
          <p style={{fontSize:13,color:C.mutedLight,marginBottom:28}}>Ready-to-use checklists for every shift. Click any item to check it off.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {SOPS_DATA.map(sop=>(
              <div key={sop.id} onClick={()=>setActiveSOP(sop.id)}
                style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=sop.color+"44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{fontSize:28,flexShrink:0}}>{sop.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:"bold",color:C.white,marginBottom:4}}>{sop.title}</div>
                  <div style={{fontSize:11,color:C.muted}}>{sop.sections.length} sections · Click to open checklist</div>
                </div>
                <Pill color={sop.color}>{sop.sections.reduce((a,s)=>a+s.steps.length,0)} steps</Pill>
              </div>
            ))}
          </div>
        </>}

        {view==="sops"&&activeSOP&&<SOPViewer sop={SOPS_DATA.find(s=>s.id===activeSOP)} onBack={()=>setActiveSOP(null)}/>}

        {/* GUIDES */}
        {view==="guides"&&!activeGuide&&<>
          <div style={{fontSize:9,letterSpacing:4,color:C.blue,textTransform:"uppercase",marginBottom:12}}>📖 &nbsp; Step-by-Step Guides</div>
          <h2 style={{fontSize:"clamp(20px,4vw,34px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>The Complete Playbooks</h2>
          <p style={{fontSize:13,color:C.mutedLight,marginBottom:28}}>Follow each guide step by step. No skipping. If you do every step, you will not fail.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:13}}>
            {GUIDES_DATA.map(guide=>(
              <div key={guide.id} onClick={()=>setActiveGuide(guide.id)}
                style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"20px 22px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=guide.color+"44"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${guide.color},transparent)`}}/>
                <div style={{fontSize:28,marginBottom:10}}>{guide.icon}</div>
                <div style={{fontSize:15,fontWeight:"bold",color:C.white,marginBottom:7}}>{guide.title}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:12}}>{guide.desc}</div>
                <div style={{fontSize:9,letterSpacing:2,color:guide.color,textTransform:"uppercase"}}>{guide.phases.reduce((a,p)=>a+p.steps.length,0)} steps →</div>
              </div>
            ))}
          </div>
        </>}

        {view==="guides"&&activeGuide&&<GuideViewer guide={GUIDES_DATA.find(g=>g.id===activeGuide)} onBack={()=>setActiveGuide(null)}/>}

      </main>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState(()=>ls.get("pb_auth_v6")?"dashboard":"login");
  const [user,setUser]=useState(()=>ls.get("pb_auth_v6"));
  const [plan,setPlan]=useState(()=>ls.get("pb_auth_v6")?.plan||"team");
  const [brand,setBrand]=useState(()=>ls.get("pb_brand_v6")||{name:"THE OPERATOR'S PLAYBOOK",sub:"Chef Keiona Jackson Hospitality Consulting",accent:C.gold});
  const [section,setSection]=useState(null);
  const [progress,setProgress]=useState(()=>ls.get("pb_prog_v6")||{});
  const [notifs,setNotifs]=useState(()=>ls.get("pb_notif_v6")||[]);
  const [showNotifs,setShowNotifs]=useState(false);
  const [loginLoading,setLoginLoading]=useState(false);
  const [loginError,setLoginError]=useState("");

  const addNotif=useCallback(n=>{setNotifs(p=>{const nx=[...p,n];ls.set("pb_notif_v6",nx);return nx;});},[]);
  const markAllRead=useCallback(()=>{setNotifs(p=>{const nx=p.map(n=>({...n,read:true}));ls.set("pb_notif_v6",nx);return nx;});},[]);
  const toggleNotifs=()=>{setShowNotifs(v=>!v);if(!showNotifs)setTimeout(markAllRead,2000);};

  const handleLogin=async(email,password)=>{
    if(!email||!password){setLoginError("Please enter your email and password.");return;}
    setLoginLoading(true);setLoginError("");
    if(DEMO_MODE){
      const role=email.includes("admin")?"admin":email.includes("manager")?"manager":email.includes("staff")?"staff":"owner";
      const planId=email.includes("pro")?"pro":email.includes("solo")?"solo":"team";
      const u={email,role,name:email.split("@")[0].replace(/[._]/g," ").replace(/\b\w/g,c=>c.toUpperCase()),plan:planId};
      setUser(u);setPlan(planId);ls.set("pb_auth_v6",u);
      addNotif(mkNotif("welcome",{name:u.name,plan:PLANS.find(p=>p.id===planId)?.name||"Team"}));
      setScreen("dashboard");setLoginLoading(false);return;
    }
    setLoginLoading(false);setLoginError("Configure Supabase to enable real auth.");
  };

  const handleProgress=useCallback((modId)=>{
    const next={...progress,[modId]:true};
    setProgress(next);ls.set("pb_prog_v6",next);
  },[progress]);

  const handlePlanSelect=(planId)=>{
    const p=PLANS.find(x=>x.id===planId);
    setPlan(planId);
    if(user){const u={...user,plan:planId};setUser(u);ls.set("pb_auth_v6",u);}
    addNotif(mkNotif("upgrade",{plan:p?.name||planId}));
    setSection(null);setScreen("dashboard");
  };

  const logout=()=>{setUser(null);ls.set("pb_auth_v6",null);setSection(null);setScreen("login");};
  const goHome=()=>{setSection(null);setScreen("dashboard");};

  const shared={user,brand,onLogout:logout,notifs,onToggleNotifs:toggleNotifs,showNotifs,onMarkAll:markAllRead,addNotif};

  // Training section needs its own screen to manage sub-navigation
  if(screen==="dashboard"&&section==="training")   return <TrainingSection {...shared} progress={progress} onProgress={handleProgress} onBack={goHome}/>;
  if(screen==="dashboard"&&section==="sales")      return <SalesSection {...shared} onBack={goHome}/>;
  if(screen==="dashboard"&&section==="coaching")   return <CoachingSection {...shared} onBack={goHome}/>;
  if(screen==="dashboard"&&section==="certs")      return <CertsSection {...shared} progress={progress} onBack={goHome}/>;
  if(screen==="dashboard"&&section==="operations") return <OperationsSection {...shared} onBack={goHome}/>;

  return (
    <div style={{background:C.black,minHeight:"100vh",color:C.white}}>
      {screen==="login"&&<Login onLogin={handleLogin} onNewUser={()=>setScreen("onboarding")} onPricing={()=>setScreen("pricing")} loading={loginLoading} error={loginError}/>}
      {screen==="onboarding"&&<Onboarding onComplete={u=>{setUser(u);setPlan(u.plan||"team");ls.set("pb_auth_v6",u);addNotif(mkNotif("welcome",{name:u.name,plan:PLANS.find(p=>p.id===u.plan)?.name||"Team"}));setScreen("dashboard");}}/>}
      {screen==="pricing"&&<PricingPage onSelect={handlePlanSelect} currentPlan={plan} onBack={()=>setScreen(user?"dashboard":"login")}/>}
      {screen==="dashboard"&&user&&!section&&(
        <MainDashboard {...shared} plan={plan} progress={progress} onSection={setSection} onAdmin={user?.role==="admin"?()=>setSection("admin"):null} onPricing={()=>setScreen("pricing")}/>
      )}
    </div>
  );
}