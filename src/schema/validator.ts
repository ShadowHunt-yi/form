import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import addKeywords from 'ajv-keywords';

// 创建Ajv实例
const ajv = new Ajv({
  allErrors: true,      // 收集所有错误而不是仅第一个
  coerceTypes: true,    // 尝试转换数据类型以匹配schema
  useDefaults: true,    // 使用schema中的默认值
  removeAdditional: true, // 移除schema中未定义的属性
  strict: false,        // 关闭严格模式
});

// 添加格式支持
addFormats(ajv);

// 添加关键字支持
addKeywords(ajv);

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 验证错误接口
 */
export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
  params?: Record<string, any>;
}

/**
 * 将Ajv错误对象转换为标准化的错误对象
 * @param errors Ajv错误对象数组
 */
function normalizeErrors(errors: ErrorObject[] | null | undefined): ValidationError[] {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map(err => {
    const path = err.instancePath.replace(/^\//, '').replace(/\//g, '.');
    return {
      path: path || 'root',
      message: err.message || '未知错误',
      keyword: err.keyword,
      params: err.params
    };
  });
}

/**
 * 根据JSON Schema验证数据
 * @param schema JSON Schema
 * @param data 要验证的数据
 * @returns 验证结果
 */
export function validateWithSchema(schema: object, data: any): ValidationResult {
  try {
    // 确保数据是一个对象
    const validData = typeof data === 'object' && data !== null ? data : {};
    
    // 编译schema
    const validate = ajv.compile({
      ...schema,
      additionalProperties: true // 允许额外的属性
    });
    
    // 执行验证
    const valid = validate(validData);
    
    // 如果验证失败，检查错误
    if (!valid && validate.errors) {
      // 过滤掉不相关的错误
      const relevantErrors = validate.errors.filter(err => {
        // 如果是必需属性错误，检查属性是否真的缺失
        if (err.keyword === 'required') {
          const missingProp = err.params.missingProperty;
          return !(missingProp in validData);
        }
        return true;
      });
      
      // 返回结果
      return {
        valid: relevantErrors.length === 0,
        errors: normalizeErrors(relevantErrors)
      };
    }
    
    // 返回结果
    return {
      valid: true,
      errors: []
    };
  } catch (error) {
    console.error('Schema validation error:', error);
    return {
      valid: false,
      errors: [{
        path: 'root',
        message: error instanceof Error ? error.message : '验证过程中发生错误'
      }]
    };
  }
}

/**
 * 根据JSON Schema获取默认值
 * @param schema JSON Schema
 * @returns 默认值对象
 */
export function getDefaultValues(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return undefined;
  }

  // 如果schema本身有default属性，返回它
  if ('default' in schema) {
    return schema.default;
  }

  // 处理不同类型的schema
  if (schema.type === 'object' && schema.properties) {
    const result: Record<string, any> = {};
    
    // 处理每个属性
    for (const key in schema.properties) {
      const propDefault = getDefaultValues(schema.properties[key]);
      if (propDefault !== undefined) {
        result[key] = propDefault;
      }
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  }

  if (schema.type === 'array' && schema.items) {
    // 对于数组，如果有默认项或minItems，创建默认数组
    if (schema.minItems && schema.minItems > 0) {
      const itemDefault = getDefaultValues(schema.items);
      if (itemDefault !== undefined) {
        return Array(schema.minItems).fill(itemDefault);
      }
    }
  }

  return undefined;
} 