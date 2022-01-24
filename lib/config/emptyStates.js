
const emptyStates = {
  paragraph: {
    name: 'paragraph',
    text: ''
  },
  'thematic-break': {
    name: 'thematic-break',
    text: '---' // --- or ___ or ***
  },
  frontmatter: {
    name: 'frontmatter',
    text: '',
    meta: {
      lang: 'yaml', // yaml | toml | json
      style: '-' // `-` for yaml | `+` for toml | `;;;` and `{}` for json
    }
  },
  'atx-heading': {
    name: 'atx-heading',
    meta: {
      level: 1 // 1 ~ 6
    },
    text: '# ' // can not contain `\n`!
  },
  table: {
    name: 'table',
    children: [
      {
        name: 'table.row',
        children: [
          {
            name: 'table.cell',
            meta: {
              align: 'none' // none left center right, cells in the same column has the same alignment.
            },
            text: ''
          },
          {
            name: 'table.cell',
            meta: {
              align: 'none' // none left center right, cells in the same column has the same alignment.
            },
            text: ''
          }
        ]
      },
      {
        name: 'table.row',
        children: [
          {
            name: 'table.cell',
            meta: {
              align: 'none' // none left center right, cells in the same column has the same alignment.
            },
            text: ''
          },
          {
            name: 'table.cell',
            meta: {
              align: 'none' // none left center right, cells in the same column has the same alignment.
            },
            text: ''
          }
        ]
      }
    ]
  },
  'math-block': {
    name: 'math-block',
    text: '',
    meta: {
      mathStyle: '' // '' for `$$` and 'gitlab' for ```math
    }
  },
  'html-block': {
    name: 'html-block',
    text: '<div>\n\n</div>'
  },
  'code-block': {
    name: 'code-block',
    meta: {
      type: 'fenced', // indented or fenced
      lang: '' // lang will be enpty string if block is indented block. set language will auto change into fenced code block.
    },
    text: ''
  },
  'block-quote': {
    name: 'block-quote',
    children: [{ // Can contains any type and number of leaf blocks.
      name: 'paragraph',
      text: ''
    }]
  },
  'order-list': {
    name: 'order-list',
    meta: {
      start: 1, // 0 ~ 999999999
      loose: true, // true or false, true is loose list and false is tight.
      delimiter: '.' // . or )
    },
    children: [
      // List Item
      {
        name: 'list-item', // Can contains any type and number of leaf blocks.
        children: [
          {
            name: 'paragraph',
            text: ''
          }
        ]
      }
    ]
  },
  'bullet-list': {
    name: 'bullet-list',
    meta: {
      marker: '-', // - + *
      loose: false // true or false
    },
    children: [
      // List Item
      {
        name: 'list-item', // Can contains any type and number of leaf blocks.
        children: [
          {
            name: 'paragraph',
            text: ''
          }
        ]
      }
    ]
  },
  'task-list': {
    name: 'task-list',
    meta: {
      marker: '-', // - + *
      loose: false
    },
    children: [
      {
        name: 'task-list-item',
        meta: {
          checked: true // true or false
        },
        children: [{
          name: 'paragraph',
          text: ''
        }]
      }
    ]
  },
  diagram: {
    name: 'diagram',
    text: '',
    meta: {
      lang: 'yaml',
      type: 'mermaid'
    }
  }
}

export default emptyStates
