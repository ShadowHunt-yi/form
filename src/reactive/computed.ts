import { ReactiveEffect } from './effect';
import { track, trigger } from './effect';

export interface ComputedRef<T = any> {
  value: T;
}

class ComputedRefImpl<T> {
  private _value!: T;
  private _dirty = true;
  public readonly effect: ReactiveEffect<T>;

  constructor(getter: () => T) {
    // 创建一个响应式副作用
    this.effect = new ReactiveEffect(getter, () => {
      // 当依赖项变化时，将 _dirty 标记为 true
      if (!this._dirty) {
        this._dirty = true;
        // 触发订阅了计算属性的副作用
        trigger(this, 'value');
      }
    });
    this.effect.allowRecurse = true;
  }

  get value(): T {
    // 如果值已经脏了（需要重新计算），则运行副作用获取新值
    if (this._dirty) {
      this._value = this.effect.run() as T;
      this._dirty = false;
    }
    // 收集依赖
    track(this, 'value');
    return this._value;
  }
}

/**
 * 创建一个计算属性
 * @param getter 计算属性的getter函数
 */
export function computed<T>(getter: () => T): ComputedRef<T> {
  return new ComputedRefImpl(getter) as ComputedRef<T>;
} 