import "./style.css";
import { FlameMonument } from "./components/FlameMonument";

const app = document.getElementById("app") as HTMLDivElement | null;

if (!app) {
  throw new Error("Missing #app container");
}

const FIRE_ROUTE = "/fire";
if (window.location.pathname !== FIRE_ROUTE) {
  window.history.replaceState(null, "", FIRE_ROUTE);
}

app.innerHTML = `
  <div class="relative min-h-screen overflow-hidden">
    <div class="relative flex min-h-screen items-center justify-center">
      <div id="monument-slot" class="relative"></div>
    </div>
  </div>
`;

const monumentSlot = document.getElementById("monument-slot") as HTMLDivElement;
const monument = new FlameMonument({
  size: 1,
  intensity: 1,
  speed: 1,
  flameLayer: "front",
});
monumentSlot.appendChild(monument.el);

