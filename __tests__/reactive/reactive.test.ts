import { reactive, isReactive, toRaw } from '../../src/reactive/reactive';

describe('响应式对象测试', () => {
  test('创建响应式对象', () => {
    const original = { count: 0, text: 'hello' };
    const observed = reactive(original);
    
    expect(observed.count).toBe(0);
    expect(observed.text).toBe('hello');
  });
  
  test('响应式对象修改', () => {
    const observed = reactive({ count: 0, text: 'hello' });
    
    observed.count = 1;
    observed.text = 'world';
    
    expect(observed.count).toBe(1);
    expect(observed.text).toBe('world');
  });
  
  test('isReactive判断响应式对象', () => {
    const original = { count: 0 };
    const observed = reactive(original);
    
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
    expect(isReactive({})).toBe(false);
  });
  
  test('toRaw获取原始对象', () => {
    const original = { count: 0 };
    const observed = reactive(original);
    
    const raw = toRaw(observed);
    expect(raw).toBe(original);
    expect(isReactive(raw)).toBe(false);
  });
  
  test('嵌套对象自动转为响应式', () => {
    const observed = reactive({
      nested: {
        count: 0
      }
    });
    
    expect(isReactive(observed.nested)).toBe(true);
    
    observed.nested.count = 1;
    expect(observed.nested.count).toBe(1);
  });
  
  test('已响应式对象不会重复代理', () => {
    const observed1 = reactive({ count: 0 });
    const observed2 = reactive(observed1);
    
    expect(observed1).toBe(observed2);
  });
  
  test('处理数组操作', () => {
    const observed = reactive([1, 2, 3]);
    
    // 数组方法
    observed.push(4);
    expect(observed.length).toBe(4);
    expect(observed[3]).toBe(4);
    
    observed.pop();
    expect(observed.length).toBe(3);
    
    observed.unshift(0);
    expect(observed.length).toBe(4);
    expect(observed[0]).toBe(0);
    
    observed.shift();
    expect(observed.length).toBe(3);
    expect(observed[0]).toBe(1);
    
    observed.splice(1, 1, 10);
    expect(observed[1]).toBe(10);
    
    // 直接索引赋值
    observed[0] = 100;
    expect(observed[0]).toBe(100);
    
    // 数组长度
    observed.length = 2;
    expect(observed.length).toBe(2);
    expect(observed[2]).toBe(undefined);
  });
  
  test('新增属性响应式', () => {
    interface DynamicObject {
      count: number;
      text?: string;
      nested?: {
        value: number;
      };
      [key: string]: any;
    }
    
    const observed = reactive<DynamicObject>({ count: 0 });
    
    // 添加新属性
    observed.text = 'hello';
    expect(observed.text).toBe('hello');
    
    // 添加嵌套对象
    observed.nested = { value: 1 };
    expect(isReactive(observed.nested)).toBe(true);
    
    observed.nested.value = 2;
    expect(observed.nested.value).toBe(2);
  });
  
  test('删除属性', () => {
    interface TestObject {
      count: number;
      text?: string;
    }
    
    const observed = reactive<TestObject>({ count: 0, text: 'hello' });
    
    delete observed.text;
    expect('text' in observed).toBe(false);
  });
}); 