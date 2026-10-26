import mysql from '../ClubOS/backend/node_modules/mysql2/promise.js';
import fs from 'node:fs';
const c=await mysql.createConnection({host:'127.0.0.1',port:13316,user:'root',database:'clubos'});
const logs=[];let n=0;
async function req(path,method='GET',body,token){const r=await fetch('http://127.0.0.1:14091/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(5000)});const b=await r.json();logs.push({path,method,status:r.status,body:b.accessToken?{session:true}:b});console.log(method,path,r.status);return {s:r.status,b}}
const users={};
for(const role of ['administrador','manager','entrenador','socio']){
const email=role+'@qa.invalid';await req('/auth/register','POST',{clubSlug:'bigua',email,password:'QA-only-Password-2026!',nombre:'Prueba',apellido:role,anioNacimiento:2011});
const [[u]]=await c.query('SELECT id FROM usuarios WHERE email=?',[email]);
if(role!=='socio')await c.query('INSERT INTO usuario_roles(usuario_id,rol) VALUES (?,?)',[u.id,role]);
users[role]=(await req('/auth/login','POST',{clubSlug:'bigua',email,password:'QA-only-Password-2026!'})).b;
}
const a=users.administrador.accessToken;
await req('/health');
const ds=(await req('/divisiones/disciplinas','GET',undefined,a)).b;
const div=(await req('/divisiones','POST',{disciplinaId:ds[0].id,nombre:'M15',temporada:2026},a)).b.id;
const member=(await req('/socios','POST',{nombre:'Jugador',apellido:'QA',anioNacimiento:2011},a)).b.id;
await req(`/divisiones/${div}/inscripciones`,'POST',{socioId:member},a);
for(const role of ['manager','entrenador'])await req(`/divisiones/${div}/asignaciones`,'POST',{email:role+'@qa.invalid',funcion:role},a);
const train=(await req('/entrenamientos','POST',{divisionId:div,fecha:'2026-10-22',hora:'18:00'},users.entrenador.accessToken)).b.id;
await req(`/entrenamientos/${train}/asistencia`,'POST',{registros:[{socioId:member,estado:'presente'}]},users.manager.accessToken);
await req(`/entrenamientos/${train}/asistencia`,'GET',undefined,a);
await req('/entrenamientos','POST',{divisionId:div,fecha:'2026-02-31',hora:'18:00'},a);
for(const role of Object.keys(users))for(const path of ['/socios','/divisiones','/familias','/temporadas','/facturacion','/viajes?divisionId='+div])await req(path,'GET',undefined,users[role].accessToken);
const old=users.socio.refreshToken;await req('/auth/refresh','POST',{refreshToken:old});await req('/auth/refresh','POST',{refreshToken:old});
await req('/socios','POST',{nombre:'',apellido:'',anioNacimiento:9999},a);
await c.end();fs.writeFileSync('integration-results.json',JSON.stringify(logs,null,2));
