export const app = {
  render(){
    return h(
     'div','this is a ' + this.msg 
    )
  },
  setup(){
    return { msg:'Vue-thin'}
  }
}