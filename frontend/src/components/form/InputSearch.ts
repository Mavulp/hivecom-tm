import { $, reusable } from "@dolanske/cascade";
import { MaybeRef, Ref, computed } from "@vue/reactivity";
import { Icon } from "../Icon";

interface Props {
  label?: MaybeRef<string>,
  disabled?: MaybeRef<boolean>
  placeholder?: MaybeRef<string>
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
    $.label().if(label).html(`${Icon.search} ${label}`),
    $.input('text')
      .placeholder(placeholder)
      .model(modelValue)
      .attr('disabled', disabled),
    $.button().html(Icon.close).show(hasInput).click(() => {
      modelValue.value = ''
    })
  ])
})