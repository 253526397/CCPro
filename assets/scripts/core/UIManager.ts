import { Prefab, Node, instantiate } from 'cc';

/** UI 渲染层级，数字越大越靠前 */
export enum UILayer {
  BACKGROUND = 0,
  SCENE = 1,
  HUD = 2,
  DIALOG = 3,
  FLOAT = 4,
  TIPS = 5,
  LOADING = 6,
}

/** 每层在节点树中的 sibling 索引（通过间隔 100 预留扩展空间） */
const LAYER_ORDER: Record<UILayer, number> = {
  [UILayer.BACKGROUND]: 0,
  [UILayer.SCENE]: 100,
  [UILayer.HUD]: 200,
  [UILayer.DIALOG]: 300,
  [UILayer.FLOAT]: 400,
  [UILayer.TIPS]: 500,
  [UILayer.LOADING]: 600,
};

/**
 * 全局 UI 管理器，所有 UI 注册、查找、层级控制、打开/关闭的公开入口。
 * 业务模块通过 UIManager.inst.open('DialogName', prefab) 获取 UI 实例。
 */
export class UIManager {
  private static _inst: UIManager;
  static get inst(): UIManager {
    if (!this._inst) this._inst = new UIManager();
    return this._inst;
  }

  private layers: Map<UILayer, Node> = new Map();
  private uiRegistry: Map<string, Node> = new Map();

  private static readonly ALL_LAYERS: UILayer[] = [
    UILayer.BACKGROUND, UILayer.SCENE, UILayer.HUD,
    UILayer.DIALOG, UILayer.FLOAT, UILayer.TIPS, UILayer.LOADING,
  ];

  /** 初始化所有 UI 层级节点，入参为场景中的 Canvas 节点 */
  init(canvas: Node): void {
    UIManager.ALL_LAYERS.forEach((layer) => {
      const node = new Node(`Layer_${UILayer[layer]}`);
      node.setParent(canvas);
      node.setSiblingIndex(LAYER_ORDER[layer]);
      this.layers.set(layer, node);
    });
  }

  /** 注册 UI 实例到全局表中 */
  register(key: string, ui: Node): void {
    this.uiRegistry.set(key, ui);
  }

  /** 从全局表中注销 UI */
  unregister(key: string): void {
    this.uiRegistry.delete(key);
  }

  /** 按 key 查找 UI 实例 */
  get<T extends Node>(key: string): T | null {
    return (this.uiRegistry.get(key) as T) || null;
  }

  /** 将 UI 节点挂到指定层级下 */
  addToLayer(ui: Node, layer: UILayer): void {
    const layerNode = this.layers.get(layer);
    if (layerNode) {
      ui.setParent(layerNode);
    }
  }

  /**
   * 打开 UI：
   * - 若已存在且激活则复用
   * - 否则从 prefab 实例化，自动分配到合适的层级
   */
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

  /** 关闭 UI（隐藏不销毁，可复用） */
  close(key: string): void {
    const ui = this.uiRegistry.get(key);
    if (ui) {
      ui.active = false;
    }
  }

  /**
   * 关闭 UI：
   * - 指定 layer 则只关闭该层所有 UI
   * - 不指定则关闭所有 UI
   */
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

  /** 根据 key 中的关键词自动判断所属层级 */
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
