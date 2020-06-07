import { CLASS_NAMES } from '@/config'

export default function hr (h, cursor, block, token, outerClass) {
  const { start, end } = token.range
  const content = this.highlight(h, block, start, end, token)

  return [
    h(`span.${CLASS_NAMES.MU_GRAY}.${CLASS_NAMES.MU_REMOVE}`, content)
  ]
}
