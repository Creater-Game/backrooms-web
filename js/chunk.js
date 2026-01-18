export function buildChunkMesh(THREE, level, chunkData, chunkX, chunkZ) {
  const group = new THREE.Group();

  const size = level.chunkSize;
  const { N, grid } = chunkData;
  const cell = size / N;

  const floorMat = new THREE.MeshStandardMaterial({ color: level.palette.floor });
  const wallMat = new THREE.MeshStandardMaterial({ color: level.palette.wall });
  const ceilMat = new THREE.MeshStandardMaterial({ color: level.palette.ceiling });

  // floor + ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(chunkX * size, 0, chunkZ * size);
  group.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(size, size), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(chunkX * size, level.wallHeight, chunkZ * size);
  group.add(ceiling);

  // walls
  const wallGeo = new THREE.BoxGeometry(cell, level.wallHeight, cell);
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      if (grid[z * N + x] === 1) {
        const wall = new THREE.Mesh(wallGeo, wallMat);
        const wx = chunkX * size + (x + 0.5) * cell - size / 2;
        const wz = chunkZ * size + (z + 0.5) * cell - size / 2;
        wall.position.set(wx, level.wallHeight / 2, wz);
        group.add(wall);
      }
    }
  }

  // light
  const light = new THREE.PointLight(0xffffff, 0.6, size * 1.6);
  light.position.set(chunkX * size, level.wallHeight - 0.3, chunkZ * size);
  group.add(light);

  // doors
  const { doors = [] } = chunkData;

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x7a4a2a });
  const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

  const frameGeo = new THREE.BoxGeometry(cell * 1.2, level.wallHeight * 0.9, cell * 0.2);
  const doorGeo  = new THREE.BoxGeometry(cell * 0.9, level.wallHeight * 0.8, cell * 0.08);

  for (const d of doors) {
    const gx = chunkX * size + (d.tx + 0.5) * cell - size / 2;
    const gz = chunkZ * size + (d.tz + 0.5) * cell - size / 2;

    const frame = new THREE.Mesh(frameGeo, doorFrameMat);
    frame.position.set(gx, (level.wallHeight * 0.9) / 2, gz);
    group.add(frame);

    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(gx, (level.wallHeight * 0.8) / 2, gz + cell * 0.09);

    door.userData.isDoor = true;
    door.userData.destSeed = d.destSeed;

    group.add(door);
  }

  return group;
}
