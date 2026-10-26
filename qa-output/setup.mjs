import mysql from '../ClubOS/backend/node_modules/mysql2/promise.js';
import fs from 'node:fs';
const c=await mysql.createConnection({host:'127.0.0.1',port:13316,user:'root',multipleStatements:true});
console.log('INSTANCE', (await c.query('SELECT @@port port,@@datadir datadir'))[0]);
for(const f of ['clubos.sql','02_viajes_manager.sql','04_categorias_por_anio.sql','07_aranceles_descuentos.sql','10_familias_descuentos.sql','12_pagos_familiares.sql']){
try{await c.query(fs.readFileSync('../ClubOS/database/'+f,'utf8'));console.log('PASS schema',f)}catch(e){console.log('FAIL schema',f,e.code,e.message)}}
await c.end();
