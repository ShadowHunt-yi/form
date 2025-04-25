import { model } from '../../src/core/model';

describe('响应式模型测试', () => {
  test('基本创建和获取属性', () => {
    const user = model({
      name: 'Zhang San',
      age: 28
    });
    
    expect(user.name).toBe('Zhang San');
    expect(user.age).toBe(28);
  });

  test('修改属性值', () => {
    const user = model({
      name: 'Zhang San',
      age: 28
    });
    
    user.name = 'Li Si';
    user.age = 30;
    
    expect(user.name).toBe('Li Si');
    expect(user.age).toBe(30);
  });

  test('订阅模型变化', () => {
    const user = model({
      name: 'Zhang San',
      age: 28
    });
    
    const snapshots: any[] = [];
    const unsubscribe = user.$subscribe(snapshot => {
      snapshots.push({...snapshot});
    });
    
    user.name = 'Li Si';
    user.age = 30;
    
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]).toEqual({ name: 'Li Si', age: 28 });
    expect(snapshots[1]).toEqual({ name: 'Li Si', age: 30 });
    
    // 测试取消订阅
    unsubscribe();
    user.name = 'Wang Wu';
    expect(snapshots).toHaveLength(2); // 不再增加
  });

  test('订阅特定属性变化', () => {
    const user = model({
      name: 'Zhang San',
      age: 28
    });
    
    const nameValues: string[] = [];
    const unsubscribe = user.$subscribeKey('name', value => {
      nameValues.push(value);
    });
    
    user.name = 'Li Si';
    user.age = 30; // 这个不应该触发name的订阅
    user.name = 'Wang Wu';
    
    expect(nameValues).toHaveLength(2);
    expect(nameValues).toEqual(['Li Si', 'Wang Wu']);
    
    // 测试取消订阅
    unsubscribe();
    user.name = 'Zhao Liu';
    expect(nameValues).toHaveLength(2); // 不再增加
  });

  test('批量更新模型', () => {
    const user = model({
      name: 'Zhang San',
      age: 28,
      email: 'zhangsan@example.com'
    });
    
    const snapshots: any[] = [];
    user.$subscribe(snapshot => {
      snapshots.push({...snapshot});
    });
    
    user.$patch({
      name: 'Li Si',
      age: 30
    });
    
    expect(user.name).toBe('Li Si');
    expect(user.age).toBe(30);
    expect(user.email).toBe('zhangsan@example.com');
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual({
      name: 'Li Si',
      age: 30,
      email: 'zhangsan@example.com'
    });
  });

  test('不变的更新不触发订阅', () => {
    const user = model({
      name: 'Zhang San',
      age: 28
    });
    
    const snapshots: any[] = [];
    user.$subscribe(snapshot => {
      snapshots.push({...snapshot});
    });
    
    user.$patch({
      name: 'Zhang San', // 相同的值
      age: 28            // 相同的值
    });
    
    expect(snapshots).toHaveLength(0); // 不应该触发订阅
  });

  test('重置模型到初始状态', () => {
    const user = model({
      name: 'Zhang San',
      age: 28
    });
    
    user.name = 'Li Si';
    user.age = 30;
    
    expect(user.name).toBe('Li Si');
    expect(user.age).toBe(30);
    
    user.$reset();
    
    expect(user.name).toBe('Zhang San');
    expect(user.age).toBe(28);
  });

  test('获取模型快照', () => {
    const user = model({
      name: 'Zhang San',
      age: 28
    });
    
    const snapshot = user.$snapshot();
    
    expect(snapshot).toEqual({
      name: 'Zhang San',
      age: 28
    });
    
    // 修改模型不应影响已获取的快照
    user.name = 'Li Si';
    expect(snapshot.name).toBe('Zhang San');
    
    // 获取新快照应反映最新状态
    const newSnapshot = user.$snapshot();
    expect(newSnapshot.name).toBe('Li Si');
  });

  test('嵌套对象处理', () => {
    const user = model({
      name: 'Zhang San',
      profile: {
        age: 28,
        address: 'Beijing'
      }
    });
    
    // 对嵌套对象的修改应该生效
    user.profile = {
      age: 30,
      address: 'Shanghai'
    };
    
    expect(user.profile).toEqual({
      age: 30,
      address: 'Shanghai'
    });
  });
}); 