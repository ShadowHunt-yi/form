import { validateWithSchema, getDefaultValues } from '../../src/schema/validator';

describe('Schema验证器测试', () => {
  test('基本类型验证', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    };
    
    // 有效数据
    const validResult = validateWithSchema(schema, { name: 'Zhang San', age: 30 });
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
    
    // 无效数据 - 缺少必填字段
    const invalidResult1 = validateWithSchema(schema, { age: 30 });
    expect(invalidResult1.valid).toBe(false);
    expect(invalidResult1.errors.length).toBeGreaterThan(0);
    expect(invalidResult1.errors[0].keyword).toBe('required');
    
    // 无效数据 - 类型错误
    const invalidResult2 = validateWithSchema(schema, { name: 'Zhang San', age: '30' });
    expect(invalidResult2.valid).toBe(true); // 应该是true，因为设置了coerceTypes为true
  });
  
  test('嵌套对象验证', () => {
    const schema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                zip: { type: 'string', pattern: '^\\d{6}$' }
              },
              required: ['city']
            }
          },
          required: ['name']
        }
      },
      required: ['user']
    };
    
    // 有效数据
    const validResult = validateWithSchema(schema, {
      user: {
        name: 'Zhang San',
        address: {
          city: 'Beijing',
          zip: '100000'
        }
      }
    });
    expect(validResult.valid).toBe(true);
    
    // 无效数据 - 嵌套属性缺失
    const invalidResult = validateWithSchema(schema, {
      user: {
        name: 'Zhang San',
        address: {
          zip: '100000'
        }
      }
    });
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors[0].path).toBe('user.address');
  });
  
  test('数组验证', () => {
    const schema = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1
        }
      },
      required: ['tags']
    };
    
    // 有效数据
    const validResult = validateWithSchema(schema, {
      tags: ['tag1', 'tag2']
    });
    expect(validResult.valid).toBe(true);
    
    // 无效数据 - 空数组
    const invalidResult1 = validateWithSchema(schema, {
      tags: []
    });
    expect(invalidResult1.valid).toBe(false);
    
    // 无效数据 - 数组项类型错误
    const invalidResult2 = validateWithSchema(schema, {
      tags: [1, 2]
    });
    expect(invalidResult2.valid).toBe(true); // 应该是true，因为设置了coerceTypes为true
  });
  
  test('格式验证', () => {
    const schema = {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        date: { type: 'string', format: 'date' }
      }
    };
    
    // 有效数据
    const validResult = validateWithSchema(schema, {
      email: 'test@example.com',
      date: '2023-01-01'
    });
    expect(validResult.valid).toBe(true);
    
    // 无效数据
    const invalidResult = validateWithSchema(schema, {
      email: 'not-an-email',
      date: '2023/01/01'
    });
    expect(invalidResult.valid).toBe(false);
  });
  
  test('获取默认值', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Unknown' },
        age: { type: 'number', default: 18 },
        address: {
          type: 'object',
          properties: {
            city: { type: 'string', default: 'Beijing' },
            zip: { type: 'string' }
          }
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          default: ['default']
        }
      }
    };
    
    const defaults = getDefaultValues(schema);
    expect(defaults).toEqual({
      name: 'Unknown',
      age: 18,
      address: {
        city: 'Beijing'
      },
      tags: ['default']
    });
  });
}); 