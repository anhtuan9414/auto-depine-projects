import"./assets/modulepreload-polyfill-B5Qt9EMX.js";import{d as E,l as s}from"./assets/logg-VUsZloPS.js";const y="modulepreload",h=function(e){return"/"+e},u={},S=function(t,c,P){let l=Promise.resolve();if(c&&c.length>0){document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),n=a?.nonce||a?.getAttribute("nonce");l=Promise.allSettled(c.map(r=>{if(r=h(r),r in u)return;u[r]=!0;const i=r.endsWith(".css"),g=i?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${r}"]${g}`))return;const o=document.createElement("link");if(o.rel=i?"stylesheet":y,i||(o.as="script"),o.crossOrigin="",o.href=r,n&&o.setAttribute("nonce",n),document.head.appendChild(o),i)return new Promise((p,v)=>{o.addEventListener("load",p),o.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${r}`)))})}))}function d(a){const n=new Event("vite:preloadError",{cancelable:!0});if(n.payload=a,window.dispatchEvent(n),!n.defaultPrevented)throw a}return l.then(a=>{for(const n of a||[])n.status==="rejected"&&d(n.reason);return t().catch(d)})},f=new BroadcastChannel("oasis/database");f.addEventListener("message",e=>w=e.data);let w=E;const m=async e=>f.postMessage(e);//! You do not have access to chrome.system apis in offscreen documents
const b=async()=>{const e=performance.memory,t=e?e.totalJSHeapSize-e.usedJSHeapSize:0;return{gpuInfo:k()||{renderer:"Unknown",vendor:"Unknown"},memoryInfo:{availableCapacity:t,capacity:e?.totalJSHeapSize??0},operatingSystem:_()}},_=()=>navigator.userAgent.indexOf("Win")!=-1?"windows":navigator.userAgent.indexOf("Mac")!=-1?"macos":navigator.userAgent.indexOf("Linux")!=-1?"linux":"unknown",k=()=>{let e=document.createElement("canvas").getContext("webgl2");if(!e)return;const t=e.getExtension("WEBGL_debug_renderer_info");if(t!=null)return{renderer:e.getParameter(t.UNMASKED_RENDERER_WEBGL),vendor:e.getParameter(t.UNMASKED_VENDOR_WEBGL)}};s("Offscreen started");navigator.serviceWorker.ready.then(e=>{s("Starting service worker keep alive interval"),setInterval(()=>{s("Keep alive message sent from offscreen to worker"),e.active?.postMessage("keepAlive")},20*1e3),b().then(t=>{s("System info synced"),m({system:t})}),S(()=>import("./assets/thumbmark.esm-D3KlR47k.js"),[]).then(t=>t.getFingerprint()).then(t=>{s("Thumb info added"),m({system:{machineId:t}})})});