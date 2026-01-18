import { buildChunkMesh } from "./chunk.js";

export function createWorld(THREE, scene, level) {
  const chunk2D = new Map();   // key -> {N,grid,doors}
  const chunk3D = new Map();   // key -> mesh group

  const renderRadius = 2;
  const keep2DRadius = 6;

  function key(cx, cz) { return cx + "," + cz; }

  function getChunk2D(cx, cz) {
    const k = key(cx, cz);
    if (!chunk2D.has(k)) chunk2D.set(k, level.generate2D(cx, cz));
    return chunk2D.get(k);
  }

  function ensureChunk3D(cx, cz) {
    const k = key(cx, cz);
    if (chunk3D.has(k)) return;
    const data = getChunk2D(cx, cz);
    const mesh = buildChunkMesh(THREE, level, data, cx, cz);
    scene.add(mesh);
    chunk3D.set(k, mesh);
  }

  function dropChunk3D(cx, cz) {
    const k = key(cx, cz);
    const mesh = chunk3D.get(k);
    if (!mesh) return;
    scene.remove(mesh);
    mesh.traverse(o => {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) o.material.dispose?.();
    });
    chunk3D.delete(k);
  }

  // Collision: is a wall at world x,z?
  function isSolidAt(x, z) {
    const size = level.chunkSize;

    // which chunk?
    const cx = Math.floor(x / size);
    const cz = Math.floor(z / size);
    const data = getChunk2D(cx, cz);

    const N = data.N;
    const cell = size / N;

    // local coords inside chunk centered at (cx*size, cz*size)
    const localX = x - cx * size + size / 2;
    const localZ = z - cz * size + size / 2;

    // which tile?
    const tx = Math.floor(localX / cell);
    const tz = Math.floor(localZ / cell);

    // outside tile range => treat as wall (prevents weird edges)
    if (tx < 0 || tz < 0 || tx >= N || tz >= N) return true;

    return data.grid[tz * N + tx] === 1;
  }

  function update(playerPos) {
    const cx = Math.floor(playerPos.x / level.chunkSize);
    const cz = Math.floor(playerPos.z / level.chunkSize);

    for (let z = cz - renderRadius; z <= cz + renderRadius; z++) {
      for (let x = cx - renderRadius; x <= cx + renderRadius; x++) {
        ensureChunk3D(x, z);
      }
    }

    for (const k of chunk3D.keys()) {
      const [x, z] = k.split(",").map(Number);
      if (Math.abs(x - cx) > renderRadius || Math.abs(z - cz) > renderRadius) {
        dropChunk3D(x, z);
      }
    }

    for (const k of chunk2D.keys()) {
      const [x, z] = k.split(",").map(Number);
      if (Math.abs(x - cx) > keep2DRadius || Math.abs(z - cz) > keep2DRadius) {
        chunk2D.delete(k);
      }
    }
  }

  function setLevel(newLevel) {
    for (const k of chunk3D.keys()) {
      const [x, z] = k.split(",").map(Number);
      dropChunk3D(x, z);
    }
    chunk2D.clear();
    level = newLevel;
  }

  return {
    update,
    setLevel,
    isSolidAt,
    get level() { return level; }
  };
}
