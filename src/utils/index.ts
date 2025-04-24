/**
 * 判断一个值是否为对象
 * @param val 要检查的值
 */
export function isObject(val: unknown): val is Record<any, any> {
  return val !== null && typeof val === 'object';
}

/**
 * 判断一个值是否为函数
 * @param val 要检查的值
 */
export function isFunction(val: unknown): val is Function {
  return typeof val === 'function';
}

/**
 * 判断一个值是否为字符串
 * @param val 要检查的值
 */
export function isString(val: unknown): val is string {
  return typeof val === 'string';
}

/**
 * 判断一个值是否为数字
 * @param val 要检查的值
 */
export function isNumber(val: unknown): val is number {
  return typeof val === 'number';
}

/**
 * 判断一个值是否为布尔值
 * @param val 要检查的值
 */
export function isBoolean(val: unknown): val is boolean {
  return typeof val === 'boolean';
}

/**
 * 判断一个值是否为数组
 * @param val 要检查的值
 */
export function isArray(val: unknown): val is any[] {
  return Array.isArray(val);
}

/**
 * 深度合并两个对象
 * @param target 目标对象
 * @param source 源对象
 */
export function deepMerge<T extends object = any, S extends object = T>(
  target: T,
  source: S
): T & S {
  const result = { ...target } as any;

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!result[key]) {
          result[key] = {};
        }
        result[key] = deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * 获取对象的嵌套属性值
 * @param obj 对象
 * @param path 路径，如 'a.b.c'
 * @param defaultValue 默认值
 */
export function get(
  obj: any,
  path: string | string[],
  defaultValue?: any
): any {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
}

/**
 * 设置对象的嵌套属性值
 * @param obj 对象
 * @param path 路径，如 'a.b.c'
 * @param value 要设置的值
 */
export function set(obj: any, path: string | string[], value: any): void {
  if (!isObject(obj)) return;

  const keys = Array.isArray(path) ? path : path.split('.');
  const lastKey = keys.pop()!;
  let current = obj;

  for (const key of keys) {
    if (!isObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
} 