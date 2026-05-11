import { Prefab, Node, instantiate } from 'cc';

export enum UILayer {
  BACKGROUND = 0,
  SCENE = 1,
  HUD = 2,
  DIALOG = 3,
  FLOAT = 4,
  TIPS = 5,
  LOADING = 6,
}

const LAYER_ORDER: Record<UILayer, number> = {
  [UILayer.BACKGROUND]: 0,
  [UILayer.SCENE]: 100,
  [UILayer.HUD]: 200,
  [UILayer.DIALOG]: 300,
  [UILayer.FLOAT]: 400,
  [UILayer.TIPS]: 500,
  [UILayer.LOADING]: 600,
};

export class UIManager {
  private static _inst: UIManager;
  static get inst(): UIManager {
    if (!this._inst) this._inst = new UIManager();
    return this._inst;
  }

  private layers: Map<UILayer, Node> = new Map();
  private uiRegistry: Map<string, Node> = new Map();

  init(canvas: Node): void {
    Object.values(UILayer).forEach((layer) => {
      if (typeof layer === 'number') {
        const node = new Node(`Layer_${UILayer[layer]}`);
        node.setParent(canvas);
        node.setSiblingIndex(LAYER_ORDER[layer as UILayer]);
        this.layers.set(layer as UILayer, node);
      }
    });
  }

  register(key: string, ui: Node): void {
    this.uiRegistry.set(key, ui);
  }

  unregister(key: string): void {
    this.uiRegistry.delete(key);
  }

  get<T extends Node>(key: string): T | null {
    return (this.uiRegistry.get(key) as T) || null;
  }

  addToLayer(ui: Node, layer: UILayer): void {
    const layerNode = this.layers.get(layer);
    if (layerNode) {
      ui.setParent(layerNode);
    }
  }

  async open(key: string, prefab: Prefab): Promise<Node | null> {
    const existing = this.uiRegistry.get(key);
    if (existing && existing.active) return existing;

    const node = instantiate(prefab);
    if (!node) return null;

    node.name = key;
    const layer = this.guessLayerFor(key);
    this.addToLayer(node, layer);
    this.register(key, node);
    return node;
  }

  close(key: string): void {
    const ui = this.uiRegistry.get(key);
    if (ui) {
      ui.active = false;
    }
  }

  closeAll(layer?: UILayer): void {
    if (layer !== undefined) {
      const layerNode = this.layers.get(layer);
      if (layerNode) {
        layerNode.children.forEach(child => (child.active = false));
      }
    } else {
      this.uiRegistry.forEach(ui => (ui.active = false));
    }
  }

  private guessLayerFor(key: string): UILayer {
    const lower = key.toLowerCase();
    if (lower.includes('loading') || lower.includes('mask')) return UILayer.LOADING;
    if (lower.includes('tips') || lower.includes('toast')) return UILayer.TIPS;
    if (lower.includes('confirm') || lower.includes('alert')) return UILayer.FLOAT;
    if (lower.includes('dialog') || lower.includes('panel') || lower.includes('result')) return UILayer.DIALOG;
    if (lower.includes('hud') || lower.includes('bar') || lower.includes('button')) return UILayer.HUD;
    return UILayer.SCENE;
  }
}
