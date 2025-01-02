import type { Ref } from '@vue/reactivity'
import { createId, input, label, reusable } from '@dolanske/cascade'

interface Props {
  modelValue: Ref<boolean>
  icon: string
}

export default reusable<Props>('div', (ctx, props) => {
  const id = createId()
  // For this project, checkbox is a simple toggleable icon
  ctx.class('form-checkbox')
  ctx.nest(
    input('checkbox')
      .name(id)
      .id(id)
      .attr('checked', props.modelValue)
      .on('input', (e) => {
        props.modelValue.value = (e.target as HTMLInputElement).checked
      }),
    label().attr('for', id).html(props.icon),
  )
})
