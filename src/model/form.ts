import { computed, effect, reactive } from '../reactive';
import { Field, FieldOptions } from './field';

// 表单值类型
export type FormValues = Record<string, any>;

// 表单字段映射类型
export type FieldMap = Record<string, Field>;

// 表单状态类型
interface FormState {
  submitting: boolean;
  dirty: boolean;
  valid: boolean;
  errors: Record<string, string>;
  values: FormValues;
}

// 表单配置选项
export interface FormOptions {
  initialValues?: FormValues;
  onSubmit?: (values: FormValues) => void | Promise<void>;
  onError?: (errors: Record<string, string>) => void;
}

// 表单类，表示一个完整表单
export class Form {
  // 表单字段集合
  private fields: FieldMap = {};

  // 表单状态，使用响应式对象
  private state: FormState = reactive({
    submitting: false,
    dirty: false,
    valid: true,
    errors: {},
    values: {}
  });

  // 表单选项
  private options: FormOptions;

  constructor(options: FormOptions = {}) {
    this.options = options;

    // 设置初始值
    if (options.initialValues) {
      this.state.values = { ...options.initialValues };
    }

    // 使用计算属性监视表单的有效性
    effect(() => {
      this.validateFields();
    });
  }

  // 获取表单的所有值
  get values(): FormValues {
    const values: FormValues = {};
    
    for (const key in this.fields) {
      values[key] = this.fields[key].value;
    }
    
    return values;
  }

  // 获取表单的所有错误信息
  get errors(): Record<string, string> {
    const errors: Record<string, string> = {};
    
    for (const key in this.fields) {
      const error = this.fields[key].error;
      if (error) {
        errors[key] = error;
      }
    }
    
    return errors;
  }

  // 表单是否正在提交
  get submitting(): boolean {
    return this.state.submitting;
  }

  // 表单是否有效
  get valid(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  // 表单是否已修改
  get dirty(): boolean {
    for (const key in this.fields) {
      if (this.fields[key].touched) {
        return true;
      }
    }
    return false;
  }

  // 注册一个字段
  registerField(name: string, options: FieldOptions = {}): Field {
    if (this.fields[name]) {
      return this.fields[name];
    }

    // 创建字段实例
    const field = new Field(options);
    
    // 如果有初始值，设置字段的初始值
    if (this.options.initialValues && name in this.options.initialValues) {
      field.value = this.options.initialValues[name];
    }
    
    // 将字段添加到字段集合中
    this.fields[name] = field;
    
    return field;
  }

  // 移除一个字段
  unregisterField(name: string): void {
    delete this.fields[name];
  }

  // 获取一个字段
  getField(name: string): Field | undefined {
    return this.fields[name];
  }

  // 设置字段值
  setFieldValue(name: string, value: any): void {
    const field = this.getField(name) || this.registerField(name);
    field.value = value;
  }

  // 获取字段值
  getFieldValue(name: string): any {
    const field = this.getField(name);
    return field ? field.value : undefined;
  }

  // 设置多个字段的值
  setValues(values: FormValues): void {
    for (const key in values) {
      this.setFieldValue(key, values[key]);
    }
  }

  // 重置表单
  reset(): void {
    // 重置所有字段
    for (const key in this.fields) {
      // 如果有初始值，先设置初始值
      if (this.options.initialValues && key in this.options.initialValues) {
        this.fields[key].value = this.options.initialValues[key];
      } else {
        this.fields[key].reset();
      }
    }
    
    // 重置状态
    this.state.submitting = false;
    this.state.dirty = false;
    
    // 重置表单值为初始值
    if (this.options.initialValues) {
      for (const key in this.options.initialValues) {
        // 确保该字段已注册
        if (!this.fields[key]) {
          this.registerField(key);
        }
        this.fields[key].value = this.options.initialValues[key];
      }
    }
  }

  // 验证所有字段
  async validateFields(): Promise<boolean> {
    const promises = Object.keys(this.fields).map(key => 
      this.fields[key].validate().then(valid => ({
        key,
        valid,
        error: this.fields[key].error
      }))
    );
    
    const results = await Promise.all(promises);
    const errors: Record<string, string> = {};
    
    for (const result of results) {
      if (!result.valid) {
        errors[result.key] = result.error;
      }
    }
    
    this.state.errors = errors;
    this.state.valid = Object.keys(errors).length === 0;
    
    return this.state.valid;
  }

  // 提交表单
  async submit(): Promise<void> {
    this.state.submitting = true;
    
    try {
      // 验证所有字段
      const isValid = await this.validateFields();
      
      if (isValid) {
        if (this.options.onSubmit) {
          await this.options.onSubmit(this.values);
        }
      } else if (this.options.onError) {
        this.options.onError(this.errors);
      }
    } finally {
      this.state.submitting = false;
    }
  }
} 