import { reusable, input, button, span } from "@dolanske/cascade";
import { MaybeRef, Ref, computed } from "@vue/reactivity";
import { Icon } from "../Icon";

interface Props {
  disabled?: MaybeRef<boolean>
  placeholder?: MaybeRef<string>
  modelValue: Ref<string>
}

export default reusable('div', (ctx, props: Props) => {
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
    })
  )
})