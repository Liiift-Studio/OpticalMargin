// Empty React stub for the capture harness only.
// The hero visual uses only the framework-agnostic core (applyOpticalMargin /
// getCleanHTML), but the built bundle imports "react" at the top level for its
// optional hook/component. This stub satisfies that import without pulling React.
export default {}
export const useRef = () => ({ current: null })
export const useEffect = () => {}
export const useLayoutEffect = () => {}
export const useCallback = (fn) => fn
export const createElement = () => null
export const forwardRef = (fn) => fn
export const jsx = () => null
export const jsxs = () => null
export const Fragment = Symbol("Fragment")
