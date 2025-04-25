/**
 * 订阅者类型
 */
export type Subscriber<T> = (value: T) => void;

/**
 * 信号接口
 */
export interface Signal<T> {
  get: () => T;
  set: (value: T) => void;
  subscribe: (subscriber: Subscriber<T>) => () => void;
}

/**
 * 创建一个响应式信号
 * @param initialValue 初始值
 * @returns 信号对象
 */
export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Subscriber<T>>();

  const notifySubscribers = (newValue: T) => {
    subscribers.forEach(subscriber => subscriber(newValue));
  };

  return {
    get: () => value,
    set: (newValue: T) => {
      // 只有在值真正改变时才更新和通知订阅者
      if (!Object.is(value, newValue)) {
        value = newValue;
        
        // 如果是对象，创建一个新的引用以避免引用问题
        if (typeof newValue === 'object' && newValue !== null) {
          value = JSON.parse(JSON.stringify(newValue));
        }
        
        notifySubscribers(value);
      }
    },
    subscribe: (subscriber: Subscriber<T>) => {
      subscribers.add(subscriber);
      // 移除立即通知新订阅者当前值的行为
      
      // 返回取消订阅函数
      return () => {
        subscribers.delete(subscriber);
      };
    }
  };
} 