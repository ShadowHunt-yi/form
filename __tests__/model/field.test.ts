import { Field } from '../../src/model/field';
import { required, email, minLength } from '../../src/validators';

describe('字段模型测试', () => {
  test('创建字段实例', () => {
    const field = new Field();
    
    expect(field.value).toBeUndefined();
    expect(field.error).toBe('');
    expect(field.valid).toBe(true);
    expect(field.touched).toBe(false);
    expect(field.validating).toBe(false);
  });
  
  test('设置和获取字段值', () => {
    const field = new Field();
    
    field.value = 'test';
    expect(field.value).toBe('test');
    expect(field.touched).toBe(true);
  });
  
  test('初始值设置', () => {
    const field = new Field({ initialValue: 'initial' });
    
    expect(field.value).toBe('initial');
    expect(field.touched).toBe(false);
  });
  
  test('单一验证规则', async () => {
    const field = new Field({
      rules: [required('必填项')]
    });
    
    // 初始空值
    let valid = await field.validate();
    expect(valid).toBe(false);
    expect(field.error).toBe('必填项');
    expect(field.valid).toBe(false);
    
    // 设置值后验证通过
    field.value = 'test';
    valid = await field.validate();
    expect(valid).toBe(true);
    expect(field.error).toBe('');
    expect(field.valid).toBe(true);
  });
  
  test('多重验证规则', async () => {
    const field = new Field({
      rules: [
        required('邮箱不能为空'),
        email('请输入有效的邮箱地址')
      ]
    });
    
    // 空值验证
    await field.validate();
    expect(field.valid).toBe(false);
    expect(field.error).toBe('邮箱不能为空');
    
    // 无效邮箱验证
    field.value = 'invalid';
    await field.validate();
    expect(field.valid).toBe(false);
    expect(field.error).toBe('请输入有效的邮箱地址');
    
    // 有效邮箱验证
    field.value = 'test@example.com';
    await field.validate();
    expect(field.valid).toBe(true);
    expect(field.error).toBe('');
  });
  
  test('必填项标记', async () => {
    const field = new Field({
      required: true
    });
    
    await field.validate();
    expect(field.valid).toBe(false);
    expect(field.error).toBe('该字段为必填项');
    
    field.value = 'test';
    await field.validate();
    expect(field.valid).toBe(true);
    expect(field.error).toBe('');
  });
  
  test('重置字段', async () => {
    const field = new Field({
      initialValue: 'initial',
      rules: [required('必填项')]
    });
    
    // 修改字段
    field.value = 'modified';
    expect(field.value).toBe('modified');
    expect(field.touched).toBe(true);
    
    // 重置字段
    field.reset();
    expect(field.value).toBe('initial');
    expect(field.touched).toBe(false);
    expect(field.error).toBe('');
    expect(field.valid).toBe(true);
  });
  
  test('设置触碰状态', () => {
    const field = new Field();
    
    expect(field.touched).toBe(false);
    
    field.setTouched(true);
    expect(field.touched).toBe(true);
    
    field.setTouched(false);
    expect(field.touched).toBe(false);
  });
  
  test('异步验证显示validating状态', async () => {
    // 创建异步验证规则
    const asyncRule = (value: any) => {
      return new Promise<string | void>(resolve => {
        setTimeout(() => {
          if (value !== 'valid') {
            resolve('异步验证失败');
          } else {
            resolve();
          }
        }, 10);
      });
    };
    
    const field = new Field({
      rules: [asyncRule]
    });
    
    // 开始验证，验证中状态应为true
    const validatePromise = field.validate();
    expect(field.validating).toBe(true);
    
    // 验证完成后状态应为false
    await validatePromise;
    expect(field.validating).toBe(false);
    expect(field.valid).toBe(false);
    expect(field.error).toBe('异步验证失败');
    
    // 设置有效值
    field.value = 'valid';
    await field.validate();
    expect(field.valid).toBe(true);
    expect(field.error).toBe('');
  });
}); 