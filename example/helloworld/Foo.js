import { h } from '../../lib/vue-thin.esm.js'

export const Foo = {
  setup(props) {
    // props.count
    props.count++
    console.log(props)
  },
  render() {
    return h('div', {}, `foo: ${this.count}`)
  },
}
