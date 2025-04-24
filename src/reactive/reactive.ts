import { track, trigger } from './effect';

// 存储已经代理过的对象
const reactiveMap = new WeakMap<object, any>();

// 标记一个对象已经是响应式的
export const ReactiveFlags = {
  IS_REACTIVE: '__v_isReactive',
  RAW: '__v_raw'
};

/**
 * 获取响应式对象的原始对象
 * @param observed 响应式对象
 */
export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as any)[ReactiveFlags.RAW];
  return raw ? toRaw(raw) : observed;
}

// 需要特殊处理的数组方法
const arrayInstrumentations: Record<string, Function> = {};
['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method) => {
  const original = Array.prototype[method as any];
  arrayInstrumentations[method] = function(this: unknown[], ...args: any[]) {
    // 保存原始数组
    const rawArray = toRaw(this);
    
    // 执行原始方法
    const result = original.apply(rawArray, args);
    
    // 触发相关的更新
    // 对于会改变数组长度的方法，触发length依赖更新
    trigger(rawArray, 'length');
    // 对于可能修改数组内容的方法，触发迭代器相关的更新
    trigger(rawArray, Symbol.iterator);
    // 为确保一定触发更新，对整个数组触发更新
    trigger(rawArray, method);
    
    return result;
  };
});

/**
 * 判断一个对象是否是响应式对象
 * @param value 要检查的对象
 */
export function isReactive(value: unknown): boolean {
  return !!(value && (value as any)[ReactiveFlags.IS_REACTIVE]);
}

/**
 * 创建响应式对象
 * @param target 要代理的目标对象
 */
export function reactive<T extends object>(target: T): T {
  // 如果目标已经是响应式对象，直接返回
  if (isReactive(target)) {
    return target;
  }

  // 如果已经为目标创建过代理，直接返回缓存的代理
  const existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  // 创建代理
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      // 处理特殊的标记属性
      if (key === ReactiveFlags.IS_REACTIVE) {
        return true;
      } else if (key === ReactiveFlags.RAW) {
        return target;
      }

      // 处理数组方法
      if (Array.isArray(target) && Object.prototype.hasOwnProperty.call(arrayInstrumentations, key)) {
        return arrayInstrumentations[key as any];
      }

      const res = Reflect.get(target, key, receiver);

      // 收集依赖
      track(target, key);

      // 如果访问的是数组的length属性，也追踪迭代器依赖
      if (Array.isArray(target) && key === 'length') {
        track(target, Symbol.iterator);
      }

      // 如果获取的值是对象，也将其转换为响应式对象
      if (typeof res === 'object' && res !== null) {
        return reactive(res);
      }

      return res;
    },

    set(target, key, newValue, receiver) {
      const oldValue = (target as any)[key];
      
      // 设置属性值
      const result = Reflect.set(target, key, newValue, receiver);
      
      // 如果值发生变化，触发更新
      if (oldValue !== newValue) {
        trigger(target, key, newValue, oldValue);
        
        // 如果是数组且修改了length相关的属性，额外触发length依赖的更新
        if (Array.isArray(target)) {
          if (key === 'length') {
            trigger(target, Symbol.iterator);
          } else if (typeof key === 'number') {
            // 如果修改了数组元素，也触发长度依赖更新
            trigger(target, 'length');
            trigger(target, Symbol.iterator);
          }
        }
      }
      
      return result;
    },

    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const oldValue = (target as any)[key];
      
      // 删除属性
      const result = Reflect.deleteProperty(target, key);
      
      // 如果属性存在且被成功删除，触发更新
      if (hadKey && result) {
        trigger(target, key, undefined, oldValue);
        
        // 如果是数组，额外触发迭代器相关更新
        if (Array.isArray(target)) {
          trigger(target, 'length');
          trigger(target, Symbol.iterator);
        }
      }
      
      return result;
    },

    has(target, key) {
      const result = Reflect.has(target, key);
      track(target, key);
      return result;
    },

    ownKeys(target) {
      // 追踪整个对象的迭代操作
      track(target, Symbol.iterator);
      
      // 如果是数组，也追踪length属性
      if (Array.isArray(target)) {
        track(target, 'length');
      }
      
      return Reflect.ownKeys(target);
    }
  });

  // 缓存代理
  reactiveMap.set(target, proxy);

  return proxy;
} 