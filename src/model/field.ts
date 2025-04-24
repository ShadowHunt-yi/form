import { computed, effect, reactive } from '../reactive';

// 字段验证器类型
export type Validator = (value: any) => string | void | Promise<string | void>;

// 字段选项接口
export interface FieldOptions {
  initialValue?: any;
  rules?: Validator[];
  required?: boolean;
}

// 字段类，表示表单中的一个字段
export class Field<T = any> {
  // 字段状态，使用响应式对象
  private state = reactive({
    value: undefined as unknown as T,
    error: '',
    touched: false,
    validating: false,
    valid: true,
  });

  // 字段选项
  private options: FieldOptions;

  constructor(options: FieldOptions = {}) {
    this.options = options;
    
    // 设置初始值
    if ('initialValue' in options) {
      this.state.value = options.initialValue;
    }
    
    // 自动验证
    effect(() => {
      this.validate();
    });
  }

  // 获取字段值
  get value(): T {
    return this.state.value;
  }

  // 设置字段值
  set value(val: T) {
    this.state.value = val;
    this.state.touched = true;
  }

  // 获取错误信息
  get error(): string {
    return this.state.error;
  }

  // 获取验证状态
  get validating(): boolean {
    return this.state.validating;
  }

  // 判断字段是否有效
  get valid(): boolean {
    return this.state.valid;
  }

  // 判断字段是否被触碰过
  get touched(): boolean {
    return this.state.touched;
  }

  // 重置字段状态
  reset() {
    if ('initialValue' in this.options) {
      this.state.value = this.options.initialValue;
    } else {
      this.state.value = undefined as unknown as T;
    }
    this.state.error = '';
    this.state.touched = false;
    this.state.validating = false;
    this.state.valid = true;
  }

  // 设置为已触碰
  setTouched(touched = true) {
    this.state.touched = touched;
  }

  // 验证字段
  async validate(): Promise<boolean> {
    const { rules = [], required } = this.options;
    const value = this.state.value;

    // 开始验证
    this.state.validating = true;
    this.state.error = '';

    try {
      // 如果字段是必填的且值为空
      if (required && (value === undefined || value === null || value === '')) {
        this.state.error = '该字段为必填项';
        this.state.valid = false;
        return false;
      }

      // 运行所有验证规则
      for (const rule of rules) {
        const result = await rule(value);
        if (result) {
          this.state.error = result;
          this.state.valid = false;
          return false;
        }
      }

      // 验证通过
      this.state.valid = true;
      return true;
    } finally {
      this.state.validating = false;
    }
  }
} 