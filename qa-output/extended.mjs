import fs from 'node:fs';
const out=[];async function q(p,m='GET',b,t){const r=await fetch('http://127.0.0.1:14091/api'+p,{method:m,headers:{'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:b===undefined?undefined:JSON.stringify(b)});const v=await r.json();out.push({p,m,status:r.status,body:v.accessToken?{session:true}:v});console.log(p,r.status);return v}
const s=await q('/auth/login','POST',{clubSlug:'bigua',email:'administrador@qa.invalid',password:'QA-only-Password-2026!'});const t=s.accessToken;
for(const p of ['/temporadas/2027/vista-previa','/facturacion/aranceles','/facturacion/2026-10/vista-previa','/finanzas/socios/5/cuotas','/jugadores/5','/familias/configuracion'])await q(p,'GET',undefined,t);
await q('/finanzas/cuotas','POST',{socioId:5,periodo:'2026-10',vencimiento:'2026-10-30',importe:1000,concepto:'Cuota QA'},t);
const cuotas=await q('/finanzas/socios/5/cuotas','GET',undefined,t);
await q('/familias','POST',{nombre:'Familia QA'},t);
await q('/familias/1/miembros','POST',{socioId:5},t);
await q('/familias','GET',undefined,t);
await q('/viajes','POST',{divisionId:1,titulo:'Viaje QA',destino:'Destino ficticio',salida:'2026-11-01',regreso:'2026-11-02'},t);
await q('/viajes/1/participantes','POST',{socioId:5},t);
await q('/viajes/1','GET',undefined,t);
await q('/finanzas/cuotas/1/pagos','POST',{monto:1000,metodo:'efectivo',referencia:'SIMULACION QA'},t);
await q('/finanzas/cuotas/1/pagos','POST',{monto:1,metodo:'efectivo'},t);
await q('/finanzas/socios/5/cuotas','GET',undefined,t);
fs.writeFileSync('extended-results.json',JSON.stringify(out,null,2));
