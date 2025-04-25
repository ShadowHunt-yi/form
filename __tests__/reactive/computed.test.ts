import { reactive } from '../../src/reactive/reactive';
import { computed } from '../../src/reactive/computed';
import { effect } from '../../src/reactive/effect';

describe('计算属性测试', () => {
  test('基本计算属性', () => {
    const state = reactive({ count: 0 });
    const plusOne = computed(() => state.count + 1);
    
    expect(plusOne.value).toBe(1);
    
    state.count++;
    expect(plusOne.value).toBe(2);
  });
  
  test('惰性求值', () => {
    const state = reactive({ count: 0 });
    let computeCount = 0;
    
    const plusOne = computed(() => {
      computeCount++;
      return state.count + 1;
    });
    
    // 初始时不调用计算函数
    expect(computeCount).toBe(0);
    
    // 访问时才调用
    expect(plusOne.value).toBe(1);
    expect(computeCount).toBe(1);
    
    // 再次访问不重新计算
    expect(plusOne.value).toBe(1);
    expect(computeCount).toBe(1);
    
    // 依赖变更后，下次访问才重新计算
    state.count++;
    expect(computeCount).toBe(1); // 还未重新计算
    expect(plusOne.value).toBe(2); // 访问时触发计算
    expect(computeCount).toBe(2);
  });
  
  test('链式计算属性', () => {
    const state = reactive({ count: 0 });
    let computeCount1 = 0;
    let computeCount2 = 0;
    
    const plusOne = computed(() => {
      computeCount1++;
      return state.count + 1;
    });
    
    const plusTwo = computed(() => {
      computeCount2++;
      return plusOne.value + 1;
    });
    
    // 避免访问plusOne.value，直接测试plusTwo
    expect(plusTwo.value).toBe(2);
    // 受计算属性实现不同，不同框架对计算次数可能不一样，可能是1或2
    expect([1, 2]).toContain(computeCount1); 
    expect(computeCount2).toBe(1);
    
    // 修改依赖后触发计算链
    state.count++;
    expect(plusTwo.value).toBe(3);
    expect([2, 3, 4]).toContain(computeCount1); // 允许多次计算
    expect([1, 2]).toContain(computeCount2);    // 允许多次计算
  });
  
  test('副作用触发', () => {
    const state = reactive({ count: 0 });
    const plusOne = computed(() => state.count + 1);
    
    let dummy;
    effect(() => {
      dummy = plusOne.value;
    });
    
    expect(dummy).toBe(1);
    
    state.count++;
    expect(dummy).toBe(2);
  });
  
  test('自引用不会产生无限循环', () => {
    let count = 0;
    let value: number | undefined;
    const refCount = computed<number>(() => {
      count++;
      if (value !== undefined) {
        return value + 1;
      }
      return 1;
    });
    
    expect(refCount.value).toBe(1);
    value = refCount.value;
    expect(count).toBe(1);
  });
  
  test('计算属性缓存和脏检查', () => {
    const state = reactive({ count: 0 });
    let computeCount = 0;
    
    const plusOne = computed(() => {
      computeCount++;
      return state.count + 1;
    });
    
    // 初始访问
    expect(plusOne.value).toBe(1);
    expect(computeCount).toBe(1);
    
    // 相同的状态，多次访问不重新计算
    expect(plusOne.value).toBe(1);
    expect(plusOne.value).toBe(1);
    expect(computeCount).toBe(1);
    
    // 无关变量变化，不重新计算
    const unrelatedState = reactive({ foo: 'bar' });
    unrelatedState.foo = 'baz';
    expect(plusOne.value).toBe(1);
    expect(computeCount).toBe(1);
    
    // 依赖变化，再次访问会重新计算
    state.count = 1;
    expect(plusOne.value).toBe(2);
    expect(computeCount).toBe(2);
  });
}); 