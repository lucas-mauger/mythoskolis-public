import { initEgoGraphInteractive } from "../components/ego-graph-interactive-client";

const wireGraphs = () => {
  const containers = document.querySelectorAll<HTMLElement>("[data-ego-graph-container]");

  containers.forEach((el) => {
    const componentId = el.dataset.componentId;
    const initialSlug = el.dataset.initialSlug;

    if (!componentId || !initialSlug) {
      console.error("EgoGraph: données manquantes sur le container", el);
      return;
    }

    initEgoGraphInteractive(componentId, initialSlug);
  });
};

if (document.readyState !== "loading") {
  wireGraphs();
} else {
  document.addEventListener("DOMContentLoaded", wireGraphs);
}

document.addEventListener("astro:page-load", wireGraphs);
