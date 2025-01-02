import type { MaybeRef, Ref } from '@vue/reactivity'
import { button, input, reusable, span } from '@dolanske/cascade'
import { computed } from '@vue/reactivity'
import { Icon } from '../Icon'

interface Props {
  disabled?: MaybeRef<boolean>
  placeholder?: MaybeRef<string>
  modelValue: Ref<string>
}

export default reusable<Props>('div', (ctx, props) => {
  const hasInput = computed(() => props.modelValue.value.length > 0)
  ctx.class('form-item').class('form-search').class({ 'has-input': hasInput })
  ctx.nest(
    span().class('form-search-icon').html(Icon.search),
    input('text')
      .placeholder(props.placeholder)
      .model(props.modelValue)
      .attr('disabled', props.disabled === true),
    button().class('form-clear-icon').html(Icon.close).show(hasInput).click(() => {
      props.modelValue.value = ''
    }),
  )
})
