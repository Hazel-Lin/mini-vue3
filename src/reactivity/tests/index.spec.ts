import { add } from '../index'

it('init',()=>{
  expect(true).toBe(true);
})
describe('first',() => {
  expect(add(1,1)).toBe(2);
})