import { createSignal } from '../../src/core/signal';

describe('信号系统测试', () => {
  test('创建信号并获取初始值', () => {
    const count = createSignal(0);
    expect(count.get()).toBe(0);
    
    const text = createSignal('hello');
    expect(text.get()).toBe('hello');
    
    const bool = createSignal(true);
    expect(bool.get()).toBe(true);
    
    const obj = createSignal({ name: 'test' });
    expect(obj.get()).toEqual({ name: 'test' });
  });
  
  test('设置信号值', () => {
    const count = createSignal(0);
    
    count.set(5);
    expect(count.get()).toBe(5);
    
    count.set(10);
    expect(count.get()).toBe(10);
  });
  
  test('订阅信号变化', () => {
    const count = createSignal(0);
    const values: number[] = [];
    
    const unsubscribe = count.subscribe(value => {
      values.push(value);
    });
    
    count.set(1);
    count.set(2);
    count.set(3);
    
    expect(values).toEqual([1, 2, 3]);
    
    // 测试取消订阅
    unsubscribe();
    count.set(4);
    expect(values).toEqual([1, 2, 3]); // 不再增加新值
  });
  
  test('设置相同的值不应触发订阅', () => {
    const count = createSignal(0);
    let callCount = 0;
    
    count.subscribe(() => {
      callCount++;
    });
    
    count.set(0); // 相同的值
    expect(callCount).toBe(0);
    
    count.set(1); // 不同的值
    expect(callCount).toBe(1);
    
    count.set(1); // 相同的值
    expect(callCount).toBe(1); // 不应该增加
  });
  
  test('多个订阅者应都被通知', () => {
    const count = createSignal(0);
    
    let subscriber1Count = 0;
    let subscriber2Count = 0;
    
    count.subscribe(() => {
      subscriber1Count++;
    });
    
    count.subscribe(() => {
      subscriber2Count++;
    });
    
    count.set(1);
    
    expect(subscriber1Count).toBe(1);
    expect(subscriber2Count).toBe(1);
  });
  
  test('一个订阅者取消不应影响其他订阅者', () => {
    const count = createSignal(0);
    
    let subscriber1Count = 0;
    let subscriber2Count = 0;
    
    const unsubscribe1 = count.subscribe(() => {
      subscriber1Count++;
    });
    
    count.subscribe(() => {
      subscriber2Count++;
    });
    
    count.set(1);
    expect(subscriber1Count).toBe(1);
    expect(subscriber2Count).toBe(1);
    
    // 取消第一个订阅者
    unsubscribe1();
    
    count.set(2);
    expect(subscriber1Count).toBe(1); // 不再增加
    expect(subscriber2Count).toBe(2); // 继续增加
  });
  
  test('处理复杂对象值', () => {
    const user = createSignal({ name: 'Zhang San', age: 25 });
    
    user.set({ name: 'Li Si', age: 30 });
    expect(user.get()).toEqual({ name: 'Li Si', age: 30 });
    
    // 修改深层属性
    const currentUser = user.get();
    currentUser.age = 31;
    user.set(currentUser);
    
    expect(user.get()).toEqual({ name: 'Li Si', age: 31 });
  });
}); 