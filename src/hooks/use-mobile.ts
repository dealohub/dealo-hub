import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Returns `true` when the viewport is narrower than the `md` breakpoint
 * (768 px). During server render / first client paint (before the media
 * query listener runs) the hook returns `false` so SSR output matches
 * the desktop layout.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
