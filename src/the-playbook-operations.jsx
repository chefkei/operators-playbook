import { useState, useCallback } from "react";

// ─── BRAND ────────────────────────────────────────────────────────
const C = {
  gold:"#C9A84C", goldLight:"#F5D78E", goldDark:"#A67C2E", goldGlow:"#C9A84C12",
  black:"#080808", card:"#0F0F0F", cardHover:"#141414",
  border:"#1C1C1C", borderGold:"#C9A84C2E",
  white:"#F0F0F0", muted:"#666", mutedLight:"#999",
  green:"#4CAF7D", red:"#E05252", purple:"#9B7FD4", blue:"#5B8CDB",
  orange:"#E0924A",
};
const gold = `linear-gradient(135deg,${C.goldDark} 0%,${C.goldLight} 50%,${C.goldDark} 100%)`;
const GT = { background:gold, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" };

// ─── UI ATOMS ─────────────────────────────────────────────────────
const GoldLine = () => (
  <div style={{display:"flex",alignItems:"center",gap:10,margin:"6px 0"}}>
    <div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${C.goldDark}88)`}}/>
    <div style={{width:4,height:4,borderRadius:"50%",background:C.gold}}/>
    <div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${C.goldDark}88)`}}/>
  </div>
);

const GBtn = ({children,onClick,outline,ghost,small,full,disabled,color,style={}}) => {
  const bg = disabled ? C.border : outline||ghost ? "transparent" : gold;
  const border = outline ? `1px solid ${color||C.borderGold}` : ghost ? `1px solid ${C.border}` : "none";
  const clr = disabled ? C.muted : outline ? (color||C.gold) : ghost ? C.muted : C.black;
  return (
    <button onClick={!disabled?onClick:undefined}
      style={{padding:small?"7px 14px":"12px 24px",background:bg,border,borderRadius:2,color:clr,
        fontSize:small?9:10,letterSpacing:small?2:3,textTransform:"uppercase",fontWeight:"bold",
        cursor:disabled?"not-allowed":"pointer",fontFamily:"Georgia,serif",transition:"all .2s",
        width:full?"100%":"auto",...style}}>
      {children}
    </button>
  );
};

const Pill = ({children,color=C.gold}) => (
  <span style={{fontSize:9,letterSpacing:2,textTransform:"uppercase",padding:"3px 9px",border:`1px solid ${color}44`,color,borderRadius:2,fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>{children}</span>
);

const Inp = ({label,value,onChange,type="text",placeholder,prefix,suffix,style={}}) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{display:"block",fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:6,fontFamily:"Georgia,serif"}}>{label}</label>}
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      {prefix && <span style={{position:"absolute",left:12,fontSize:13,color:C.muted,fontFamily:"Georgia,serif"}}>{prefix}</span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder||"0"}
        style={{width:"100%",boxSizing:"border-box",background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,
          padding:`10px ${suffix?"36px":"12px"} 10px ${prefix?"28px":"12px"}`,color:C.white,fontSize:13,
          fontFamily:"Georgia,serif",outline:"none",...style}}/>
      {suffix && <span style={{position:"absolute",right:12,fontSize:11,color:C.muted,fontFamily:"Georgia,serif"}}>{suffix}</span>}
    </div>
  </div>
);

const ResultBox = ({label,value,color=C.gold,sub}) => (
  <div style={{background:`${color}0D`,border:`1px solid ${color}33`,borderRadius:2,padding:"16px 20px",textAlign:"center"}}>
    <div style={{fontSize:9,letterSpacing:3,color,textTransform:"uppercase",marginBottom:6,fontFamily:"Georgia,serif"}}>{label}</div>
    <div style={{fontSize:28,fontWeight:"bold",color,lineHeight:1,fontFamily:"Georgia,serif"}}>{value}</div>
    {sub && <div style={{fontSize:10,color:C.muted,marginTop:4,fontFamily:"Georgia,serif"}}>{sub}</div>}
  </div>
);

const Section = ({title,icon,color=C.gold,children}) => (
  <div style={{marginBottom:32}}>
    <div style={{fontSize:9,letterSpacing:4,color,textTransform:"uppercase",marginBottom:16,display:"flex",alignItems:"center",gap:12,fontFamily:"Georgia,serif"}}>
      {icon} {title}
      <div style={{flex:1,height:1,background:`linear-gradient(to right,${color}44,transparent)`}}/>
    </div>
    {children}
  </div>
);

const Card = ({children,style={}}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"22px 24px",...style}}>
    {children}
  </div>
);

// ─── TOOLS ────────────────────────────────────────────────────────

// 1. FOOD COST CALCULATOR
function FoodCostCalculator() {
  const [ingredients, setIngredients] = useState([
    {id:1,name:"Chicken Breast",unit:"oz",qty:"6",costPerUnit:"0.45"},
    {id:2,name:"Mixed Greens",unit:"oz",qty:"3",costPerUnit:"0.18"},
    {id:3,name:"Olive Oil",unit:"oz",qty:"0.5",costPerUnit:"0.22"},
  ]);
  const [menuPrice, setMenuPrice] = useState("18.00");
  const [portions, setPortions] = useState("1");
  const [newIng, setNewIng] = useState({name:"",unit:"oz",qty:"",costPerUnit:""});

  const totalCost = ingredients.reduce((a,i) => a + (parseFloat(i.qty)||0)*(parseFloat(i.costPerUnit)||0), 0);
  const costPerPortion = totalCost / (parseFloat(portions)||1);
  const foodCostPct = menuPrice > 0 ? (costPerPortion / parseFloat(menuPrice)) * 100 : 0;
  const idealPrice = costPerPortion / 0.30;
  const profitPerPlate = parseFloat(menuPrice) - costPerPortion;

  const statusColor = foodCostPct <= 28 ? C.green : foodCostPct <= 35 ? C.gold : C.red;
  const statusLabel = foodCostPct <= 28 ? "Excellent" : foodCostPct <= 35 ? "Acceptable" : "Too High";

  const addIng = () => {
    if (!newIng.name) return;
    setIngredients(p => [...p, {...newIng, id: Date.now()}]);
    setNewIng({name:"",unit:"oz",qty:"",costPerUnit:""});
  };

  return (
    <div>
      <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,marginBottom:24}}>
        Enter every ingredient in a dish. The calculator shows your food cost percentage, ideal menu price, and profit per plate.
      </p>

      {/* Ingredients */}
      <div style={{marginBottom:20}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:8}}>
          {["Ingredient","Unit","Qty","Cost/Unit",""].map((h,i) => (
            <div key={i} style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase",fontFamily:"Georgia,serif",paddingBottom:4}}>{h}</div>
          ))}
        </div>
        {ingredients.map(ing => (
          <div key={ing.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:6,alignItems:"center"}}>
            <input value={ing.name} onChange={e=>setIngredients(p=>p.map(x=>x.id===ing.id?{...x,name:e.target.value}:x))}
              style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
            <select value={ing.unit} onChange={e=>setIngredients(p=>p.map(x=>x.id===ing.id?{...x,unit:e.target.value}:x))}
              style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}>
              {["oz","lb","g","kg","cup","tbsp","tsp","each","fl oz"].map(u=><option key={u}>{u}</option>)}
            </select>
            <input value={ing.qty} onChange={e=>setIngredients(p=>p.map(x=>x.id===ing.id?{...x,qty:e.target.value}:x))} type="number"
              style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
            <input value={ing.costPerUnit} onChange={e=>setIngredients(p=>p.map(x=>x.id===ing.id?{...x,costPerUnit:e.target.value}:x))} type="number"
              style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
            <button onClick={()=>setIngredients(p=>p.filter(x=>x.id!==ing.id))}
              style={{background:"none",border:`1px solid ${C.red}33`,borderRadius:2,padding:"6px 10px",color:C.red,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
          </div>
        ))}

        {/* Add row */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginTop:10,alignItems:"center"}}>
          <input value={newIng.name} onChange={e=>setNewIng(p=>({...p,name:e.target.value}))} placeholder="New ingredient"
            style={{background:"#0C0C0C",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
          <select value={newIng.unit} onChange={e=>setNewIng(p=>({...p,unit:e.target.value}))}
            style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}>
            {["oz","lb","g","kg","cup","tbsp","tsp","each","fl oz"].map(u=><option key={u}>{u}</option>)}
          </select>
          <input value={newIng.qty} onChange={e=>setNewIng(p=>({...p,qty:e.target.value}))} type="number" placeholder="0"
            style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
          <input value={newIng.costPerUnit} onChange={e=>setNewIng(p=>({...p,costPerUnit:e.target.value}))} type="number" placeholder="0.00"
            style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
          <button onClick={addIng} style={{background:gold,border:"none",borderRadius:2,padding:"8px 12px",color:C.black,fontSize:11,fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>+</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <Inp label="Menu Price ($)" value={menuPrice} onChange={e=>setMenuPrice(e.target.value)} type="number" prefix="$"/>
        <Inp label="Portions from Recipe" value={portions} onChange={e=>setPortions(e.target.value)} type="number"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginTop:20}}>
        <ResultBox label="Total Recipe Cost" value={`$${totalCost.toFixed(2)}`}/>
        <ResultBox label="Cost Per Portion" value={`$${costPerPortion.toFixed(2)}`}/>
        <ResultBox label="Food Cost %" value={`${foodCostPct.toFixed(1)}%`} color={statusColor} sub={statusLabel}/>
        <ResultBox label="Profit Per Plate" value={`$${profitPerPlate.toFixed(2)}`} color={C.green}/>
        <ResultBox label="Ideal Menu Price" value={`$${idealPrice.toFixed(2)}`} sub="at 30% food cost" color={C.purple}/>
      </div>

      <div style={{marginTop:16,padding:"12px 16px",background:`${C.blue}0D`,border:`1px solid ${C.blue}33`,borderRadius:2,fontSize:12,color:C.mutedLight,lineHeight:1.6,fontFamily:"Georgia,serif"}}>
        💡 <strong style={{color:C.blue}}>Rule of thumb:</strong> Food cost % under 30% = excellent. 30–35% = acceptable. Over 35% = you need to re-engineer this dish or raise the price.
      </div>
    </div>
  );
}

// 2. MENU PRICE CALCULATOR
function MenuPriceCalculator() {
  const [items, setItems] = useState([
    {id:1,name:"Grilled Salmon",cost:"8.50",target:"30",category:"Entree"},
    {id:2,name:"Caesar Salad",cost:"2.20",target:"28",category:"Starter"},
    {id:3,name:"Old Fashioned",cost:"1.80",target:"22",category:"Cocktail"},
  ]);
  const [newItem, setNewItem] = useState({name:"",cost:"",target:"30",category:"Entree"});

  const addItem = () => {
    if(!newItem.name||!newItem.cost) return;
    setItems(p=>[...p,{...newItem,id:Date.now()}]);
    setNewItem({name:"",cost:"",target:"30",category:"Entree"});
  };

  const categories = ["Starter","Entree","Dessert","Cocktail","Wine","Beer","NA Beverage"];

  return (
    <div>
      <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,marginBottom:24}}>Enter your cost per dish and target food cost percentage. The calculator shows the recommended menu price and profit margin.</p>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:8}}>
        {["Item Name","Plate Cost","Target FC%","Category",""].map((h,i)=>(
          <div key={i} style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>{h}</div>
        ))}
      </div>

      {items.map(item => {
        const menuPrice = parseFloat(item.cost) / (parseFloat(item.target)/100);
        const profit = menuPrice - parseFloat(item.cost);
        return (
          <div key={item.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"12px 14px",marginBottom:8}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,alignItems:"center",marginBottom:10}}>
              <input value={item.name} onChange={e=>setItems(p=>p.map(x=>x.id===item.id?{...x,name:e.target.value}:x))}
                style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
              <input value={item.cost} onChange={e=>setItems(p=>p.map(x=>x.id===item.id?{...x,cost:e.target.value}:x))} type="number"
                style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
              <input value={item.target} onChange={e=>setItems(p=>p.map(x=>x.id===item.id?{...x,target:e.target.value}:x))} type="number"
                style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
              <select value={item.category} onChange={e=>setItems(p=>p.map(x=>x.id===item.id?{...x,category:e.target.value}:x))}
                style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}>
                {categories.map(c=><option key={c}>{c}</option>)}
              </select>
              <button onClick={()=>setItems(p=>p.filter(x=>x.id!==item.id))}
                style={{background:"none",border:`1px solid ${C.red}33`,borderRadius:2,padding:"5px 9px",color:C.red,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <div style={{fontSize:12,color:C.mutedLight,fontFamily:"Georgia,serif"}}>Recommended price: <strong style={{color:C.gold}}>${menuPrice.toFixed(2)}</strong></div>
              <div style={{fontSize:12,color:C.mutedLight,fontFamily:"Georgia,serif"}}>Profit per cover: <strong style={{color:C.green}}>${profit.toFixed(2)}</strong></div>
              <Pill color={C.purple}>{item.category}</Pill>
            </div>
          </div>
        );
      })}

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginTop:12,alignItems:"center"}}>
        <input value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="New item name"
          style={{background:"#0C0C0C",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
        <input value={newItem.cost} onChange={e=>setNewItem(p=>({...p,cost:e.target.value}))} type="number" placeholder="0.00"
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
        <input value={newItem.target} onChange={e=>setNewItem(p=>({...p,target:e.target.value}))} type="number"
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
        <select value={newItem.category} onChange={e=>setNewItem(p=>({...p,category:e.target.value}))}
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}>
          {categories.map(c=><option key={c}>{c}</option>)}
        </select>
        <button onClick={addItem} style={{background:gold,border:"none",borderRadius:2,padding:"8px 12px",color:C.black,fontSize:11,fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>+</button>
      </div>
    </div>
  );
}

// 3. LABOR COST CALCULATOR
function LaborCostCalculator() {
  const [staff, setStaff] = useState([
    {id:1,name:"Line Cook",hours:"40",rate:"16",type:"BOH"},
    {id:2,name:"Server",hours:"30",rate:"3.50",type:"FOH"},
    {id:3,name:"Bartender",hours:"35",rate:"5.00",type:"FOH"},
    {id:4,name:"Manager",hours:"45",rate:"22",type:"MGT"},
  ]);
  const [projectedSales, setProjectedSales] = useState("12000");
  const [newStaff, setNewStaff] = useState({name:"",hours:"",rate:"",type:"FOH"});

  const totalLabor = staff.reduce((a,s) => a + (parseFloat(s.hours)||0)*(parseFloat(s.rate)||0), 0);
  const laborPct = projectedSales > 0 ? (totalLabor / parseFloat(projectedSales)) * 100 : 0;
  const statusColor = laborPct <= 30 ? C.green : laborPct <= 35 ? C.gold : C.red;
  const statusLabel = laborPct <= 30 ? "On Target" : laborPct <= 35 ? "Watch This" : "Over Budget";

  const types = ["FOH","BOH","BAR","MGT","DELIVERY"];

  const addStaff = () => {
    if(!newStaff.name) return;
    setStaff(p=>[...p,{...newStaff,id:Date.now()}]);
    setNewStaff({name:"",hours:"",rate:"",type:"FOH"});
  };

  return (
    <div>
      <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,marginBottom:24}}>Track every position's hours and wage to calculate your total labor cost against projected weekly sales.</p>

      <Inp label="Projected Weekly Sales ($)" value={projectedSales} onChange={e=>setProjectedSales(e.target.value)} type="number" prefix="$"/>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:8,marginTop:20}}>
        {["Position","Hrs/Week","Wage","Type",""].map((h,i)=>(
          <div key={i} style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>{h}</div>
        ))}
      </div>
      {staff.map(s => {
        const total = (parseFloat(s.hours)||0)*(parseFloat(s.rate)||0);
        return (
          <div key={s.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginBottom:6,alignItems:"center"}}>
            <input value={s.name} onChange={e=>setStaff(p=>p.map(x=>x.id===s.id?{...x,name:e.target.value}:x))}
              style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
            <input value={s.hours} onChange={e=>setStaff(p=>p.map(x=>x.id===s.id?{...x,hours:e.target.value}:x))} type="number"
              style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
            <input value={s.rate} onChange={e=>setStaff(p=>p.map(x=>x.id===s.id?{...x,rate:e.target.value}:x))} type="number"
              style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
            <select value={s.type} onChange={e=>setStaff(p=>p.map(x=>x.id===s.id?{...x,type:e.target.value}:x))}
              style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}>
              {types.map(t=><option key={t}>{t}</option>)}
            </select>
            <button onClick={()=>setStaff(p=>p.filter(x=>x.id!==s.id))}
              style={{background:"none",border:`1px solid ${C.red}33`,borderRadius:2,padding:"6px 10px",color:C.red,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
          </div>
        );
      })}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr auto",gap:8,marginTop:10,alignItems:"center"}}>
        <input value={newStaff.name} onChange={e=>setNewStaff(p=>({...p,name:e.target.value}))} placeholder="New position"
          style={{background:"#0C0C0C",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
        <input value={newStaff.hours} onChange={e=>setNewStaff(p=>({...p,hours:e.target.value}))} type="number" placeholder="0"
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
        <input value={newStaff.rate} onChange={e=>setNewStaff(p=>({...p,rate:e.target.value}))} type="number" placeholder="0.00"
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
        <select value={newStaff.type} onChange={e=>setNewStaff(p=>({...p,type:e.target.value}))}
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}>
          {types.map(t=><option key={t}>{t}</option>)}
        </select>
        <button onClick={addStaff} style={{background:gold,border:"none",borderRadius:2,padding:"8px 12px",color:C.black,fontSize:11,fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>+</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginTop:24}}>
        <ResultBox label="Total Weekly Labor" value={`$${totalLabor.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`}/>
        <ResultBox label="Monthly Labor Est." value={`$${(totalLabor*4.33).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`}/>
        <ResultBox label="Labor Cost %" value={`${laborPct.toFixed(1)}%`} color={statusColor} sub={statusLabel}/>
        <ResultBox label="Labor Budget Target" value={`$${(parseFloat(projectedSales)*0.30).toFixed(2)}`} sub="at 30% target" color={C.purple}/>
      </div>
    </div>
  );
}

// 4. BREAK-EVEN CALCULATOR
function BreakEvenCalculator() {
  const [fixed, setFixed] = useState([
    {id:1,name:"Rent",amount:"8500"},{id:2,name:"Utilities",amount:"1200"},
    {id:3,name:"Insurance",amount:"800"},{id:4,name:"Loan Payment",amount:"2200"},
    {id:5,name:"Software/POS",amount:"400"},
  ]);
  const [variablePct, setVariablePct] = useState("65");
  const [avgCheck, setAvgCheck] = useState("42");
  const [newFixed, setNewFixed] = useState({name:"",amount:""});

  const totalFixed = fixed.reduce((a,f)=>a+(parseFloat(f.amount)||0),0);
  const varPct = parseFloat(variablePct)/100;
  const breakEvenSales = totalFixed / (1 - varPct);
  const breakEvenCovers = breakEvenSales / (parseFloat(avgCheck)||1);
  const breakEvenPerDay = breakEvenSales / 30;
  const coversPerDay = breakEvenCovers / 30;

  const addFixed = () => {
    if(!newFixed.name||!newFixed.amount) return;
    setFixed(p=>[...p,{...newFixed,id:Date.now()}]);
    setNewFixed({name:"",amount:""});
  };

  return (
    <div>
      <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,marginBottom:24}}>
        Enter your fixed monthly costs and variable cost percentage. The calculator shows exactly how much you need to sell every month — and every day — just to break even.
      </p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
        <Inp label="Variable Cost % (food + labor + supplies)" value={variablePct} onChange={e=>setVariablePct(e.target.value)} type="number" suffix="%"/>
        <Inp label="Average Check Per Guest ($)" value={avgCheck} onChange={e=>setAvgCheck(e.target.value)} type="number" prefix="$"/>
      </div>

      <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:12,fontFamily:"Georgia,serif"}}>Monthly Fixed Costs</div>
      {fixed.map(f=>(
        <div key={f.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginBottom:6,alignItems:"center"}}>
          <input value={f.name} onChange={e=>setFixed(p=>p.map(x=>x.id===f.id?{...x,name:e.target.value}:x))}
            style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
          <input value={f.amount} onChange={e=>setFixed(p=>p.map(x=>x.id===f.id?{...x,amount:e.target.value}:x))} type="number"
            style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
          <button onClick={()=>setFixed(p=>p.filter(x=>x.id!==f.id))}
            style={{background:"none",border:`1px solid ${C.red}33`,borderRadius:2,padding:"6px 10px",color:C.red,fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
        </div>
      ))}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginTop:10,alignItems:"center"}}>
        <input value={newFixed.name} onChange={e=>setNewFixed(p=>({...p,name:e.target.value}))} placeholder="Cost name"
          style={{background:"#0C0C0C",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
        <input value={newFixed.amount} onChange={e=>setNewFixed(p=>({...p,amount:e.target.value}))} type="number" placeholder="0.00"
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"8px 10px",color:C.white,fontSize:12,fontFamily:"Georgia,serif",outline:"none"}}/>
        <button onClick={addFixed} style={{background:gold,border:"none",borderRadius:2,padding:"8px 12px",color:C.black,fontSize:11,fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>+</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginTop:24}}>
        <ResultBox label="Total Fixed Costs" value={`$${totalFixed.toLocaleString()}`}/>
        <ResultBox label="Break-Even Sales/Mo" value={`$${Math.round(breakEvenSales).toLocaleString()}`} color={C.red}/>
        <ResultBox label="Break-Even Per Day" value={`$${Math.round(breakEvenPerDay).toLocaleString()}`} color={C.orange}/>
        <ResultBox label="Covers Needed/Day" value={Math.round(coversPerDay)} sub="to break even" color={C.purple}/>
      </div>

      <div style={{marginTop:16,padding:"14px 18px",background:`${C.gold}0A`,border:`1px solid ${C.borderGold}`,borderRadius:2,fontFamily:"Georgia,serif"}}>
        <div style={{fontSize:11,fontWeight:"bold",color:C.gold,marginBottom:8}}>📌 Post This Number</div>
        <div style={{fontSize:14,color:C.white,lineHeight:1.7}}>
          You need <strong style={{color:C.gold}}>${Math.round(breakEvenPerDay).toLocaleString()}</strong> in daily sales and <strong style={{color:C.gold}}>{Math.round(coversPerDay)} covers</strong> every single day before you make one dollar of profit. Every shift, your team should know this number.
        </div>
      </div>
    </div>
  );
}

// 5. WASTE LOG
function WasteLog() {
  const [entries, setEntries] = useState([
    {id:1,date:"2025-06-01",item:"Salmon",qty:"3",unit:"portion",reason:"Over-prep",cost:"8.50",station:"BOH"},
    {id:2,date:"2025-06-01",item:"Soup",qty:"2",unit:"qt",reason:"Expired",cost:"4.20",station:"BOH"},
    {id:3,date:"2025-06-02",item:"Cocktail",qty:"1",unit:"each",reason:"Dropped",cost:"2.80",station:"BAR"},
  ]);
  const [newEntry, setNewEntry] = useState({date:new Date().toISOString().split("T")[0],item:"",qty:"",unit:"portion",reason:"Over-prep",cost:"",station:"BOH"});
  const [filter, setFilter] = useState("All");

  const totalWaste = entries.reduce((a,e)=>a+(parseFloat(e.cost)||0)*(parseFloat(e.qty)||0),0);
  const monthlyEst = totalWaste * 30;
  const reasons = ["Over-prep","Expired","Dropped","Wrong order","Quality issue","Spillage","Other"];
  const stations = ["BOH","FOH","BAR","DELIVERY"];

  const addEntry = () => {
    if(!newEntry.item||!newEntry.cost) return;
    setEntries(p=>[...p,{...newEntry,id:Date.now()}]);
    setNewEntry(p=>({...p,item:"",qty:"",cost:""}));
  };

  const filtered = filter==="All" ? entries : entries.filter(e=>e.station===filter);
  const byReason = reasons.map(r=>({reason:r,total:entries.filter(e=>e.reason===r).reduce((a,e)=>a+(parseFloat(e.cost)||0)*(parseFloat(e.qty)||0),0)})).filter(r=>r.total>0).sort((a,b)=>b.total-a.total);

  return (
    <div>
      <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,marginBottom:24}}>Track every item wasted by station and reason. Awareness alone reduces waste by 20–30% in the first week.</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <ResultBox label="Today's Waste Cost" value={`$${totalWaste.toFixed(2)}`} color={C.red}/>
        <ResultBox label="Monthly Estimate" value={`$${monthlyEst.toFixed(0)}`} color={C.orange} sub="if today is typical"/>
      </div>

      {byReason.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:10,fontFamily:"Georgia,serif"}}>Waste by Reason</div>
          {byReason.map(r=>(
            <div key={r.reason} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:12,color:C.mutedLight,fontFamily:"Georgia,serif"}}>{r.reason}</span>
              <span style={{fontSize:12,fontWeight:"bold",color:C.red,fontFamily:"Georgia,serif"}}>${r.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
        {["All",...stations].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:"5px 12px",background:filter===s?gold:"transparent",border:`1px solid ${filter===s?C.gold:C.border}`,borderRadius:2,color:filter===s?C.black:C.muted,fontSize:9,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif"}}>{s}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr auto",gap:6,marginBottom:7}}>
        {["Date","Item","Qty","Reason","$/Unit","Station",""].map((h,i)=>(
          <div key={i} style={{fontSize:8,letterSpacing:2,color:C.muted,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>{h}</div>
        ))}
      </div>
      {filtered.map(e=>(
        <div key={e.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr auto",gap:6,marginBottom:5,alignItems:"center"}}>
          <span style={{fontSize:11,color:C.mutedLight,fontFamily:"Georgia,serif"}}>{e.date}</span>
          <span style={{fontSize:12,color:C.white,fontFamily:"Georgia,serif"}}>{e.item}</span>
          <span style={{fontSize:12,color:C.mutedLight,fontFamily:"Georgia,serif"}}>{e.qty} {e.unit}</span>
          <span style={{fontSize:11,color:C.orange,fontFamily:"Georgia,serif"}}>{e.reason}</span>
          <span style={{fontSize:12,color:C.red,fontFamily:"Georgia,serif"}}>${parseFloat(e.cost).toFixed(2)}</span>
          <Pill color={e.station==="BOH"?C.purple:e.station==="BAR"?C.blue:C.green}>{e.station}</Pill>
          <button onClick={()=>setEntries(p=>p.filter(x=>x.id!==e.id))}
            style={{background:"none",border:`1px solid ${C.red}33`,borderRadius:2,padding:"4px 8px",color:C.red,fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif"}}>✕</button>
        </div>
      ))}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr auto",gap:6,marginTop:12,alignItems:"center"}}>
        <input value={newEntry.date} onChange={e=>setNewEntry(p=>({...p,date:e.target.value}))} type="date"
          style={{background:"#0C0C0C",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:"7px 8px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}/>
        <input value={newEntry.item} onChange={e=>setNewEntry(p=>({...p,item:e.target.value}))} placeholder="Item"
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px 8px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}/>
        <input value={newEntry.qty} onChange={e=>setNewEntry(p=>({...p,qty:e.target.value}))} type="number" placeholder="1"
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px 8px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}/>
        <select value={newEntry.reason} onChange={e=>setNewEntry(p=>({...p,reason:e.target.value}))}
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px",color:C.white,fontSize:10,fontFamily:"Georgia,serif",outline:"none"}}>
          {reasons.map(r=><option key={r}>{r}</option>)}
        </select>
        <input value={newEntry.cost} onChange={e=>setNewEntry(p=>({...p,cost:e.target.value}))} type="number" placeholder="0.00"
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px 8px",color:C.white,fontSize:11,fontFamily:"Georgia,serif",outline:"none"}}/>
        <select value={newEntry.station} onChange={e=>setNewEntry(p=>({...p,station:e.target.value}))}
          style={{background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"7px",color:C.white,fontSize:10,fontFamily:"Georgia,serif",outline:"none"}}>
          {stations.map(s=><option key={s}>{s}</option>)}
        </select>
        <button onClick={addEntry} style={{background:gold,border:"none",borderRadius:2,padding:"7px 11px",color:C.black,fontSize:11,fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>+</button>
      </div>
    </div>
  );
}

// 6. WEEKLY P&L TRACKER
function PLTracker() {
  const [sales, setSales] = useState({food:"28500",bev:"9200",other:"800"});
  const [costs, setCosts] = useState({food_cost:"8550",bev_cost:"2300",labor:"11200",rent:"8500",utilities:"1200",marketing:"600",supplies:"800",misc:"500"});

  const totalSales = Object.values(sales).reduce((a,v)=>a+(parseFloat(v)||0),0);
  const totalCosts = Object.values(costs).reduce((a,v)=>a+(parseFloat(v)||0),0);
  const grossProfit = totalSales - totalCosts;
  const profitPct = totalSales > 0 ? (grossProfit/totalSales)*100 : 0;
  const foodCostPct = totalSales > 0 ? (parseFloat(costs.food_cost)/parseFloat(sales.food))*100 : 0;
  const bevCostPct = totalSales > 0 ? (parseFloat(costs.bev_cost)/parseFloat(sales.bev))*100 : 0;
  const laborPct = totalSales > 0 ? (parseFloat(costs.labor)/totalSales)*100 : 0;
  const primeCost = (parseFloat(costs.food_cost)||0)+(parseFloat(costs.bev_cost)||0)+(parseFloat(costs.labor)||0);
  const primePct = totalSales > 0 ? (primeCost/totalSales)*100 : 0;

  const salesFields = [{key:"food",label:"Food Sales"},{key:"bev",label:"Beverage Sales"},{key:"other",label:"Other Income"}];
  const costFields = [
    {key:"food_cost",label:"Food Cost"},{key:"bev_cost",label:"Beverage Cost"},
    {key:"labor",label:"Labor"},{key:"rent",label:"Rent"},
    {key:"utilities",label:"Utilities"},{key:"marketing",label:"Marketing"},
    {key:"supplies",label:"Supplies"},{key:"misc",label:"Misc."},
  ];

  const Row = ({label,value,total,color}) => {
    const pct = total > 0 ? (value/total)*100 : 0;
    return (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:13,color:C.mutedLight,fontFamily:"Georgia,serif"}}>{label}</span>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <span style={{fontSize:11,color:C.muted,fontFamily:"Georgia,serif",minWidth:50,textAlign:"right"}}>{pct.toFixed(1)}%</span>
          <span style={{fontSize:13,fontWeight:"bold",color:color||C.white,fontFamily:"Georgia,serif",minWidth:80,textAlign:"right"}}>${(value||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,marginBottom:24}}>Your weekly P&L in one place. Enter actual numbers and instantly see where you stand on food cost, labor, prime cost, and net profit.</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <div style={{fontSize:9,letterSpacing:3,color:C.green,textTransform:"uppercase",marginBottom:12,fontFamily:"Georgia,serif"}}>Sales</div>
          {salesFields.map(f=>(
            <div key={f.key} style={{marginBottom:10}}>
              <label style={{display:"block",fontSize:10,color:C.muted,marginBottom:5,fontFamily:"Georgia,serif"}}>{f.label}</label>
              <input value={sales[f.key]} onChange={e=>setSales(p=>({...p,[f.key]:e.target.value}))} type="number"
                style={{width:"100%",boxSizing:"border-box",background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"9px 12px",color:C.white,fontSize:13,fontFamily:"Georgia,serif",outline:"none"}}/>
            </div>
          ))}
          <div style={{padding:"10px 14px",background:`${C.green}0D`,border:`1px solid ${C.green}33`,borderRadius:2,marginTop:8}}>
            <div style={{fontSize:9,letterSpacing:2,color:C.green,textTransform:"uppercase",fontFamily:"Georgia,serif",marginBottom:3}}>Total Sales</div>
            <div style={{fontSize:24,fontWeight:"bold",color:C.green,fontFamily:"Georgia,serif"}}>${totalSales.toLocaleString()}</div>
          </div>
        </div>
        <div>
          <div style={{fontSize:9,letterSpacing:3,color:C.red,textTransform:"uppercase",marginBottom:12,fontFamily:"Georgia,serif"}}>Costs</div>
          {costFields.map(f=>(
            <div key={f.key} style={{marginBottom:10}}>
              <label style={{display:"block",fontSize:10,color:C.muted,marginBottom:5,fontFamily:"Georgia,serif"}}>{f.label}</label>
              <input value={costs[f.key]} onChange={e=>setCosts(p=>({...p,[f.key]:e.target.value}))} type="number"
                style={{width:"100%",boxSizing:"border-box",background:"#0C0C0C",border:`1px solid ${C.border}`,borderRadius:2,padding:"9px 12px",color:C.white,fontSize:13,fontFamily:"Georgia,serif",outline:"none"}}/>
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:24,background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"20px 22px"}}>
        <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",marginBottom:14,fontFamily:"Georgia,serif"}}>P&L Summary</div>
        <Row label="Total Sales" value={totalSales} total={totalSales} color={C.green}/>
        <Row label="Food Cost" value={parseFloat(costs.food_cost)} total={totalSales} color={foodCostPct>35?C.red:C.mutedLight}/>
        <Row label="Beverage Cost" value={parseFloat(costs.bev_cost)} total={totalSales} color={bevCostPct>30?C.red:C.mutedLight}/>
        <Row label="Labor" value={parseFloat(costs.labor)} total={totalSales} color={laborPct>35?C.red:C.mutedLight}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.gold}33`}}>
          <span style={{fontSize:13,fontWeight:"bold",color:C.gold,fontFamily:"Georgia,serif"}}>Prime Cost</span>
          <div style={{display:"flex",gap:16}}>
            <span style={{fontSize:11,color:primePct>65?C.red:C.gold,fontFamily:"Georgia,serif"}}>{primePct.toFixed(1)}%</span>
            <span style={{fontSize:13,fontWeight:"bold",color:primePct>65?C.red:C.gold,fontFamily:"Georgia,serif"}}>${primeCost.toLocaleString()}</span>
          </div>
        </div>
        <Row label="Rent" value={parseFloat(costs.rent)} total={totalSales}/>
        <Row label="Other Costs" value={parseFloat(costs.utilities)+parseFloat(costs.marketing)+parseFloat(costs.supplies)+parseFloat(costs.misc)} total={totalSales}/>
        <div style={{display:"flex",justifyContent:"space-between",padding:"14px 0 0"}}>
          <span style={{fontSize:16,fontWeight:"bold",color:grossProfit>=0?C.green:C.red,fontFamily:"Georgia,serif"}}>Net {grossProfit>=0?"Profit":"Loss"}</span>
          <div style={{display:"flex",gap:16}}>
            <span style={{fontSize:13,color:grossProfit>=0?C.green:C.red,fontFamily:"Georgia,serif"}}>{profitPct.toFixed(1)}%</span>
            <span style={{fontSize:18,fontWeight:"bold",color:grossProfit>=0?C.green:C.red,fontFamily:"Georgia,serif"}}>${Math.abs(grossProfit).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SOP LIBRARY ──────────────────────────────────────────────────
const SOPS = [
  {
    id:"opening-foh", title:"Opening Procedures — FOH", icon:"🌅", color:C.gold,
    desc:"Everything front-of-house needs to do before the first guest walks in.",
    sections:[
      {title:"Arrive & Secure the Floor", steps:["Arrive 45 minutes before open","Check all tables are properly set — silverware, glassware, napkins","Walk every table and chair for wobbles, damage, or dirt","Check all menus are clean and current","Ensure host stand is stocked — menus, pens, reservation book or tablet"]},
      {title:"Beverage Station Setup", steps:["Stock coffee station — filters, cups, condiments","Check all ice bins are full","Verify all beer taps are pouring clean","Check wine is properly stored and at correct temperature","Stock all servers' side stations with supplies"]},
      {title:"Technology & Systems", steps:["Power on all POS terminals and verify they're functioning","Print the reservation list and review with host team","Check that all tablets or handheld devices are charged","Verify credit card terminals are processing","Test any digital menu boards or music systems"]},
      {title:"Pre-Shift Meeting (15 min before open)", steps:["Gather all FOH staff at a designated time","Review the day's specials — taste them if possible","Cover 86'd items and any allergy alerts","Acknowledge top performer from last shift","Set the daily sales goal — share the break-even number","Assign sections, tables, and side work responsibilities"]},
      {title:"Final Walk Before Open", steps:["Manager does a full floor walk","All lights at correct levels","Music at appropriate volume","Restrooms clean, stocked, and smelling fresh","All staff in uniform and in position","Doors open on time — no exceptions"]},
    ],
  },
  {
    id:"closing-foh", title:"Closing Procedures — FOH", icon:"🌙", color:C.purple,
    desc:"Leave the floor exactly how you'd want to find it in the morning.",
    sections:[
      {title:"Last Guests Out", steps:["Last table acknowledged, check dropped, payment complete","Politely encourage departure once dining is complete","No staff visibly cleaning around seated guests","Thank every departing guest personally"]},
      {title:"Floor & Furniture", steps:["All tables cleared, wiped, and reset","Chairs wiped and pushed in properly","Booths wiped down and sanitized","Host stand cleared and organized","Check under every booth and table for items left behind"]},
      {title:"Beverage Station Breakdown", steps:["Empty and clean all ice bins","Sanitize all bar mats and speed rails","Drain and clean all coffee equipment","Restock for next shift — count par levels","Cap and store all open wine properly"]},
      {title:"POS & Cash Close", steps:["Server checkouts completed — all cash and cards accounted for","Run end-of-day sales reports and file them","Count and verify all cash drawers","Safe is locked and combination is secured","All voids and comps are documented with manager signature"]},
      {title:"Facilities", steps:["All restrooms cleaned, sanitized, and stocked","Trash emptied and bags replaced","Mop entrance and any high-traffic areas","Lights set to security level or off","All exterior doors locked and verified"]},
    ],
  },
  {
    id:"opening-boh", title:"Opening Procedures — BOH", icon:"🔪", color:C.orange,
    desc:"Set the kitchen up to win before service starts.",
    sections:[
      {title:"Arrive & Safety Check", steps:["Arrive 1 hour before service","Turn on all equipment — ovens, fryers, grill, steam table","Check all refrigeration temps — they must be 41°F or below","Check freezer temps — they must be 0°F or below","Inspect all equipment for damage or malfunction — report immediately"]},
      {title:"Line Check (Every Single Day)", steps:["Walk every station with the chef or lead cook","Taste every sauce, soup, and prep item made yesterday","Check temps on all hot and cold holds","Verify par levels for every station","Cross-reference with today's reservation count — adjust prep accordingly","Sign the line check sheet — manager reviews it"]},
      {title:"Mise en Place Setup", steps:["Each station sets up to their checklist — nothing from memory","All containers labeled with item, date, and time","Prep list posted and checked off as completed","All allergen items stored separately and clearly labeled","Knives sanitized, sharpened, and at station"]},
      {title:"Deliveries & Receiving", steps:["Check all deliveries against purchase order before signing anything","Inspect every item — reject anything that doesn't meet spec","Immediately date and label all received items","Store by FIFO — first in, first out, always","Log any substitutions or shortages for the chef"]},
    ],
  },
  {
    id:"closing-boh", title:"Closing Procedures — BOH", icon:"🧼", color:C.blue,
    desc:"A clean kitchen is a safe kitchen. Leave nothing for tomorrow that you wouldn't want to find.",
    sections:[
      {title:"Line Breakdown", steps:["Cool all hot food to 70°F within 2 hours, then to 41°F within 4 more hours","Label, date, and cover all stored items — every single one","Drain and clean all steam table wells","Break down all cutting boards, sanitize, and air dry","Clean and sanitize all prep surfaces with approved solution"]},
      {title:"Equipment Cleaning", steps:["Clean and sanitize all grills, flat tops, and ranges","Empty and clean all fryers — filter or change oil per schedule","Clean inside of all ovens — document if deep clean is due","Wipe down all reach-ins inside and out","Clean all floor mats and place them to dry upright"]},
      {title:"Dishes & Smallwares", steps:["All dishes run through the machine — none left in sinks","All pots and pans clean and stored in their designated place","Knife roll cleaned and stored properly","All smallwares inventoried and in place","Dish pit wiped down and sanitized"]},
      {title:"Floors & Drains", steps:["Floors swept and mopped with sanitizer solution","All floor drains cleaned — never leave food debris in drains","Under equipment mopped — this is where health inspectors look","Walk-in floors swept and mopped","Check walk-in door gaskets for damage or mold"]},
      {title:"Final Manager Walkthrough", steps:["Manager inspects every station before staff leaves","All refrigeration units confirmed closed and alarmed","Gas and equipment turned off per closing list","Back door locked and tested","Closing checklist signed and filed"]},
    ],
  },
  {
    id:"line-check", title:"Line Check Form", icon:"✅", color:C.green,
    desc:"Non-negotiable. Every shift. Signed by a manager.",
    sections:[
      {title:"Temperature Log", steps:["Walk-in cooler: ___°F (must be ≤41°F)","Walk-in freezer: ___°F (must be ≤0°F)","Reach-in #1: ___°F","Reach-in #2: ___°F","Hot hold (steam table): ___°F (must be ≥135°F)","Cold hold (prep table): ___°F (must be ≤41°F)"]},
      {title:"Product Quality Checks", steps:["All sauces tasted and approved: YES / NO","Soups tasted and approved: YES / NO","All proteins at correct temp: YES / NO","Garnishes fresh and prepped: YES / NO","Bread / starches ready: YES / NO","Allergen items properly labeled and separated: YES / NO"]},
      {title:"Par Level Check", steps:["Station 1 (Sauté): All pars met: YES / NO — Notes: ___","Station 2 (Grill): All pars met: YES / NO — Notes: ___","Station 3 (Fry): All pars met: YES / NO — Notes: ___","Station 4 (Cold/Pantry): All pars met: YES / NO — Notes: ___","Bar: All pars met: YES / NO — Notes: ___"]},
      {title:"Sign Off", steps:["Line Cook Sign-off: _______________ Time: ___","Chef / Lead Sign-off: _______________ Time: ___","Manager Sign-off: _______________ Time: ___","Issues noted: _______________","Corrective action taken: _______________"]},
    ],
  },
  {
    id:"pre-shift", title:"Pre-Shift Meeting Guide", icon:"📋", color:C.gold,
    desc:"15 minutes that set the tone for the entire shift. Never skip it.",
    sections:[
      {title:"Why Pre-Shift Matters", steps:["Your team is walking in from different places, different mindsets, and different days","Pre-shift aligns everyone before the first guest sits down","Studies show restaurants with consistent pre-shifts have higher check averages and lower turnover","It takes 15 minutes. It saves hours of problems during service"]},
      {title:"The Structure (Every Shift)", steps:["OPEN (2 min): Acknowledge something good — a shout-out from last shift, a win, a milestone","NUMBERS (2 min): Tell your team what they need to sell today. Share the reservation count. Share the break-even number.","FOOD (3 min): Walk through specials. Describe them specifically. Make your team taste them if you can.","86s & ALERTS (2 min): What's not available. Any allergy alerts for tonight's reservations.","FOCUS (3 min): One training topic — a service technique, a wine pairing, an upsell strategy. One thing. Do it consistently.","CLOSE (1 min): Fire them up. End on energy. Every single time."]},
      {title:"Common Mistakes to Avoid", steps:["Making it too long — 15 minutes maximum, no exceptions","Turning it into a complaint session — pre-shift is not the place","Skipping it on busy nights — that's exactly when you need it most","Letting it become routine without new content — rotate topics","Not following up on what you covered — accountability matters"]},
    ],
  },
  {
    id:"server-sidework", title:"Server Sidework Checklist", icon:"🍽️", color:C.mutedLight,
    desc:"Side work is not optional. It's part of the job. Every server, every shift.",
    sections:[
      {title:"Opening Side Work", steps:["Stock all salt and pepper shakers — full","Fill all condiment caddy items — ketchup, mustard, hot sauce","Roll silverware to par (check the board for tonight's count)","Polish water glasses at your station — no spots","Restock all napkins at service station","Check linen on all tables — replace anything that's stained or rumpled","Check your section for any maintenance issues — wobbly tables, burned bulbs"]},
      {title:"During Service", steps:["Keep your section bussed — do not let dishes stack","Check water levels at every pass through your section","Be aware of your tables' status at all times — anticipate, don't react","Keep your service station clean and stocked throughout the shift","Never walk the floor empty-handed — always carry something in or something out"]},
      {title:"Closing Side Work", steps:["Break down your section — wipe all tables and chairs","Restock all condiments, sugars, and napkins to opening par","Roll silverware to closing par for next shift","Clean and sanitize your service station completely","Sweep your section — under tables and booths","Clock out only after manager sign-off on side work"]},
    ],
  },
  {
    id:"health-inspection", title:"Health Inspection Prep Guide", icon:"🏥", color:C.red,
    desc:"The inspector can show up any day. This is how you pass every time.",
    sections:[
      {title:"The Inspector's Top Priorities", steps:["Temperature control — they will check every cooler, every hold, every product","Employee hygiene — hand washing stations stocked, gloves used correctly","Cross-contamination prevention — raw proteins stored below ready-to-eat foods always","Date labeling — every item in your walk-in must be dated. No exceptions.","Pest control — evidence of rodents or insects is an automatic critical violation","Employee health policy — written policy on file, employees trained"]},
      {title:"What to Have Ready at All Times", steps:["Current food handler certifications for all kitchen staff — posted or available","Written allergen policy — posted in kitchen","Most recent inspection report — posted in view of guests (many states require this)","Pest control service records — last 12 months","Equipment calibration records — thermometers especially","Employee illness / injury log"]},
      {title:"Daily Non-Negotiables", steps:["Every item in cooler labeled with item name AND date made","Walk-in organized — raw proteins on bottom, cooked and ready-to-eat on top","All sanitizer buckets mixed correctly (check with test strips) and accessible","Hand washing sink in kitchen — nothing blocking it, always stocked with soap and paper towels","All staff washing hands after handling raw protein, touching face, or returning from break","Cutting boards — no deep scoring, clean, sanitized between uses"]},
      {title:"If an Inspector Arrives", steps:["Greet them professionally — they are doing their job","Do not argue or get defensive — it escalates the situation","Walk with them and take notes on everything they observe","If a violation is noted, correct it immediately if possible","Ask questions — 'What would you recommend?' builds goodwill","Sign the report — your signature means you received it, not that you agree","Correct all violations before the reinspection date"]},
    ],
  },
];

function SOPViewer({sop, onBack}) {
  const [checked, setChecked] = useState({});
  const totalSteps = sop.sections.reduce((a,s)=>a+s.steps.length,0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((checkedCount/totalSteps)*100);

  return (
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:20}}>← Back to SOPs</button>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:28,marginBottom:8}}>{sop.icon}</div>
        <h3 style={{fontSize:"clamp(18px,3vw,28px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>{sop.title}</h3>
        <p style={{fontSize:13,color:C.mutedLight,margin:"0 0 16px"}}>{sop.desc}</p>
        <div style={{maxWidth:300}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:9,letterSpacing:2,color:C.muted,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>Completion</span>
            <span style={{fontSize:9,color:sop.color,fontFamily:"Georgia,serif"}}>{checkedCount}/{totalSteps}</span>
          </div>
          <div style={{height:3,background:C.border,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(to right,${sop.color}88,${sop.color})`,transition:"width .5s ease"}}/>
          </div>
        </div>
      </div>

      {sop.sections.map((section,si)=>(
        <div key={si} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"18px 20px",marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:"bold",color:sop.color,marginBottom:14,letterSpacing:1,fontFamily:"Georgia,serif",textTransform:"uppercase"}}>{String(si+1).padStart(2,"0")} — {section.title}</div>
          {section.steps.map((step,stepi)=>{
            const key=`${si}-${stepi}`;
            return (
              <div key={stepi} onClick={()=>setChecked(p=>({...p,[key]:!p[key]}))}
                style={{display:"flex",alignItems:"flex-start",gap:12,padding:"9px 0",borderBottom:stepi<section.steps.length-1?`1px solid ${C.border}`:"none",cursor:"pointer"}}>
                <div style={{width:20,height:20,borderRadius:2,border:`1px solid ${checked[key]?sop.color:C.border}`,background:checked[key]?`${sop.color}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:sop.color,flexShrink:0,marginTop:1}}>
                  {checked[key]?"✓":""}
                </div>
                <span style={{fontSize:13,color:checked[key]?C.muted:C.white,lineHeight:1.6,textDecoration:checked[key]?"line-through":"none",fontFamily:"Georgia,serif",transition:"all .2s"}}>{step}</span>
              </div>
            );
          })}
        </div>
      ))}

      <div style={{display:"flex",gap:10,marginTop:20}}>
        <GBtn small outline onClick={()=>setChecked({})}>Reset Checklist</GBtn>
        {pct===100&&<div style={{padding:"8px 16px",background:`${C.green}0D`,border:`1px solid ${C.green}44`,borderRadius:2,fontSize:9,letterSpacing:3,color:C.green,textTransform:"uppercase",fontFamily:"Georgia,serif",display:"flex",alignItems:"center"}}>✓ Complete</div>}
      </div>
    </div>
  );
}

// ─── STEP-BY-STEP GUIDES ──────────────────────────────────────────
const GUIDES = [
  {
    id:"open-restaurant", title:"How to Open a Restaurant", icon:"🏗️", color:C.gold,
    desc:"The complete 90-day pre-opening playbook. Follow every step in order.",
    phases:[
      {phase:"Days 90–75: Foundation", color:C.red, steps:[
        {n:1,title:"Define Your Concept",detail:"Write one paragraph describing your restaurant: who the guest is, what the experience feels like, and what makes you different. This paragraph should guide every decision you make for the next 90 days."},
        {n:2,title:"Validate Your Market",detail:"Visit 10 restaurants in your target area in the next 2 weeks. Take notes on pricing, service, gaps, and what the market is missing. You are looking for white space — not confirmation that your idea is good."},
        {n:3,title:"Build Your Financial Model",detail:"Before you sign a lease or spend a dollar, build a 3-year P&L projection. Include startup costs, monthly fixed costs, projected revenue at 50%, 70%, and 100% capacity. Your model should show a clear path to profitability. If it doesn't, redesign the concept."},
        {n:4,title:"Secure Your Funding",detail:"Calculate total startup costs plus 6 months of operating capital. This is your funding target. Sources: personal savings, SBA loan, investors, or restaurant-specific lenders. Do not open undercapitalized — it is the number one reason restaurants fail."},
        {n:5,title:"Form Your Legal Entity",detail:"Register your business (LLC recommended for liability protection). Get your EIN from the IRS. Open a dedicated business bank account. Never mix personal and business finances. Hire a CPA who specializes in restaurants."},
      ]},
      {phase:"Days 75–60: Location & Lease", color:C.orange, steps:[
        {n:6,title:"Define Your Location Criteria",detail:"Write down your non-negotiables: square footage range, parking requirements, hood system present, grease trap in place, target neighborhoods, maximum rent. Only look at spaces that meet your criteria."},
        {n:7,title:"Evaluate Potential Spaces",detail:"For every space you visit, complete a Location Evaluation Checklist: foot traffic counts at peak times, visibility from street, neighboring businesses, loading access, existing infrastructure (hood, grease trap, electrical), and history of prior tenants."},
        {n:8,title:"Negotiate Your Lease",detail:"Never accept the first offer. Negotiate: free rent period during build-out, tenant improvement allowance (TI), renewal options with capped rent increases, and clear terms on who pays for what. Always have a restaurant-experienced real estate attorney review before signing."},
        {n:9,title:"Apply for Permits & Licenses",detail:"Submit applications immediately after signing — they take time. You will need: business license, food service permit, liquor license (start this early — it can take 90+ days), certificate of occupancy, and any local health department pre-approval."},
      ]},
      {phase:"Days 60–45: Build & Hire", color:C.purple, steps:[
        {n:10,title:"Hire a Restaurant-Experienced Contractor",detail:"Get at least 3 bids. Ask for references from other restaurant builds specifically. Define a detailed scope of work before any contract is signed. Set milestone payments tied to completion stages, not calendar dates. Build 3 weeks of buffer into your timeline."},
        {n:11,title:"Design Your Kitchen Layout",detail:"Work with your chef and contractor to design a kitchen that flows logically: receiving → storage → prep → line → pass → dish. Every step of the process should move forward, never backward. Inefficient kitchen design costs you labor dollars every single shift."},
        {n:12,title:"Order Equipment",detail:"Lead times on commercial kitchen equipment can be 4–10 weeks. Order immediately after your layout is finalized. Buy new for anything with a compressor (refrigeration). Leasing vs. buying: lease for items that need frequent servicing, buy outright for items that last."},
        {n:13,title:"Begin Hiring Key Leadership",detail:"Your chef and front-of-house manager should be hired at least 6 weeks before opening. They need to help build your menu, write your training materials, and hire their teams. If you try to do all of this yourself, something will break."},
      ]},
      {phase:"Days 45–30: Systems & Menu", color:C.blue, steps:[
        {n:14,title:"Finalize Your Menu",detail:"Menu should be finalized 30 days before opening. Run every dish through your food cost calculator. Every item should have a standardized recipe card. Menu size: open with fewer items than you think you need. You can always add. You cannot un-confuse a guest."},
        {n:15,title:"Set Up Your POS System",detail:"Select and configure your POS. Build your full menu into the system. Set up all revenue centers (bar, dining room, to-go). Configure your modifier groups, voids, and comp codes. Train managers on reporting functions. Run a full test transaction before opening."},
        {n:16,title:"Build Your Training Program",detail:"Write your employee handbook. Build your training schedule for each position. Create your steps of service document. Build your pre-opening training calendar — 2 weeks minimum of structured training before you open to the public."},
        {n:17,title:"Hire and Begin Onboarding",detail:"Start with your core team — experienced staff who will train others. Schedule 2 weeks of classroom-style training (menu knowledge, service standards, systems) followed by at least 3 soft-open services before grand opening."},
      ]},
      {phase:"Days 30–0: Pre-Opening", color:C.green, steps:[
        {n:18,title:"Run Your First Soft Open",detail:"Invite friends, family, and trusted community members. Charge nothing — or a nominal amount. Run service as if it were real. Take detailed notes on every failure. The purpose of a soft open is to break things in a safe environment."},
        {n:19,title:"Debrief After Every Soft Open",detail:"After each service, gather the full team. Every person shares one thing that went well and one thing that needs to improve. Document everything. Create an action item list and assign ownership before the team leaves."},
        {n:20,title:"Resolve All Open Issues",detail:"Go through your permit and inspection checklist. Final health inspection must be complete. Certificate of occupancy in hand. All licenses posted. POS tested and balanced. Staff trained and confident. Menu finalized and printed. Opening day supplies ordered and received."},
        {n:21,title:"Launch Your Marketing",detail:"Announce your opening date at least 2 weeks in advance. Social media, email list, local press, community groups. Create a reason to come the first week — not a discount, but an experience. Your opening week sets the narrative for your restaurant in the community."},
        {n:22,title:"Open Your Doors",detail:"Open on time. No exceptions. Be present on the floor. Greet every guest. Take notes on everything. Your job on opening day is to be the calm in the storm — your team will look to you to set the tone. Smile. You built this."},
      ]},
    ],
  },
  {
    id:"build-menu", title:"How to Build Your Menu from Scratch", icon:"🍽️", color:C.purple,
    desc:"From concept to final printed menu — the complete menu development process.",
    phases:[
      {phase:"Step 1: Menu Strategy", color:C.gold, steps:[
        {n:1,title:"Define Your Menu's Job",detail:"Your menu is a sales tool, a cost control system, and a brand statement simultaneously. Before you write a single dish, answer: What is the highest-margin category on my menu? What 3 dishes do I want every guest to order? What does my menu say about my brand?"},
        {n:2,title:"Determine Your Menu Size",detail:"Smaller menus are almost always better. 6–8 starters, 8–12 entrees, 4–6 desserts is more than enough for most concepts. A focused menu means better quality control, lower food cost, less waste, and faster service. Every item you add costs you money."},
        {n:3,title:"Set Your Price Positioning",detail:"Research your competitors. Know the lowest and highest price points in your market. Position your menu based on your concept and target guest. Price anchoring: put your most expensive item first or prominently to make everything else seem reasonable."},
      ]},
      {phase:"Step 2: Menu Engineering", color:C.orange, steps:[
        {n:4,title:"Cost Every Dish Before It Goes on the Menu",detail:"Use the food cost calculator for every single item. No dish gets on the menu without knowing its food cost percentage. Target: 28–32% for food, 18–22% for cocktails. If a dish you love doesn't hit the target, engineer it — change portion size, substitute an ingredient, or adjust the price."},
        {n:5,title:"Classify Every Item",detail:"After costing, classify every dish: Stars (high profit, high popularity), Plowhorses (popular but low margin), Puzzles (high margin but underordered), Dogs (low margin, low popularity). Stars go in prime menu real estate. Dogs get cut."},
        {n:6,title:"Design for Upselling",detail:"Build your menu so natural add-ons exist at every course. Soup or salad with entree. Side upgrades. Dessert add-on. Suggested wine pairing. Every upsell opportunity you build into the menu structure is passive revenue that requires zero additional labor."},
      ]},
      {phase:"Step 3: Recipe Development", color:C.blue, steps:[
        {n:7,title:"Write Standardized Recipes for Every Item",detail:"Every dish needs a written recipe card with: exact ingredient quantities by weight, step-by-step preparation instructions, plating photo and written description, cook time and temperature, yield and portion size, cost per portion, and allergen flags. No recipe card = no dish on the menu."},
        {n:8,title:"Run Tasting Sessions",detail:"Cook every dish for feedback before finalizing. Include your chef, a manager, and if possible, some trusted guests. Document feedback specifically. 'It needs more acid' is useful feedback. 'It's okay' is not. Finalize recipes only after two rounds of approved tastings."},
        {n:9,title:"Train Every Cook on Every Recipe",detail:"Every cook on your line needs to produce every dish to your standard before you open. Run line cook competency checks: cook the dish, taste it, compare to the recipe card, grade it. No one goes on the line without passing their station's recipe checks."},
      ]},
    ],
  },
  {
    id:"hire-staff", title:"How to Hire & Onboard Staff", icon:"👥", color:C.green,
    desc:"Hire slow, fire fast. Build a team that stays.",
    phases:[
      {phase:"Step 1: Before You Post the Job", color:C.gold, steps:[
        {n:1,title:"Write a Real Job Description",detail:"Most restaurant job postings are generic and attract generic candidates. Write a job description that describes your culture, your standards, and what makes your restaurant different. The right candidate should feel excited reading it. The wrong one should self-select out."},
        {n:2,title:"Define Your Non-Negotiables",detail:"Before interviewing anyone, write down 3–5 non-negotiables for the role. For a server: punctuality, attention to detail, warmth with guests. For a line cook: shows up on time, takes direction without attitude, keeps station clean. Interview to these standards, not to likability."},
        {n:3,title:"Know Your Compensation Before Posting",detail:"Post the wage range. Candidates who don't see compensation waste both their time and yours. Know your budget, know market rates, and make a competitive offer. Low wages attract high turnover. Calculate the true cost of turnover — training, coverage, morale — and invest accordingly."},
      ]},
      {phase:"Step 2: Interviewing", color:C.purple, steps:[
        {n:4,title:"The Phone Screen (10 minutes)",detail:"Before bringing anyone in, do a 10-minute phone screen. Listen for: Are they on time for the call? Do they sound engaged and interested? Can they clearly articulate why they want this job? This alone eliminates 30–40% of applicants and saves hours of in-person interviews."},
        {n:5,title:"The In-Person Interview",detail:"Ask behavioral questions — not hypotheticals. Not 'What would you do if...' but 'Tell me about a time when...' Examples: 'Tell me about the most difficult guest situation you've handled.' 'Tell me about a time you disagreed with a manager. What did you do?' Listen for accountability, communication, and self-awareness."},
        {n:6,title:"The Working Interview",detail:"For kitchen staff — always. For experienced FOH — highly recommended. A 2–3 hour working interview tells you more about a candidate than any conversation. Watch: do they ask questions or fake it? How do they handle pressure? Do they clean as they go? Do they interact well with the team?"},
      ]},
      {phase:"Step 3: Onboarding", color:C.blue, steps:[
        {n:7,title:"Day One Sets the Tone",detail:"Have their paperwork ready. Give them a tour. Introduce them to every person they'll work with. Assign them a buddy or trainer. Show them where everything is — uniform, food, break room, clock-in system. Make them feel like they belong here. First impressions of a workplace are hard to undo."},
        {n:8,title:"Structured Training Schedule",detail:"Every new hire gets a written training schedule for their first 2 weeks. Day by day, what they're learning, who they're training with, what they need to pass at the end of each day. No 'just follow someone around' — that's not training, that's hoping."},
        {n:9,title:"30-Day Check-In",detail:"At 30 days, every new hire gets a formal check-in with their manager. Not performance review — a conversation. How are they feeling? What's going well? What's confusing or frustrating? What do they need? Most employees leave in the first 90 days. This check-in is how you find out why before they go."},
      ]},
    ],
  },
  {
    id:"weekly-inventory", title:"How to Run Weekly Inventory", icon:"📦", color:C.orange,
    desc:"Inventory is the only way to know your actual food and beverage cost. Do it weekly. No exceptions.",
    phases:[
      {phase:"Step 1: Set Up Your System", color:C.gold, steps:[
        {n:1,title:"Build Your Inventory Sheet",detail:"Your inventory sheet should mirror your storage areas — walk-in, dry storage, freezer, bar, prep. List every item you carry, its unit of measure, and its current cost per unit. Update costs when vendor prices change. This sheet is your most important financial document."},
        {n:2,title:"Establish Count Frequency by Category",detail:"Weekly: all high-cost proteins, seafood, premium spirits, and produce. Bi-weekly: dry goods, canned items, and moderate-cost proteins. Monthly: paper goods, cleaning supplies. The frequency should match the cost and perishability of the item."},
        {n:3,title:"Assign Count Ownership",detail:"Inventory is not a solo task. Assign: Chef counts BOH, Bar Manager counts bar, Manager supervises and does spot checks. Separate count and verification — the person who orders should not be the only person who counts. This is basic theft prevention."},
      ]},
      {phase:"Step 2: The Count", color:C.purple, steps:[
        {n:4,title:"Count at the Same Time Every Week",detail:"Best practice: Sunday close or Monday morning before delivery. The consistency matters — you're measuring the same window of time every week to make comparisons meaningful. Count the same way every time: left to right, front to back, top to bottom."},
        {n:5,title:"Count by Sight, Not by Memory",detail:"Open every box. Look in every container. Move things. Count what's actually there, not what you think is there. The person who ordered it knows what should be there — that's exactly why they shouldn't be the only one counting."},
        {n:6,title:"Record Immediately — Never From Memory",detail:"Write down counts as you go. Never 'I'll remember that, I'll write it after.' The smallest distraction wipes your count. Use a printed sheet or a tablet. Transfer to your system the same day, while your recall is fresh."},
      ]},
      {phase:"Step 3: Analyze & Act", color:C.blue, steps:[
        {n:7,title:"Calculate Your Actual Food Cost",detail:"Formula: (Beginning Inventory + Purchases) − Ending Inventory = Cost of Goods Sold. Divide COGS by your sales for the period = your actual food cost %. Compare to your theoretical food cost (what it should be based on recipes). A variance of more than 2–3% requires investigation."},
        {n:8,title:"Investigate Variances",detail:"High variance means one of three things: over-portioning, waste, or theft. Check in that order. Pull ticket data and compare portion counts to inventory usage. Review your waste log. If variance is consistent and unexplained after checking portioning and waste, you have a theft problem."},
        {n:9,title:"Adjust Pars Based on Actuals",detail:"Every week, compare what you had, what you used, and what you wasted. Adjust your par levels to match actual usage, not assumptions. Over-ordering ties up cash and creates waste. Under-ordering creates 86s. Weekly inventory is how you tune the system."},
      ]},
    ],
  },
  {
    id:"read-pl", title:"How to Read Your P&L", icon:"📊", color:C.blue,
    desc:"Your P&L is your scoreboard. If you can't read it, you can't manage your business.",
    phases:[
      {phase:"Understanding the Structure", color:C.gold, steps:[
        {n:1,title:"The P&L Has Three Parts",detail:"1. Revenue (top line) — everything you sold. 2. Cost of Goods Sold (COGS) — food cost + beverage cost. 3. Operating Expenses — labor, rent, utilities, marketing, etc. What's left after all of that is your net profit or net loss. Every line on the P&L tells you something specific about your business."},
        {n:2,title:"Understand Percentages, Not Just Dollars",detail:"A food cost of $8,000 tells you nothing without context. A food cost of 32% of sales tells you exactly where you stand. Always convert dollar amounts to percentages of sales. This is how you compare performance week to week and against industry benchmarks regardless of sales volume."},
        {n:3,title:"Know Your Benchmarks",detail:"Food cost: 28–32%. Beverage cost: 18–22%. Labor: 30–35%. Prime cost (food + bev + labor): 55–65%. Rent: 6–10% of sales. Net profit: 5–15% for a healthy full-service restaurant. If any of your numbers are outside these ranges, that line is where you focus first."},
      ]},
      {phase:"Reading It Weekly", color:C.purple, steps:[
        {n:4,title:"The Weekly Review Ritual",detail:"Block 30 minutes every Monday morning. Pull your P&L from your POS and accounting software. Review in this order: 1) Sales vs. prior week and prior year. 2) Food cost actual vs. theoretical. 3) Labor cost actual vs. schedule. 4) Prime cost total. 5) Any line that moved more than 1% from last week."},
        {n:5,title:"Ask These Questions Every Week",detail:"Did sales grow or shrink — and do I know why? Is food cost trending up? (Check ordering, portioning, and waste.) Is labor tracking to budget? (Check the schedule vs. actual hours.) What is my prime cost — is it under 65%? What happened this week that I want to repeat or avoid?"},
        {n:6,title:"The Most Important Number Nobody Tracks",detail:"Your prime cost — food cost + beverage cost + labor — is the single most important number on your P&L. It's the only number you have meaningful control over week to week. A prime cost under 60% is excellent. 60–65% is sustainable. Over 65% and you are working to pay other people, not yourself."},
      ]},
      {phase:"Taking Action", color:C.green, steps:[
        {n:7,title:"Never Let a Bad Week Pass Without a Plan",detail:"If your P&L shows a problem, address it in writing before that week is over. What happened? What will change? Who owns the change? What will you measure next week to know if it worked? A P&L that's reviewed and not acted on is just a document. A P&L that drives action is a management tool."},
        {n:8,title:"Share the Numbers With Your Team",detail:"You don't have to share every line. But share the prime cost, the food cost percentage, and the sales goal. Teams that know the numbers perform to them. Teams that are kept in the dark can't help you win. Transparency about performance is one of the highest-leverage things you can do as an operator."},
      ]},
    ],
  },
  {
    id:"bar-program", title:"How to Set Up Your Bar Program", icon:"🍸", color:C.purple,
    desc:"A great bar program can be your highest-margin revenue center. Build it right.",
    phases:[
      {phase:"Step 1: Bar Concept & Menu", color:C.gold, steps:[
        {n:1,title:"Define Your Bar Identity",detail:"Your bar should reflect your restaurant's concept. A farm-to-table restaurant has a different bar identity than a steakhouse. Define: What are 3–5 words that describe your bar? What price range and spirit quality level? What's your signature — the one cocktail or experience guests will talk about?"},
        {n:2,title:"Build a Focused Cocktail Menu",detail:"Start with 8–12 cocktails maximum. Include: 2–3 classic-inspired drinks, 2–3 original signatures, 1–2 spirit-forward options, 1–2 lower ABV or NA options. Cost every cocktail. Target: 18–22% beverage cost. Price them confidently — guests pay for experience, not just ingredients."},
        {n:3,title:"Set Up Your Well, Call, and Premium Tiers",detail:"Well spirits are your lowest-cost option for mixed drinks. Call spirits are mid-tier — what guests request by name. Premium and top shelf are your margin drivers. Train your team to suggest call and premium: 'Would you like that with Tito's or our well vodka?' That question alone moves check averages."},
      ]},
      {phase:"Step 2: Systems & Controls", color:C.orange, steps:[
        {n:4,title:"Standardize Every Pour",detail:"Write a recipe card for every cocktail on your menu. Every cocktail spec should include: exact spirit amount (in oz), every modifier and its exact amount, ice type and method, glassware, garnish, and estimated cost. A bartender guessing at pours is a bartender giving away margin."},
        {n:5,title:"Set Up Weekly Liquor Inventory",detail:"Count every bottle every week. Record what you have, calculate what you used, and compare to what you sold based on your POS data. Variance between what you poured (per POS) and what you used (per inventory) tells you if you have a problem. Acceptable variance: under 3%."},
        {n:6,title:"Lock Down Opening & Closing Procedures",detail:"Opening: count the bank, check all pars, date-check all juices and perishable mixers, taste all batched cocktails. Closing: count all liquor, record in the log, lock the bar, balance the till. The manager verifies both. Accountability in the bar is not optional — it's where most restaurant theft occurs."},
      ]},
      {phase:"Step 3: Training Your Bar Team", color:C.blue, steps:[
        {n:7,title:"Certify Every Bartender on the Menu",detail:"Before any bartender works independently, they must: make every cocktail on the menu to spec, recite the spirit list and price tiers, pass a tasting of house cocktails, and demonstrate proper pour technique. Certification is not a formality — it's the minimum standard."},
        {n:8,title:"Train Servers on Beverage Upselling",detail:"Your servers sell more beverages than your bartenders. Train them: how to describe cocktails using sensory language, when to suggest a second round, how to recommend wine pairings, how to offer dessert cocktails or digestifs. A server who confidently sells beverages is worth thousands of dollars in annual revenue."},
      ]},
    ],
  },
];

function GuideViewer({guide, onBack}) {
  const [openPhase, setOpenPhase] = useState(0);
  const [openStep, setOpenStep] = useState(null);
  const totalSteps = guide.phases.reduce((a,p)=>a+p.steps.length,0);

  return (
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:20}}>← Back to Guides</button>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:32,marginBottom:8}}>{guide.icon}</div>
        <h3 style={{fontSize:"clamp(18px,3vw,28px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>{guide.title}</h3>
        <p style={{fontSize:13,color:C.mutedLight,margin:"0 0 8px"}}>{guide.desc}</p>
        <div style={{fontSize:11,color:C.muted,fontFamily:"Georgia,serif"}}>{totalSteps} steps · Follow in order</div>
      </div>

      {guide.phases.map((phase,pi)=>(
        <div key={pi} style={{marginBottom:12}}>
          <div onClick={()=>setOpenPhase(openPhase===pi?null:pi)}
            style={{background:C.card,border:`1px solid ${openPhase===pi?phase.color+"55":C.border}`,borderRadius:2,padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}>
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
                  <div onClick={()=>setOpenStep(openStep===`${pi}-${si}`?null:`${pi}-${si}`)}
                    style={{padding:"14px 18px",background:openStep===`${pi}-${si}`?C.cardHover:C.card,borderBottom:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all .2s"}}>
                    <div style={{width:28,height:28,borderRadius:2,background:`${phase.color}18`,border:`1px solid ${phase.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:"bold",color:phase.color,flexShrink:0,fontFamily:"Georgia,serif"}}>
                      {step.n}
                    </div>
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

// ─── TOOLS LIST ───────────────────────────────────────────────────
const TOOLS_LIST = [
  {id:"food-cost",  title:"Food Cost Calculator",    icon:"🧮", color:C.gold,   desc:"Calculate plate cost, food cost %, and ideal menu price for any dish.",        component:FoodCostCalculator},
  {id:"menu-price", title:"Menu Price Calculator",   icon:"💵", color:C.green,  desc:"Set menu prices based on your cost and target food cost percentage.",          component:MenuPriceCalculator},
  {id:"labor",      title:"Labor Cost Calculator",   icon:"👷", color:C.purple, desc:"Track every position's hours and wages against projected weekly sales.",        component:LaborCostCalculator},
  {id:"break-even", title:"Break-Even Calculator",   icon:"📉", color:C.red,    desc:"Know exactly what you need to sell every day before you make a dollar.",        component:BreakEvenCalculator},
  {id:"pl-tracker", title:"Weekly P&L Tracker",      icon:"📊", color:C.blue,   desc:"Enter your weekly numbers and see your full P&L with prime cost analysis.",    component:PLTracker},
  {id:"waste-log",  title:"Waste Log",               icon:"🗑️", color:C.orange, desc:"Track daily waste by station and reason to identify and eliminate loss.",      component:WasteLog},
];

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function OperationsCenter() {
  const [activeSection, setActiveSection] = useState("home");
  const [activeTool, setActiveTool] = useState(null);
  const [activeSOP, setActiveSOP] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);

  const SECTIONS = [
    {id:"tools",  label:"Tools",        icon:"🧮", color:C.gold},
    {id:"sops",   label:"SOP Library",  icon:"📋", color:C.purple},
    {id:"guides", label:"Step-by-Step Guides", icon:"📖", color:C.blue},
  ];

  const goHome = () => {
    setActiveSection("home");
    setActiveTool(null);
    setActiveSOP(null);
    setActiveGuide(null);
  };

  // Header
  const Header = () => (
    <header style={{background:C.card,borderBottom:`1px solid ${C.borderGold}`,padding:"0 16px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,fontFamily:"Georgia,serif"}}>
      <div onClick={goHome} style={{fontSize:"clamp(11px,3vw,15px)",letterSpacing:"clamp(3px,1vw,5px)",fontWeight:"bold",...GT,cursor:"pointer",flexShrink:0}}>THE PLAYBOOK</div>
      <div style={{fontSize:9,letterSpacing:3,color:C.gold,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>Operations Center</div>
      {activeSection!=="home"&&<GBtn small outline onClick={goHome}>← Home</GBtn>}
    </header>
  );

  // Home
  if (activeSection==="home") return (
    <div style={{background:C.black,minHeight:"100vh",color:C.white}}>
      <Header/>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"48px 16px 80px"}}>
        <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:12,fontFamily:"Georgia,serif"}}>✦ &nbsp; Restaurant for Operators</div>
        <h1 style={{fontSize:"clamp(26px,5vw,52px)",fontWeight:"bold",lineHeight:1.1,margin:"0 0 16px",color:C.white}}>Operations<br/><span style={GT}>Center.</span></h1>
        <p style={{fontSize:14,color:C.mutedLight,lineHeight:1.8,maxWidth:540,marginBottom:48,fontFamily:"Georgia,serif"}}>
          Every tool, every SOP, every step-by-step guide you need to open, run, and scale a profitable restaurant — without guessing. If you can't figure something out, that's what the 1-on-1 coaching is for.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {SECTIONS.map(sec=>(
            <div key={sec.id} onClick={()=>setActiveSection(sec.id)}
              style={{background:`linear-gradient(135deg,${C.card},#0A0A0A)`,border:`1px solid ${sec.color}33`,borderRadius:2,padding:"28px 24px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=sec.color+"66";e.currentTarget.style.boxShadow=`0 0 30px ${sec.color}0F`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=sec.color+"33";e.currentTarget.style.boxShadow="none";}}>
              <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${sec.color},transparent)`}}/>
              <div style={{fontSize:36,marginBottom:14}}>{sec.icon}</div>
              <div style={{fontSize:18,fontWeight:"bold",color:C.white,marginBottom:8,fontFamily:"Georgia,serif"}}>{sec.label}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.6,fontFamily:"Georgia,serif"}}>
                {sec.id==="tools"&&"6 working calculators — food cost, labor, break-even, P&L, and more."}
                {sec.id==="sops"&&"8 ready-to-use SOPs with interactive checklists for every shift."}
                {sec.id==="guides"&&"6 complete step-by-step playbooks covering every major operational challenge."}
              </div>
              <div style={{marginTop:16,fontSize:9,letterSpacing:3,color:sec.color,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>Open →</div>
            </div>
          ))}
        </div>

        <div style={{marginTop:48,background:"linear-gradient(135deg,#0E0A00,#140E00)",border:`1px solid ${C.borderGold}`,borderRadius:2,padding:28,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:`radial-gradient(circle,${C.gold}18,transparent 70%)`,pointerEvents:"none"}}/>
          <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:10,fontFamily:"Georgia,serif"}}>✦ &nbsp; Still Have Questions?</div>
          <div style={{fontSize:"clamp(16px,3vw,24px)",fontWeight:"bold",color:C.white,marginBottom:10,lineHeight:1.2,fontFamily:"Georgia,serif"}}>This is built to answer every question before you have to ask it.</div>
          <p style={{fontSize:13,color:C.mutedLight,lineHeight:1.7,maxWidth:420,marginBottom:20,fontFamily:"Georgia,serif"}}>If after using these tools and guides you still need help — that's what private coaching is for. 1-on-1 with Chef Keiona Jackson, applied to your specific situation.</p>
          <GBtn small>Book a Coaching Session — $250 →</GBtn>
        </div>
      </div>
    </div>
  );

  // Tools
  if (activeSection==="tools") {
    const ToolComp = activeTool ? TOOLS_LIST.find(t=>t.id===activeTool)?.component : null;
    const toolInfo = activeTool ? TOOLS_LIST.find(t=>t.id===activeTool) : null;
    return (
      <div style={{background:C.black,minHeight:"100vh",color:C.white}}>
        <Header/>
        <div style={{maxWidth:1000,margin:"0 auto",padding:"40px 16px 80px"}}>
          {!activeTool?(
            <>
              <button onClick={goHome} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:24}}>← Home</button>
              <div style={{fontSize:9,letterSpacing:4,color:C.gold,textTransform:"uppercase",marginBottom:12,fontFamily:"Georgia,serif"}}>🧮 &nbsp; Tools</div>
              <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Working Calculators</h2>
              <p style={{fontSize:13,color:C.mutedLight,marginBottom:32,fontFamily:"Georgia,serif"}}>Real tools that do the math for you. Know your numbers before you make decisions.</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:13}}>
                {TOOLS_LIST.map(tool=>(
                  <div key={tool.id} onClick={()=>setActiveTool(tool.id)}
                    style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"20px 22px",cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=tool.color+"44";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                    <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${tool.color},transparent)`}}/>
                    <div style={{fontSize:28,marginBottom:10}}>{tool.icon}</div>
                    <div style={{fontSize:15,fontWeight:"bold",color:C.white,marginBottom:7,fontFamily:"Georgia,serif"}}>{tool.title}</div>
                    <div style={{fontSize:12,color:C.muted,lineHeight:1.6,fontFamily:"Georgia,serif"}}>{tool.desc}</div>
                    <div style={{marginTop:14,fontSize:9,letterSpacing:2,color:tool.color,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>Open Tool →</div>
                  </div>
                ))}
              </div>
            </>
          ):(
            <>
              <button onClick={()=>setActiveTool(null)} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:24}}>← Back to Tools</button>
              <div style={{fontSize:9,letterSpacing:4,color:toolInfo.color,textTransform:"uppercase",marginBottom:10,fontFamily:"Georgia,serif"}}>{toolInfo.icon} &nbsp; Tool</div>
              <h2 style={{fontSize:"clamp(20px,4vw,34px)",fontWeight:"bold",color:C.white,margin:"0 0 24px",fontFamily:"Georgia,serif"}}>{toolInfo.title}</h2>
              <ToolComp/>
            </>
          )}
        </div>
      </div>
    );
  }

  // SOPs
  if (activeSection==="sops") return (
    <div style={{background:C.black,minHeight:"100vh",color:C.white}}>
      <Header/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"40px 16px 80px"}}>
        {!activeSOP?(
          <>
            <button onClick={goHome} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:24}}>← Home</button>
            <div style={{fontSize:9,letterSpacing:4,color:C.purple,textTransform:"uppercase",marginBottom:12,fontFamily:"Georgia,serif"}}>📋 &nbsp; SOP Library</div>
            <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>Standard Operating Procedures</h2>
            <p style={{fontSize:13,color:C.mutedLight,marginBottom:32,fontFamily:"Georgia,serif"}}>Ready-to-use checklists for every shift. Click any item to check it off. Nothing left to guesswork.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {SOPS.map(sop=>(
                <div key={sop.id} onClick={()=>setActiveSOP(sop.id)}
                  style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=sop.color+"44";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                  <div style={{fontSize:28,flexShrink:0}}>{sop.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:"bold",color:C.white,marginBottom:4,fontFamily:"Georgia,serif"}}>{sop.title}</div>
                    <div style={{fontSize:12,color:C.muted,fontFamily:"Georgia,serif"}}>{sop.desc}</div>
                  </div>
                  <Pill color={sop.color}>{sop.sections.length} sections</Pill>
                </div>
              ))}
            </div>
          </>
        ):(
          <SOPViewer sop={SOPS.find(s=>s.id===activeSOP)} onBack={()=>setActiveSOP(null)}/>
        )}
      </div>
    </div>
  );

  // Guides
  if (activeSection==="guides") return (
    <div style={{background:C.black,minHeight:"100vh",color:C.white}}>
      <Header/>
      <div style={{maxWidth:900,margin:"0 auto",padding:"40px 16px 80px"}}>
        {!activeGuide?(
          <>
            <button onClick={goHome} style={{background:"none",border:"none",color:C.gold,fontSize:9,letterSpacing:3,textTransform:"uppercase",cursor:"pointer",fontFamily:"Georgia,serif",marginBottom:24}}>← Home</button>
            <div style={{fontSize:9,letterSpacing:4,color:C.blue,textTransform:"uppercase",marginBottom:12,fontFamily:"Georgia,serif"}}>📖 &nbsp; Step-by-Step Guides</div>
            <h2 style={{fontSize:"clamp(22px,4vw,38px)",fontWeight:"bold",color:C.white,margin:"0 0 8px"}}>The Complete Playbooks</h2>
            <p style={{fontSize:13,color:C.mutedLight,marginBottom:32,fontFamily:"Georgia,serif"}}>Follow each guide step by step. No skipping. If you do every step, you will not fail.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:13}}>
              {GUIDES.map(guide=>(
                <div key={guide.id} onClick={()=>setActiveGuide(guide.id)}
                  style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:2,padding:"20px 22px",cursor:"pointer",position:"relative",overflow:"hidden",transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=guide.color+"44";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
                  <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:`linear-gradient(to bottom,${guide.color},transparent)`}}/>
                  <div style={{fontSize:28,marginBottom:10}}>{guide.icon}</div>
                  <div style={{fontSize:15,fontWeight:"bold",color:C.white,marginBottom:7,fontFamily:"Georgia,serif"}}>{guide.title}</div>
                  <div style={{fontSize:12,color:C.muted,lineHeight:1.6,fontFamily:"Georgia,serif",marginBottom:12}}>{guide.desc}</div>
                  <div style={{fontSize:9,letterSpacing:2,color:guide.color,textTransform:"uppercase",fontFamily:"Georgia,serif"}}>{guide.phases.reduce((a,p)=>a+p.steps.length,0)} steps →</div>
                </div>
              ))}
            </div>
          </>
        ):(
          <GuideViewer guide={GUIDES.find(g=>g.id===activeGuide)} onBack={()=>setActiveGuide(null)}/>
        )}
      </div>
    </div>
  );

  return null;
}
