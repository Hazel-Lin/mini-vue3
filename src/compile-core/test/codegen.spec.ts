import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformExpression } from "../src/transform/transformExpression";
describe("codegen", () => {
  // it("string", () => {
  //   const ast = baseParse("hi");
  //   transform(ast);
  //   const { code } = generate(ast);
  //   // 快照测试 string
  //   expect(code).toMatchSnapshot();
  // });
  it.only("interpolation", () => {
    const ast = baseParse("{{message}}");
    transform(ast);
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});
