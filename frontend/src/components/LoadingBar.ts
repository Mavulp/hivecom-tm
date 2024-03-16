import { reusable, div } from "@dolanske/cascade"
import { Ref, computed, ref } from "@vue/reactivity"
import { watchEffect } from "@vue-reactivity/watch"

interface Props {
  active: Ref<boolean>
}

export default reusable('div', (ctx, props: Props) => {
  ctx.class('loading-bar')
  const offsetActive = ref(false)

  watchEffect(() => {
    if (props.active.value) {
      offsetActive.value = true
    } else {
      setTimeout(() => {
        offsetActive.value = false
      }, 300)
    }
  })




  ctx.nest(
    div()
      .class('bar')
      .class('animate', offsetActive)
  )
})