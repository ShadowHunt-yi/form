import { Validator } from '../model/field';

// 必填验证器
export const required = (message = '该字段为必填项'): Validator => {
  return (value) => {
    if (value === undefined || value === null || value === '') {
      return message;
    }
  };
};

// 最小长度验证器
export const minLength = (min: number, message?: string): Validator => {
  return (value) => {
    if (value !== undefined && value !== null && value.length < min) {
      return message || `长度不能少于${min}个字符`;
    }
  };
};

// 最大长度验证器
export const maxLength = (max: number, message?: string): Validator => {
  return (value) => {
    if (value !== undefined && value !== null && value.length > max) {
      return message || `长度不能超过${max}个字符`;
    }
  };
};

// 邮箱格式验证器
export const email = (message = '请输入有效的邮箱地址'): Validator => {
  return (value) => {
    if (
      value &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value as string)
    ) {
      return message;
    }
  };
};

// 数字验证器
export const number = (message = '请输入有效的数字'): Validator => {
  return (value) => {
    if (value !== undefined && value !== null && isNaN(Number(value))) {
      return message;
    }
  };
};

// 自定义模式验证器
export const pattern = (
  regex: RegExp,
  message = '输入格式不正确'
): Validator => {
  return (value) => {
    if (value !== undefined && value !== null && !regex.test(value as string)) {
      return message;
    }
  };
}; 