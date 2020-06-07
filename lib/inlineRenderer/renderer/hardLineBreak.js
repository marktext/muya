import { CLASS_NAMES } from '@/config'

export default function softLineBreak (h, cursor, block, token, outerClass) {
  const { spaces, lineBreak, isAtEnd } = token
  const className = CLASS_NAMES.MU_HARD_LINE_BREAK
  const spaceClass = CLASS_NAMES.MU_HARD_LINE_BREAK_SPACE
  if (isAtEnd) {
    return [
      h(`span.${className}`, h(`span.${spaceClass}`, spaces)),
      h(`span.${CLASS_NAMES.MU_LINE_END}`, lineBreak)
    ]
  } else {
    return [
      h(`span.${className}`, [h(`span.${spaceClass}`, spaces), lineBreak])
    ]
  }
}
