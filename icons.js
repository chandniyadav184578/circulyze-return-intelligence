/* Icon library — simple stroke-based SVGs, currentColor so CSS controls tint.
   Kept separate from app logic so new icons can be dropped in without touching app.js. */
window.SR = window.SR || {};

SR.icons = {
  logo: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4a12 12 0 1 1-9 4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M4 4v6h6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  resell: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 9h18M3 9l2-5h14l2 5M3 9v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 13h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  refurbish: `<svg viewBox="0 0 24 24" fill="none"><path d="M17 3a9 9 0 1 1-6.7 3M17 3v5h-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  exchange: `<svg viewBox="0 0 24 24" fill="none"><path d="M7 7h13l-3-3M17 17H4l3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  donate: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.4-9.5-8.6C.7 8.8 2.6 5 6.2 5c1.9 0 3.3 1 4.8 2.7C12.5 6 13.9 5 15.8 5c3.6 0 5.5 3.8 3.7 7.4C17 16.6 12 21 12 21Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  recycle: `<svg viewBox="0 0 24 24" fill="none"><path d="M7 19H4.5a2 2 0 0 1-1.7-3l1.6-2.7M9.5 3.6 11 6l3-1.7M17.4 8l1.9 3.3a2 2 0 0 1 0 2L17.6 16M14.5 20.4H11l1.5-2.6M6.5 15.7l-1.7-3M19.8 13.3l1.7 2.9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  writeoff: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 20V10M11 20V4M18 20v-7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  price: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 6H9.5a3 3 0 1 0 0 6h5a3 3 0 1 1 0 6H6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  route: `<svg viewBox="0 0 24 24" fill="none"><circle cx="5" cy="6" r="2.4" stroke="currentColor" stroke-width="1.7"/><circle cx="19" cy="18" r="2.4" stroke="currentColor" stroke-width="1.7"/><path d="M7 7 12 12M12 12l5 2M12 12l-2 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  warranty: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  co2: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 15a4 4 0 0 1 1-7.9A5.5 5.5 0 0 1 15.8 6 4.5 4.5 0 0 1 15 15H4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  ewaste: `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="7" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.7"/></svg>`,
  fraud: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 3 7v5c0 5 3.8 8 9 10 5.2-2 9-5 9-10V7l-9-4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 8v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="16" r=".3" fill="currentColor" stroke="currentColor" stroke-width="1.7"/></svg>`,
  photo: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="11" r="2" stroke="currentColor" stroke-width="1.7"/><path d="m21 16-4.5-4.5a2 2 0 0 0-2.8 0L9 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  risk: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2 2 21h20L12 2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 9v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  depreciation: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 5h4l3 12h9M15 21l4-4M15 17l4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  parts: `<svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a3 3 0 1 0-4.2 4.2L3 18v3h3l7.5-7.5a3 3 0 1 0 4.2-4.2l-2.1 2.1-2.1-2.1 2.1-2.1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  workflow: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.7"/><rect x="15" y="15" width="6" height="6" rx="1.4" stroke="currentColor" stroke-width="1.7"/><path d="M9 6h6a3 3 0 0 1 3 3v6" stroke="currentColor" stroke-width="1.7"/></svg>`,
  dashboard: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.7"/></svg>`,
  clipboard: `<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="12" height="17" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.7"/><path d="M9 11h6M9 15h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  history: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 0 2.6-5.9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M4 5v4h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.3" stroke="currentColor" stroke-width="1.7"/><path d="M2.5 20c1-3.6 3.6-5.4 6.5-5.4s5.5 1.8 6.5 5.4M16 8.2a3 3 0 1 1 3.6 4M21.5 20c-.6-2.2-1.8-3.7-3.4-4.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.3 3h-4.6l-.3 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2l.3 2.6h4.6l.3-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 21V6l8-3 8 3v15" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 21v-5h6v5M9 10h.01M15 10h.01M9 14h.01M15 14h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13.5" r="3.3" stroke="currentColor" stroke-width="1.7"/></svg>`,
  condition: `<svg viewBox="0 0 24 24" fill="none"><path d="m9 11 2 2 4-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/></svg>`,
  category: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.7"/><rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.7"/></svg>`,
  location: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.4" stroke="currentColor" stroke-width="1.7"/></svg>`,
  season: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
  cost: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 19h16M6 19V9l6-5 6 5v10" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

/* tiny DOM + format helpers used across modules */
SR.util = {
  qs:(s,el=document)=>el.querySelector(s),
  qsa:(s,el=document)=>Array.from(el.querySelectorAll(s)),
  fmtINR:(n)=>{
    const symbol = (SR.data && SR.data.settings && SR.data.settings.currencySymbol) || '₹';
    return symbol + Math.round(n).toLocaleString('en-IN');
  },
  fmtNum:(n,d=1)=>Number(n).toFixed(d),
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
  uid:()=>'id'+Math.random().toString(36).slice(2,9),
};
