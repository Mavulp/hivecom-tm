import type { Component } from '@dolanske/cascade'
import type { MaybeRef } from '@vue/reactivity'
import { button, div, reusable } from '@dolanske/cascade'
import { isRef, ref, watch } from '@vue/reactivity'

interface Props {
  button: Component<any>
  content: Component<any>
  open?: MaybeRef<boolean>
}

export default reusable<Props>('div', (ctx, props) => {
  const open = isRef(props.open) ? props.open : ref(props.open || false)

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
          ctx.el.style.maxHeight = `${ctx.el.scrollHeight}px`
        }
        else {
          ctx.el.style.maxHeight = String(0)
        }
      }, { immediate: true })
      ctx.onDestroy(release)
      ctx.nest(props.content)
    }),
  )
})
