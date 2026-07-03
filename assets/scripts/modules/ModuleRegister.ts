import { ModuleManager } from "../core/ModuleManager";
import { BagModule } from "./bag/BagModule";
import { BattleModule } from "./battle/BattleModule";
import { OpenConditionModule } from "./opencondition/OpenConditionModule";
import { RedDotModule } from "./reddot/RedDotModule";

export const bagModule = ModuleManager.inst.register<BagModule>('BagModule', BagModule);
export const battleModule = ModuleManager.inst.register<BattleModule>("BattleModule", BattleModule);
export const openConditionModule = ModuleManager.inst.register<OpenConditionModule>('OpenConditionModule', OpenConditionModule);
export const redDotModule = ModuleManager.inst.register<RedDotModule>('RedDotModule', RedDotModule);