export function createPlayer(camera, domElement, isSolidAt) {
  const state = {
    pos: { x: 0, y: 1.6, z: 0 },
    velY: 0,
    yaw: 0,
    pitch: 0,
    keys: new Set(),
    grounded: false,
    crouching: false
  };

  function onKey(e, down) {
    if (down) state.keys.add(e.code);
    else state.keys.delete(e.code);
    if (e.code === "KeyC" && down) state.crouching = !state.crouching;
  }

  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));

  domElement.addEventListener("click", () => {
    domElement.requestPointerLock();
  });

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== domElement) return;
    state.yaw -= e.movementX * 0.002;
    state.pitch -= e.movementY * 0.002;
    state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch));
  });

  // Simple circle collision vs wall tiles
  const R = 0.28; // player radius in meters

  function collides(px, pz) {
    // check a few points around player circle
    return (
      isSolidAt(px + R, pz) ||
      isSolidAt(px - R, pz) ||
      isSolidAt(px, pz + R) ||
      isSolidAt(px, pz - R) ||
      isSolidAt(px + R * 0.7, pz + R * 0.7) ||
      isSolidAt(px - R * 0.7, pz + R * 0.7) ||
      isSolidAt(px + R * 0.7, pz - R * 0.7) ||
      isSolidAt(px - R * 0.7, pz - R * 0.7)
    );
  }

  function tryMove(dx, dz) {
    // move X then Z for sliding
    const nx = state.pos.x + dx;
    if (!collides(nx, state.pos.z)) state.pos.x = nx;

    const nz = state.pos.z + dz;
    if (!collides(state.pos.x, nz)) state.pos.z = nz;
  }

  function update(dt) {
    const sprint = state.keys.has("ShiftLeft") || state.keys.has("ShiftRight");
    const speed = (sprint ? 5.2 : 3.4) * (state.crouching ? 0.55 : 1);

    const forward = (state.keys.has("KeyW") ? 1 : 0) - (state.keys.has("KeyS") ? 1 : 0);
    const strafe  = (state.keys.has("KeyD") ? 1 : 0) - (state.keys.has("KeyA") ? 1 : 0);

    const sin = Math.sin(state.yaw);
    const cos = Math.cos(state.yaw);

    const dx = (strafe * cos + forward * sin) * speed * dt;
    const dz = (forward * cos - strafe * sin) * speed * dt;

    tryMove(dx, dz);

    // gravity + jump
    state.velY -= 12 * dt;
    state.pos.y += state.velY * dt;

    const targetHeight = state.crouching ? 1.1 : 1.6;
    if (state.pos.y < targetHeight) {
      state.pos.y = targetHeight;
      state.velY = 0;
      state.grounded = true;
    } else {
      state.grounded = false;
    }

    if (state.grounded && state.keys.has("Space")) {
      state.velY = 5.5;
      state.grounded = false;
    }

    camera.rotation.set(state.pitch, state.yaw, 0, "YXZ");
    camera.position.set(state.pos.x, state.pos.y, state.pos.z);
  }

  return { state, update };
}
