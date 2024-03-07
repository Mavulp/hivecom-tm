import { $, reusable } from "@dolanske/pantry";
import { Ref, computed } from "@vue/reactivity";
import { Icon } from "../Icon";

// TODO (cascade) placeholder can be undeinfed
// TODO (cascade) expression in if() can be undefiend 

interface Props {
  label?: string,
  disabled?: boolean
  placeholder?: string
  modelValue: Ref<string>
}

export default reusable('div', (ctx, props: Props) => {
  const {
    modelValue,
    label,
    placeholder,
    disabled
  } = props

  const hasInput = computed(() => modelValue.value.length > 0)
  ctx.class('input-wrap')
  ctx.nest([
    $.label().if(!!label).html(`${Icon.search} ${label}`),
    $.input('text')
      .placeholder(placeholder ?? '')
      .model(modelValue)
      .attr('disabled', !!disabled),
    $.button().html(Icon.close).show(hasInput).click(() => {
      modelValue.value = ''
    })
  ])
})