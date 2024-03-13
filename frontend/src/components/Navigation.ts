import { nav, div, img, button } from "@dolanske/cascade";
import { onRouteResolve } from "@dolanske/crumbs"
import { computed, ref } from "@vue/reactivity";
import { RouterLink } from "@dolanske/pantry";
import { watchEffect } from "@vue-reactivity/watch";
import { Icon } from "./Icon";

function isDefaultDark() {
  const defaultState = localStorage.getItem('dark-theme')
  if (defaultState === 'true')
    return true
  if (defaultState === 'false')
    return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function () {
  const activeButton = ref('records')
  const buttons = ['records', "stats", 'players']

  onRouteResolve((route) => {
    activeButton.value = route.path.replaceAll('/', '')
  })

  return nav().class('navigation').nest(
    div().class('logo-wrap').nest(
      img().attrs({
        src: '/logo.svg',
        alt: 'Hivecom Records Logo'
      })
    ),
    div().class('flex-1'),
    button().setup((ctx) => {
      const isDark = ref(isDefaultDark())

      watchEffect(() => {
        localStorage.setItem('dark-theme', String(isDark.value))
        if (isDark.value)
          document.body.classList.add('dark-theme')
        else
          document.body.classList.remove('dark-theme')
      })

      const buttonIcon = computed(() => isDark.value ? Icon.sun : Icon.moon)

      ctx.class('nav-theme')
      ctx.class('active', isDark)
      ctx.click(() => isDark.value = !isDark.value)
      ctx.html(buttonIcon)
      ctx.attr('data-title-left', "Switch Theme")
    }),
    div().class('nav-links').for(buttons, (link) => {
      const isActive = computed(() => link === activeButton.value)
      return RouterLink(`/${link}`, link).class('active', isActive)
    })
  )
}