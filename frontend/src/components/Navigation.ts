import { nav, fragment, div, img, button } from "@dolanske/cascade";
import { onRouteResolve, onNavigation } from "@dolanske/crumbs"
import { computed, ref } from "@vue/reactivity";
import { RouterLink } from "@dolanske/pantry";
import { watchEffect } from "@vue-reactivity/watch";
import { Icon } from "./Icon";
import { throttle } from "../util/timing";
import LoadingBar from "./LoadingBar";

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
  const loading = ref(false)

  onNavigation(() => {
    loading.value = true
  })

  onRouteResolve((route) => {
    activeButton.value = route.path.replaceAll('/', '')
    loading.value = false
  })

  return fragment().nest(
    LoadingBar().prop('active', loading),
    nav().class('navigation').nest(
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
            document.documentElement.classList.add('dark-theme')
          else
            document.documentElement.classList.remove('dark-theme')
        })

        const buttonIcon = computed(() => isDark.value ? Icon.sun : Icon.moon)

        ctx.class('nav-theme')
        ctx.class('active', isDark)
        ctx.click(() => isDark.value = !isDark.value)
        ctx.html(buttonIcon)
        ctx.attr('data-title-left', "Switch Theme")
      }),
      div()
        .class('nav-links')
        .style('grid-template-columns', `repeat(${buttons.length}, 1fr)`)
        .for(buttons, (link) => {
          const isActive = computed(() => link === activeButton.value)
          return RouterLink(`/${link}`, link).class('active', isActive)
        }),
      button()
        .setup((ctx) => {
          // Scrolling check
          const showScrollUp = ref(false)
          window.addEventListener('scroll', throttle(() => {
            showScrollUp.value = window.scrollY > 256
          }, 50))
          ctx.class({ active: showScrollUp })
        })
        .class('scroll-up')
        .html(Icon.arrowUp)
        .attr('data-title-top', "Scroll up")
        .click(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        })
    )
  )
}