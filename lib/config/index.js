import { generateKeyHash, genUpper2LowerKeyHash } from '@/utils'

export const BLOCK_DOM_PROPERTY = '__MUYA_BLOCK__'

export const DEFAULT_STATE = {
  name: 'scrollpage',
  children: [{
    name: 'paragraph',
    children: [
      {
        name: 'paragraph.content',
        text: 'Write by muya 111...'
      }
    ]
  }, {
    name: 'paragraph',
    children: [
      {
        name: 'paragraph.content',
        text: 'Write by muya 333...'
      }
    ]
  }]
}

export const EVENT_KEYS = generateKeyHash([
  'Enter',
  'Backspace',
  'Space',
  'Delete',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Tab',
  'Escape'
])

export const CLASS_NAMES = genUpper2LowerKeyHash([
  'MU_ACTIVE',
  'MU_AUTO_LINK',
  'MU_AUTO_LINK_EXTENSION',
  'MU_BACKLASH',
  'MU_BUG',
  'MU_BULLET_LIST',
  'MU_BULLET_LIST_ITEM',
  'MU_CHECKBOX_CHECKED',
  'MU_CONTAINER_BLOCK',
  'MU_CONTAINER_PREVIEW',
  'MU_CONTAINER_ICON',
  'MU_COPY_REMOVE',
  'MU_EDITOR_ID',
  'MU_EMOJI_MARKED_TEXT',
  'MU_EMOJI_MARKER',
  'MU_EMPTY',
  'MU_FENCE_CODE',
  'MU_FLOWCHART',
  'MU_FOCUS_MODE',
  'MU_FRONT_MATTER',
  'MU_FRONT_ICON',
  'MU_GRAY',
  'MU_HARD_LINE_BREAK',
  'MU_HARD_LINE_BREAK_SPACE',
  'MU_LINE_END',
  'MU_HEADER_TIGHT_SPACE',
  'MU_HIDE',
  'MU_HIGHLIGHT',
  'MU_HTML_BLOCK',
  'MU_HTML_ESCAPE',
  'MU_HTML_PREVIEW',
  'MU_HTML_TAG',
  'MU_IMAGE_FAIL',
  'MU_IMAGE_BUTTONS',
  'MU_IMAGE_LOADING',
  'MU_EMPTY_IMAGE',
  'MU_IMAGE_MARKED_TEXT',
  'MU_IMAGE_SRC',
  'MU_IMAGE_CONTAINER',
  'MU_INLINE_IMAGE',
  'MU_IMAGE_SUCCESS',
  'MU_IMAGE_UPLOADING',
  'MU_INLINE_IMAGE_SELECTED',
  'MU_INLINE_IMAGE_IS_EDIT',
  'MU_INDENT_CODE',
  'MU_INLINE_FOOTNOTE_IDENTIFIER',
  'MU_INLINE_RULE',
  'MU_LANGUAGE',
  'MU_LANGUAGE_INPUT',
  'MU_LINK',
  'MU_LINK_IN_BRACKET',
  'MU_LIST_ITEM',
  'MU_LOOSE_LIST_ITEM',
  'MU_MATH',
  'MU_MATH_TEXT',
  'MU_MATH_RENDER',
  'MU_RUBY',
  'MU_RUBY_TEXT',
  'MU_RUBY_RENDER',
  'MU_SELECTED',
  'MU_SOFT_LINE_BREAK',
  'MU_MATH_ERROR',
  'MU_MATH_MARKER',
  'MU_MATH_RENDER',
  'MU_MATH_TEXT',
  'MU_MERMAID',
  'MU_MULTIPLE_MATH',
  'MU_NOTEXT_LINK',
  'MU_ORDER_LIST',
  'MU_ORDER_LIST_ITEM',
  'MU_OUTPUT_REMOVE',
  'MU_PARAGRAPH',
  'MU_RAW_HTML',
  'MU_REFERENCE_LABEL',
  'MU_REFERENCE_LINK',
  'MU_REFERENCE_MARKER',
  'MU_REFERENCE_TITLE',
  'MU_REMOVE',
  'MU_RUBY',
  'MU_RUBY_RENDER',
  'MU_RUBY_TEXT',
  'MU_SELECTION',
  'MU_SEQUENCE',
  'MU_SHOW_PREVIEW',
  'MU_SOFT_LINE_BREAK',
  'MU_TASK_LIST',
  'MU_TASK_LIST_ITEM',
  'MU_TASK_LIST_ITEM_CHECKBOX',
  'MU_TIGHT_LIST_ITEM',
  'MU_TOOL_BAR',
  'MU_VEGA_LITE',
  'MU_WARN'
])

export const punctuation = ['!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~']
export const isInElectron = window && window.process && window.process.type === 'renderer'
export const IMAGE_EXT_REG = /\.(jpeg|jpg|png|gif|svg|webp)(?=\?|$)/i
