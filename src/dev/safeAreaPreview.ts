// an iPhone 11 in portrait: the desktop has no safe area, so a preview lays the screen
// out 82 px taller than the phone and the footer lands below the home indicator
const INSET_TOP = '48px'
const INSET_BOTTOM = '34px'

const probe = document.createElement('div')
probe.style.cssText =
  'position:fixed;top:0;left:0;width:env(safe-area-inset-bottom);height:env(safe-area-inset-top)'
document.body.append(probe)
const { width, height } = probe.getBoundingClientRect()
probe.remove()

// a real device already answers, only the one that does not gets the pretend values
if (width === 0 && height === 0) {
  document.documentElement.style.setProperty('--safe-top', INSET_TOP)
  document.documentElement.style.setProperty('--safe-bottom', INSET_BOTTOM)
}
