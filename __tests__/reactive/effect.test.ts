import { reactive } from '../../src/reactive/reactive';
import { effect, ReactiveEffect } from '../../src/reactive/effect';

// 手动实现stop函数，因为原始模块可能没有导出
function stop(runner: any) {
  if (runner.effect instanceof ReactiveEffect) {
    runner.effect.stop();
  }
}

describe('副作用函数测试', () => {
  test('基本effect执行', () => {
    const state = reactive({ count: 0 });
    let dummy;
    
    effect(() => {
      dummy = state.count;
    });
    
    expect(dummy).toBe(0);
    
    state.count = 1;
    expect(dummy).toBe(1);
  });
  
  test('多个属性依赖', () => {
    const state = reactive({ count: 0, text: 'hello' });
    let dummy;
    
    effect(() => {
      dummy = `${state.count}: ${state.text}`;
    });
    
    expect(dummy).toBe('0: hello');
    
    state.count = 1;
    expect(dummy).toBe('1: hello');
    
    state.text = 'world';
    expect(dummy).toBe('1: world');
  });
  
  test('effect嵌套', () => {
    const state = reactive({ foo: 0, bar: 0 });
    let dummy1, dummy2;
    
    effect(() => {
      dummy1 = state.foo;
      effect(() => {
        dummy2 = state.bar;
      });
    });
    
    expect(dummy1).toBe(0);
    expect(dummy2).toBe(0);
    
    state.foo = 1;
    expect(dummy1).toBe(1);
    expect(dummy2).toBe(0);
    
    state.bar = 1;
    expect(dummy1).toBe(1);
    expect(dummy2).toBe(1);
  });
  
  test('避免无限递归', () => {
    const state = reactive({ count: 0 });
    
    effect(() => {
      state.count++;
    });
    
    expect(state.count).toBe(1);
    // 应该只触发一次，而不是无限递归
  });
  
  test('调度器', () => {
    const state = reactive({ count: 0 });
    let dummy;
    
    // 创建一个mock调度器函数
    const scheduler = jest.fn((effect) => {
      // 立即执行effect
      effect.run();
    });
    
    const runner = effect(
      () => {
        dummy = state.count;
      },
      { scheduler }
    );
    
    // 初始运行不会调用调度器
    expect(dummy).toBe(0);
    expect(scheduler).not.toHaveBeenCalled();
    
    // 更新时会调用调度器
    state.count = 1;
    
    // 调度器被调用
    expect(scheduler).toHaveBeenCalledTimes(1);
    
    // 由于我们的调度器实现会立即执行effect，所以dummy应该已经更新
    expect(dummy).toBe(1);
  });
  
  test('停止effect', () => {
    const state = reactive({ count: 0 });
    let dummy;
    
    const runner = effect(() => {
      dummy = state.count;
    });
    
    expect(dummy).toBe(0);
    
    state.count = 1;
    expect(dummy).toBe(1);
    
    // 停止effect
    if (runner.effect) {
      runner.effect.stop();
    }
    
    state.count = 2;
    expect(dummy).toBe(1); // 不应该更新
    
    // 手动调用仍然可以更新
    runner();
    expect(dummy).toBe(2);
    
    // 停止后修改仍然不触发
    state.count = 3;
    expect(dummy).toBe(2);
  });
  
  test('依赖清理', () => {
    const state = reactive({
      flag: true,
      a: 0,
      b: 0
    });
    
    let dummy;
    let effectTriggerCount = 0;
    
    effect(() => {
      effectTriggerCount++;
      dummy = state.flag ? state.a : state.b;
    });
    
    expect(dummy).toBe(0);
    expect(effectTriggerCount).toBe(1);
    
    // 修改 a 触发
    state.a = 1;
    expect(dummy).toBe(1);
    expect(effectTriggerCount).toBe(2);
    
    // 修改 b 不应触发
    state.b = 1;
    expect(dummy).toBe(1);
    expect(effectTriggerCount).toBe(2);
    
    // 切换依赖
    state.flag = false;
    expect(dummy).toBe(1); // 现在读取的是 b
    expect(effectTriggerCount).toBe(3);
    
    // 修改 a 不应触发
    state.a = 2;
    expect(dummy).toBe(1);
    expect(effectTriggerCount).toBe(3);
    
    // 修改 b 应触发
    state.b = 2;
    expect(dummy).toBe(2);
    expect(effectTriggerCount).toBe(4);
  });
}); 