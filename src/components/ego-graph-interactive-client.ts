import {
  createGenealogieStore,
  type GenealogieData,
  type GenealogieStore,
  type EgoGraph,
  type RelatedNode,
} from "../lib/genealogie-shared";

type NodeRole = "central" | "parent" | "child" | "sibling" | "consort";
type RelationSection = "parents" | "siblings" | "consorts" | "children";

interface NodeSpec {
  key: string;
  slug: string;
  id: string;
  culture?: string;
  name: string;
  relationLabel: string;
  role: NodeRole;
  isMuted?: boolean;
  isRelatedChild?: boolean;
  isRelatedConsort?: boolean;
  isSibling?: boolean;
  isNonConsensus?: boolean;
  isMixedConsensus?: boolean;
  sourceLabel?: string | string[];
  sources?: { author?: string; work?: string; note?: string; consensus?: boolean; index?: string | null }[];
  showBadges?: boolean;
  showIndexBadge?: boolean;
  sourceIndexLabels?: string[];
}

type IndexedSourcesResult = {
  sources: { author?: string; work?: string; note?: string; consensus?: boolean; index?: string | null }[];
  labels: string[];
};

const RELATION_LABELS: Record<NodeRole, string> = {
  central: "Centre",
  parent: "Parent",
  child: "Enfant",
  sibling: "Fratrie",
  consort: "Consort",
};

const SECTION_ROLE: Record<RelationSection, NodeRole> = {
  parents: "parent",
  siblings: "sibling",
  consorts: "consort",
  children: "child",
};

const RELATION_SECTIONS: RelationSection[] = ["parents", "siblings", "consorts", "children"];

function makeSourceKey(source: { author?: string; work?: string; note?: string }) {
  return `${source.author ?? ""}|${source.work ?? ""}|${source.note ?? ""}`;
}

function buildIndexMapFromSources(sources: { author?: string; work?: string; note?: string; consensus?: boolean }[]) {
  const map = new Map<string, string>();
  let idx = 1;
  sources.forEach((s) => {
    map.set(makeSourceKey(s), String(idx++));
  });
  return map;
}

function buildParentIndexMap(parents: RelatedNode[]) {
  const perParent = new Map<string, Map<string, string>>();
  let idx = 1;
  parents.forEach((p) => {
    const keyBase = p.entity.slug;
    (p.relation.source_texts || []).forEach((s) => {
      if (s.consensus === false) {
        const key = `${keyBase}|${makeSourceKey(s)}`;
        if (!perParent.has(keyBase)) perParent.set(keyBase, new Map());
        const m = perParent.get(keyBase)!;
        if (!m.has(makeSourceKey(s))) {
          m.set(makeSourceKey(s), String(idx++));
        }
      }
    });
  });
  return perParent;
}

function buildChildParentIndexedSources(
  childSlug: string,
  centralSlug: string,
  store: GenealogieStore,
  makeKey: (s: { author?: string; work?: string; note?: string }) => string,
) {
  const childGraph = store.getEgoGraphBySlug(childSlug) ?? store.getEgoGraphById?.(childSlug);
  if (!childGraph) return null;

  // Index map based on la relation central -> child (si présente)
  const centralRelation = childGraph.parents?.find((p) => p.entity.slug === centralSlug);
  const centralSources = centralRelation?.relation.source_texts || [];
  const baseIndexMap = new Map<string, string>();
  centralSources.forEach((s, idx) => {
    baseIndexMap.set(makeKey(s), String(idx + 1));
  });

  const indexedPerParent = new Map<string, IndexedSourcesResult>();

  (childGraph.parents ?? []).forEach((p) => {
    let fallback = 1;
    const sources = (p.relation.source_texts || []).map((s) => {
      const key = makeKey(s);
      const index = baseIndexMap.get(key) ?? String(fallback++);
      return { ...s, index };
    });
    const labels = sources.map((s) => s.index).filter((x): x is string => Boolean(x));
    indexedPerParent.set(p.entity.slug, { sources, labels });
  });

  return { indexedPerParent };
}

function computeIndexedSources(
  sources: { author?: string; work?: string; note?: string; consensus?: boolean }[],
  mapping?: Map<string, string>,
): IndexedSourcesResult {
  const labels: string[] = [];
  let counter = 1;
  const indexed = sources.map((s) => {
    const key = makeSourceKey(s);
    const index = mapping?.get(key) ?? String(counter++);
    labels.push(index);
    return { ...s, index };
  });
  return { sources: indexed, labels };
}

type SourceWithIndex = { author?: string; work?: string; note?: string; consensus?: boolean; index?: string | null };

type FocusRelationIndexing = {
  indexedSources: SourceWithIndex[];
  labels: string[];
  perTarget: Map<string, string[]>;
  unlinkedIndices: string[];
};

function buildRelationIndexing(
  relations: { targetSlug: string; sources: SourceWithIndex[] }[],
  unlinkedSources: SourceWithIndex[] = [],
): FocusRelationIndexing {
  const indexedSources: SourceWithIndex[] = [];
  const perTarget = new Map<string, string[]>();
  const sourceIndexMap = new Map<string, string>();
  const addedKeys = new Set<string>();
  let counter = 1;
  const unlinkedIndices: string[] = [];

  const getOrCreateIndex = (s: SourceWithIndex) => {
    const key = makeSourceKey(s);
    if (!sourceIndexMap.has(key)) {
      sourceIndexMap.set(key, String(counter++));
      indexedSources.push({ ...s, index: sourceIndexMap.get(key)! });
      addedKeys.add(key);
    }
    return sourceIndexMap.get(key)!;
  };

  // Prioriser les sources consensuelles (consensus !== false) pour l'ordre de numérotation
  const relationItems = relations.flatMap(({ targetSlug, sources }) =>
    (sources || []).map((s) => ({ targetSlug, source: s })),
  );
  relationItems.sort((a, b) => {
    const ca = a.source.consensus === false ? 1 : 0;
    const cb = b.source.consensus === false ? 1 : 0;
    return ca - cb;
  });

  relationItems.forEach(({ targetSlug, source }) => {
    const indices = perTarget.get(targetSlug) ?? [];
    const idx = getOrCreateIndex(source);
    if (!indices.includes(idx)) {
      indices.push(idx);
    }
    if (indices.length) {
      perTarget.set(targetSlug, indices);
    }
  });

  // Sources sans cible (relation directe avec le personnage central) : pas de pastille mais on les place en haut si consensuelles
  const sortedUnlinked = [...unlinkedSources].sort((a, b) => {
    const ca = a.consensus === true ? 0 : 1;
    const cb = b.consensus === true ? 0 : 1;
    return ca - cb;
  });
  sortedUnlinked.forEach((s) => {
    const key = makeSourceKey(s);
    const idx = getOrCreateIndex(s);
    unlinkedIndices.push(idx);
    if (!addedKeys.has(key)) {
      addedKeys.add(key);
      // On ne numérote pas dans l'infobulle pour ces sources directes
      indexedSources.push({ ...s, index: null });
    }
  });

  // Réordonner pour afficher les sources consensuelles en tête, qu'elles soient numérotées ou non
  indexedSources.sort((a, b) => {
    const ca = a.consensus === true ? 0 : 1;
    const cb = b.consensus === true ? 0 : 1;
    if (ca !== cb) return ca - cb;
    // Ensuite, on garde l'ordre numérique des index (null en dernier)
    const ai = a.index ? Number(a.index) : Number.POSITIVE_INFINITY;
    const bi = b.index ? Number(b.index) : Number.POSITIVE_INFINITY;
    return ai - bi;
  });

  const labels = indexedSources.map((s) => s.index!).filter(Boolean);
  return { indexedSources, labels, perTarget, unlinkedIndices };
}

function getIndexColorClass(index?: string | null): string | null {
  if (!index) return null;
  const match = `${index}`.match(/\d+/);
  if (!match) return null;
  const idx = parseInt(match[0] ?? "", 10);
  const colorKey = idx >= 8 ? 1 : idx; // 8 et plus : fallback bleu
  if (colorKey < 1) return null;
  return `ego-source-index-badge--${colorKey}`;
}

function createIndexBadges(labels?: string[]): HTMLElement | null {
  if (!labels || labels.length === 0) return null;
  const container = document.createElement("div");
  container.className = "ego-source-index-badges";
  labels.forEach((label) => {
    const badge = document.createElement("span");
    badge.className = "ego-source-index-badge";
    const badgeClass = getIndexColorClass(label);
    if (badgeClass) badge.classList.add(badgeClass);
    badge.textContent = label;
    container.appendChild(badge);
  });
  return container;
}

function isScrollable(el: HTMLElement) {
  const style = getComputedStyle(el);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;
  const canScrollY = (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") && el.scrollHeight > el.clientHeight;
  const canScrollX = (overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay") && el.scrollWidth > el.clientWidth;
  return canScrollY || canScrollX;
}

function getScrollContainer(el: HTMLElement): HTMLElement | Document {
  let current: HTMLElement | null = el;
  while (current) {
    if (isScrollable(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return document;
}

export function centerNodeInContainer(
  container: HTMLElement | Document,
  node: HTMLElement,
  behavior: ScrollBehavior = "instant",
) {
  const nodeRect = node.getBoundingClientRect();

  if (container instanceof HTMLElement) {
    const containerRect = container.getBoundingClientRect();
    const offsetX = nodeRect.left - containerRect.left - (containerRect.width / 2 - nodeRect.width / 2);
    const offsetY = nodeRect.top - containerRect.top - (containerRect.height / 2 - nodeRect.height / 2);
    container.scrollTo({
      left: container.scrollLeft + offsetX,
      top: container.scrollTop + offsetY,
      behavior,
    });
    return;
  }

  const targetLeft = window.scrollX + nodeRect.left - (window.innerWidth / 2 - nodeRect.width / 2);
  const header = document.querySelector("header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const nodeCenterY = nodeRect.top + nodeRect.height / 2;
  const desiredCenterY = headerHeight + (window.innerHeight - headerHeight) / 2;
  const targetTop = window.scrollY + nodeCenterY - desiredCenterY;
  window.scrollTo({ left: targetLeft, top: targetTop, behavior });
}

function centerElementInViewport(el: HTMLElement, behavior: ScrollBehavior = "smooth") {
  const rect = el.getBoundingClientRect();
  const header = document.querySelector("header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const elementCenterY = rect.top + rect.height / 2;
  const desiredCenterY = headerHeight + (window.innerHeight - headerHeight) / 2;
  const deltaY = elementCenterY - desiredCenterY;
  const targetTop = window.scrollY + deltaY;
  const targetLeft = window.scrollX + rect.left - (window.innerWidth / 2 - rect.width / 2);
  window.scrollTo({ left: targetLeft, top: targetTop, behavior });
}

export async function initEgoGraphInteractive(containerId: string, initialSlug: string) {
  const root = document.getElementById(containerId);
  if (!root) {
    return;
  }

  try {
    const response = await fetch("/data/genealogie.json");
    if (!response.ok) {
      throw new Error("Impossible de charger les données généalogiques");
    }

    const data = (await response.json()) as GenealogieData;
    const store = createGenealogieStore(data);
    const controller = new EgoGraphController(root, store);
    (root as unknown as { __egoController?: EgoGraphController }).__egoController = controller;
    controller
      .setCurrentSlug(initialSlug)
      .then(() => {
        root.dispatchEvent(new CustomEvent("ego-graph-ready", { detail: { controller } }));
      })
      .catch((err) => console.error(err));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    renderMessage(root, message);
    console.error(error);
  }
}

class EgoGraphController {
  private currentSlug: string | null = null;
  private currentGraph: EgoGraph | null = null;
  private focusedConsortSlug: string | null = null;
  private selectedConsortSlug: string | null = null;
  private focusedChildSlug: string | null = null;
  private activeNodeKey: string | null = null;
  private childrenOrder: string[] | null = null;
  private consortOrder: string[] | null = null;
  private messageEl: HTMLElement | null;
  private nodeInstances = new Map<string, HTMLElement>();
  private sectionContainers = new Map<RelationSection, HTMLElement>();
  private sectionScrollTops = new Map<RelationSection, number>();
  private pageIds = new Set<string>();
  private handleViewportChange = () => {
    if (!this.activeNodeKey) return;
    const el = this.nodeInstances.get(this.activeNodeKey);
    if (el) {
      this.positionTooltip(el);
    }
  };
  private advancedMode = false;
  private advancedToggle?: HTMLButtonElement;

  constructor(private root: HTMLElement, private store: GenealogieStore) {
    this.messageEl = this.root.querySelector(".ego-graph-message");
    const scope = this.root.closest("section");
    const pageIdsRaw = this.root.dataset.pageIds;
    if (pageIdsRaw) {
      try {
        const parsed = JSON.parse(pageIdsRaw) as string[];
        parsed.forEach((id) => this.pageIds.add(id));
      } catch {
        this.pageIds = new Set();
      }
    }
    RELATION_SECTIONS.forEach((section) => {
      const container = this.root.querySelector<HTMLElement>(`[data-section="${section}"]`);
      if (container) {
        this.sectionContainers.set(section, container);
        enableQuadrantDragScroll(container);
        monitorScrollable(container);
        container.addEventListener("scroll", this.handleViewportChange);
      }
    });
    this.advancedToggle = scope?.querySelector<HTMLButtonElement>('[data-ego-advanced-toggle]');
    if (this.advancedToggle) {
      this.advancedToggle.setAttribute("aria-disabled", "false");
      this.advancedToggle.addEventListener("click", () => {
        this.advancedMode = !this.advancedMode;
        this.updateAdvancedToggleUI();
        if (this.currentGraph) {
          void this.renderGraph(this.currentGraph);
        }
      });
      this.updateAdvancedToggleUI();
    }
    window.addEventListener("scroll", this.handleViewportChange, true);
    window.addEventListener("resize", this.handleViewportChange, true);

    this.root.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".ego-node")) {
        this.clearActiveNode();
        this.selectedConsortSlug = null;
        this.focusedConsortSlug = null;
        this.focusedChildSlug = null;
        this.consortOrder = null;
        if (this.currentGraph) {
          this.renderGraph(this.currentGraph);
        }
      }
      if (this.selectedConsortSlug) {
        if (target.closest('.ego-node[data-role="consort"]')) {
          return;
        }
        this.selectedConsortSlug = null;
        this.focusedConsortSlug = null;
        if (this.currentGraph) {
          this.renderGraph(this.currentGraph);
        }
      }
    });

  }

  async setCurrentSlug(slug: string) {
    const graph = this.store.getEgoGraphBySlug(slug) ?? this.store.getEgoGraphById?.(slug);
    if (!graph) {
      this.showMessage("Pas encore de données pour ce dieu.");
      return;
    }

    this.currentSlug = graph.central.slug;
    this.currentGraph = graph;
    this.selectedConsortSlug = null;
    this.focusedConsortSlug = null;
    this.childrenOrder = null;
    this.consortOrder = null;
    this.activeNodeKey = null;
    this.sectionScrollTops.clear();
    this.clearMessage();
    await this.renderGraph(graph);
    this.handleViewportChange();
  }

  getCurrentSlug(): string | null {
    return this.currentSlug;
  }

  private async renderGraph(graph: EgoGraph) {
    this.captureScrollTops();
    this.clearNodes();

    const displayedChildren = new Set((graph.children ?? []).map((c) => c.entity.slug));
    const displayedConsorts = new Set((graph.consorts ?? []).map((c) => c.entity.slug));

    let focusIndexing: FocusRelationIndexing | null = null;
    let focusIndexingSlug: string | null = null;

    if (this.advancedMode && this.focusedConsortSlug) {
      const focusGraph =
        this.store.getEgoGraphBySlug(this.focusedConsortSlug) ?? this.store.getEgoGraphById?.(this.focusedConsortSlug);
      if (focusGraph) {
        const relations = (focusGraph.children ?? [])
          .filter(
            (child) =>
              displayedChildren.has(child.entity.slug) &&
              this.store.hasParent(child.entity.slug, this.focusedConsortSlug!) &&
              this.store.hasParent(child.entity.slug, graph.central.slug),
          )
          .map((child) => ({
            targetSlug: child.entity.slug,
            sources: child.relation.source_texts ?? [],
          }));

        const centralRelation = (graph.consorts ?? []).find((c) => c.entity.slug === this.focusedConsortSlug);
        const unlinkedSources = centralRelation?.relation.source_texts ?? [];

        const built = buildRelationIndexing(relations, unlinkedSources);
        if (built.indexedSources.length) {
          focusIndexing = built;
          focusIndexingSlug = this.focusedConsortSlug;
        }
      }
    } else if (this.advancedMode && this.focusedChildSlug) {
      const focusGraph =
        this.store.getEgoGraphBySlug(this.focusedChildSlug) ?? this.store.getEgoGraphById?.(this.focusedChildSlug);
      if (focusGraph) {
        const allParents = focusGraph.parents ?? [];
        const relations = allParents
          .filter(
            (parent) =>
              displayedConsorts.has(parent.entity.slug) && this.store.hasParent(this.focusedChildSlug!, parent.entity.slug),
          )
          .map((parent) => ({
            targetSlug: parent.entity.slug,
            sources: parent.relation.source_texts ?? [],
          }));

        const centralRelation = allParents.find((p) => p.entity.slug === graph.central.slug);
        const unlinkedSources = centralRelation?.relation.source_texts ?? [];

        const built = buildRelationIndexing(relations, unlinkedSources);
        if (built.indexedSources.length) {
          focusIndexing = built;
          focusIndexingSlug = this.focusedChildSlug;
        }
      }
    }

    const hasMultipleSources = this.advancedMode && focusIndexing && focusIndexing.labels.length > 1;

    const centralIndexLabels = hasMultipleSources
      ? focusIndexing.unlinkedIndices.slice().filter(Boolean).sort((a, b) => Number(a) - Number(b))
      : [];

    const centralNode = this.createNode({
      key: `central-${graph.central.id}`,
      slug: graph.central.slug,
      id: graph.central.id,
      culture: graph.central.culture,
      name: graph.central.name,
      role: "central",
      relationLabel: RELATION_LABELS.central,
      isRelatedConsort: this.focusedChildSlug !== null,
      showBadges: centralIndexLabels.length > 0,
      showIndexBadge: true,
      sourceIndexLabels: centralIndexLabels,
    });
    this.root.appendChild(centralNode);
    requestAnimationFrame(() => centralNode.classList.add("is-visible"));

    RELATION_SECTIONS.forEach((section) => {
      const container = this.sectionContainers.get(section);
      if (!container) {
        return;
      }
      const prevScroll = this.sectionScrollTops.get(section) ?? container.scrollTop;
      const shouldResetScroll =
        section === "consorts" &&
        this.focusedChildSlug !== null &&
        (graph.consorts ?? []).some((c) => this.store.hasParent(this.focusedChildSlug!, c.entity.slug));
      const shouldResetChildren =
        section === "children" &&
        this.focusedConsortSlug !== null &&
        (graph.children ?? []).some((child) => this.store.hasParent(child.entity.slug, this.focusedConsortSlug!));
      const restoreScroll = shouldResetScroll || shouldResetChildren ? 0 : prevScroll;
      container.innerHTML = "";
      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      const baseColumns = isMobile ? 2 : 3;
      let columns = baseColumns;
      let index = 0;
      let nodes = sortSection(this.filterByMode(graph[section] as RelatedNode[]));
      const isCompactParents = section === "parents" && nodes.length > 0 && nodes.length <= 2;
      container.classList.toggle("is-compact-parents", isCompactParents);
      if (isCompactParents) {
        columns = isMobile ? 1 : Math.min(2, nodes.length);
      }
      if (section === "children" && this.childrenOrder && this.childrenOrder.length) {
        nodes = sortByOrder(nodes, this.childrenOrder);
      }
      if (section === "children") {
        if (this.focusedConsortSlug) {
          const { prioritized, rest } = prioritizeChildren(nodes, this.focusedConsortSlug, this.store);
          nodes = [...prioritized, ...rest];
          this.childrenOrder = nodes.map((n) => n.entity.slug);
        } else if (this.focusedChildSlug) {
          nodes = reorderSiblings(nodes, this.focusedChildSlug, this.store);
          this.childrenOrder = nodes.map((n) => n.entity.slug);
        } else if (this.childrenOrder && this.childrenOrder.length) {
          nodes = sortByOrder(nodes, this.childrenOrder);
        }
      } else if (section === "consorts") {
        if (this.consortOrder && this.consortOrder.length) {
          nodes = sortByOrder(nodes, this.consortOrder);
        }
        if (this.focusedChildSlug) {
          const { prioritized, rest } = prioritizeConsorts(nodes, this.focusedChildSlug, this.store);
          nodes = [...prioritized, ...rest];
          this.consortOrder = nodes.map((n) => n.entity.slug);
        }
      }
      nodes.forEach((item) => {
        const isConsort = SECTION_ROLE[section] === "consort";
        const isChild = SECTION_ROLE[section] === "child";
        const isRelatedChild =
          isChild && this.focusedConsortSlug !== null && this.store.hasParent(item.entity.slug, this.focusedConsortSlug);
        const isRelatedConsort =
          isConsort && this.focusedChildSlug !== null && this.store.hasParent(this.focusedChildSlug, item.entity.slug);
        const isSibling =
          isChild &&
          this.focusedChildSlug !== null &&
          this.isSiblingOfFocused(item.entity.slug, this.focusedChildSlug);
        const relationSources = item.relation.source_texts ?? [];
        let indexedSources: IndexedSourcesResult = computeIndexedSources(relationSources);
        let sourceIndexLabels: string[] = indexedSources.labels.slice();
        const isFocusSlug = focusIndexingSlug !== null && item.entity.slug === focusIndexingSlug;
        const focusTargets = focusIndexing?.perTarget ?? new Map<string, string[]>();

        if (focusIndexing) {
          if (isFocusSlug) {
            indexedSources = { sources: focusIndexing.indexedSources, labels: focusIndexing.labels };
            sourceIndexLabels = focusIndexing.labels;
          } else {
            const indices = focusTargets.get(item.entity.slug);
            if (indices) {
              sourceIndexLabels = indices;
            } else {
              sourceIndexLabels = [];
            }
          }
        }

        const hasNumbering = focusIndexing !== null && focusIndexing.labels.length > 1;
        if (!hasNumbering) {
          sourceIndexLabels = [];
          indexedSources = {
            sources: indexedSources.sources.map((s) => ({ ...s, index: null })),
            labels: [],
          };
        } else if (sourceIndexLabels.length > 1) {
          sourceIndexLabels = sourceIndexLabels.slice().sort((a, b) => Number(a) - Number(b));
        }
        const sourceLabel = relationSources
          .map((s) => [s.author, s.work, s.note].filter(Boolean).join(", ").trim())
          .filter(Boolean);
        const isMuted =
          (isConsort && this.selectedConsortSlug && this.selectedConsortSlug !== item.entity.slug) ||
          (isConsort &&
            this.focusedChildSlug !== null &&
            !this.store.hasParent(this.focusedChildSlug, item.entity.slug)) ||
          (isChild &&
            this.focusedConsortSlug !== null &&
            !this.store.hasParent(item.entity.slug, this.focusedConsortSlug)) ||
          (isChild &&
            this.focusedChildSlug !== null &&
            !this.isSiblingOfFocused(item.entity.slug, this.focusedChildSlug) &&
            item.entity.slug !== this.focusedChildSlug);
        const node = this.createNode({
          key: `${section}-${item.entity.id}`,
          slug: item.entity.slug,
          id: item.entity.id,
          culture: item.entity.culture,
          name: item.entity.name,
          role: SECTION_ROLE[section],
          relationLabel: RELATION_LABELS[SECTION_ROLE[section]],
          isMuted,
          isRelatedChild,
          isRelatedConsort,
          isSibling,
          isNonConsensus: item.relation.consensus === false,
          isMixedConsensus: item.relation.consensus === null,
          sourceLabel,
          sources: indexedSources.sources,
          showBadges: this.advancedMode,
          showIndexBadge: !isFocusSlug,
          sourceIndexLabels: sourceIndexLabels,
        });
        const row = Math.floor(index / columns) + 1;
        const col = (index % columns) + 1;
        node.style.gridRowStart = String(row);
        node.style.gridColumnStart = String(col);
        index += 1;
        container.appendChild(node);
        requestAnimationFrame(() => node.classList.add("is-visible"));
      });
      container.dispatchEvent(new Event("scroll")); // refresh indicators
      container.classList.toggle("has-content", nodes.length > 0);
      // Restore scroll position to avoid jump-to-top
      requestAnimationFrame(() => {
        container.scrollTop = restoreScroll;
      });
    });

    if (this.activeNodeKey) {
      this.setActiveNode(this.activeNodeKey);
    }

    this.centerOnCentralNode("smooth");
  }

  private clearNodes() {
    this.root.querySelectorAll(".ego-node").forEach((node) => node.remove());
    this.nodeInstances.clear();
  }

  private captureScrollTops() {
    RELATION_SECTIONS.forEach((section) => {
      const container = this.sectionContainers.get(section);
      if (container) {
        this.sectionScrollTops.set(section, container.scrollTop);
      }
    });
  }

  private createNode(node: NodeSpec): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "ego-node";
    wrapper.dataset.role = node.role;
    wrapper.dataset.slug = node.slug;
    if (node.role === "central") {
      wrapper.dataset.centralNode = "true";
    }
    if (node.isMuted) {
      wrapper.classList.add("is-muted");
    }
    if (node.isRelatedChild) {
      wrapper.classList.add("is-related");
    }
    if (node.isRelatedConsort) {
      wrapper.classList.add("is-related");
    }
    if (node.isSibling) {
      wrapper.classList.add("is-sibling");
    }
    if (node.isNonConsensus) {
      wrapper.classList.add("is-non-consensus");
    }
    if (node.isMixedConsensus) {
      wrapper.classList.add("is-mixed-consensus");
    }
    if (node.showBadges && node.showIndexBadge !== false && (node.sourceIndexLabels?.length ?? 0) > 0) {
      wrapper.classList.add("has-source-indices");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.disabled = false;
    button.setAttribute("aria-label", `${node.name} — ${node.relationLabel}`);

    button.addEventListener("click", async () => {
      const isSecondClick = this.activeNodeKey === node.key;
      this.setActiveNode(node.key);

      if (node.role === "consort") {
        const currentOrder = this.getSectionOrder("consorts");
        if (currentOrder.length) {
          this.consortOrder = currentOrder;
        }
        this.selectedConsortSlug = node.slug;
        this.focusedConsortSlug = node.slug;
        this.focusedChildSlug = null;
        if (isSecondClick && node.slug !== this.currentSlug) {
          this.resetFocusState();
          const targets = this.computeTargetPositions(node.slug);
          await Promise.all([
            this.animateToCenter(wrapper),
            targets ? this.animateOtherNodes(targets, node.slug) : Promise.resolve(),
          ]);
          await this.setCurrentSlug(node.slug);
          return;
        }
        if (this.currentGraph && this.currentSlug) {
          await this.renderGraph(this.currentGraph);
        }
      } else if (node.role !== "central") {
        if (node.role === "child") {
          const currentOrder = this.getSectionOrder("children");
          if (currentOrder.length) {
            this.childrenOrder = currentOrder;
          }
          const consortOrder = this.getSectionOrder("consorts");
          if (consortOrder.length) {
            this.consortOrder = consortOrder;
          }
          this.focusedChildSlug = node.slug;
          this.selectedConsortSlug = null;
          this.focusedConsortSlug = null;
          if (isSecondClick && node.slug !== this.currentSlug) {
            this.resetFocusState();
            const targets = this.computeTargetPositions(node.slug);
            await Promise.all([
              this.animateToCenter(wrapper),
              targets ? this.animateOtherNodes(targets, node.slug) : Promise.resolve(),
            ]);
            await this.setCurrentSlug(node.slug);
            return;
          }
          if (this.currentGraph) {
            await this.renderGraph(this.currentGraph);
          }
        } else if (isSecondClick && node.slug !== this.currentSlug) {
          this.resetFocusState();
          const targets = this.computeTargetPositions(node.slug);
          await Promise.all([
            this.animateToCenter(wrapper),
            targets ? this.animateOtherNodes(targets, node.slug) : Promise.resolve(),
          ]);
          await this.setCurrentSlug(node.slug);
        } else {
          // Parent or sibling first click: clear previous child-related focus/halos.
          this.focusedChildSlug = null;
          this.focusedConsortSlug = null;
          this.selectedConsortSlug = null;
          if (this.currentGraph) {
            await this.renderGraph(this.currentGraph);
          }
        }
      } else {
        // Clicking the central node clears related halos/focus states but keeps central active/displayed
        this.focusedChildSlug = null;
        this.focusedConsortSlug = null;
        this.selectedConsortSlug = null;
        this.childrenOrder = null;
        this.consortOrder = null;
        if (this.currentGraph) {
          await this.renderGraph(this.currentGraph);
          this.setActiveNode(node.key);
        }
      }
    });

    const faceLayers = getFaceUrls(node.slug, node.id, node.culture);
    const gradient =
      node.role === "central"
        ? "linear-gradient(140deg, rgba(255,255,255,0.2), rgba(99,102,241,0.25))"
        : "linear-gradient(155deg, rgba(255,255,255,0.12), rgba(79,70,229,0.2))";
    const faceBackground = faceLayers.map((u) => `url(${u})`).join(", ");
    button.style.backgroundImage = `${gradient}, ${faceBackground}`;
    button.style.backgroundSize = "cover";
    button.style.backgroundPosition = "center";
    button.style.backgroundRepeat = "no-repeat";

    const filler = document.createElement("span");
    button.append(filler);

    const label = document.createElement("div");
    label.className = "ego-node-label";
    label.textContent = node.name;

    const sources = Array.isArray(node.sources) ? node.sources : [];
    if (node.showBadges && sources.length) {
      if (node.isNonConsensus) {
        const badge = document.createElement("span");
        badge.className = "ego-non-consensus-badge";
        badge.setAttribute("aria-label", "Variante non consensuelle");
        badge.title = "Variante non consensuelle";
        badge.textContent = "!";
        wrapper.appendChild(badge);
      } else if (node.isMixedConsensus) {
        const badge = document.createElement("span");
        badge.className = "ego-mixed-badge";
        badge.setAttribute("aria-label", "Sources divergentes");
        badge.title = "Sources divergentes";
        badge.textContent = "±";
        wrapper.appendChild(badge);
      }

      const tooltip = document.createElement("div");
      tooltip.className = node.isMixedConsensus ? "ego-non-consensus-tooltip ego-mixed-tooltip" : "ego-non-consensus-tooltip";
      const hasIndex = (node.sourceIndexLabels?.length ?? 0) > 0;
      const sourcesForTooltip =
        hasIndex && sources.length > 1
          ? sources.slice().sort((a, b) => {
              const ai = a.index ? Number(a.index) : Number.POSITIVE_INFINITY;
              const bi = b.index ? Number(b.index) : Number.POSITIVE_INFINITY;
              return ai - bi;
            })
          : sources;
      sourcesForTooltip.forEach((s) => {
        const row = document.createElement("div");
        row.className = "ego-tooltip-row";
        if (s.consensus !== false) {
          row.classList.add("ego-tooltip-row-consensus");
        }
        const author = s.author?.trim();
        const rest = [s.work, s.note].filter(Boolean).map((p) => p!.trim());
        if (hasIndex && s.index) {
          const idxSpan = document.createElement("span");
          idxSpan.className = "ego-tooltip-index";
          const badgeClass = getIndexColorClass(s.index);
          if (badgeClass) idxSpan.classList.add(badgeClass);
          idxSpan.textContent = s.index;
          row.appendChild(idxSpan);
          row.append(" ");
        }
        if (author) {
          const strong = document.createElement("span");
          strong.className = s.consensus !== false ? "ego-tooltip-author ego-tooltip-author-consensus" : "ego-tooltip-author";
          strong.textContent = author;
          row.appendChild(strong);
        }
        if (rest.length) {
          row.appendChild(document.createElement("br"));
          row.append(rest.join(", "));
        }
        tooltip.appendChild(row);
      });
      wrapper.appendChild(tooltip);

      if (node.showIndexBadge !== false && node.sourceIndexLabels && node.sourceIndexLabels.length > 0) {
        const badgeContainer = createIndexBadges(node.sourceIndexLabels);
        if (badgeContainer) wrapper.appendChild(badgeContainer);
      }
    } else if (node.showBadges && node.showIndexBadge !== false && node.sourceIndexLabels && node.sourceIndexLabels.length > 0) {
      // Permet d'afficher la pastille sur le central même sans tooltip (pas de sources attachées)
      const badgeContainer = createIndexBadges(node.sourceIndexLabels);
      if (badgeContainer) wrapper.appendChild(badgeContainer);
    }

    if (node.role === "central" && this.pageIds.has(node.id)) {
      const action = document.createElement("div");
      action.className = "ego-node-action";
      action.textContent = "Aller à la fiche";
      action.addEventListener("click", (event) => {
        event.stopPropagation();
          window.location.href = `/entites/${node.id}/`;
      });
      wrapper.appendChild(action);
    }

    wrapper.appendChild(button);
    wrapper.appendChild(label);
    this.nodeInstances.set(node.key, wrapper);
    return wrapper;
  }

  private setActiveNode(key: string | null) {
    this.activeNodeKey = key;
    this.nodeInstances.forEach((el, nodeKey) => {
      el.classList.toggle("is-active", key !== null && nodeKey === key);
    });
    if (key) {
      const el = this.nodeInstances.get(key);
      if (el) {
        this.positionTooltip(el);
      }
    }
    if (key === null) {
      return;
    }
  }

  private centerOnCentralNode(behavior: ScrollBehavior = "smooth") {
    const center = () => {
      // On mobile, c'est la page qui scrolle : on recentre le conteneur complet du graphe
      centerElementInViewport(this.root, behavior);
    };

    // Triple raf pour garantir le layout final (images/polices) avant centrage
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(center);
      });
    });

    // Fallback si le layout continue d'évoluer (polices/images tardives)
    window.setTimeout(center, 250);
  }

  private clearActiveNode() {
    this.setActiveNode(null);
  }

  private showMessage(text: string) {
    if (!this.messageEl) {
      this.messageEl = document.createElement("div");
      this.messageEl.className = "ego-graph-message";
      this.root.appendChild(this.messageEl);
    }
    this.messageEl.textContent = text;
  }

  private clearMessage() {
    if (this.messageEl) {
      this.messageEl.remove();
      this.messageEl = null;
    }
  }

  private updateAdvancedToggleUI() {
    if (!this.advancedToggle) return;
    this.advancedToggle.setAttribute("aria-pressed", this.advancedMode ? "true" : "false");
    this.advancedToggle.textContent = this.advancedMode ? "Mode avancé activé" : "Mode avancé";
  }

  private getSectionOrder(section: RelationSection): string[] {
    const container = this.sectionContainers.get(section);
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(".ego-node"))
      .map((el) => el.dataset.slug)
      .filter((slug): slug is string => Boolean(slug));
  }

  public setActiveSlug(slug: string): boolean {
    const entry = Array.from(this.nodeInstances.entries()).find(([, el]) => el.dataset.slug === slug);
    if (!entry) return false;
    this.setActiveNode(entry[0]);
    return true;
  }

  private isSiblingOfFocused(childSlug: string, focusedChildSlug: string): boolean {
    if (childSlug === focusedChildSlug) return false;
    return this.store.hasSibling(childSlug, focusedChildSlug);
  }

  private filterByMode(nodes: RelatedNode[]): RelatedNode[] {
    if (this.advancedMode) return nodes;
    return nodes.filter((n) => n.relation.consensus !== false);
  }

  private async animateToCenter(nodeEl: HTMLElement): Promise<void> {
    // Suspend active glow during animation
    nodeEl.classList.remove("is-active");
    nodeEl.classList.remove("is-related");
    nodeEl.classList.remove("is-sibling");
    const originalLabel = nodeEl.querySelector<HTMLElement>(".ego-node-label");
    if (originalLabel) {
      originalLabel.style.visibility = "hidden";
    }
    const sourceRect = nodeEl.getBoundingClientRect();
    const rootRect = this.root.getBoundingClientRect();
    const targetNode = this.root.querySelector<HTMLElement>('.ego-node[data-role="central"]');
    const targetRect = targetNode?.getBoundingClientRect() ?? {
      left: rootRect.left + rootRect.width / 2 - sourceRect.width / 2,
      top: rootRect.top + rootRect.height / 2 - sourceRect.height / 2,
      width: sourceRect.width * 2,
      height: sourceRect.height * 2,
    };

    const clone = nodeEl.cloneNode(true) as HTMLElement;
    clone.classList.add("ego-node-fly");
    clone.classList.remove("is-active", "is-related", "is-sibling");
    clone.querySelector(".ego-node-label")?.remove();
    clone.style.position = "fixed";
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.transformOrigin = "center center";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";

    document.body.appendChild(clone);

    // Hide original during flight
    nodeEl.classList.add("is-animating");
    nodeEl.style.opacity = "0";

    const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
    const scale = targetRect.width / sourceRect.width;

    // Force reflow then animate
    void clone.getBoundingClientRect();
    clone.style.transition = "transform 450ms ease, opacity 450ms ease";
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

    await new Promise<void>((resolve) => {
      const done = () => {
        clone.remove();
        nodeEl.classList.remove("is-animating");
        nodeEl.style.opacity = "";
        if (originalLabel) {
          originalLabel.style.visibility = "";
        }
        resolve();
      };
      const timeout = window.setTimeout(done, 600);
      clone.addEventListener(
        "transitionend",
        () => {
          window.clearTimeout(timeout);
          done();
        },
        { once: true },
      );
    });
  }

  private resetFocusState() {
    this.selectedConsortSlug = null;
    this.focusedConsortSlug = null;
    this.focusedChildSlug = null;
    this.childrenOrder = null;
    this.consortOrder = null;
    this.clearActiveNode();
  }

  private async animateOtherNodes(targetPositions: Map<string, DOMRect>, excludeSlug: string): Promise<void> {
    const animations: Promise<void>[] = [];
    this.nodeInstances.forEach((el) => {
      const slug = el.dataset.slug;
      if (!slug || slug === excludeSlug) return;
      const target = targetPositions.get(slug);
      if (!target) return;
      animations.push(this.animateNodeTo(el, target));
    });
    if (animations.length) {
      await Promise.all(animations);
    }
  }

  private async animateNodeTo(nodeEl: HTMLElement, targetRect: DOMRect): Promise<void> {
    nodeEl.classList.remove("is-active");
    nodeEl.classList.remove("is-related");
    nodeEl.classList.remove("is-sibling");
    const originalLabel = nodeEl.querySelector<HTMLElement>(".ego-node-label");
    if (originalLabel) {
      originalLabel.style.visibility = "hidden";
    }
    const sourceRect = nodeEl.getBoundingClientRect();
    const frame = this.createClipFrame(nodeEl);
    const clone = nodeEl.cloneNode(true) as HTMLElement;
    clone.classList.add("ego-node-fly");
    clone.classList.remove("is-active", "is-related", "is-sibling");
    clone.querySelector(".ego-node-label")?.remove();
    clone.style.position = "absolute";
    clone.style.left = `${sourceRect.left - frame.rect.left}px`;
    clone.style.top = `${sourceRect.top - frame.rect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.transformOrigin = "center center";
    clone.style.pointerEvents = "none";
    frame.container.appendChild(clone);
    nodeEl.classList.add("is-animating");
    nodeEl.style.opacity = "0";

    const dx = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
    const dy = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
    const scale = targetRect.width / sourceRect.width;

    void clone.getBoundingClientRect();
    clone.style.transition = "transform 450ms ease, opacity 450ms ease";
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

    await new Promise<void>((resolve) => {
      const done = () => {
        clone.remove();
        frame.container.remove();
        nodeEl.classList.remove("is-animating");
        nodeEl.style.opacity = "";
        if (originalLabel) {
          originalLabel.style.visibility = "";
        }
        resolve();
      };
      const timeout = window.setTimeout(done, 600);
      clone.addEventListener(
        "transitionend",
        () => {
          window.clearTimeout(timeout);
          done();
        },
        { once: true },
      );
    });
  }

  private computeTargetPositions(targetSlug: string): Map<string, DOMRect> | null {
    const graph = this.store.getEgoGraphBySlug(targetSlug);
    if (!graph) return null;

    const ghostRoot = document.createElement("div");
    const rootRect = this.root.getBoundingClientRect();
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const baseColumns = isMobile ? 2 : 3;
    ghostRoot.className = "ego-graph-sky ego-graph-ghost";
    ghostRoot.style.position = "fixed";
    ghostRoot.style.left = "-99999px";
    ghostRoot.style.top = "-99999px";
    ghostRoot.style.width = `${rootRect.width}px`;
    ghostRoot.style.height = `${rootRect.height}px`;
    ghostRoot.style.pointerEvents = "none";
    ghostRoot.style.visibility = "hidden";

    const grid = document.createElement("div");
    grid.className = "ego-graph-grid";
    ghostRoot.appendChild(grid);

    const sectionContents = new Map<RelationSection, HTMLElement>();
    RELATION_SECTIONS.forEach((section) => {
      const quad = document.createElement("div");
      quad.className = "ego-quadrant";
      const content = document.createElement("div");
      content.className = "ego-quadrant-content";
      quad.appendChild(content);
      grid.appendChild(quad);
      sectionContents.set(section, content);
    });

    const central = this.createGhostNode(graph.central.slug, graph.central.name, "central");
    ghostRoot.appendChild(central);

    RELATION_SECTIONS.forEach((section) => {
      const container = sectionContents.get(section);
      if (!container) return;
      let columns = baseColumns;
      let index = 0;
      let nodes = sortSection(this.filterByMode(graph[section] as RelatedNode[]));
      const isCompactParents = section === "parents" && nodes.length > 0 && nodes.length <= 2;
      if (isCompactParents) {
        columns = isMobile ? 1 : Math.min(2, nodes.length);
        container.classList.add("is-compact-parents");
      }
      nodes.forEach((item) => {
        const node = this.createGhostNode(item.entity.slug, item.entity.name, SECTION_ROLE[section]);
        const row = Math.floor(index / columns) + 1;
        const col = (index % columns) + 1;
        node.style.gridRowStart = String(row);
        node.style.gridColumnStart = String(col);
        index += 1;
        container.appendChild(node);
      });
    });

    document.body.appendChild(ghostRoot);
    const ghostRect = ghostRoot.getBoundingClientRect();
    const positions = new Map<string, DOMRect>();
    ghostRoot.querySelectorAll<HTMLElement>(".ego-node").forEach((el) => {
      const slug = el.dataset.slug;
      if (!slug) return;
      const rect = el.getBoundingClientRect();
      positions.set(
        slug,
        new DOMRect(
          rootRect.left + (rect.left - ghostRect.left),
          rootRect.top + (rect.top - ghostRect.top),
          rect.width,
          rect.height,
        ),
      );
    });

    ghostRoot.remove();
    return positions;
  }

  private positionTooltip(el: HTMLElement) {
    const tooltip = el.querySelector<HTMLElement>(".ego-non-consensus-tooltip");
    if (!tooltip) return;
    const rect = el.getBoundingClientRect();
    const rawLeft = rect.left + rect.width / 2;
    const top = rect.top;
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 12;
    const half = tooltipRect.width / 2;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const container = el.closest<HTMLElement>(".ego-quadrant-content");
    const gridStyle = container ? getComputedStyle(container) : null;
    const columns = gridStyle?.gridTemplateColumns
      ? gridStyle.gridTemplateColumns.split(" ").filter(Boolean).length
      : 0;
    const containerRect = container?.getBoundingClientRect();
    const columnWidth = containerRect && columns ? containerRect.width / columns : null;
    const centerX = rect.left + rect.width / 2;
    const columnIndex =
      containerRect && columnWidth ? Math.max(0, Math.min(columns - 1, Math.floor((centerX - containerRect.left) / columnWidth))) : null;
    let targetLeft = rawLeft;
    if (isMobile) {
      const role = el.dataset.role;
      if (role === "consort") {
        targetLeft = margin + half;
      } else if (role === "child") {
        targetLeft = window.innerWidth - margin - half;
      }
    } else if (columns && columnIndex !== null) {
      const role = el.dataset.role;
      // Décale horizontalement pour les extrêmes : consorts à droite -> bulle vers la gauche ; enfants à gauche -> bulle vers la droite.
      if (role === "consort" && columnIndex === columns - 1) {
        targetLeft = rawLeft - (half - rect.width / 2);
      } else if (role === "child" && columnIndex === 0) {
        targetLeft = rawLeft + (half - rect.width / 2);
      }
    }
    const clampedLeft = Math.min(Math.max(targetLeft, margin + half), window.innerWidth - margin - half);
    tooltip.style.left = `${clampedLeft}px`;
    tooltip.style.top = `${top}px`;
  }

  private createGhostNode(slug: string, name: string, role: NodeRole): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "ego-node";
    wrapper.dataset.role = role;
    wrapper.dataset.slug = slug;
    wrapper.title = name;
    return wrapper;
  }

  private createClipFrame(nodeEl: HTMLElement): { container: HTMLElement; rect: DOMRect } {
    const container = document.createElement("div");
    const grid = this.root.querySelector(".ego-graph-grid");
    const rect = grid?.getBoundingClientRect() ?? this.root.getBoundingClientRect();
    container.style.position = "fixed";
    container.style.left = `${rect.left}px`;
    container.style.top = `${rect.top}px`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    container.style.overflow = "hidden";
    container.style.pointerEvents = "none";
    container.style.zIndex = "9997";
    document.body.appendChild(container);
    return { container, rect };
  }
}

function getFaceUrls(slug: string, id: string, culture?: string): string[] {
  const urls: string[] = [];
  if (culture) {
    urls.push(`/faces/${culture}/${id}.webp`);
    urls.push(`/faces/${culture}/${slug}.webp`);
    urls.push(`/faces/${culture}/${culture}-unknown_x.webp`);
  }
  urls.push(`/faces/${id}.webp`);
  urls.push(`/faces/${slug}.webp`);
  urls.push(`/faces/grecque/grecque-unknown_x.webp`);
  urls.push(`/faces/unknown_x.webp`);
  urls.push(`/faces/unknown_m.webp`);
  return urls;
}

function sortSection(nodes: RelatedNode[]): RelatedNode[] {
  return nodes
    .slice()
    .sort((a, b) => a.entity.name.localeCompare(b.entity.name, "fr", { sensitivity: "base" }));
}

function prioritizeChildren(
  nodes: RelatedNode[],
  consortSlug: string,
  store: GenealogieStore,
): {
  prioritized: RelatedNode[];
  rest: RelatedNode[];
} {
  const prioritized: RelatedNode[] = [];
  const rest: RelatedNode[] = [];

  nodes.forEach((child) => {
    if (store.hasParent(child.entity.slug, consortSlug)) {
      prioritized.push(child);
    } else {
      rest.push(child);
    }
  });

  return { prioritized, rest };
}

function prioritizeConsorts(
  nodes: RelatedNode[],
  childSlug: string,
  store: GenealogieStore,
): {
  prioritized: RelatedNode[];
  rest: RelatedNode[];
} {
  const prioritized: RelatedNode[] = [];
  const rest: RelatedNode[] = [];

  nodes.forEach((consort) => {
    if (store.hasParent(childSlug, consort.entity.slug)) {
      prioritized.push(consort);
    } else {
      rest.push(consort);
    }
  });

  return { prioritized, rest };
}

function reorderSiblings(nodes: RelatedNode[], focusedChildSlug: string, store: GenealogieStore): RelatedNode[] {
  const focusIndex = nodes.findIndex((n) => n.entity.slug === focusedChildSlug);
  if (focusIndex === -1) return nodes;
  const siblings = nodes.filter(
    (child) => child.entity.slug !== focusedChildSlug && store.hasSibling(child.entity.slug, focusedChildSlug),
  );
  const others = nodes.filter(
    (child) => child.entity.slug === focusedChildSlug || !store.hasSibling(child.entity.slug, focusedChildSlug),
  );

  const ordered: (RelatedNode | null)[] = Array(nodes.length).fill(null);
  ordered[focusIndex] = nodes[focusIndex];

  let siblingIdx = 0;
  for (let offset = 1; siblingIdx < siblings.length && (focusIndex - offset >= 0 || focusIndex + offset < nodes.length); offset++) {
    const leftIndex = focusIndex - offset;
    const rightIndex = focusIndex + offset;

    if (leftIndex >= 0 && siblingIdx < siblings.length && ordered[leftIndex] === null) {
      ordered[leftIndex] = siblings[siblingIdx++];
    }
    if (rightIndex < nodes.length && siblingIdx < siblings.length && ordered[rightIndex] === null) {
      ordered[rightIndex] = siblings[siblingIdx++];
    }
  }

  // Fill remaining slots with others in their original order (excluding focus already placed)
  const remaining = others.filter((child) => child.entity.slug !== focusedChildSlug);
  let remainingIdx = 0;
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i] === null && remainingIdx < remaining.length) {
      ordered[i] = remaining[remainingIdx++];
    }
  }

  // Cast away nulls (should be full) and return
  return ordered.filter((item): item is RelatedNode => item !== null);
}

function sortByOrder(nodes: RelatedNode[], order: string[]): RelatedNode[] {
  const rank = new Map<string, number>();
  order.forEach((slug, idx) => rank.set(slug, idx));
  return nodes
    .slice()
    .sort((a, b) => (rank.get(a.entity.slug) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.entity.slug) ?? Number.MAX_SAFE_INTEGER));
}

function enableQuadrantDragScroll(container: HTMLElement) {
  let isDragging = false;
  let startY = 0;
  let startScroll = 0;
  let activePointer: number | null = null;

  container.addEventListener("pointerdown", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest(".ego-node button")) {
      return;
    }
    event.preventDefault();
    isDragging = true;
    startY = event.clientY;
    startScroll = container.scrollTop;
    activePointer = event.pointerId;
    container.setPointerCapture(event.pointerId);
    container.classList.add("is-dragging");
  });

  const stopDragging = (event: PointerEvent) => {
    if (!isDragging || (activePointer !== null && event.pointerId !== activePointer)) {
      return;
    }
    isDragging = false;
    activePointer = null;
    container.classList.remove("is-dragging");
    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }
  };

  container.addEventListener("pointermove", (event) => {
    if (!isDragging || (activePointer !== null && event.pointerId !== activePointer)) {
      return;
    }
    event.preventDefault();
    const deltaY = event.clientY - startY;
    container.scrollTop = startScroll - deltaY;
  });

  container.addEventListener("pointerup", stopDragging);
  container.addEventListener("pointercancel", stopDragging);
}

function monitorScrollable(container: HTMLElement) {
  const update = () => {
    const atTop = container.scrollTop <= 2;
    const atBottom = container.scrollHeight - container.clientHeight - container.scrollTop <= 2;
    container.classList.toggle("has-more-top", !atTop);
    container.classList.toggle("has-more-bottom", !atBottom);
  };
  container.addEventListener("scroll", update);
  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(container);
  update();
}

function renderMessage(root: HTMLElement, text: string) {
  const message = document.createElement("div");
  message.className = "ego-graph-message";
  message.textContent = text;
  root.innerHTML = "";
  root.appendChild(message);
}

function bootFromDom() {
  document.querySelectorAll<HTMLElement>("[data-ego-graph]").forEach((element) => {
    if (element.dataset.graphHydrated === "true") {
      return;
    }
    const slug = element.dataset.initialSlug;
    if (!slug) {
      return;
    }
    element.dataset.graphHydrated = "true";
    initEgoGraphInteractive(element.id, slug);
  });
}

bootFromDom();
