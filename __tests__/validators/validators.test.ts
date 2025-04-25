import { required, minLength, maxLength, email, number, pattern } from '../../src/validators';

describe('验证器测试', () => {
  test('required验证器', () => {
    const validator = required('必填项');
    
    expect(validator(undefined)).toBe('必填项');
    expect(validator(null)).toBe('必填项');
    expect(validator('')).toBe('必填项');
    expect(validator(0)).toBeUndefined();
    expect(validator(false)).toBeUndefined();
    expect(validator('value')).toBeUndefined();
  });
  
  test('minLength验证器', () => {
    const validator = minLength(3, '长度不能少于3个字符');
    
    expect(validator('a')).toBe('长度不能少于3个字符');
    expect(validator('ab')).toBe('长度不能少于3个字符');
    expect(validator('abc')).toBeUndefined();
    expect(validator('abcd')).toBeUndefined();
    expect(validator(undefined)).toBeUndefined(); // 不处理undefined/null
    expect(validator(null)).toBeUndefined();
  });
  
  test('maxLength验证器', () => {
    const validator = maxLength(3, '长度不能超过3个字符');
    
    expect(validator('a')).toBeUndefined();
    expect(validator('ab')).toBeUndefined();
    expect(validator('abc')).toBeUndefined();
    expect(validator('abcd')).toBe('长度不能超过3个字符');
    expect(validator(undefined)).toBeUndefined(); // 不处理undefined/null
    expect(validator(null)).toBeUndefined();
  });
  
  test('email验证器', () => {
    const validator = email('请输入有效的邮箱地址');
    
    expect(validator('')).toBeUndefined(); // 空字符串不验证
    expect(validator('not-an-email')).toBe('请输入有效的邮箱地址');
    expect(validator('test@')).toBe('请输入有效的邮箱地址');
    expect(validator('test@example')).toBe('请输入有效的邮箱地址');
    expect(validator('test@example.')).toBe('请输入有效的邮箱地址');
    expect(validator('test@example.c')).toBe('请输入有效的邮箱地址');
    expect(validator('test@example.com')).toBeUndefined();
    expect(validator('test.name@example.com')).toBeUndefined();
  });
  
  test('number验证器', () => {
    const validator = number('请输入有效的数字');
    
    expect(validator('')).toBeUndefined(); // 空字符串不验证
    expect(validator('abc')).toBe('请输入有效的数字');
    expect(validator('123abc')).toBe('请输入有效的数字');
    expect(validator('123')).toBeUndefined();
    expect(validator('123.45')).toBeUndefined();
    expect(validator('-123')).toBeUndefined();
    expect(validator(123)).toBeUndefined(); // 数字类型
    expect(validator(undefined)).toBeUndefined(); // 不处理undefined/null
    expect(validator(null)).toBeUndefined();
  });
  
  test('pattern验证器', () => {
    // 仅允许数字和字母
    const validator = pattern(/^[a-zA-Z0-9]+$/, '只能包含字母和数字');
    
    // 根据实际实现，空字符串会导致验证失败，因为它不匹配正则表达式
    expect(validator('')).toBe('只能包含字母和数字');
    
    expect(validator('abc123')).toBeUndefined();
    expect(validator('ABC123')).toBeUndefined();
    expect(validator('123')).toBeUndefined();
    expect(validator('abc-123')).toBe('只能包含字母和数字');
    expect(validator('abc 123')).toBe('只能包含字母和数字');
    expect(validator('abc_123')).toBe('只能包含字母和数字');
    expect(validator(undefined)).toBeUndefined(); // 不处理undefined/null
    expect(validator(null)).toBeUndefined();
  });
  
  test('自定义错误消息', () => {
    // 测试自定义错误消息
    const requiredValidator = required('自定义必填项消息');
    expect(requiredValidator('')).toBe('自定义必填项消息');
    
    const minLengthValidator = minLength(3, '自定义长度消息');
    expect(minLengthValidator('a')).toBe('自定义长度消息');
    
    const emailValidator = email('自定义邮箱消息');
    expect(emailValidator('invalid')).toBe('自定义邮箱消息');
  });
  
  test('验证器链式组合', async () => {
    // 模拟真实场景中的链式验证
    const validators = [
      required('用户名不能为空'),
      minLength(3, '用户名不能少于3个字符'),
      maxLength(20, '用户名不能超过20个字符'),
      pattern(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
    ];
    
    // 依次执行验证器
    async function validate(value: any): Promise<string | undefined> {
      for (const validator of validators) {
        const result = await validator(value);
        if (result) {
          return result;
        }
      }
      return undefined;
    }
    
    expect(await validate('')).toBe('用户名不能为空');
    expect(await validate('a')).toBe('用户名不能少于3个字符');
    expect(await validate('a'.repeat(21))).toBe('用户名不能超过20个字符');
    expect(await validate('user-name')).toBe('用户名只能包含字母、数字和下划线');
    expect(await validate('user_name')).toBeUndefined(); // 通过所有验证
    expect(await validate('UserName123')).toBeUndefined(); // 通过所有验证
  });
}); 