import { _decorator, Component } from 'cc';
import { ModuleManager } from '../../core/ModuleManager';
import type { RedDotModule } from './RedDotModule';
import type { IRedDotDisplay } from './RedDotModule';

const { ccclass, property } = _decorator;

/**
 * 红点显示组件 — 挂载到需要显示红点的节点上。
 * 在 onLoad 中注册到红点模块，在 onDestroy 中移除。
 * 当路径对应的计数变化时自动显示/隐藏节点。
 */
@ccclass('RedDotComponent')
export class RedDotComponent extends Component implements IRedDotDisplay {
  @property
  redDotPath: string = '';

  private module: RedDotModule | null = null;

  onLoad(): void {
    this.module = ModuleManager.inst.get<RedDotModule>('RedDotModule');
    this.module.registerDisplay(this.redDotPath, this);
  }

  onDestroy(): void {
    if (this.module) {
      this.module.removeDisplay(this.redDotPath, this);
    }
  }

  /** IRedDotDisplay — 红点模块在计数变化时调用 */
  updateVisible(visible: boolean): void {
    this.node.active = visible;
  }
}
