/** 红点树节点 */
interface RedDotNode {
  path: string;
  ownCount: number;
  totalCount: number;
  parent: string | null;
  children: Set<string>;
}

/**
 * 红点数据层 — 维护树状结构，处理计数与聚合。
 * 纯数据逻辑，不依赖任何 CocosCreator API。
 */
export class RedDotData {
  private nodes: Map<string, RedDotNode> = new Map();

  /** 确保路径对应的节点存在（自动补全中间节点） */
  private ensureNode(path: string): RedDotNode {
    let node = this.nodes.get(path);
    if (node) return node;

    node = { path, ownCount: 0, totalCount: 0, parent: null, children: new Set() };
    this.nodes.set(path, node);

    // 建立父子关系
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash > 0) {
      const parentPath = path.substring(0, lastSlash);
      const parent = this.ensureNode(parentPath);
      node.parent = parentPath;
      parent.children.add(path);
    }

    return node;
  }

  /** 设置节点自身计数 */
  setCount(path: string, count: number): void {
    const node = this.ensureNode(path);
    node.ownCount = count;
    this.recalculate(path);
  }

  /** 增量更新节点计数 */
  addCount(path: string, delta: number): void {
    const node = this.ensureNode(path);
    node.ownCount += delta;
    this.recalculate(path);
  }

  /** 获取节点总计数（自身 + 所有子节点） */
  getCount(path: string): number {
    return this.nodes.get(path)?.totalCount ?? 0;
  }

  /** 递归向上重算 totalCount */
  private recalculate(path: string): void {
    const node = this.nodes.get(path);
    if (!node) return;

    let sum = node.ownCount;
    node.children.forEach(childPath => {
      sum += this.nodes.get(childPath)?.totalCount ?? 0;
    });
    node.totalCount = sum;

    // 向上传播
    if (node.parent) {
      this.recalculate(node.parent);
    }
  }

  /** 移除节点自身计数（不清除子节点，保留树结构） */
  clearCount(path: string): void {
    const node = this.nodes.get(path);
    if (!node) return;
    node.ownCount = 0;
    this.recalculate(path);
  }

  /** 清空所有数据 */
  clear(): void {
    this.nodes.clear();
  }
}
