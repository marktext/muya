export const BLOCK_DOM_PROPERTY = '__MUYA_BLOCK__'

export const DEFAULT_STATE = {
  name: 'scrollpage',
  children: [{
    name: 'paragraph',
    children: [
      {
        name: 'paragraph.content',
        text: 'Write by muya...'
      }
    ]
  }]
}

export const punctuation = ['!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~']
export const isInElectron = window && window.process && window.process.type === 'renderer'
export const IMAGE_EXT_REG = /\.(jpeg|jpg|png|gif|svg|webp)(?=\?|$)/i
