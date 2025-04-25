import { model } from '../core/model';
import { createComputed, createEffect } from '../core/reaction';
import { validateWithSchema, ValidationResult, getDefaultValues } from './validator';

/**
 * 创建基于Schema的响应式模型
 * @param schema JSON Schema
 * @param initialData 初始数据（可选）
 * @returns 包含响应式数据、验证结果和重置功能的对象
 */
export function createSchemaModel<T extends object = any>(
  schema: object,
  initialData?: Partial<T>
) {
  // 获取schema默认值
  const defaults = getDefaultValues(schema) || {};
  
  // 合并初始数据和默认值
  const mergedData = { ...defaults, ...initialData };

  // 创建响应式模型
  const formModel = model<{
    data: T;
    validationResult: ValidationResult;
  }>({
    data: mergedData as T,
    validationResult: {
      valid: true,
      errors: []
    }
  });

  // 创建验证函数
  const validate = () => {
    const result = validateWithSchema(schema, formModel.data);
    // 深拷贝确保响应式更新
    formModel.validationResult = JSON.parse(JSON.stringify(result));
    return result;
  };

  // 初始验证
  validate();

  // 设置数据更新时的验证
  let updateTimeout: any = null;
  const dataEffect = createEffect(() => {
    // 监听data变化
    const data = JSON.stringify(formModel.data);
    
    // 清除之前的定时器
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    // 延迟验证，避免频繁更新
    updateTimeout = setTimeout(() => {
      validate();
      updateTimeout = null;
    }, 100);
  });

  // 重置表单到初始状态或默认值
  const reset = (data?: Partial<T>) => {
    const resetData = data 
      ? { ...defaults, ...data }
      : initialData 
        ? { ...defaults, ...initialData }
        : { ...defaults };
    
    // 使用$patch进行批量更新
    formModel.$patch({
      data: resetData as T
    });
    
    // 重置后立即验证
    validate();
  };

  // 创建一个包装器来确保所有操作都是原子的
  const wrapper = {
    get data() {
      return formModel.data;
    },
    set data(value: T) {
      // 确保值是一个对象
      const newValue = typeof value === 'object' && value !== null
        ? { ...value }
        : {};
      
      // 使用$patch进行批量更新
      formModel.$patch({
        data: newValue as T
      });
    },
    get validationResult() {
      return formModel.validationResult;
    },
    validate,
    hasFieldError: (path: string) => {
      return createComputed(() => {
        const errors = formModel.validationResult.errors;
        return errors && errors.some(err => err.path === path || err.path === `${path}.`);
      });
    },
    getFieldErrors: (path: string) => {
      return createComputed(() => {
        const errors = formModel.validationResult.errors;
        return errors
          ? errors
              .filter(err => err.path === path || err.path === `${path}.`)
              .map(err => err.message)
          : [];
      });
    },
    reset,
    _formModel: formModel
  };

  return wrapper;
} 