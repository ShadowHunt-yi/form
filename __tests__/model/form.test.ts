import { Form } from '../../src/model/form';
import { required, email, minLength } from '../../src/validators';

describe('表单模型测试', () => {
  test('创建表单实例', () => {
    const form = new Form();
    
    expect(form.values).toEqual({});
    expect(form.errors).toEqual({});
    expect(form.valid).toBe(true);
    expect(form.dirty).toBe(false);
    expect(form.submitting).toBe(false);
  });
  
  test('设置初始值', () => {
    const form = new Form({
      initialValues: {
        username: 'user1',
        email: 'user1@example.com'
      }
    });
    
    // 注册字段才能从form.values获取到值
    form.registerField('username');
    form.registerField('email');
    
    expect(form.values).toEqual({
      username: 'user1',
      email: 'user1@example.com'
    });
  });
  
  test('注册字段', () => {
    const form = new Form();
    
    const usernameField = form.registerField('username', {
      initialValue: 'user1',
      rules: [required('用户名不能为空')]
    });
    
    expect(usernameField.value).toBe('user1');
    expect(form.values).toEqual({ username: 'user1' });
  });
  
  test('注册字段使用表单初始值', () => {
    const form = new Form({
      initialValues: {
        username: 'user1',
        email: 'user1@example.com'
      }
    });
    
    const usernameField = form.registerField('username');
    const emailField = form.registerField('email');
    
    expect(usernameField.value).toBe('user1');
    expect(emailField.value).toBe('user1@example.com');
  });
  
  test('获取和设置字段值', () => {
    const form = new Form();
    
    form.registerField('username');
    form.setFieldValue('username', 'user1');
    
    expect(form.getFieldValue('username')).toBe('user1');
    expect(form.values).toEqual({ username: 'user1' });
  });
  
  test('批量设置值', () => {
    const form = new Form();
    
    form.registerField('username');
    form.registerField('email');
    
    form.setValues({
      username: 'user1',
      email: 'user1@example.com'
    });
    
    expect(form.values).toEqual({
      username: 'user1',
      email: 'user1@example.com'
    });
  });
  
  test('移除字段', () => {
    const form = new Form();
    
    form.registerField('username');
    form.registerField('email');
    
    form.setValues({
      username: 'user1',
      email: 'user1@example.com'
    });
    
    form.unregisterField('email');
    
    expect(form.values).toEqual({ username: 'user1' });
    expect(form.getField('email')).toBeUndefined();
  });
  
  test('表单验证', async () => {
    const form = new Form();
    
    form.registerField('username', {
      rules: [required('用户名不能为空')]
    });
    
    form.registerField('email', {
      rules: [
        required('邮箱不能为空'),
        email('请输入有效的邮箱地址')
      ]
    });
    
    // 初始状态验证
    let isValid = await form.validateFields();
    expect(isValid).toBe(false);
    expect(form.valid).toBe(false);
    expect(form.errors).toEqual({
      username: '用户名不能为空',
      email: '邮箱不能为空'
    });
    
    // 设置部分有效值
    form.setFieldValue('username', 'user1');
    form.setFieldValue('email', 'invalid');
    
    isValid = await form.validateFields();
    expect(isValid).toBe(false);
    expect(form.errors).toEqual({
      email: '请输入有效的邮箱地址'
    });
    
    // 设置全部有效值
    form.setFieldValue('email', 'user1@example.com');
    
    isValid = await form.validateFields();
    expect(isValid).toBe(true);
    expect(form.valid).toBe(true);
    expect(form.errors).toEqual({});
  });
  
  test('表单重置', () => {
    const form = new Form({
      initialValues: {
        username: 'initial_user',
        email: 'initial@example.com'
      }
    });
    
    // 注册字段
    form.registerField('username');
    form.registerField('email');
    
    // 修改字段值
    form.setFieldValue('username', 'modified_user');
    form.setFieldValue('email', 'modified@example.com');
    
    expect(form.values).toEqual({
      username: 'modified_user',
      email: 'modified@example.com'
    });
    
    // 重置表单
    form.reset();
    
    // 验证重置后的值是否正确
    expect(form.values).toEqual({
      username: 'initial_user',
      email: 'initial@example.com'
    });
  });
  
  test('表单提交', async () => {
    const onSubmitMock = jest.fn();
    const onErrorMock = jest.fn();
    
    const form = new Form({
      onSubmit: onSubmitMock,
      onError: onErrorMock
    });
    
    form.registerField('username', {
      required: true
    });
    
    // 提交无效表单
    await form.submit();
    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(onErrorMock).toHaveBeenCalledWith({
      username: '该字段为必填项'
    });
    
    // 设置有效值并提交
    form.setFieldValue('username', 'user1');
    await form.submit();
    
    expect(onSubmitMock).toHaveBeenCalledWith({
      username: 'user1'
    });
  });
  
  test('表单脏状态检测', () => {
    const form = new Form();
    
    form.registerField('username');
    form.registerField('email');
    
    expect(form.dirty).toBe(false);
    
    form.setFieldValue('username', 'user1');
    expect(form.dirty).toBe(true);
  });
}); 