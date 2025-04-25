import { effect } from '../reactive/effect';
import { computed } from '../reactive/computed';
import { createSignal } from './signal';

/**
 * 创建一个副作用函数，当依赖变化时会自动运行
 * 这是对reactive/effect的简单封装，提供更简洁的API
 * 
 * @param fn 要执行的副作用函数
 * @returns 清理函数，调用后停止追踪依赖
 */
export function createEffect(fn: () => void): () => void {
  const runner = effect(fn);
  
  // 返回清理函数
  return () => {
    if (runner.effect) {
      runner.effect.stop();
    }
  };
}

/**
 * 创建一个计算属性，只有在依赖变化且被访问时才会重新计算
 * 这是对reactive/computed的简单封装，适配信号API风格
 * 
 * @param getter 计算函数
 * @returns 包含get()和subscribe()方法的对象
 */
export function createComputed<T>(getter: () => T) {
  const computedRef = computed(getter);
  
  // 创建信号以支持订阅模式
  const signal = createSignal<T>(computedRef.value);
  
  // 当计算属性变化时更新信号
  createEffect(() => {
    signal.set(computedRef.value);
  });
  
  return {
    get: () => computedRef.value,
    subscribe: signal.subscribe
  };
} 