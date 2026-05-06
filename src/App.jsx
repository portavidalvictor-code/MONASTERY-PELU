import { useState, useRef, useEffect, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const LS = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const makeGCalLink = (a) => {
  const ds = a.date.replace(/-/g,"");
  const [h,m] = a.time.split(":").map(Number);
  const p = (n) => String(n).padStart(2,"0");
  const start = `${ds}T${p(h)}${p(m)}00`;
  const end   = `${ds}T${p(h+1)}${p(m)}00`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("💈 "+a.client+" — "+a.service)}&dates=${start}/${end}&location=${encodeURIComponent("Avinguda de Daniel Gil, 40, 46870 Ontinyent, Valencia")}&details=${encodeURIComponent("Cliente: "+a.client+"\nServicio: "+a.service+"\nBarbero: "+a.barber+"\nTel: "+a.phone)}`;
};

const ADMIN_USER = "edwin";
const ADMIN_PASS = "monastery2025";

const SERVICES = [
  { icon:"✂️", name:"Corte + Cejas", desc:"Corte clásico o moderno a tu gusto con arreglo de cejas incluido. El servicio más completo del día a día.", price:"13", time:"35 min", tag:"Más popular" },
  { icon:"🧔", name:"Corte + Barba", desc:"Corte completo más perfilado y diseño de barba con navaja. Saldrás impecable de pies a cabeza.", price:"15", time:"50 min", tag:"Todo incluido" },
  { icon:"🎨", name:"Tinte", desc:"Color profesional con productos de calidad. Decoloración, mechas o color sólido. Transformación garantizada.", price:"25", time:"90 min", tag:"Transformación total" },
];

const BARBERS = [
  { name:"Edwin Silva", spec:"Fades · Diseño · Color", role:"Fundador" },
  { name:"Su Hermano",  spec:"Barba · Classic · Cortes", role:"Co-Fundador" },
];

const HOURS_WD = ["10:00","10:30","11:00","11:30","12:00","12:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"];
const HOURS_SA = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30"];
const ALL_TIMES = [...new Set([...HOURS_WD,...HOURS_SA])].sort();

const TODAY = new Date().toISOString().split("T")[0];

const INIT_RVS = [
  { name:"Carlos M.", stars:5, text:"El mejor corte que me han hecho en Ontinyent. Edwin tiene una mano increíble.", date:"Hace 3 días" },
  { name:"Alejandro R.", stars:5, text:"El pack corte+barba por 15€ es una pasada. Llevo meses yendo y siempre sale perfecto.", date:"Hace 1 semana" },
  { name:"David P.", stars:5, text:"Primera vez y ya tengo cita para la próxima. El ambiente y el resultado, todo genial.", date:"Hace 2 semanas" },
];

const INIT_APPTS = [
  { id:1, client:"Carlos M.",    phone:"+34 611 234 567", service:"Corte + Cejas", barber:"Edwin Silva", date:TODAY, time:"10:00", status:"confirmed" },
  { id:2, client:"Alejandro R.", phone:"+34 622 345 678", service:"Corte + Barba", barber:"Edwin Silva", date:TODAY, time:"11:00", status:"confirmed" },
  { id:3, client:"David P.",     phone:"+34 633 456 789", service:"Corte + Cejas", barber:"Su Hermano",  date:TODAY, time:"10:30", status:"pending" },
  { id:4, client:"Miguel T.",    phone:"+34 644 567 890", service:"Tinte",          barber:"Su Hermano",  date:TODAY, time:"12:00", status:"confirmed" },
  { id:5, client:"Iñaki S.",     phone:"+34 655 678 901", service:"Corte + Barba", barber:"Edwin Silva", date:TODAY, time:"16:00", status:"pending" },
];

const REV_DATA = [
  {month:"Ene",rev:1800,citas:32},{month:"Feb",rev:2300,citas:44},{month:"Mar",rev:2100,citas:39},
  {month:"Abr",rev:2900,citas:53},{month:"May",rev:3200,citas:58},{month:"Jun",rev:3000,citas:55},
];

const SYSTEM = `Eres Monk, asistente de Barber Brothers Monastery en Ontinyent, Valencia. Estilo: urbano, directo. Máx 3 líneas. Español.
DIRECCIÓN: Avinguda de Daniel Gil, 40, 46870 Ontinyent, Valencia. WHATSAPP: +34 641 856 656. INSTAGRAM: @barber_shop_monastery.
HORARIO: Lun cerrado | Mar-Vie 10-14/16-20 | Sáb 9-14 | Dom cerrado.
SERVICIOS: Corte+Cejas 13€ (35min) | Corte+Barba 15€ (50min) | Tinte 25€ (90min).
DUEÑO: Edwin Silva (nació en Colombia), junto a su hermano.
CITAS: Guía → servicio → día → hora → nombre → "Reserva en la web o WhatsApp: +34 641 856 656 💈"`;

// ── SVG CUTS ─────────────────────────────────────────────────────────────────
const Cut1 = () => (
  <svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
    <rect width="300" height="340" fill="#0a0a0a"/>
    <defs>
      <radialGradient id="rg1" cx="50%" cy="40%" r="55%"><stop offset="0%" stopColor="#C9A84C" stopOpacity=".09"/><stop offset="100%" stopColor="#000" stopOpacity="0"/></radialGradient>
      <linearGradient id="fd1" x1="0" y1=".3" x2="0" y2="1"><stop offset="0%" stopColor="#C9A84C" stopOpacity=".75"/><stop offset="55%" stopColor="#C9A84C" stopOpacity=".18"/><stop offset="100%" stopColor="#C9A84C" stopOpacity="0"/></linearGradient>
    </defs>
    <rect width="300" height="340" fill="url(#rg1)"/>
    <ellipse cx="150" cy="138" rx="58" ry="68" fill="#1c1c1c"/>
    <ellipse cx="150" cy="138" rx="58" ry="68" fill="url(#fd1)"/>
    {[...Array(14)].map((_,i)=><line key={i} x1={108+i*3.8} y1="72" x2={110+i*3.8} y2="84" stroke="#C9A84C" strokeWidth="1.3" opacity={.85-i*.04}/>)}
    <ellipse cx="94" cy="146" rx="7" ry="11" fill="#161616" stroke="#2a2a2a" strokeWidth=".8"/>
    <ellipse cx="206" cy="146" rx="7" ry="11" fill="#161616" stroke="#2a2a2a" strokeWidth=".8"/>
    <line x1="97" y1="118" x2="203" y2="118" stroke="#C9A84C" strokeWidth="1.5"/>
    <path d="M120 118 Q136 112 150 115 Q164 112 180 118" stroke="#C9A84C" strokeWidth="1.2" fill="none" opacity=".4"/>
    <rect x="130" y="203" width="40" height="32" fill="#1c1c1c"/>
    <text x="150" y="296" textAnchor="middle" fill="#C9A84C" opacity=".08" fontSize="52" fontFamily="serif">✂</text>
    <rect x="24" y="100" width="10" height="120" rx="3" fill="#1c1c1c" stroke="#C9A84C" strokeWidth=".6" opacity=".5"/>
    {[0,1,2,3,4,5].map(i=><line key={i} x1="24" y1={110+i*18} x2="34" y2={118+i*18} stroke="#C9A84C" strokeWidth="1" opacity=".4"/>)}
  </svg>
);

const Cut2 = () => (
  <svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
    <rect width="300" height="340" fill="#0b0a0a"/>
    <defs><radialGradient id="rg2" cx="50%" cy="45%" r="55%"><stop offset="0%" stopColor="#8B6914" stopOpacity=".14"/><stop offset="100%" stopColor="#000" stopOpacity="0"/></radialGradient></defs>
    <rect width="300" height="340" fill="url(#rg2)"/>
    <ellipse cx="150" cy="128" rx="56" ry="62" fill="#1d1d1d"/>
    <path d="M96 162 Q90 188 98 208 Q124 238 150 240 Q176 238 202 208 Q210 188 204 162 Q178 176 150 178 Q122 176 96 162Z" fill="#232323" stroke="#C9A84C" strokeWidth=".8" opacity=".9"/>
    {[...Array(9)].map((_,i)=><line key={i} x1={108+i*5} y1={180+i*2} x2={106+i*5} y2={212+i*1.5} stroke="#C9A84C" strokeWidth=".6" opacity={.28+i*.025}/>)}
    <ellipse cx="95" cy="140" rx="6" ry="10" fill="#161616" stroke="#2a2a2a" strokeWidth=".8"/>
    <ellipse cx="205" cy="140" rx="6" ry="10" fill="#161616" stroke="#2a2a2a" strokeWidth=".8"/>
    <path d="M120 160 Q136 154 150 158 Q164 154 180 160" stroke="#C9A84C" strokeWidth="2" fill="none" opacity=".8"/>
    {[...Array(12)].map((_,i)=><line key={i} x1={106+i*3.5} y1="68" x2={108+i*3.5} y2="80" stroke="#C9A84C" strokeWidth="1.2" opacity={.85-i*.04}/>)}
    <line x1="97" y1="116" x2="203" y2="116" stroke="#C9A84C" strokeWidth="1.2"/>
    <g transform="translate(240,90) rotate(30)"><rect x="0" y="0" width="24" height="6" rx="1" fill="#C9A84C" opacity=".6"/><rect x="20" y="-2" width="6" height="10" rx="1" fill="#C9A84C" opacity=".8"/></g>
  </svg>
);

const Cut3 = () => (
  <svg viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
    <rect width="300" height="340" fill="#0a0c0a"/>
    <defs>
      <radialGradient id="rg3" cx="60%" cy="35%" r="50%"><stop offset="0%" stopColor="#6B4C11" stopOpacity=".18"/><stop offset="100%" stopColor="#000" stopOpacity="0"/></radialGradient>
      <linearGradient id="tn1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E8C98E" stopOpacity=".9"/><stop offset="50%" stopColor="#C9A84C" stopOpacity=".6"/><stop offset="100%" stopColor="#8B6914" stopOpacity=".3"/></linearGradient>
    </defs>
    <rect width="300" height="340" fill="url(#rg3)"/>
    <ellipse cx="150" cy="132" rx="56" ry="64" fill="#1c1a1a"/>
    <ellipse cx="150" cy="100" rx="48" ry="36" fill="url(#tn1)"/>
    {[...Array(16)].map((_,i)=><line key={i} x1={106+i*2.9} y1="66" x2={118+i*2.9} y2="102" stroke="#E8C98E" strokeWidth="1.6" opacity={.8-Math.abs(i-8)*.05}/>)}
    <rect x="94" y="104" width="14" height="65" fill="#111" opacity=".95"/>
    <rect x="192" y="104" width="14" height="65" fill="#111" opacity=".95"/>
    <ellipse cx="95" cy="142" rx="6" ry="10" fill="#141414" stroke="#2a2a2a" strokeWidth=".8"/>
    <ellipse cx="205" cy="142" rx="6" ry="10" fill="#141414" stroke="#2a2a2a" strokeWidth=".8"/>
    <line x1="98" y1="116" x2="202" y2="116" stroke="#E8C98E" strokeWidth="1.5" opacity=".7"/>
    <line x1="120" y1="90" x2="128" y2="118" stroke="#fff" strokeWidth="1.2" opacity=".35"/>
    <rect x="126" y="196" width="48" height="34" fill="#1c1c1c"/>
    <g transform="translate(238,58) rotate(-18)"><rect x="0" y="0" width="30" height="8" rx="2" fill="#C9A84C" opacity=".5"/><rect x="28" y="-3" width="7" height="14" rx="1" fill="#E8C98E" opacity=".7"/></g>
  </svg>
);

// ── STYLES ────────────────────────────────────────────────────────────────────
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Cormorant+Garamond:ital,wght@1,400;1,600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{--bl:#070707;--card:#0f0f0f;--card2:#181818;--bdr:#1e1e1e;--gld:#C9A84C;--gld2:#E8C98E;--wh:#F5F0EB;--gr:#555;--gr2:#888;--red:#e74c3c;--wa:#25D366;}
    html{scroll-behavior:smooth;}
    body{background:var(--bl);color:var(--wh);font-family:'DM Sans',sans-serif;font-weight:300;overflow-x:hidden;}
    ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:var(--gld);}
    .bb{font-family:'Bebas Neue',sans-serif;letter-spacing:.04em;}
    .cm{font-family:'Cormorant Garamond',serif;font-style:italic;}
    .gld{color:var(--gld);}
    /* NAV */
    .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 40px;background:linear-gradient(to bottom,rgba(7,7,7,.97),transparent);backdrop-filter:blur(6px);border-bottom:1px solid rgba(201,168,76,.08);}
    .navlogo{cursor:pointer;display:flex;align-items:center;gap:10px;}
    .navlogo-img{width:44px;height:44px;object-fit:contain;}
    .navtxt{font-family:'Bebas Neue';font-size:14px;letter-spacing:.2em;color:var(--gld);line-height:1.15;}
    .navtxt small{display:block;font-size:8px;letter-spacing:.28em;color:var(--gr2);}
    .navlinks{display:flex;gap:24px;}
    .nl{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gr);cursor:pointer;background:none;border:none;font-family:'DM Sans';transition:color .2s;}
    .nl:hover,.nl.act{color:var(--wh);}
    .navcta{font-size:10px;letter-spacing:.18em;text-transform:uppercase;background:var(--gld);color:var(--bl);border:none;padding:10px 22px;cursor:pointer;font-family:'DM Sans';font-weight:600;transition:all .2s;}
    .navcta:hover{background:var(--gld2);}
    /* HERO */
    .hero{min-height:100vh;display:flex;align-items:center;padding:110px 40px 70px;position:relative;overflow:hidden;}
    .hbg{position:absolute;inset:0;background:radial-gradient(ellipse 55% 75% at 70% 50%,rgba(201,168,76,.06) 0%,transparent 60%);}
    .hline{position:absolute;top:0;right:30%;width:1px;height:100%;background:linear-gradient(to bottom,transparent,rgba(201,168,76,.1),transparent);}
    .hcont{position:relative;z-index:2;max-width:700px;}
    .hey{display:flex;align-items:center;gap:14px;margin-bottom:26px;}
    .heyl{width:36px;height:1px;background:var(--gld);}
    .heyt{font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--gld);}
    .hh1{font-family:'Bebas Neue';font-size:clamp(65px,10vw,138px);line-height:.88;color:var(--wh);margin-bottom:20px;}
    .hh1 span{color:var(--gld);}
    .hsub{font-family:'Cormorant Garamond';font-style:italic;font-size:20px;color:var(--gr2);margin-bottom:40px;line-height:1.5;max-width:440px;}
    .hact{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
    .btnp{background:var(--gld);color:var(--bl);border:none;padding:14px 34px;cursor:pointer;font-family:'DM Sans';font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;transition:all .25s;}
    .btnp:hover{background:var(--gld2);transform:translateY(-1px);}
    .btno{background:transparent;color:var(--wh);border:1px solid var(--bdr);padding:14px 34px;cursor:pointer;font-family:'DM Sans';font-size:10px;letter-spacing:.18em;text-transform:uppercase;transition:all .25s;}
    .btno:hover{border-color:var(--gld);color:var(--gld);}
    .hst{display:flex;gap:38px;margin-top:60px;padding-top:30px;border-top:1px solid var(--bdr);flex-wrap:wrap;}
    .stn{font-family:'Bebas Neue';font-size:40px;color:var(--gld);line-height:1;}
    .stl{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--gr);margin-top:3px;}
    /* SECTIONS */
    .sec{padding:80px 40px;}
    .stag{display:flex;align-items:center;gap:14px;margin-bottom:16px;}
    .stagl{width:28px;height:1px;background:var(--gld);}
    .stagt{font-size:9px;letter-spacing:.32em;text-transform:uppercase;color:var(--gld);}
    .sh2{font-family:'Bebas Neue';font-size:clamp(40px,5.2vw,68px);line-height:1;margin-bottom:12px;}
    .sdesc{color:var(--gr);font-size:14px;line-height:1.75;max-width:460px;}
    /* SERVICES */
    .sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:48px;border:1px solid var(--bdr);}
    .sc{background:var(--card);padding:36px 28px;border-right:1px solid var(--bdr);transition:background .25s;position:relative;overflow:hidden;}
    .sc:last-child{border-right:none;}
    .sc::before{content:'';position:absolute;bottom:0;left:0;width:0;height:2px;background:var(--gld);transition:width .45s;}
    .sc:hover::before{width:100%;}
    .sc:hover{background:var(--card2);}
    .sico{font-size:26px;margin-bottom:18px;}
    .snm{font-family:'Bebas Neue';font-size:26px;margin-bottom:9px;}
    .sds{font-size:13px;color:var(--gr);line-height:1.65;margin-bottom:18px;}
    .spr{font-family:'Bebas Neue';font-size:50px;color:var(--gld);}
    .spr span{font-family:'DM Sans';font-size:13px;color:var(--gr);}
    .stag2{display:inline-block;margin-top:10px;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--gld2);border:1px solid rgba(201,168,76,.2);padding:3px 10px;}
    /* ABOUT */
    .agrid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;}
    .ew{position:relative;height:520px;overflow:hidden;background:var(--card);border:1px solid var(--bdr);}
    .ew img{width:100%;height:100%;object-fit:cover;object-position:top center;}
    .ew-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(7,7,7,.88) 0%,rgba(7,7,7,.15) 55%,transparent 100%);}
    .ew-bd{position:absolute;bottom:0;left:0;right:0;padding:26px 26px 22px;z-index:2;}
    .ew-nm{font-family:'Bebas Neue';font-size:30px;letter-spacing:.06em;}
    .ew-rl{font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:var(--gld);margin-top:4px;}
    .ew-fl{font-size:18px;margin-top:5px;}
    .abadge{position:absolute;top:20px;right:0;background:var(--gld);color:var(--bl);padding:9px 16px;font-family:'Bebas Neue';font-size:11px;letter-spacing:.1em;z-index:2;}
    .aq{font-family:'Cormorant Garamond';font-style:italic;font-size:22px;line-height:1.45;color:var(--wh);margin-bottom:24px;}
    .aq::before{content:'"';color:var(--gld);}
    .aq::after{content:'"';color:var(--gld);}
    .at{font-size:13.5px;color:var(--gr);line-height:1.85;margin-bottom:13px;}
    .pills{display:flex;flex-wrap:wrap;gap:7px;margin-top:26px;}
    .pill{border:1px solid var(--bdr);padding:6px 16px;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--gr);}
    /* GALLERY */
    .ggrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:48px;}
    .gc{position:relative;overflow:hidden;background:var(--card);border:1px solid var(--bdr);cursor:pointer;transition:border-color .3s;}
    .gc:hover{border-color:var(--gld);}
    .gc-inner{height:340px;position:relative;}
    .gc-ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.1) 60%,transparent 100%);}
    .gc-info{position:absolute;bottom:0;left:0;right:0;padding:20px;z-index:2;}
    .gc-nm{font-family:'Bebas Neue';font-size:22px;color:var(--wh);}
    .gc-tg{font-size:11px;color:var(--gld);letter-spacing:.12em;text-transform:uppercase;margin-top:3px;}
    .gc-pr{font-family:'Bebas Neue';font-size:28px;color:var(--gld2);margin-top:5px;}
    .gc-sh{position:absolute;inset:0;background:rgba(201,168,76,.04);opacity:0;transition:opacity .3s;}
    .gc:hover .gc-sh{opacity:1;}
    /* REVIEWS */
    .rvg{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:34px;}
    .rvc{background:var(--card);border:1px solid var(--bdr);padding:24px;}
    .rvs{color:var(--gld);font-size:13px;margin-bottom:12px;}
    .rvt{font-size:13px;color:var(--gr);line-height:1.7;margin-bottom:16px;font-style:italic;}
    .rva{display:flex;align-items:center;gap:10px;}
    .rvav{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gld),#8B6914);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue';font-size:16px;color:var(--bl);}
    .rvnm{font-size:13px;font-weight:500;}
    .rvdt{font-size:10px;color:var(--gr);margin-top:2px;}
    .rvform{background:var(--card);border:1px solid var(--bdr);padding:32px;margin-top:32px;}
    .rvftit{font-family:'Bebas Neue';font-size:24px;margin-bottom:20px;}
    .starsel{display:flex;gap:5px;margin-bottom:16px;align-items:center;}
    .starsel button{font-size:24px;background:none;border:none;cursor:pointer;color:var(--bdr);transition:transform .15s;}
    .starsel button.on{color:var(--gld);}
    .starsel button:hover{transform:scale(1.2);}
    .fgrp{margin-bottom:14px;}
    .flbl{display:block;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gr);margin-bottom:7px;}
    .finp{width:100%;background:var(--card2);border:1px solid var(--bdr);color:var(--wh);padding:11px 14px;font-family:'DM Sans';font-size:13px;outline:none;transition:border-color .2s;resize:none;}
    .finp:focus{border-color:var(--gld);}
    .frow{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    /* BOOKING */
    .bsteps{display:flex;margin-bottom:34px;}
    .bstep{flex:1;text-align:center;padding:12px;border-bottom:2px solid var(--bdr);font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--gr);transition:all .3s;}
    .bstep.act{border-color:var(--gld);color:var(--gld);}
    .bstep.dn{border-color:var(--gld2);color:var(--gr2);}
    .bcard{background:var(--card);border:1px solid var(--bdr);padding:40px;}
    .bg3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;}
    .bg2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}
    .bopt{border:1px solid var(--bdr);padding:18px;cursor:pointer;transition:all .2s;}
    .bopt:hover{border-color:var(--gld2);}
    .bopt.sel{border-color:var(--gld);background:rgba(201,168,76,.05);}
    .boptT{font-size:13px;font-weight:500;margin-bottom:3px;}
    .boptS{font-size:11px;color:var(--gr);}
    .boptP{font-family:'Bebas Neue';font-size:26px;color:var(--gld);margin-top:7px;}
    .tgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
    .tslot{border:1px solid var(--bdr);padding:9px;text-align:center;cursor:pointer;font-size:12px;transition:all .2s;}
    .tslot:hover{border-color:var(--gld2);}
    .tslot.sel{border-color:var(--gld);color:var(--gld);background:rgba(201,168,76,.05);}
    .tslot.tak{opacity:.3;cursor:not-allowed;text-decoration:line-through;}
    .bnav{display:flex;justify-content:space-between;margin-top:26px;align-items:center;}
    /* GOOGLE CALENDAR CARD */
    .gcal{background:linear-gradient(135deg,#1a1f2e,#0f1319);border:1px solid rgba(66,133,244,.25);padding:18px 22px;display:flex;align-items:center;gap:14px;margin:18px 0;}
    .gcal-ico{width:38px;height:38px;border-radius:8px;background:#4285F4;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .gcal-tit{font-size:13px;font-weight:600;color:var(--wh);margin-bottom:2px;}
    .gcal-sub{font-size:11px;color:#888;}
    .gcal-btn{margin-left:auto;background:#4285F4;border:none;color:#fff;padding:8px 16px;cursor:pointer;font-family:'DM Sans';font-size:11px;font-weight:500;transition:background .2s;flex-shrink:0;}
    .gcal-btn:hover{background:#3367d6;}
    /* CONTACT */
    .cgrid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start;}
    .cinfo{margin-bottom:24px;}
    .clbl{font-size:10px;letter-spacing:.25em;text-transform:uppercase;color:var(--gld);margin-bottom:6px;}
    .cval{font-size:14px;color:var(--wh);line-height:1.65;}
    .mapframe{width:100%;height:420px;border:1px solid var(--bdr);filter:grayscale(1) invert(1) contrast(.85);display:block;transition:filter .3s;}
    .mapframe:hover{filter:grayscale(.5) invert(1) contrast(.9);}
    /* ADMIN */
    .adml{display:grid;grid-template-columns:196px 1fr;min-height:100vh;}
    .admsb{background:var(--card);border-right:1px solid var(--bdr);display:flex;flex-direction:column;}
    .admsbt{padding:22px 18px;border-bottom:1px solid var(--bdr);}
    .admsbi{width:50px;height:50px;object-fit:contain;margin-bottom:9px;}
    .admlt{font-family:'Bebas Neue';font-size:13px;letter-spacing:.1em;color:var(--gld);line-height:1.2;}
    .admls{font-size:8px;color:var(--gr);letter-spacing:.15em;margin-top:2px;}
    .admmnu{padding:14px 0;flex:1;}
    .admi{display:flex;align-items:center;gap:9px;padding:10px 18px;cursor:pointer;transition:all .2s;font-size:11px;color:var(--gr);border-left:2px solid transparent;background:none;border-right:none;border-top:none;border-bottom:none;width:100%;text-align:left;font-family:'DM Sans';}
    .admi:hover{color:var(--wh);background:rgba(255,255,255,.02);}
    .admi.act{color:var(--gld);border-left-color:var(--gld);background:rgba(201,168,76,.05);}
    .admc{padding:30px;background:var(--bl);overflow-y:auto;}
    .admh{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;}
    .admtit{font-family:'Bebas Neue';font-size:32px;}
    .admdt{font-size:10px;color:var(--gr);margin-top:2px;}
    .kg{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:20px;}
    .kc{background:var(--card);border:1px solid var(--bdr);padding:18px;position:relative;overflow:hidden;}
    .kc::after{content:'';position:absolute;bottom:0;left:0;width:100%;height:2px;background:var(--gld);}
    .kl{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--gr);margin-bottom:8px;}
    .kv{font-family:'Bebas Neue';font-size:32px;color:var(--wh);line-height:1;}
    .kch{font-size:11px;margin-top:5px;}
    .kch.up{color:#4CAF50;}.kch.dn{color:#f44336;}
    .card{background:var(--card);border:1px solid var(--bdr);padding:20px;margin-bottom:16px;}
    .cardt{font-family:'Bebas Neue';font-size:16px;margin-bottom:16px;color:var(--wh);}
    .tbl{width:100%;border-collapse:collapse;}
    .tbl th{text-align:left;font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--gr);padding-bottom:11px;border-bottom:1px solid var(--bdr);}
    .tbl td{padding:10px 0;border-bottom:1px solid rgba(28,28,28,.8);font-size:11px;color:var(--gr2);}
    .tbl td:first-child{color:var(--wh);}
    .badge{display:inline-block;padding:2px 8px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;}
    .badge.ok{background:rgba(76,175,80,.1);color:#4CAF50;border:1px solid rgba(76,175,80,.2);}
    .badge.pnd{background:rgba(201,168,76,.1);color:var(--gld);border:1px solid rgba(201,168,76,.2);}
    .badge.cn{background:rgba(244,67,54,.1);color:#f44336;border:1px solid rgba(244,67,54,.2);}
    /* CALENDAR GRID */
    .calg{display:grid;grid-template-columns:58px repeat(2,1fr);border:1px solid var(--bdr);}
    .calh{padding:10px 12px;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--gld);background:rgba(201,168,76,.05);border-bottom:1px solid var(--bdr);border-right:1px solid var(--bdr);}
    .calh:last-child{border-right:none;}
    .calt{padding:7px 10px;font-family:'Bebas Neue';font-size:16px;color:var(--gld);border-right:1px solid var(--bdr);border-bottom:1px solid rgba(28,28,28,.5);display:flex;align-items:flex-start;}
    .calcl{padding:5px 7px;border-right:1px solid var(--bdr);border-bottom:1px solid rgba(28,28,28,.5);min-height:52px;}
    .calcl:last-child{border-right:none;}
    .calev{background:rgba(201,168,76,.1);border-left:2px solid var(--gld);padding:5px 8px;margin-bottom:3px;}
    .calev-nm{font-size:11px;font-weight:500;color:var(--wh);}
    .calev-sv{font-size:10px;color:var(--gld);margin-top:1px;}
    .calem{font-size:10px;color:rgba(80,80,80,.5);font-style:italic;padding:7px 0 0 4px;}
    /* LOGIN */
    .lw{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px;background:radial-gradient(ellipse at 50% 40%,rgba(201,168,76,.04),transparent 60%);}
    .lc{background:var(--card);border:1px solid var(--bdr);padding:48px 40px;width:100%;max-width:400px;}
    .ll{display:flex;justify-content:center;margin-bottom:28px;}
    .ll img{width:72px;height:72px;object-fit:contain;}
    .ltit{font-family:'Bebas Neue';font-size:28px;text-align:center;margin-bottom:5px;}
    .lsub{text-align:center;font-size:11px;color:var(--gr);margin-bottom:32px;letter-spacing:.1em;}
    .lerr{background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);color:#e74c3c;padding:9px 14px;font-size:12px;margin-bottom:18px;text-align:center;}
    /* CHAT */
    .cfab{position:fixed;bottom:26px;right:26px;z-index:200;width:52px;height:52px;background:var(--gld);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 6px 22px rgba(201,168,76,.3);transition:all .2s;}
    .cfab:hover{background:var(--gld2);transform:translateY(-2px);}
    .cwin{position:fixed;bottom:90px;right:26px;z-index:200;width:340px;background:var(--card);border:1px solid var(--bdr);display:flex;flex-direction:column;box-shadow:0 18px 56px rgba(0,0,0,.6);}
    .chdr{padding:14px 18px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:10px;}
    .cavy{width:34px;height:34px;background:linear-gradient(135deg,var(--gld),#8B6914);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;}
    .cnm{font-size:13px;font-weight:500;}
    .cst{font-size:10px;color:#4CAF50;}
    .cmsgs{flex:1;padding:14px;overflow-y:auto;max-height:300px;display:flex;flex-direction:column;gap:8px;}
    .msg{max-width:82%;}
    .msg.usr{align-self:flex-end;}
    .msg.ast{align-self:flex-start;}
    .mbub{padding:9px 13px;font-size:13px;line-height:1.55;}
    .msg.usr .mbub{background:var(--gld);color:var(--bl);}
    .msg.ast .mbub{background:var(--card2);color:var(--wh);border:1px solid var(--bdr);}
    .tdots{display:flex;gap:4px;align-items:center;padding:10px 13px;background:var(--card2);border:1px solid var(--bdr);width:fit-content;}
    .td{width:6px;height:6px;background:var(--gld);border-radius:50%;animation:tb 1.2s infinite;}
    .td:nth-child(2){animation-delay:.2s;}.td:nth-child(3){animation-delay:.4s;}
    @keyframes tb{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}
    .cinrow{display:flex;border-top:1px solid var(--bdr);}
    .cinp{flex:1;background:transparent;border:none;outline:none;padding:12px 15px;color:var(--wh);font-family:'DM Sans';font-size:13px;}
    .csnd{background:var(--gld);border:none;cursor:pointer;padding:0 15px;color:var(--bl);font-size:14px;transition:background .2s;}
    .csnd:hover{background:var(--gld2);}
    /* FOOTER */
    .foot{border-top:1px solid var(--bdr);padding:36px 40px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;}
    .flog{font-family:'Bebas Neue';font-size:13px;letter-spacing:.15em;color:var(--gld);}
    .flog small{display:block;font-size:8px;color:var(--gr);letter-spacing:.2em;margin-top:2px;}
    .fcpy{font-size:11px;color:var(--gr);}
    .flnks{display:flex;gap:18px;}
    .fl{font-size:10px;color:var(--gr);cursor:pointer;letter-spacing:.1em;text-transform:uppercase;transition:color .2s;background:none;border:none;font-family:'DM Sans';}
    .fl:hover{color:var(--gld);}
    @media(max-width:768px){
      .nav{padding:12px 18px;}.navlinks{display:none;}
      .sec{padding:52px 18px;}.agrid,.cgrid{grid-template-columns:1fr;}
      .rvg{grid-template-columns:1fr;}.kg{grid-template-columns:1fr 1fr;}
      .ggrid,.sgrid{grid-template-columns:1fr;}.hst{gap:18px;}
      .frow,.bg2,.bg3{grid-template-columns:1fr;}.adml{grid-template-columns:1fr;}.admsb{display:none;}
    }
  `}</style>
);

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]     = useState("home");
  const [loggedIn, setLI]   = useState(false);
  const [lf, setLf]         = useState({ u:"", p:"", err:"" });
  const [chatOpen, setCO]   = useState(false);
  const [msgs, setMsgs]     = useState([{ role:"assistant", content:"¡Buenas! Soy Monk 💈 ¿En qué te ayudo?" }]);
  const [inp, setInp]       = useState("");
  const [typing, setTyping] = useState(false);
  const [bStep, setBStep]   = useState(1);
  const [bk, setBk]         = useState({ service:"", barber:"", date:"", time:"", name:"", phone:"" });
  const [admTab, setAT]     = useState("dashboard");
  const [reviews, setRvs]   = useState(()=> LS.get("bbm_rv") || INIT_RVS);
  const [appts, setApts]    = useState(()=> LS.get("bbm_ap") || INIT_APPTS);
  const [nxId, setNxId]     = useState(()=> LS.get("bbm_id") || 6);
  const [nrv, setNrv]       = useState({ stars:0, text:"", name:"", hov:0 });
  const [rvOk, setRvOk]     = useState(false);
  const [lastApt, setLA]    = useState(null);
  const botRef = useRef(null);

  useEffect(()=>{ botRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs,typing]);

  const saveAp = (a)=>{ setApts(a); LS.set("bbm_ap",a); };
  const saveRv = (r)=>{ setRvs(r);  LS.set("bbm_rv",r); };

  const sendChat = useCallback(async()=>{
    if(!inp.trim()||typing) return;
    const txt=inp.trim(); setInp("");
    const up=[...msgs,{role:"user",content:txt}]; setMsgs(up); setTyping(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,system:SYSTEM,
          messages:up.map(m=>({role:m.role,content:m.content}))})
      });
      const d=await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:d.content?.[0]?.text||"Error. WhatsApp: 641 856 656 💈"}]);
    }catch{
      setMsgs(p=>[...p,{role:"assistant",content:"Error de conexión. WhatsApp: +34 641 856 656 💈"}]);
    }finally{ setTyping(false); }
  },[inp,msgs,typing]);

  const submitRv=()=>{
    if(!nrv.stars||!nrv.name.trim()) return;
    const rv={name:nrv.name,stars:nrv.stars,text:nrv.text||"¡Excelente servicio!",date:"Ahora mismo"};
    saveRv([rv,...reviews]); setNrv({stars:0,text:"",name:"",hov:0}); setRvOk(true);
    setTimeout(()=>setRvOk(false),3000);
  };

  const submitB=()=>{
    if(!bk.name||!bk.phone) return;
    const a={id:nxId,client:bk.name,phone:bk.phone,service:bk.service,barber:bk.barber,date:bk.date,time:bk.time,status:"pending"};
    saveAp([...appts,a]); LS.set("bbm_id",nxId+1); setNxId(n=>n+1); setLA(a); setBStep(4);
  };

  const getTimes=()=>{
    if(!bk.date) return [];
    const day=new Date(bk.date).getDay();
    const pool=day===6?HOURS_SA:(day===0||day===1)?[]:HOURS_WD;
    const taken=appts.filter(a=>a.date===bk.date&&a.barber===bk.barber).map(a=>a.time);
    return pool.map(t=>({time:t,taken:taken.includes(t)}));
  };

  const avg=reviews.length?(reviews.reduce((s,r)=>s+r.stars,0)/reviews.length).toFixed(1):"5.0";

  const doLogin=()=>{
    if(lf.u===ADMIN_USER&&lf.p===ADMIN_PASS){ setLI(true); setLf(f=>({...f,err:""})); }
    else setLf(f=>({...f,err:"Usuario o contraseña incorrectos"}));
  };

  const todayApts = appts.filter(a=>a.date===TODAY);

  return (<>
    <G/>

    {/* NAV */}
    {view!=="admin"&&(
      <nav className="nav">
        <div className="navlogo" onClick={()=>setView("home")}>
          <img src="/logo.png" alt="BBM" className="navlogo-img" style={{filter:"brightness(0.85) sepia(0.5) saturate(2) hue-rotate(5deg)"}}/>
          <div className="navtxt">BARBER BROTHERS<small>MONASTERY · ONTINYENT</small></div>
        </div>
        {view==="home"&&(
          <div className="navlinks">
            {[["Servicios","servicios"],["Nosotros","nosotros"],["Galería","galeria"],["Opiniones","opiniones"],["Contacto","contacto"]].map(([l,id])=>(
              <button key={id} className="nl" onClick={()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"})}>{l}</button>
            ))}
            <button className="nl" onClick={()=>setView("admin")}>🔐 Admin</button>
          </div>
        )}
        <button className="navcta" onClick={()=>setView("booking")}>Reservar Cita</button>
      </nav>
    )}

    {/* ═══ HOME ═══════════════════════════════════════════════════════════ */}
    {view==="home"&&(<>
      {/* HERO */}
      <section className="hero">
        <div className="hbg"/><div className="hline"/>
        <div style={{position:"absolute",right:"3%",top:"50%",transform:"translateY(-50%)",opacity:.06,pointerEvents:"none"}}>
          <img src="/logo.png" alt="" style={{width:400,height:400,objectFit:"contain"}}/>
        </div>
        <div className="hcont">
          <div className="hey"><div className="heyl"/><span className="heyt">Ontinyent, Valencia · Est. 2019</span></div>
          <h1 className="hh1 bb">BARBER<br/><span>BROTHERS</span><br/>MONASTERY</h1>
          <p className="hsub">Dos hermanos. Una pasión. El mejor corte de Ontinyent.</p>
          <div className="hact">
            <button className="btnp" onClick={()=>setView("booking")}>Reservar Ahora</button>
            <button className="btno" onClick={()=>document.getElementById("servicios")?.scrollIntoView({behavior:"smooth"})}>Servicios</button>
            <button className="btno" style={{borderColor:"var(--wa)",color:"var(--wa)"}} onClick={()=>window.open("https://wa.me/34641856656","_blank")}>💬 WhatsApp</button>
          </div>
          <div className="hst">
            <div><div className="stn">{avg}★</div><div className="stl">Valoración media</div></div>
            <div><div className="stn">+1K</div><div className="stl">Clientes</div></div>
            <div><div className="stn">6+</div><div className="stl">Años exp.</div></div>
            <div><div className="stn">13€</div><div className="stl">Desde</div></div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="servicios" className="sec" style={{paddingTop:36}}>
        <div className="stag"><div className="stagl"/><span className="stagt">Servicios y precios</span></div>
        <h2 className="sh2 bb">CALIDAD<br/>A BUEN PRECIO</h2>
        <p className="sdesc">Tres servicios, tres niveles de precisión. Sin rodeos.</p>
        <div className="sgrid">
          {SERVICES.map((s,i)=>(
            <div key={i} className="sc">
              <div className="sico">{s.icon}</div>
              <div className="snm bb">{s.name}</div>
              <div className="sds">{s.desc}</div>
              <div className="spr bb">{s.price}€ <span>/ {s.time}</span></div>
              <div className="stag2">{s.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT — Edwin */}
      <section id="nosotros" className="sec">
        <div className="agrid">
          <div className="ew">
            <img src="/edwin.png" alt="Edwin Silva"/>
            <div className="ew-ov"/>
            <div className="abadge">ONTINYENT · VLC</div>
            <div className="ew-bd">
              <div className="ew-nm bb">EDWIN SILVA</div>
              <div className="ew-rl">Fundador · Barber Brothers Monastery</div>
              <div className="ew-fl">🇨🇴 Colombia</div>
            </div>
          </div>
          <div>
            <div className="stag"><div className="stagl"/><span className="stagt">Nuestra historia</span></div>
            <h2 className="sh2 bb">NACIDO EN<br/><span className="gld">COLOMBIA,</span><br/>CRIADO CON<br/>LAS TIJERAS.</h2>
            <p className="aq">No cortamos pelo. Construimos identidades.</p>
            <p className="at">Edwin nació en Colombia con una pasión que nunca dudó: cortar el pelo. Desde pequeño soñaba con ser peluquero profesional, y no paró hasta conseguirlo. Junto a su hermano, cruzaron el Atlántico y pusieron raíces en Ontinyent, Valencia.</p>
            <p className="at">Hoy, Barber Brothers Monastery es mucho más que una barbería. Es el sitio donde el barrio se reúne, donde cada cliente sale con un corte limpio y una sonrisa. Precio justo, trabajo de calidad, trato de familia.</p>
            <div className="pills">
              {["Colombia","Ontinyent","Familia","Precisión","Flow","Urbano"].map(t=>(
                <span key={t} className="pill">{t}</span>
              ))}
            </div>
            <div style={{display:"flex",gap:12,marginTop:24,flexWrap:"wrap"}}>
              <button className="btnp" onClick={()=>window.open("https://www.instagram.com/barber_shop_monastery/","_blank")}>📸 Instagram</button>
              <button className="btno" onClick={()=>window.open("https://wa.me/34641856656","_blank")}>💬 WhatsApp</button>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY — 3 cortes */}
      <section id="galeria" className="sec" style={{paddingTop:0}}>
        <div className="stag"><div className="stagl"/><span className="stagt">Nuestro trabajo</span></div>
        <h2 className="sh2 bb">3 CORTES<br/>SIGNATURE</h2>
        <p className="sdesc">Inspirados en @barber_shop_monastery. Tres estilos, tres niveles.</p>
        <div className="ggrid">
          {[
            {Comp:Cut1,name:"CORTE + CEJAS",tag:"El más pedido",price:"13€"},
            {Comp:Cut2,name:"CORTE + BARBA",tag:"Degradado + navaja",price:"15€"},
            {Comp:Cut3,name:"TINTE PREMIUM",tag:"Transformación total",price:"25€"},
          ].map(({Comp,name,tag,price},i)=>(
            <div key={i} className="gc">
              <div className="gc-inner">
                <Comp/>
                <div className="gc-sh"/>
                <div className="gc-ov"/>
                <div className="gc-info">
                  <div className="gc-nm bb">{name}</div>
                  <div className="gc-tg">{tag}</div>
                  <div className="gc-pr bb">{price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:22}}>
          <button className="btno" onClick={()=>window.open("https://www.instagram.com/barber_shop_monastery/","_blank")}>
            Ver más en @barber_shop_monastery →
          </button>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="opiniones" className="sec" style={{paddingTop:0}}>
        <div className="stag"><div className="stagl"/><span className="stagt">Opiniones reales</span></div>
        <h2 className="sh2 bb">LO QUE<br/>DICEN</h2>
        <div className="rvg">
          {reviews.slice(0,3).map((r,i)=>(
            <div key={i} className="rvc">
              <div className="rvs">{"★".repeat(r.stars)}{"☆".repeat(5-r.stars)}</div>
              <p className="rvt">"{r.text}"</p>
              <div className="rva"><div className="rvav">{r.name[0]}</div><div><div className="rvnm">{r.name}</div><div className="rvdt">{r.date}</div></div></div>
            </div>
          ))}
        </div>
        <div className="rvform">
          <div className="rvftit bb">DEJA TU OPINIÓN</div>
          <div className="fgrp">
            <label className="flbl">Puntuación *</label>
            <div className="starsel">
              {[1,2,3,4,5].map(n=>(
                <button key={n} className={(nrv.hov||nrv.stars)>=n?"on":""}
                  onMouseEnter={()=>setNrv(r=>({...r,hov:n}))} onMouseLeave={()=>setNrv(r=>({...r,hov:0}))}
                  onClick={()=>setNrv(r=>({...r,stars:n}))}>★</button>
              ))}
              {nrv.stars>0&&<span style={{fontSize:12,color:"var(--gld)",marginLeft:8}}>{["","Malo","Regular","Bueno","Muy bueno","¡Excelente!"][nrv.stars]}</span>}
            </div>
          </div>
          <div className="frow">
            <div className="fgrp"><label className="flbl">Tu nombre *</label><input className="finp" placeholder="Nombre" value={nrv.name} onChange={e=>setNrv(r=>({...r,name:e.target.value}))}/></div>
            <div className="fgrp"><label className="flbl">Servicio</label>
              <select className="finp" style={{cursor:"pointer"}} onChange={e=>setNrv(r=>({...r,svc:e.target.value}))}>
                <option value="">Seleccionar...</option>
                {SERVICES.map(s=><option key={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="fgrp"><label className="flbl">Comentario</label><textarea className="finp" rows={3} placeholder="Cuéntanos tu experiencia..." value={nrv.text} onChange={e=>setNrv(r=>({...r,text:e.target.value}))}/></div>
          {rvOk
            ? <div style={{background:"rgba(76,175,80,.1)",border:"1px solid rgba(76,175,80,.3)",padding:"12px 16px",color:"#4CAF50",fontSize:13}}>✅ ¡Gracias por tu valoración! Ya está publicada.</div>
            : <button className="btnp" onClick={submitRv} style={{opacity:nrv.stars&&nrv.name?1:.4}}>Publicar Opinión →</button>
          }
        </div>
      </section>

      {/* CONTACT + MAP */}
      <section id="contacto" className="sec" style={{paddingTop:0}}>
        <div className="stag"><div className="stagl"/><span className="stagt">Visítanos</span></div>
        <h2 className="sh2 bb">ESTAMOS EN<br/>ONTINYENT</h2>
        <div className="cgrid" style={{marginTop:40}}>
          <div>
            <div className="cinfo"><div className="clbl">Dirección</div><div className="cval">Avinguda de Daniel Gil, 40<br/>46870 Ontinyent, Valencia</div></div>
            <div className="cinfo">
              <div className="clbl">Horario</div>
              <div className="cval" style={{fontSize:13}}>
                <div style={{display:"grid",gridTemplateColumns:"120px 1fr",rowGap:"5px"}}>
                  <span style={{color:"var(--gr)"}}>Lunes</span><span style={{color:"var(--red)"}}>Cerrado</span>
                  <span style={{color:"var(--gr)"}}>Mar – Vie</span><span>10:00–14:00 / 16:00–20:00</span>
                  <span style={{color:"var(--gr)"}}>Sábado</span><span>09:00–14:00</span>
                  <span style={{color:"var(--gr)"}}>Domingo</span><span style={{color:"var(--red)"}}>Cerrado</span>
                </div>
              </div>
            </div>
            <div className="cinfo"><div className="clbl">Teléfono / WhatsApp</div><div className="cval">+34 641 856 656</div></div>
            <div className="cinfo">
              <div className="clbl">Instagram</div>
              <div className="cval" style={{cursor:"pointer",color:"var(--gld)"}} onClick={()=>window.open("https://www.instagram.com/barber_shop_monastery/","_blank")}>@barber_shop_monastery</div>
            </div>
            <button className="btnp" style={{marginTop:10,width:"100%"}} onClick={()=>window.open("https://maps.app.goo.gl/v3HLdgzkhj37ew6L7","_blank")}>
              📍 Abrir en Google Maps
            </button>
          </div>
          <div>
            <iframe title="Barber Brothers Monastery" className="mapframe"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3109.4!2d-0.6095!3d38.8221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDQ5JzE5LjYiTiAwwrAzNiczy4AzNi4yIlc!5e0!3m2!1ses!2ses!4v1715000000000!5m2!1ses!2ses"
              style={{border:0}} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
            <p style={{fontSize:10,color:"var(--gr)",marginTop:7,textAlign:"center",letterSpacing:".1em"}}>📍 Avinguda de Daniel Gil, 40 · 46870 Ontinyent, Valencia</p>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section style={{padding:"48px 40px",background:"var(--card)",borderTop:"1px solid var(--bdr)",borderBottom:"1px solid var(--bdr)"}}>
        <div style={{maxWidth:580,margin:"0 auto",textAlign:"center"}}>
          <p className="cm" style={{fontSize:18,color:"var(--gr2)",marginBottom:11}}>¿Listo para tu próxima transformación?</p>
          <h2 className="bb" style={{fontSize:"clamp(40px,5vw,66px)",marginBottom:22}}>RESERVA EN<br/><span className="gld">ONTINYENT</span></h2>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btnp" onClick={()=>setView("booking")}>Reservar Online</button>
            <button className="btno" style={{borderColor:"var(--wa)",color:"var(--wa)"}} onClick={()=>window.open("https://wa.me/34641856656","_blank")}>💬 WhatsApp</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/logo.png" alt="BBM" style={{width:34,height:34,objectFit:"contain",filter:"brightness(.8) sepia(.5) saturate(2)"}}/>
          <div className="flog">BARBER BROTHERS<small>MONASTERY · ONTINYENT, VLC</small></div>
        </div>
        <div className="fcpy">© 2025 Barber Brothers Monastery · Edwin Silva</div>
        <div className="flnks">
          <button className="fl" onClick={()=>window.open("https://www.instagram.com/barber_shop_monastery/","_blank")}>Instagram</button>
          <button className="fl" onClick={()=>window.open("https://wa.me/34641856656","_blank")}>WhatsApp</button>
          <button className="fl" onClick={()=>setView("booking")}>Reservar</button>
        </div>
      </footer>
    </>)}

    {/* ═══ BOOKING ════════════════════════════════════════════════════════ */}
    {view==="booking"&&(
      <div style={{minHeight:"100vh",paddingTop:80,paddingBottom:80}}>
        <div className="sec">
          <button className="nl" style={{color:"var(--gld)",fontSize:11,marginBottom:12}} onClick={()=>setView("home")}>← Volver</button>
          <div className="stag"><div className="stagl"/><span className="stagt">Reservas online</span></div>
          <h2 className="sh2 bb" style={{marginBottom:28}}>RESERVA TU CITA</h2>
          <div style={{maxWidth:720,margin:"0 auto"}}>
            <div className="bsteps">
              {["Servicio","Barbero & Hora","Tus datos"].map((s,i)=>(
                <div key={i} className={`bstep ${bStep>i+1?"dn":""} ${bStep===i+1?"act":""}`}>{bStep>i+1?"✓ ":""}{s}</div>
              ))}
            </div>
            <div className="bcard">
              {bStep===1&&(<>
                <h3 className="bb" style={{fontSize:22,marginBottom:16}}>ELIGE SERVICIO</h3>
                <div className="bg3">
                  {SERVICES.map((s,i)=>(
                    <div key={i} className={`bopt ${bk.service===s.name?"sel":""}`} onClick={()=>setBk(b=>({...b,service:s.name}))}>
                      <div style={{fontSize:20,marginBottom:7}}>{s.icon}</div>
                      <div className="boptT">{s.name}</div>
                      <div className="boptS">{s.time}</div>
                      <div className="boptP bb">{s.price}€</div>
                    </div>
                  ))}
                </div>
                <div className="bnav"><span/><button className="btnp" onClick={()=>bk.service&&setBStep(2)} style={{opacity:bk.service?1:.4}}>Siguiente →</button></div>
              </>)}
              {bStep===2&&(<>
                <h3 className="bb" style={{fontSize:22,marginBottom:16}}>BARBERO & HORA</h3>
                <div className="bg2">
                  {BARBERS.map((b,i)=>(
                    <div key={i} className={`bopt ${bk.barber===b.name?"sel":""}`} onClick={()=>setBk(bk=>({...bk,barber:b.name,time:""}))}>
                      <div style={{fontSize:20,marginBottom:6}}>{i===0?"✂️":"💈"}</div>
                      <div className="boptT">{b.name}</div>
                      <div className="boptS">{b.spec}</div>
                      <div style={{fontSize:10,color:"var(--gld)",marginTop:3,letterSpacing:".1em"}}>{b.role}</div>
                    </div>
                  ))}
                </div>
                <div className="fgrp"><label className="flbl">Fecha</label>
                  <input type="date" className="finp" value={bk.date} min={new Date().toISOString().split("T")[0]} onChange={e=>setBk(b=>({...b,date:e.target.value,time:""}))}/>
                </div>
                {bk.date&&bk.barber&&(<>
                  <label className="flbl" style={{marginBottom:9,display:"block"}}>Horario disponible</label>
                  {getTimes().length===0
                    ? <p style={{color:"var(--gr)",fontSize:13}}>Sin horario disponible (Lun/Dom cerrado).</p>
                    : <div className="tgrid" style={{marginBottom:16}}>
                        {getTimes().map(({time,taken})=>(
                          <div key={time} className={`tslot ${bk.time===time?"sel":""} ${taken?"tak":""}`} onClick={()=>!taken&&setBk(b=>({...b,time}))}>
                            {time}{taken?" ✗":""}
                          </div>
                        ))}
                      </div>
                  }
                </>)}
                <div className="bnav">
                  <button className="btno" onClick={()=>setBStep(1)}>← Anterior</button>
                  <button className="btnp" onClick={()=>bk.barber&&bk.time&&setBStep(3)} style={{opacity:bk.barber&&bk.time?1:.4}}>Siguiente →</button>
                </div>
              </>)}
              {bStep===3&&(<>
                <h3 className="bb" style={{fontSize:22,marginBottom:16}}>TUS DATOS</h3>
                <div style={{background:"rgba(201,168,76,.05)",border:"1px solid rgba(201,168,76,.2)",padding:16,marginBottom:20}}>
                  <p style={{fontSize:11,color:"var(--gld)",marginBottom:5,letterSpacing:".12em"}}>RESUMEN</p>
                  <p style={{fontSize:14}}>💈 {bk.service} con {bk.barber}</p>
                  <p style={{fontSize:13,color:"var(--gr)",marginTop:3}}>📅 {bk.date} · {bk.time}</p>
                </div>
                <div className="frow">
                  <div className="fgrp"><label className="flbl">Nombre *</label><input className="finp" placeholder="Tu nombre" value={bk.name} onChange={e=>setBk(b=>({...b,name:e.target.value}))}/></div>
                  <div className="fgrp"><label className="flbl">Teléfono *</label><input className="finp" placeholder="+34 6XX XXX XXX" value={bk.phone} onChange={e=>setBk(b=>({...b,phone:e.target.value}))}/></div>
                </div>
                <div className="bnav">
                  <button className="btno" onClick={()=>setBStep(2)}>← Anterior</button>
                  <button className="btnp" onClick={submitB} style={{opacity:bk.name&&bk.phone?1:.4}}>Confirmar Cita ✓</button>
                </div>
              </>)}
              {bStep===4&&lastApt&&(
                <div style={{textAlign:"center",padding:"28px 0"}}>
                  <div style={{fontSize:52,marginBottom:16}}>✅</div>
                  <h3 className="bb" style={{fontSize:30,color:"var(--gld)",marginBottom:9}}>¡CITA ENVIADA!</h3>
                  <p style={{color:"var(--gr)",marginBottom:7}}>Gracias, {lastApt.client}.</p>
                  <p style={{fontSize:15}}>💈 {lastApt.service} con {lastApt.barber}</p>
                  <p style={{fontSize:13,color:"var(--gr)",margin:"5px 0 22px"}}>📅 {lastApt.date} · {lastApt.time}</p>
                  {/* GOOGLE CALENDAR CARD */}
                  <div className="gcal" style={{textAlign:"left",maxWidth:420,margin:"0 auto 20px"}}>
                    <div className="gcal-ico">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                    </div>
                    <div style={{flex:1}}>
                      <div className="gcal-tit">Añadir a Google Calendar</div>
                      <div className="gcal-sub">Edwin recibirá la cita en su calendario</div>
                    </div>
                    <button className="gcal-btn" onClick={()=>window.open(makeGCalLink(lastApt),"_blank")}>+ Añadir →</button>
                  </div>
                  <div style={{display:"flex",gap:11,justifyContent:"center",flexWrap:"wrap"}}>
                    <button className="btnp" onClick={()=>window.open(`https://wa.me/34641856656?text=${encodeURIComponent("Hola! He reservado:\n💈 "+lastApt.service+" con "+lastApt.barber+"\n📅 "+lastApt.date+" a las "+lastApt.time+"\nSoy "+lastApt.client+" 🙏")}`, "_blank")}>
                      💬 Confirmar WhatsApp
                    </button>
                    <button className="btno" onClick={()=>{setView("home");setBStep(1);setBk({service:"",barber:"",date:"",time:"",name:"",phone:""});setLA(null);}}>
                      Volver al inicio
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ═══ ADMIN LOGIN ════════════════════════════════════════════════════ */}
    {view==="admin"&&!loggedIn&&(
      <div className="lw">
        <div className="lc">
          <div className="ll"><img src="/logo.png" alt="BBM" style={{filter:"brightness(.8) sepia(.5) saturate(2)"}}/></div>
          <div className="ltit bb">ACCESO ADMIN</div>
          <div className="lsub">BARBER BROTHERS MONASTERY</div>
          {lf.err&&<div className="lerr">{lf.err}</div>}
          <div className="fgrp"><label className="flbl">Usuario</label>
            <input className="finp" placeholder="usuario" value={lf.u} onChange={e=>setLf(f=>({...f,u:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
          </div>
          <div className="fgrp"><label className="flbl">Contraseña</label>
            <input className="finp" type="password" placeholder="••••••••" value={lf.p} onChange={e=>setLf(f=>({...f,p:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
          </div>
          <button className="btnp" style={{width:"100%",marginTop:6}} onClick={doLogin}>Entrar →</button>
          <div style={{textAlign:"center",marginTop:18}}><button className="fl" onClick={()=>setView("home")}>← Volver a la web</button></div>
        </div>
      </div>
    )}

    {/* ═══ ADMIN PANEL ════════════════════════════════════════════════════ */}
    {view==="admin"&&loggedIn&&(
      <div className="adml">
        <aside className="admsb">
          <div className="admsbt">
            <img src="/logo.png" alt="BBM" className="admsbi" style={{filter:"brightness(.8) sepia(.5) saturate(2)"}}/>
            <div className="admlt bb">BARBER BROTHERS</div>
            <div className="admls">Edwin · Panel Admin</div>
          </div>
          <div className="admmnu">
            {[
              {id:"dashboard",icon:"📊",label:"Dashboard"},
              {id:"calendar",icon:"📅",label:"Google Calendar"},
              {id:"clients",icon:"👥",label:"Clientes y Citas"},
              {id:"reviews_adm",icon:"⭐",label:"Valoraciones"},
              {id:"revenue",icon:"💰",label:"Ingresos"},
            ].map(m=>(
              <button key={m.id} className={`admi ${admTab===m.id?"act":""}`} onClick={()=>setAT(m.id)}>
                <span>{m.icon}</span>{m.label}
              </button>
            ))}
            <div style={{margin:"16px 0",padding:"0 18px"}}><div style={{height:1,background:"var(--bdr)"}}/></div>
            <button className="admi" onClick={()=>window.open("https://calendar.google.com","_blank")}><span>🗓️</span>Abrir Google Cal.</button>
            <button className="admi" onClick={()=>window.open("https://wa.me/34641856656","_blank")}><span>💬</span>WhatsApp</button>
            <div style={{margin:"16px 0",padding:"0 18px"}}><div style={{height:1,background:"var(--bdr)"}}/></div>
            <button className="admi" onClick={()=>setView("home")}>← Web pública</button>
            <button className="admi" onClick={()=>{setLI(false);setView("home");}}>🔒 Cerrar sesión</button>
          </div>
        </aside>

        <main className="admc">
          {/* DASHBOARD */}
          {admTab==="dashboard"&&(<>
            <div className="admh">
              <div><div className="admtit bb">DASHBOARD</div><div className="admdt">Hoy · {new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</div></div>
              <button className="btnp" style={{fontSize:10}} onClick={()=>setView("booking")}>+ Nueva Cita</button>
            </div>
            <div className="kg">
              {[
                {l:"Citas Hoy",v:todayApts.length,c:"programadas",up:true},
                {l:"Confirmadas",v:todayApts.filter(a=>a.status==="confirmed").length,c:"de hoy",up:true},
                {l:"Pendientes",v:appts.filter(a=>a.status==="pending").length,c:"por confirmar",up:false},
                {l:"Media",v:`${avg}★`,c:`${reviews.length} opiniones`,up:true},
              ].map((k,i)=>(
                <div key={i} className="kc">
                  <div className="kl">{k.l}</div>
                  <div className="kv bb">{k.v}</div>
                  <div className={`kch ${k.up?"up":"dn"}`}>{k.c}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="cardt bb">CITAS DE HOY — {TODAY}</div>
              {todayApts.length===0
                ? <p style={{color:"var(--gr)",fontSize:13}}>No hay citas para hoy.</p>
                : <table className="tbl">
                    <thead><tr><th>Cliente</th><th>Servicio</th><th>Barbero</th><th>Hora</th><th>Estado</th><th>📅 Cal</th></tr></thead>
                    <tbody>
                      {todayApts.sort((a,b)=>a.time.localeCompare(b.time)).map((a,i)=>(
                        <tr key={i}>
                          <td>{a.client}</td><td>{a.service}</td><td>{a.barber}</td>
                          <td style={{fontFamily:"Bebas Neue",fontSize:18,color:"var(--gld)"}}>{a.time}</td>
                          <td><span className={`badge ${a.status==="confirmed"?"ok":a.status==="pending"?"pnd":"cn"}`}>
                            {a.status==="confirmed"?"✓ OK":a.status==="pending"?"⏳":"✗"}
                          </span></td>
                          <td>
                            <button style={{background:"#4285F4",border:"none",color:"#fff",padding:"4px 10px",cursor:"pointer",fontSize:10,fontFamily:"DM Sans"}}
                              onClick={()=>window.open(makeGCalLink(a),"_blank")}>+ Añadir</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:14}}>
              <div className="card">
                <div className="cardt bb">INGRESOS MENSUALES</div>
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart data={REV_DATA}>
                    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A84C" stopOpacity={.3}/><stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="month" tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:"#161616",border:"1px solid #222",borderRadius:0,color:"#F5F0EB",fontSize:11}}/>
                    <Area type="monotone" dataKey="rev" stroke="#C9A84C" strokeWidth={2} fill="url(#g1)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <div className="cardt bb">CITAS / MES</div>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={REV_DATA}>
                    <XAxis dataKey="month" tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:"#555",fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:"#161616",border:"1px solid #222",borderRadius:0,color:"#F5F0EB",fontSize:11}}/>
                    <Bar dataKey="citas" fill="#C9A84C" opacity={.75} radius={[2,2,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>)}

          {/* GOOGLE CALENDAR */}
          {admTab==="calendar"&&(<>
            <div className="admh">
              <div><div className="admtit bb">AGENDA · GOOGLE CALENDAR</div><div className="admdt">Vista por horas de todas las citas</div></div>
              <button className="btnp" style={{fontSize:10,background:"#4285F4"}} onClick={()=>window.open("https://calendar.google.com","_blank")}>
                🗓️ Abrir Google Calendar
              </button>
            </div>
            <div style={{background:"linear-gradient(135deg,#1a1f2e,#0f1319)",border:"1px solid rgba(66,133,244,.2)",padding:18,marginBottom:18,display:"flex",gap:14,alignItems:"flex-start"}}>
              <div style={{fontSize:28,flexShrink:0}}>🗓️</div>
              <div>
                <p style={{fontSize:13,fontWeight:600,color:"var(--wh)",marginBottom:4}}>Cómo funciona la sincronización</p>
                <p style={{fontSize:12,color:"var(--gr2)",lineHeight:1.75}}>
                  Cuando alguien reserva, aparece el botón <strong style={{color:"#4285F4"}}>+ Añadir a Google Calendar</strong>.
                  Al pulsarlo, se crea un evento en el calendario de Edwin con nombre del cliente, servicio, hora exacta y ubicación de la barbería.
                  Abajo puedes añadir todas las citas de hoy de una vez.
                </p>
              </div>
            </div>
            <div className="card">
              <div className="cardt bb" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>📅 HOY — {TODAY}</span>
                <span style={{fontSize:11,color:"var(--gr)"}}>Mar–Vie 10:00–20:00 · Sáb 9:00–14:00</span>
              </div>
              <div className="calg">
                <div className="calh">HORA</div>
                <div className="calh">✂️ EDWIN SILVA</div>
                <div className="calh">💈 SU HERMANO</div>
                {ALL_TIMES.map(t=>{
                  const eA=appts.find(a=>a.date===TODAY&&a.time===t&&a.barber==="Edwin Silva");
                  const bA=appts.find(a=>a.date===TODAY&&a.time===t&&a.barber==="Su Hermano");
                  return(
                    <div key={t} style={{display:"contents"}}>
                      <div className="calt">{t}</div>
                      <div className="calcl">
                        {eA?(<div className="calev">
                          <div className="calev-nm">{eA.client}</div>
                          <div className="calev-sv">{eA.service}</div>
                          <div style={{display:"flex",gap:5,marginTop:3,alignItems:"center"}}>
                            <span className={`badge ${eA.status==="confirmed"?"ok":"pnd"}`} style={{fontSize:"8px"}}>{eA.status==="confirmed"?"✓":"⏳"}</span>
                            <button style={{background:"#4285F4",border:"none",color:"#fff",padding:"1px 7px",cursor:"pointer",fontSize:"9px",fontFamily:"DM Sans"}} onClick={()=>window.open(makeGCalLink(eA),"_blank")}>+ Cal</button>
                          </div>
                        </div>):<div className="calem">Libre</div>}
                      </div>
                      <div className="calcl">
                        {bA?(<div className="calev">
                          <div className="calev-nm">{bA.client}</div>
                          <div className="calev-sv">{bA.service}</div>
                          <div style={{display:"flex",gap:5,marginTop:3,alignItems:"center"}}>
                            <span className={`badge ${bA.status==="confirmed"?"ok":"pnd"}`} style={{fontSize:"8px"}}>{bA.status==="confirmed"?"✓":"⏳"}</span>
                            <button style={{background:"#4285F4",border:"none",color:"#fff",padding:"1px 7px",cursor:"pointer",fontSize:"9px",fontFamily:"DM Sans"}} onClick={()=>window.open(makeGCalLink(bA),"_blank")}>+ Cal</button>
                          </div>
                        </div>):<div className="calem">Libre</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:11,color:"var(--gr)"}}>Exportar citas de hoy:</span>
                {todayApts.map((a,i)=>(
                  <button key={i} style={{background:"transparent",border:"1px solid #4285F4",color:"#4285F4",padding:"5px 12px",cursor:"pointer",fontSize:10,fontFamily:"DM Sans"}}
                    onClick={()=>window.open(makeGCalLink(a),"_blank")}>
                    {a.time} · {a.client}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {/* CLIENTS */}
          {admTab==="clients"&&(<>
            <div className="admh">
              <div><div className="admtit bb">CLIENTES Y CITAS</div><div className="admdt">{appts.length} citas · {new Set(appts.map(a=>a.client)).size} clientes</div></div>
              <button className="btnp" style={{fontSize:10}} onClick={()=>setView("booking")}>+ Nueva Cita</button>
            </div>
            <div className="card">
              <div className="cardt bb">TODAS LAS CITAS</div>
              <table className="tbl">
                <thead><tr><th>#</th><th>Cliente</th><th>Teléfono</th><th>Servicio</th><th>Barbero</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>📅</th></tr></thead>
                <tbody>
                  {[...appts].reverse().map((a,i)=>(
                    <tr key={i}>
                      <td style={{color:"var(--gr)",fontSize:10}}>#{a.id}</td>
                      <td>{a.client}</td>
                      <td style={{fontSize:10,fontFamily:"monospace"}}>{a.phone}</td>
                      <td>{a.service}</td>
                      <td>{a.barber}</td>
                      <td style={{fontSize:10}}>{a.date}</td>
                      <td style={{fontFamily:"Bebas Neue",fontSize:17,color:"var(--gld)"}}>{a.time}</td>
                      <td>
                        <select style={{background:"var(--card2)",border:"1px solid var(--bdr)",color:"var(--wh)",padding:"3px 7px",fontFamily:"DM Sans",fontSize:10,outline:"none",cursor:"pointer"}}
                          value={a.status} onChange={e=>{const up=appts.map(x=>x.id===a.id?{...x,status:e.target.value}:x);saveAp(up);}}>
                          <option value="confirmed">✓ Confirmada</option>
                          <option value="pending">⏳ Pendiente</option>
                          <option value="cancelled">✗ Cancelada</option>
                        </select>
                      </td>
                      <td>
                        <button style={{background:"#4285F4",border:"none",color:"#fff",padding:"3px 9px",cursor:"pointer",fontSize:10,fontFamily:"DM Sans"}} onClick={()=>window.open(makeGCalLink(a),"_blank")}>+ Cal</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>)}

          {/* REVIEWS ADMIN */}
          {admTab==="reviews_adm"&&(<>
            <div className="admh"><div><div className="admtit bb">VALORACIONES</div><div className="admdt">{reviews.length} opiniones · Media: {avg}★</div></div></div>
            <div className="kg" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
              {[5,4,3,2,1].map(n=>(
                <div key={n} className="kc">
                  <div className="kl">{"★".repeat(n)}</div>
                  <div className="kv bb">{reviews.filter(r=>r.stars===n).length}</div>
                  <div className="kch up">{reviews.length?Math.round(reviews.filter(r=>r.stars===n).length/reviews.length*100):0}%</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="cardt bb">TODAS LAS OPINIONES</div>
              <table className="tbl">
                <thead><tr><th>Nombre</th><th>Estrellas</th><th>Comentario</th><th>Fecha</th><th></th></tr></thead>
                <tbody>
                  {reviews.map((r,i)=>(
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td style={{color:"var(--gld)"}}>{"★".repeat(r.stars)}</td>
                      <td style={{fontSize:11,maxWidth:280}}>{r.text}</td>
                      <td style={{fontSize:10}}>{r.date}</td>
                      <td><button style={{background:"none",border:"1px solid var(--bdr)",color:"var(--gr)",padding:"3px 8px",cursor:"pointer",fontSize:10,fontFamily:"DM Sans"}} onClick={()=>saveRv(reviews.filter((_,j)=>j!==i))}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>)}

          {/* REVENUE */}
          {admTab==="revenue"&&(<>
            <div className="admh"><div><div className="admtit bb">INGRESOS</div><div className="admdt">Análisis financiero 2025</div></div></div>
            <div className="kg">
              {[
                {l:"Total Año",v:"15.100€",c:"+17% vs 2024",up:true},
                {l:"Mejor Mes",v:"3.200€",c:"Mayo 2025",up:true},
                {l:"Ticket Medio",v:"14€",c:"por cliente",up:true},
                {l:"Clientes Nuevos",v:"21",c:"este mes",up:true},
              ].map((k,i)=>(
                <div key={i} className="kc"><div className="kl">{k.l}</div><div className="kv bb">{k.v}</div><div className={`kch ${k.up?"up":"dn"}`}>{k.c}</div></div>
              ))}
            </div>
            <div className="card">
              <div className="cardt bb">EVOLUCIÓN DE INGRESOS</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={REV_DATA}>
                  <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A84C" stopOpacity={.3}/><stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/></linearGradient></defs>
                  <XAxis dataKey="month" tick={{fill:"#555",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#555",fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:"#161616",border:"1px solid #222",borderRadius:0,color:"#F5F0EB"}}/>
                  <Area type="monotone" dataKey="rev" stroke="#C9A84C" strokeWidth={2} fill="url(#g2)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>)}
        </main>
      </div>
    )}

    {/* CHAT */}
    {view!=="admin"&&(<>
      <button className="cfab" onClick={()=>setCO(o=>!o)}>{chatOpen?"✕":"💬"}</button>
      {chatOpen&&(
        <div className="cwin">
          <div className="chdr">
            <div className="cavy">💈</div>
            <div><div className="cnm">Monk · Barber Brothers</div><div className="cst">● En línea · Ontinyent</div></div>
          </div>
          <div className="cmsgs">
            {msgs.map((m,i)=>(
              <div key={i} className={`msg ${m.role==="user"?"usr":"ast"}`}><div className="mbub">{m.content}</div></div>
            ))}
            {typing&&<div className="msg ast"><div className="tdots"><div className="td"/><div className="td"/><div className="td"/></div></div>}
            <div ref={botRef}/>
          </div>
          <div className="cinrow">
            <input className="cinp" value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Escribe tu mensaje..."/>
            <button className="csnd" onClick={sendChat}>→</button>
          </div>
        </div>
      )}
    </>)}
  </>);
}
