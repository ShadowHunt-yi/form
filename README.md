# Formily 响应式模型实现

## 项目简介
本项目是一个实现类似于Formily的响应式模型的简单框架。Formily是一个用于构建复杂表单的开源解决方案，其核心是基于响应式原理实现的数据管理系统。

## 功能特点
- 响应式数据模型：通过代理和依赖追踪实现数据的响应式更新
- 表单状态管理：实现表单数据的收集、校验、联动等功能
- 可组合性：支持将复杂表单拆分为可复用的模块

## 技术架构
本项目主要包含以下几个模块：
- `reactive`：响应式核心模块，负责数据的响应式处理
- `model`：表单模型，处理表单状态和业务逻辑
- `validators`：表单校验模块
- `utils`：工具函数集

## 安装与使用

### 安装依赖
```bash
npm install
```

### 构建项目
```bash
npm run build
```

### 运行示例
```bash
# 编译TypeScript
npm run build

# 运行简单示例
node dist/examples/simple-form.js

# 运行高级示例
node dist/examples/advanced-form.js
```

## 使用示例

### 基本使用
```typescript
import { Form } from 'formily-model';
import { required, email } from 'formily-model/validators';

// 创建表单实例
const form = new Form({
  initialValues: {
    username: '',
    email: ''
  }
});

// 注册表单字段
form.registerField('username', {
  required: true,
  rules: [required('用户名不能为空')]
});

form.registerField('email', {
  required: true,
  rules: [
    required('邮箱不能为空'),
    email('请输入有效的邮箱地址')
  ]
});

// 设置字段值
form.setFieldValue('username', 'user123');

// 获取字段值
console.log(form.getFieldValue('username')); // 'user123'

// 表单验证与提交
form.submit().then(() => {
  console.log('表单提交成功');
}).catch(errors => {
  console.log('表单验证失败', errors);
});
```

### 响应式联动
```typescript
import { Form } from 'formily-model';
import { effect } from 'formily-model/reactive';

const form = new Form({
  initialValues: {
    useExpress: false,
    expressCharge: 20
  }
});

// 监听表单字段变化
effect(() => {
  const useExpress = form.getFieldValue('useExpress');
  
  // 当快递选项变化时，更新UI或其他字段
  if (useExpress) {
    console.log('需要支付快递费:', form.getFieldValue('expressCharge'));
  } else {
    console.log('不需要支付快递费');
  }
});

// 修改字段值，会自动触发上面的 effect
form.setFieldValue('useExpress', true);
```

### 自定义验证器
```typescript
import { Form } from 'formily-model';
import { Validator } from 'formily-model/model';

// 创建自定义验证器
const passwordStrength: Validator = (value) => {
  if (value && value.length < 8) {
    return '密码长度不能少于8个字符';
  }
  
  if (value && !/[A-Z]/.test(value)) {
    return '密码必须包含大写字母';
  }
  
  if (value && !/[0-9]/.test(value)) {
    return '密码必须包含数字';
  }
};

// 使用自定义验证器
const form = new Form();

form.registerField('password', {
  required: true,
  rules: [passwordStrength]
});
```

## API文档

### 响应式系统
- `reactive(object)`: 创建一个响应式对象
- `effect(fn)`: 创建一个自动追踪依赖的副作用函数
- `computed(getter)`: 创建一个计算属性

### 表单模型
- `Form`: 表单类，管理整个表单的状态和行为
- `Field`: 字段类，管理单个字段的状态和行为

### 验证器
- `required`: 必填验证器
- `email`: 邮箱格式验证器
- `number`: 数字验证器
- `minLength`: 最小长度验证器
- `maxLength`: 最大长度验证器
- `pattern`: 正则表达式验证器

## 开发进度
- [x] 项目初始化
- [x] 响应式核心模块实现
- [x] 表单模型实现
- [x] 表单校验功能
- [x] 示例和文档完善 