// 当前激活的副作用
let activeEffect: ReactiveEffect | undefined;

// 副作用栈，用于处理嵌套的副作用
const effectStack: ReactiveEffect[] = [];

// 保存子effect到父effect的映射关系
const childToParentEffectMap = new Map<ReactiveEffect, ReactiveEffect>();

/**
 * 响应式副作用类
 * 用于追踪依赖和触发更新
 */
export class ReactiveEffect<T = any> {
  // 是否处于活跃状态
  active = true;
  // 依赖此副作用的所有响应式对象
  deps: Set<ReactiveEffect>[] = [];
  // 用于防止无限递归
  allowRecurse = false;
  // 子effect集合
  children = new Set<ReactiveEffect>();
  // 记录嵌套深度，用于确保嵌套effect的正确执行顺序
  nestingDepth = 0;

  constructor(
    // 副作用回调函数
    public fn: () => T,
    // 调度器，可以自定义响应式更新的方式
    public scheduler?: (job: ReactiveEffect) => void
  ) {}

  // 运行副作用函数
  run() {
    if (!this.active) {
      return this.fn();
    }

    // 避免重复收集
    if (effectStack.includes(this) && !this.allowRecurse) {
      return;
    }

    try {
      // 将当前副作用推入栈中
      effectStack.push(this);
      
      // 如果存在父effect，建立父子关系
      const parent = activeEffect;
      if (parent && parent !== this) {
        parent.children.add(this);
        childToParentEffectMap.set(this, parent);
        this.nestingDepth = parent.nestingDepth + 1;
      } else {
        this.nestingDepth = 0;
      }
      
      activeEffect = this;

      // 清除之前的依赖关系
      cleanupEffect(this);

      // 执行函数，此时会触发代理对象的 get，进行依赖收集
      const result = this.fn();
      
      // 确保所有子effect都执行完成
      if (this.children.size > 0) {
        const children = Array.from(this.children);
        children.forEach(child => {
          if (child.active) {
            child.run();
          }
        });
      }
      
      return result;
    } finally {
      // 恢复之前的状态
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  }

  // 停止追踪副作用
  stop() {
    if (this.active) {
      cleanupEffect(this);
      
      // 从父effect的children中移除自己
      const parent = childToParentEffectMap.get(this);
      if (parent) {
        parent.children.delete(this);
        childToParentEffectMap.delete(this);
      }
      
      // 停止所有子effect
      if (this.children.size > 0) {
        const children = Array.from(this.children);
        children.forEach(child => child.stop());
        this.children.clear();
      }
      
      this.active = false;
    }
  }
}

// 清除副作用的所有依赖关系
function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}

// 用于存储响应式对象的依赖关系
// targetMap -> target -> key -> deps
export const targetMap = new WeakMap<any, Map<any, Set<ReactiveEffect>>>();

/**
 * 追踪依赖
 * @param target 响应式对象
 * @param key 属性名
 */
export function track(target: object, key: unknown) {
  if (!activeEffect) return;

  // 获取对象的依赖映射
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  // 获取属性的依赖集合
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  // 添加依赖
  trackEffects(dep);
}

/**
 * 追踪依赖集合
 * @param dep 依赖集合
 */
export function trackEffects(dep: Set<ReactiveEffect>) {
  if (activeEffect && !dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

/**
 * 触发更新
 * @param target 响应式对象
 * @param key 属性名
 * @param newValue 新值
 * @param oldValue 旧值
 */
export function trigger(
  target: object,
  key: unknown,
  newValue?: unknown,
  oldValue?: unknown
) {
  // 获取对象的依赖映射
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  // 获取属性的依赖集合
  const dep = depsMap.get(key);
  
  // 创建一个新的集合用于存储所有要触发的effect
  const effects = new Set<ReactiveEffect>();

  // 添加直接依赖此属性的effect
  if (dep) {
    dep.forEach(effect => {
      if (effect !== activeEffect || effect.allowRecurse) {
        effects.add(effect);
      }
    });
  }

  // 如果没有effect需要触发，直接返回
  if (effects.size === 0) return;

  // 触发效果
  triggerEffects(effects);
}

/**
 * 触发依赖集合中的所有副作用
 * @param effects 要触发的副作用集合
 */
export function triggerEffects(effects: Set<ReactiveEffect>) {
  // 创建副本，避免在循环过程中修改集合
  const effectsToRun = Array.from(effects);
  
  // 按嵌套深度排序，确保父effect先于子effect执行
  effectsToRun.sort((a, b) => a.nestingDepth - b.nestingDepth);

  // 执行所有effect
  for (const effect of effectsToRun) {
    // 如果有调度器，使用调度器
    if (effect.scheduler) {
      effect.scheduler(effect);
    } else {
      effect.run();
    }
  }
}

/**
 * 创建一个副作用函数
 * @param fn 要执行的函数
 * @param options 配置选项
 */
export function effect<T = any>(
  fn: () => T,
  options: {
    scheduler?: (job: ReactiveEffect) => void;
    onStop?: () => void;
  } = {}
) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  // 立即执行一次，进行依赖收集
  _effect.run();

  // 返回包装后的runner函数
  const runner = _effect.run.bind(_effect) as any;
  runner.effect = _effect;

  return runner;
} 