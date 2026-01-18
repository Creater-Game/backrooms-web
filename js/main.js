import { createPlayer } from "./player.js";
import { createWorld } from "./world.js";
import { setupUI } from "./ui.js";
import { makeLevel0, makeRandomLiminalLevel } from "./levels.js";

const THREE = window.THREE;

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 6, 35);

const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 250);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

let level = makeLevel0(123456);
let world = createWorld(THREE, scene, level);

// player uses world collision
const player = createPlayer(camera, canvas, (x, z) => world.isSolidAt(x, z));

// door targeting
const raycaster = new THREE.Raycaster();
let currentTargetDoor = null;

// stack for returning back
const levelStack = [];

function makePocketLevel(seed) {
  return {
    name: "Pocket",
    seed,
    chunkSize: 30,
    wallHeight: 3.2,
    palette: { floor: 0x101010, wall: 0x101010, ceiling: 0x050505 },

    generate2D(chunkX, chunkZ) {
      const N = 16;
      const grid = new Uint8Array(N * N); // all empty
      const doors = [];

      // return door only in spawn chunk
      if (chunkX === 0 && chunkZ === 0) {
        doors.push({ tx: Math.floor(N / 2), tz: Math.floor(N / 2), destSeed: 0 });
      }

      return { N, grid, doors };
    }
  };
}

function enterDoor(doorMesh) {
  const inPocket = (world.level.name === "Pocket");

  if (!inPocket) {
    // save return point
    levelStack.push({
      level,
      x: player.state.pos.x,
      y: player.state.pos.y,
      z: player.state.pos.z,
      yaw: player.state.yaw,
      pitch: player.state.pitch
    });

    // go pocket
    level = makePocketLevel(doorMesh.userData.destSeed);
    world.setLevel(level);

    // spawn at origin
    player.state.pos.x = 0;
    player.state.pos.z = 0;
    player.state.yaw = 0;
    player.state.pitch = 0;
  } else {
    // return
    const prev = levelStack.pop();
    if (!prev) return;

    level = prev.level;
    world.setLevel(level);

    player.state.pos.x = prev.x;
    player.state.pos.y = prev.y;
    player.state.pos.z = prev.z;
    player.state.yaw = prev.yaw;
    player.state.pitch = prev.pitch;
  }
}

// Press E to enter doors
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyE" && currentTargetDoor) {
    enterDoor(currentTargetDoor);
  }
});

setupUI({
  onRandomLevel: () => {
    levelStack.length = 0;
    level = makeRandomLiminalLevel();
    world.setLevel(level);
    player.state.pos.x = 0;
    player.state.pos.z = 0;
  },
  onFullscreen: () => {
    if (!document.fullscreenElement) canvas.requestFullscreen();
    else document.exitFullscreen();
  }
});

function resize() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  player.update(dt);
  world.update(player.state.pos);

  // door raycast from center screen
  currentTargetDoor = null;
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(scene.children, true);

  for (const h of hits) {
    if (h.object?.userData?.isDoor) {
      if (h.distance < 2.2) currentTargetDoor = h.object;
      break;
    }
  }

  const hint = document.getElementById("hint");
  if (currentTargetDoor) hint.textContent = "Press E to open/enter door";
  else hint.textContent = "Click to lock mouse • WASD • Space jump • Shift sprint • C crouch • E door";

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
