import { mulberry32, hash2, randInt } from "./rng.js";

export function makeLevel0(seed) {
  return {
    name: "Level 0",
    seed,
    chunkSize: 28,
    wallHeight: 3.2,
    palette: { floor: 0xb8b08a, wall: 0xd8d0a8, ceiling: 0xcfc7a0 },

    generate2D(chunkX, chunkZ) {
      const s = hash2(chunkX, chunkZ, seed);
      const rng = mulberry32(s);

      const N = 18;
      const grid = new Uint8Array(N * N);
      grid.fill(1);

      // carve random corridors
      const cuts = randInt(rng, 4, 8);
      for (let i = 0; i < cuts; i++) {
        let x = randInt(rng, 1, N - 2);
        let z = randInt(rng, 1, N - 2);
        const len = randInt(rng, 6, 14);
        const dir = rng() < 0.5 ? "x" : "z";
        for (let k = 0; k < len; k++) {
          grid[z * N + x] = 0;
          if (dir === "x") x = Math.min(N - 2, x + 1);
          else z = Math.min(N - 2, z + 1);
        }
      }

      // center open area
      for (let z = 7; z <= 10; z++) {
        for (let x = 7; x <= 10; x++) grid[z * N + x] = 0;
      }

      // doors: rare per chunk
      const doors = [];
      if (rng() < 0.08) { // ~8% chunks
        for (let tries = 0; tries < 60; tries++) {
          const dx = randInt(rng, 2, N - 3);
          const dz = randInt(rng, 2, N - 3);
          if (grid[dz * N + dx] === 0) {
            doors.push({
              tx: dx,
              tz: dz,
              destSeed: (rng() * 2 ** 32) >>> 0
            });
            break;
          }
        }
      }

      return { N, grid, doors };
    }
  };
}

export function makeRandomLiminalLevel() {
  const seed = (Math.random() * 2 ** 32) >>> 0;
  const rng = mulberry32(seed);

  const types = ["CUBES", "TRIANGLES", "BLOCKS"];
  const type = types[randInt(rng, 0, types.length - 1)];

  return {
    name: "Random " + type,
    seed,
    chunkSize: 30,
    wallHeight: 3 + rng() * 2,
    palette: {
      floor: rng() < 0.5 ? 0x999999 : 0x2a2a2a,
      wall: rng() < 0.5 ? 0xffffff : 0xcccccc,
      ceiling: rng() < 0.5 ? 0x777777 : 0x111111
    },

    generate2D(chunkX, chunkZ) {
      const s = hash2(chunkX, chunkZ, seed);
      const r = mulberry32(s);
      const N = 16 + randInt(r, 0, 12);
      const grid = new Uint8Array(N * N);

      if (type === "CUBES") {
        for (let i = 0; i < N * N; i++) grid[i] = r() < 0.25 ? 1 : 0;
      } else if (type === "BLOCKS") {
        for (let z = 0; z < N; z++) {
          for (let x = 0; x < N; x++) {
            grid[z * N + x] = (x % 3 === 0 || z % 4 === 0) && r() < 0.7 ? 1 : 0;
          }
        }
      } else {
        for (let z = 0; z < N; z++) {
          for (let x = 0; x < N; x++) {
            const diag = x > z ? 1 : 0;
            grid[z * N + x] = (r() < 0.35 ? diag : 0);
          }
        }
      }

      // walkable center
      const mid = Math.floor(N / 2);
      for (let z = mid - 2; z <= mid + 2; z++) {
        for (let x = mid - 2; x <= mid + 2; x++) grid[z * N + x] = 0;
      }

      // doors even rarer here
      const doors = [];
      if (r() < 0.04) {
        for (let tries = 0; tries < 80; tries++) {
          const dx = randInt(r, 2, N - 3);
          const dz = randInt(r, 2, N - 3);
          if (grid[dz * N + dx] === 0) {
            doors.push({ tx: dx, tz: dz, destSeed: (r() * 2 ** 32) >>> 0 });
            break;
          }
        }
      }

      return { N, grid, doors };
    }
  };
}
