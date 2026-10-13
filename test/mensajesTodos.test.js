import test from 'node:test';
import assert from 'node:assert/strict';
import { marcarTodosLeidos } from '../src/services/mensajesApi.js';
import { api } from '../src/services/httpClient.js';
test('lectura masiva usa el endpoint autenticado sin aceptar un UID arbitrario',async()=>{
 const original=api.put;let llamada;
 api.put=async(...args)=>{llamada=args;return{ok:true,actualizados:2};};
 try{assert.deepEqual(await marcarTodosLeidos(),{ok:true,actualizados:2});assert.deepEqual(llamada,['/v1/mensajes/read-all']);}
 finally{api.put=original;}
});
