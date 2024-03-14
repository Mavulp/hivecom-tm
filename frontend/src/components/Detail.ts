import { reusable, button, Component, div } from "@dolanske/cascade"
import { watch } from "@vue-reactivity/watch"
import { MaybeRef, isRef, ref } from "@vue/reactivity"

interface Props {
  button: Component
  content: Component
  open?: MaybeRef<boolean>
}

export default reusable('div', (ctx, props: Props) => {
  const open = props.open
    ? isRef(props.open)
      ? props.open : ref(props.open)
    : ref(false)

  ctx.class('details')

  ctx.nest(
    button(props.button)
      .class('details-button')
      .class({ active: open })
      .click(() => {
        open.value = !open.value
      }),
    div().setup((ctx) => {
      ctx.class('details-content')

      const release = watch(open, (isOpen) => {
        if (isOpen) {
          ctx.el.style.maxHeight = ctx.el.scrollHeight + 'px'
        } else {
          ctx.el.style.maxHeight = String(0)
        }
      }, { immediate: true })
      // Clean up watcher
      ctx.onDestroy(release)

      ctx.nest(props.content)
    })
  )
})
