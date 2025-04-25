import { createSignal, Signal, Subscriber } from './signal';

/**
 * 模型接口
 */
export type Model<T extends object> = T & {
  /**
   * 订阅整个模型的变化
   * @param subscriber 订阅者函数
   * @returns 取消订阅函数
   */
  $subscribe: (subscriber: Subscriber<T>) => () => void;
  
  /**
   * 订阅特定属性的变化
   * @param key 属性名
   * @param subscriber 订阅者函数
   * @returns 取消订阅函数
   */
  $subscribeKey: <K extends keyof T>(key: K, subscriber: Subscriber<T[K]>) => () => void;
  
  /**
   * 批量更新模型
   * @param updates 要更新的属性和值
   */
  $patch: (updates: Partial<T>) => void;
  
  /**
   * 重置模型到初始状态
   */
  $reset: () => void;
  
  /**
   * 获取模型的当前状态快照
   * @returns 状态快照
   */
  $snapshot: () => T;
}

/**
 * 创建一个响应式模型
 * @param initialState 初始状态对象
 * @returns 响应式模型对象
 */
export function model<T extends object>(initialState: T): Model<T> {
  const proxy = {} as Model<T>;
  const signals: Record<string, Signal<any>> = {};
  const modelSubscribers = new Set<Subscriber<T>>();
  
  // 保存初始状态的副本
  const initialStateCopy = JSON.parse(JSON.stringify(initialState));

  // 为每个属性创建信号
  for (const key in initialState) {
    if (Object.prototype.hasOwnProperty.call(initialState, key)) {
      signals[key] = createSignal(initialState[key]);
      
      // 定义代理属性
      Object.defineProperty(proxy, key, {
        get() {
          return signals[key].get();
        },
        set(value) {
          if (typeof value === 'object' && value !== null) {
            value = JSON.parse(JSON.stringify(value));
          }
          signals[key].set(value);
          // 触发模型订阅者
          notifySubscribers();
        },
        enumerable: true,
      });
    }
  }

  // 通知所有模型订阅者
  function notifySubscribers() {
    if (modelSubscribers.size > 0) {
      const snapshot = getSnapshot();
      modelSubscribers.forEach(subscriber => subscriber(snapshot));
    }
  }

  // 获取当前状态快照
  function getSnapshot(): T {
    const snapshot = {} as T;
    for (const key in signals) {
      snapshot[key as keyof T] = signals[key].get();
    }
    return snapshot;
  }

  // 添加模型方法
  proxy.$subscribe = (subscriber: Subscriber<T>) => {
    modelSubscribers.add(subscriber);
    return () => {
      modelSubscribers.delete(subscriber);
    };
  };

  proxy.$subscribeKey = <K extends keyof T>(key: K, subscriber: Subscriber<T[K]>) => {
    // 包装subscriber以处理首次订阅值
    const filteredSubscriber: Subscriber<T[K]> = (value) => {
      subscriber(value);
    };
    
    return signals[key as string].subscribe(filteredSubscriber);
  };

  proxy.$patch = (updates: Partial<T>) => {
    let hasChanges = false;
    const batch = {} as Partial<T>;
    
    // 收集所有更新
    for (const key in updates) {
      if (key in signals) {
        const currentValue = signals[key].get();
        const newValue = updates[key];
        
        if (!Object.is(currentValue, newValue)) {
          if (typeof newValue === 'object' && newValue !== null) {
            batch[key] = JSON.parse(JSON.stringify(newValue));
          } else {
            batch[key] = newValue;
          }
          hasChanges = true;
        }
      }
    }
    
    // 批量应用更新
    if (hasChanges) {
      for (const key in batch) {
        signals[key].set(batch[key]);
      }
      notifySubscribers();
    }
  };

  proxy.$reset = () => {
    // 创建一个新的副本以避免引用问题
    const resetState = JSON.parse(JSON.stringify(initialStateCopy));
    proxy.$patch(resetState);
  };

  proxy.$snapshot = getSnapshot;

  return proxy;
} 