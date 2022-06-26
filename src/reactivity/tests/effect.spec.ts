import { reactive } from '../reactive'
import { effect } from '../effect'

describe('effect', () => { 
  it('happy path', () => {
    let user = reactive({
      age:10
    })
    let updateAge;
    effect(()=>{
      updateAge = user.age + 1
    });

    expect(updateAge).toBe(11)
    
    // 响应式数据更新后
    user.age++
    expect(updateAge).toBe(12)

  })
})