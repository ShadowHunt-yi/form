import { 
  isObject, 
  isFunction, 
  isString, 
  isNumber, 
  isBoolean, 
  isArray, 
  deepMerge, 
  get, 
  set 
} from '../../src/utils';

describe('工具函数测试', () => {
  // 类型判断函数测试
  describe('类型判断函数', () => {
    test('isObject函数', () => {
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(true);
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject('string')).toBe(false);
    });

    test('isFunction函数', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
      expect(isFunction({})).toBe(false);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
      expect(isFunction(123)).toBe(false);
    });

    test('isString函数', () => {
      expect(isString('string')).toBe(true);
      expect(isString('')).toBe(true);
      expect(isString(String('string'))).toBe(true);
      expect(isString({})).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString(123)).toBe(false);
    });

    test('isNumber函数', () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(NaN)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(Number('123'))).toBe(true);
      expect(isNumber('123')).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });

    test('isBoolean函数', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(Boolean(1))).toBe(true);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean({})).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
    });

    test('isArray函数', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(new Array())).toBe(true);
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
    });
  });

  // 对象操作函数测试
  describe('对象操作函数', () => {
    test('deepMerge函数 - 合并简单对象', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
      // 确保原对象未被修改
      expect(target).toEqual({ a: 1, b: 2 });
      expect(source).toEqual({ b: 3, c: 4 });
    });

    test('deepMerge函数 - 合并嵌套对象', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const result = deepMerge(target, source);
      
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });

    test('deepMerge函数 - 合并数组和其他类型', () => {
      const target = { a: [1, 2], b: 'string' };
      const source = { a: [3, 4], c: true };
      const result = deepMerge(target, source);
      
      // 根据当前实现，数组被视为对象处理，会合并为对象而不是替换数组
      expect(result).toEqual({ 
        a: { 
          "0": 3, 
          "1": 4 
        }, 
        b: 'string', 
        c: true 
      });
    });

    test('get函数 - 获取对象属性', () => {
      const obj = { a: 1, b: { c: 2, d: { e: 3 } } };
      
      expect(get(obj, 'a')).toBe(1);
      expect(get(obj, 'b.c')).toBe(2);
      expect(get(obj, 'b.d.e')).toBe(3);
      expect(get(obj, ['b', 'd', 'e'])).toBe(3);
      expect(get(obj, 'x', 'default')).toBe('default');
      expect(get(obj, 'b.x', 'default')).toBe('default');
      expect(get(obj, 'b.d.x', 'default')).toBe('default');
    });

    test('get函数 - 处理特殊情况', () => {
      expect(get(null, 'a', 'default')).toBe('default');
      expect(get(undefined, 'a', 'default')).toBe('default');
      expect(get({}, 'a.b.c', 'default')).toBe('default');
    });

    test('set函数 - 设置对象属性', () => {
      const obj: any = { a: 1, b: { c: 2 } };
      
      set(obj, 'a', 100);
      expect(obj.a).toBe(100);
      
      set(obj, 'b.c', 200);
      expect(obj.b.c).toBe(200);
      
      set(obj, 'b.d.e', 300);
      expect(obj.b.d.e).toBe(300);
      
      set(obj, ['x', 'y', 'z'], 400);
      expect(obj.x.y.z).toBe(400);
    });

    test('set函数 - 非对象处理', () => {
      const nonObj = 123;
      set(nonObj, 'a.b', 100);
      // 非对象应该被忽略，不抛出错误
      expect(nonObj).toBe(123);
    });
  });
}); 