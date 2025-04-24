import { Form } from '../src/model';
import { effect, computed } from '../src/reactive';
import { required, number } from '../src/validators';

// 创建一个购物表单
const form = new Form({
  initialValues: {
    items: [
      { name: '商品1', price: 100, quantity: 1 },
      { name: '商品2', price: 200, quantity: 2 }
    ],
    address: '',
    paymentMethod: 'creditCard',
    useExpress: false,
    expressCharge: 20
  }
});

// 注册字段
form.registerField('address', {
  required: true,
  rules: [required('收货地址不能为空')]
});

form.registerField('paymentMethod', {
  required: true
});

form.registerField('useExpress', {});

// 计算总价
const totalAmount = computed(() => {
  const items = form.getFieldValue('items') || [];
  const useExpress = form.getFieldValue('useExpress');
  const expressCharge = form.getFieldValue('expressCharge') || 0;
  
  // 计算商品总价
  const itemsTotal = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );
  
  // 加上快递费用
  return itemsTotal + (useExpress ? expressCharge : 0);
});

// 监听表单字段变化
effect(() => {
  console.log('支付方式:', form.getFieldValue('paymentMethod'));
  console.log('是否使用快递:', form.getFieldValue('useExpress'));
  console.log('订单总金额:', totalAmount.value);
});

// 支付方式变更联动
effect(() => {
  const paymentMethod = form.getFieldValue('paymentMethod');
  
  if (paymentMethod === 'cashOnDelivery') {
    // 如果是货到付款，强制使用快递
    form.setFieldValue('useExpress', true);
  }
});

// 模拟用户操作
console.log('--- 初始状态 ---');

console.log('--- 添加商品 ---');
const items = form.getFieldValue('items');
items.push({ name: '商品3', price: 300, quantity: 1 });
form.setFieldValue('items', [...items]); // 触发更新

console.log('--- 修改支付方式为货到付款 ---');
form.setFieldValue('paymentMethod', 'cashOnDelivery');

console.log('--- 尝试取消快递（由于货到付款必须使用快递，所以会被自动重新设置为true） ---');
form.setFieldValue('useExpress', false);

console.log('--- 输入地址并提交表单 ---');
form.setFieldValue('address', '北京市海淀区123号');

// 提交表单
form.submit().then(() => {
  console.log('订单提交完成，最终金额:', totalAmount.value);
}); 