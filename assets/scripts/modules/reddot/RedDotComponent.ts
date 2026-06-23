import { _decorator, Component } from 'cc';
import { redDotModule, type IRedDotDisplay } from './RedDotModule';

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

  onLoad(): void {
    redDotModule.registerDisplay(this.redDotPath, this);
  }

  onDestroy(): void {
    redDotModule.removeDisplay(this.redDotPath, this);
  }

  /** IRedDotDisplay — 红点模块在计数变化时调用 */
  updateVisible(visible: boolean): void {
    this.node.active = visible;
  }
}
