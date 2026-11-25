// Un file glTF binario (GLB) scritto a mano, senza dipendenze: per esporta-cantiere.mjs ed esporta-oggi.mjs.
// Posizioni, normali, coordinate di texture, colori nei vertici, indici; un materiale per nome.
export function glb(meshes, generatore = 'firenze-1216') {
  const json = { asset: { version: '2.0', generator: generatore }, scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], accessors: [], bufferViews: [], materials: [], buffers: [{ byteLength: 0 }] };
  const pezzi = []; let off = 0;
  const vista = (arr, target) => {
    const b = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - (b.length % 4)) % 4;
    json.bufferViews.push({ buffer: 0, byteOffset: off, byteLength: b.length, ...(target ? { target } : {}) });
    pezzi.push(b, Buffer.alloc(pad)); off += b.length + pad; return json.bufferViews.length - 1;
  };
  const mats = new Map();
  for (const { nome, mat, pos, nor, uv, idx, colori, uv2 } of meshes) {
    if (!mats.has(mat)) { mats.set(mat, json.materials.length); json.materials.push({ name: mat, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 1 } }); }
    const n = pos.length / 3, min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
    const a = { POSITION: json.accessors.push({ bufferView: vista(pos, 34962), componentType: 5126, count: n, type: 'VEC3', min, max }) - 1 };
    if (nor) a.NORMAL = json.accessors.push({ bufferView: vista(nor, 34962), componentType: 5126, count: n, type: 'VEC3' }) - 1;
    if (uv) a.TEXCOORD_0 = json.accessors.push({ bufferView: vista(uv, 34962), componentType: 5126, count: n, type: 'VEC2' }) - 1;
    if (colori) a.COLOR_0 = json.accessors.push({ bufferView: vista(colori, 34962), componentType: 5126, count: n, type: 'VEC3' }) - 1;
    // altre coordinate di texture (TEXCOORD_1, 2…): dati per gli shader, come le finestre delle facciate di oggi
    (uv2 || []).forEach((u, k) => { a['TEXCOORD_' + (k + 1)] = json.accessors.push({ bufferView: vista(u, 34962), componentType: 5126, count: n, type: 'VEC2' }) - 1; });
    const ind = json.accessors.push({ bufferView: vista(idx, 34963), componentType: 5125, count: idx.length, type: 'SCALAR' }) - 1;
    json.meshes.push({ name: nome, primitives: [{ attributes: a, indices: ind, material: mats.get(mat) }] });
    json.nodes.push({ name: nome, mesh: json.meshes.length - 1 });
    json.scenes[0].nodes.push(json.nodes.length - 1);
  }
  json.buffers[0].byteLength = off;
  let js = Buffer.from(JSON.stringify(json)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
  const bin = Buffer.concat(pezzi);
  const testa = Buffer.alloc(12); testa.writeUInt32LE(0x46546C67, 0); testa.writeUInt32LE(2, 4); testa.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const c1 = Buffer.alloc(8); c1.writeUInt32LE(js.length, 0); c1.writeUInt32LE(0x4E4F534A, 4);
  const c2 = Buffer.alloc(8); c2.writeUInt32LE(bin.length, 0); c2.writeUInt32LE(0x004E4942, 4);
  return Buffer.concat([testa, c1, js, c2, bin]);
}

