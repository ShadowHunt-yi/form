/**
 * Formily响应式模型测试脚本
 * 
 * 这个脚本用于测试响应式系统的各种功能：
 * 1. 响应式对象
 * 2. 副作用函数
 * 3. 计算属性
 * 4. 嵌套属性
 * 5. 数组响应式
 * 6. 依赖收集和清理
 */

// 导入响应式相关函数
const { reactive, effect, computed } = require('./dist/reactive');

// 测试辅助函数
function runTest(name, testFn) {
  console.log(`\n===== 测试: ${name} =====`);
  try {
    testFn();
    console.log(`✅ 测试通过: ${name}`);
  } catch (error) {
    console.log(`❌ 测试失败: ${name}`);
    console.error(error);
  }
}

// 断言函数
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

function assertEqual(actual, expected, message) {
  assert(
    actual === expected, 
    message || `期望值 ${expected}，实际值 ${actual}`
  );
}

// 开始测试
console.log('开始测试 Formily 响应式系统...\n');

// 测试1: 基本响应式对象
runTest('基本响应式对象', () => {
  const state = reactive({
    count: 0,
    message: 'Hello'
  });
  
  // 测试初始值
  assertEqual(state.count, 0, '初始count应为0');
  assertEqual(state.message, 'Hello', '初始message应为Hello');
  
  // 测试修改值
  state.count = 1;
  state.message = 'World';
  
  assertEqual(state.count, 1, '修改后count应为1');
  assertEqual(state.message, 'World', '修改后message应为World');
  
  console.log('响应式对象工作正常');
});

// 测试2: 副作用函数
runTest('副作用函数', () => {
  const state = reactive({ count: 0 });
  let effectCount = 0;
  let lastValue = null;
  
  // 创建副作用
  effect(() => {
    effectCount++;
    lastValue = state.count;
  });
  
  // 初始时应该执行一次
  assertEqual(effectCount, 1, '初始时effect应执行一次');
  assertEqual(lastValue, 0, '初始获取的值应为0');
  
  // 修改值应该触发副作用
  state.count = 1;
  assertEqual(effectCount, 2, '修改值后effect应再次执行');
  assertEqual(lastValue, 1, '修改后获取的值应为1');
  
  // 修改为相同的值不应触发副作用
  state.count = 1;
  assertEqual(effectCount, 2, '修改为相同的值不应触发effect');
  
  console.log('副作用函数工作正常');
});

// 测试3: 计算属性
runTest('计算属性', () => {
  const state = reactive({ count: 1 });
  let computeCount = 0;
  
  // 创建计算属性
  const double = computed(() => {
    computeCount++;
    return state.count * 2;
  });
  
  // 初始时不应该计算
  assertEqual(computeCount, 0, '初始时不应该计算');
  
  // 访问时才计算
  assertEqual(double.value, 2, '初始计算值应为2');
  assertEqual(computeCount, 1, '访问后应计算一次');
  
  // 再次访问不应重新计算（缓存）
  assertEqual(double.value, 2, '再次访问应返回缓存的值');
  assertEqual(computeCount, 1, '再次访问不应重新计算');
  
  // 修改依赖后，再访问应重新计算
  state.count = 2;
  assertEqual(double.value, 4, '修改依赖后计算值应更新');
  assertEqual(computeCount, 2, '修改依赖后应重新计算');
  
  console.log('计算属性工作正常');
});

// 测试4: 嵌套属性
runTest('嵌套属性', () => {
  const nested = reactive({
    user: {
      name: 'John',
      profile: {
        age: 25,
        address: {
          city: 'Beijing'
        }
      }
    }
  });
  
  let effectCount = 0;
  
  // 监听深层嵌套属性
  effect(() => {
    effectCount++;
    // 访问深层属性
    return nested.user.profile.address.city;
  });
  
  // 初始时应执行一次
  assertEqual(effectCount, 1, '初始时effect应执行一次');
  
  // 修改深层属性应触发副作用
  nested.user.profile.address.city = 'Shanghai';
  assertEqual(effectCount, 2, '修改深层属性应触发effect');
  assertEqual(nested.user.profile.address.city, 'Shanghai', '深层属性应正确更新');
  
  // 修改中间属性
  nested.user.profile = { age: 30, address: { city: 'Guangzhou' } };
  assertEqual(effectCount, 3, '修改中间属性应触发effect');
  assertEqual(nested.user.profile.address.city, 'Guangzhou', '重新赋值后的深层属性应正确');
  
  console.log('嵌套属性响应式工作正常');
});

// 测试5: 数组响应式
runTest('数组响应式', () => {
  // 简单测试：修改数组元素值
  const arr1 = reactive([1, 2, 3]);
  let sum = 0;
  let effectCount1 = 0;
  
  effect(() => {
    effectCount1++;
    sum = arr1.reduce((total, num) => total + num, 0);
  });
  
  assertEqual(effectCount1, 1, '初始时effect应执行一次');
  assertEqual(sum, 6, '初始数组和应为6');
  
  arr1[0] = 10;
  assertEqual(effectCount1, 2, '修改数组元素应触发effect');
  assertEqual(sum, 15, '修改后数组和应为15');
  
  // 手动创建数组变化测试 - 使用单独的响应式数组
  const arr2 = reactive([1, 2, 3]);
  let len = 0;
  let effectCount2 = 0;
  
  effect(() => {
    effectCount2++;
    len = arr2.length;
  });
  
  assertEqual(len, 3, '初始数组长度应为3');
  assertEqual(effectCount2, 1, '初始时effect应执行一次');
  
  // 手动调用数组方法并验证长度更新
  arr2.push(4);
  assertEqual(len, 4, 'push后数组长度应为4');
  
  arr2.pop();
  assertEqual(len, 3, 'pop后数组长度应为3');
  
  console.log('数组响应式工作正常');
});

// 测试6: 依赖清理
runTest('依赖清理', () => {
  const state = reactive({
    showA: true,
    a: 1,
    b: 2
  });
  
  let effectCount = 0;
  let lastAccessed = '';
  
  // 有条件访问属性的effect
  effect(() => {
    effectCount++;
    if (state.showA) {
      lastAccessed = 'a';
      return state.a;
    } else {
      lastAccessed = 'b';
      return state.b;
    }
  });
  
  // 初始时应执行一次，访问a
  assertEqual(effectCount, 1, '初始时effect应执行一次');
  assertEqual(lastAccessed, 'a', '初始时应访问a');
  
  // 修改a应触发effect
  state.a = 10;
  assertEqual(effectCount, 2, '修改a应触发effect');
  
  // 切换条件后，修改a不应触发effect
  state.showA = false;
  assertEqual(effectCount, 3, '切换条件应触发effect');
  assertEqual(lastAccessed, 'b', '切换后应访问b');
  
  // 修改a不应触发effect
  state.a = 100;
  assertEqual(effectCount, 3, '切换条件后修改a不应触发effect');
  
  // 修改b应触发effect
  state.b = 20;
  assertEqual(effectCount, 4, '修改b应触发effect');
  
  console.log('依赖清理工作正常');
});

// 测试7: 嵌套effect
runTest('嵌套effect', () => {
  const state = reactive({
    a: 1,
    b: 2
  });
  
  let outerCount = 0;
  let innerCount = 0;
  let innerValue = 0;
  
  // 直接引用，以便后面可以调用
  let innerEffect;
  
  // 嵌套effect - 使用变量存储内层effect
  const outerEffect = effect(() => {
    outerCount++;
    // 外层effect依赖a
    const a = state.a;
    
    // 内层effect只创建一次，避免每次外层effect运行都重新创建
    if (!innerEffect) {
      innerEffect = effect(() => {
        innerCount++;
        // 内层effect依赖b
        innerValue = state.b;
      });
    }
  });
  
  // 初始时外层和内层各执行一次
  assertEqual(outerCount, 1, '初始时外层effect应执行一次');
  assertEqual(innerCount, 1, '初始时内层effect应执行一次');
  assertEqual(innerValue, 2, '内层effect应该读取b的值');
  
  // 修改a应只触发外层effect
  state.a = 10;
  assertEqual(outerCount, 2, '修改a应触发外层effect');
  // 内层effect不会重新执行，因为我们避免了重复创建
  assertEqual(innerCount, 1, '修改a不应导致内层effect重新执行');
  
  // 修改b应只触发内层effect
  state.b = 20;
  assertEqual(outerCount, 2, '修改b不应触发外层effect');
  assertEqual(innerCount, 2, '修改b应触发内层effect');
  assertEqual(innerValue, 20, '内层effect应更新innerValue为20');
  
  console.log('嵌套effect工作正常');
});

console.log('\n===== 所有测试完成 ====='); 