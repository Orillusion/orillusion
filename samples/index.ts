import { Sample_AnimCurve } from "./animation/Sample_AnimCurve";
import { Sample_Skeleton3 } from "./animation/Sample_Skeleton3";
import { Sample_Base_0 } from "./base/Sample_Base_0";
import { Sample_BoxBlendMode } from "./base/Sample_BoxBlendMode";
import { Sample_allocMatrix } from "./base/Sample_allocMatrix";
import { Sample_Base_1 } from "./base/Sample_base_1";
import { Sample_Base_2 } from "./base/Sample_base_2";
import { Sample_base_3 } from "./base/Sample_base_3";
import { Sample_changeShaderState } from "./base/Sample_changeShaderState";
import { Sample_changeTexture } from "./base/Sample_changeTexture";
import { Sample_FlyCameraController } from "./camera/Sample_FlyCameraController";
import { Sample_HoverCameraController } from "./camera/Sample_HoverCameraController";
import { Sample_OrbitCameraController } from "./camera/Sample_OrbitCameraController";
import { Sample_BistroExterior } from "./cityDemo/Sample_BistroExterior";
import { Sample_PickBoxCollider } from "./pick/Sample_PickBoxCollider";
import { Sample_SSR } from "./renderer/Sample_SSR";
import { Sample_TAA } from "./renderer/Sample_TAA";

/******** Load all samples in /src/sample/ ********/
if (true) {
  // new Sample_Base_0().run();
  // new Sample_Base_1().run();
  // new Sample_Base_2().run();
  // new Sample_base_3().run();
  // new Sample_Skeleton().run();
  // new Sample_FlyCameraController().run();
  // new Sample_HoverCameraController().run();
  // new Sample_PickBoxCollider().run();
  // new Sample_OrbitCameraController().run();
  // new Sample_AnimCurve().run();
  // new Sample_allocMatrix().run();
  // new Sample_BoxBlendMode().run();
  // new Sample_changeShaderState().run();
  // new Sample_changeTexture().run();
  // new Sample_BistroExterior().run();
  // new Sample_SSR().run();
  // new Sample_TAA().run();
  new Sample_Skeleton3().run();

} else {
}
function Menu() {
  // load all modules in /sample
  const modules = import.meta.glob(["./*/*.ts", "!./*/_*.ts"]);
  // create menu
  let title = "",
    list = "";
  for (const path in modules) {
    const arr = path.split("/");
    let _title = arr[1];
    let _demo = arr[2].replace(/Sample_|Sample|\.ts/g, "");
    if (_title != title) {
      list += `<p>${_title}</p>`;
      title = _title;
    }
    list += `<a id="${path}">${_demo}</a>`;
  }
  const menu = document.createElement("div");
  menu.className = "menu";
  menu.innerHTML = list;
  document.body.appendChild(menu);

  // change sessionStorage.target on click, and reload iframe
  menu.addEventListener("click", (e: Event) => {
    let button = e.target as HTMLElement;
    if (!button.id) return;
    // remove prev iframe to clear memory
    document.querySelector("iframe")?.remove();
    let target = button.id;
    if (target && modules[target]) {
      addIframe();
      document.querySelector(".active")?.classList.remove("active");
      button.classList.add("active");
      sessionStorage.top = menu.scrollTop;
      sessionStorage.target = target;
    }
  });

  // load target on refresh
  if (sessionStorage.target) {
    let target = sessionStorage.target;
    let a = document.querySelector(`[id="${target}"]`);
    if (a) {
      addIframe();
      a.classList.add("active");
      menu.scrollTop = sessionStorage.top;
    }
  } else {
    document.querySelector("a")?.click();
  }

  // create an iframe inside page to load sample
  function addIframe() {
    const iframe = document.createElement("iframe") as HTMLIFrameElement;
    iframe.srcdoc = `
        <style>html,body{margin:0;padding:0;overflow:hidden}canvas{touch-action:none}.stats{margin-left:190px}</style>
        <script>
            let target = sessionStorage.target
            if(target)
            import('./src/sample/'+target).then(m=>{
                for(let i in m){
                    new m[i]().run()
                    break
                }
            })
        </script>`;
    document.body.appendChild(iframe);
  }
}
// Menu()

// auto update index.ts, import all exports from /src/engine/
const modules = import.meta.glob([
  "../engine/**/*.ts",
  "!../engine/**/*-back.ts",
  "!../engine/**/_*.ts",
]);
let content = "";
for (let path in modules) content += `export * from "${path.slice(1, -3)}"\r\n`;
import.meta.hot!.send("autoIndex", { content });
