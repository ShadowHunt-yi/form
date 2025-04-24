import { Form } from '../src/model';
import { effect } from '../src/reactive';
import { email, required, minLength } from '../src/validators';

// 创建表单实例
const form = new Form({
  initialValues: {
    username: '',
    email: '',
    password: ''
  },
  onSubmit: async (values) => {
    console.log('表单提交成功:', values);
  },
  onError: (errors) => {
    console.log('表单验证失败:', errors);
  }
});

// 注册表单字段
const usernameField = form.registerField('username', {
  required: true,
  rules: [
    required('用户名不能为空'),
    minLength(3, '用户名长度不能少于3个字符')
  ]
});

const emailField = form.registerField('email', {
  required: true,
  rules: [
    required('邮箱不能为空'),
    email('请输入有效的邮箱地址')
  ]
});

const passwordField = form.registerField('password', {
  required: true,
  rules: [
    required('密码不能为空'),
    minLength(6, '密码长度不能少于6个字符')
  ]
});

// 通过响应式副作用监听表单变化
effect(() => {
  console.log('表单值:', form.values);
  console.log('表单错误:', form.errors);
  console.log('表单是否有效:', form.valid);
});

// 模拟用户输入
console.log('--- 模拟用户输入用户名 ---');
usernameField.value = 'user';

console.log('--- 模拟用户输入邮箱 ---');
emailField.value = 'invalid-email';

console.log('--- 模拟用户输入有效邮箱 ---');
emailField.value = 'user@example.com';

console.log('--- 模拟用户输入密码 ---');
passwordField.value = '123456';

// 提交表单
console.log('--- 提交表单 ---');
form.submit().then(() => {
  console.log('表单处理完成');
}); 