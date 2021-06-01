import Muya from '../lib'
import EmojiPicker from '../lib/ui/emojiPicker'
import FormatPicker from '../lib/ui/formatPicker'
// import ImagePicker from '../lib/ui/imagePicker'
import ImageSelector from '../lib/ui/imageSelector'
import ImageToolBar from '../lib/ui/imageToolbar'
import ImageTransformer from '../lib/ui/transformer'
import CodePicker from '../lib/ui/codePicker'
import TableColumnTools from '../lib/ui/tableColumnTools'
import TableDragBar from '../lib/ui/tableDragBar'
import TableTools from '../lib/ui/tableTools'
import PreviewTools from '../lib/ui/previewTools'

import FrontButton from '../lib/ui/frontButton'

// const DEFAULT_STATE = [
//   {
//     name: 'paragraph',
//     text: 'foo bar'
//   },
//   {
//     name: 'math-block',
//     text: 'a \\ne b',
//     meta: {
//       mathStyle: ''
//     }
//   },
//   {
//     name: 'html-block',
//     text: '<div>\nfoo bar\n</div>'
//   },
//   // Table
//   {
//     name: 'table',
//     children: [
//       {
//         name: 'table.row',
//         children: [
//           {
//             name: 'table.cell',
//             meta: {
//               align: 'right' // none left center right, cells in the same column has the same alignment.
//             },
//             text: 'foo'
//           },
//           {
//             name: 'table.cell',
//             meta: {
//               align: 'none' // none left center right, cells in the same column has the same alignment.
//             },
//             text: 'bar'
//           }
//         ]
//       },
//       {
//         name: 'table.row',
//         children: [
//           {
//             name: 'table.cell',
//             meta: {
//               align: 'right' // none left center right, cells in the same column has the same alignment.
//             },
//             text: 'zar'
//           },
//           {
//             name: 'table.cell',
//             meta: {
//               align: 'none' // none left center right, cells in the same column has the same alignment.
//             },
//             text: 'foo bar'
//           }
//         ]
//       }
//     ]
//   },
//   // Indented code blocks and Fenced code blocks
//   // Order List Blocks
//   {
//     name: 'order-list',
//     meta: {
//       start: 0, // 0 ~ 999999999
//       loose: true, // true or false, true is loose list and false is tight.
//       delimiter: '.' // . or )
//     },
//     children: [
//       // List Item
//       {
//         name: 'list-item', // Can contains any type and number of leaf blocks.
//         children: [
//           {
//             name: 'paragraph',
//             text: 'foo\nbar'
//           }
//         ]
//       }
//     ]
//   },
//   // Bullet List Blocks
//   {
//     name: 'bullet-list',
//     meta: {
//       marker: '-', // - + *
//       loose: false // true or false
//     },
//     children: [
//       // List Item
//       {
//         name: 'list-item', // Can contains any type and number of leaf blocks.
//         children: [
//           {
//             name: 'paragraph',
//             text: 'foo bar1'
//           },
//           {
//             name: 'paragraph',
//             text: 'foo bar2'
//           }
//         ]
//       }
//     ]
//   },
//   // Task List
//   {
//     name: 'task-list',
//     meta: {
//       marker: '-' // - + *
//     },
//     children: [
//       {
//         name: 'task-list-item',
//         meta: {
//           checked: false // true or false
//         },
//         children: [{
//           name: 'paragraph',
//           text: 'a'
//         }]
//       },
//       {
//         name: 'task-list-item',
//         meta: {
//           checked: true // true or false
//         },
//         children: [{
//           name: 'paragraph',
//           text: 'b'
//         }]
//       },
//       {
//         name: 'task-list-item',
//         meta: {
//           checked: false // true or false
//         },
//         children: [{
//           name: 'paragraph',
//           text: 'c'
//         }]
//       },
//       {
//         name: 'task-list-item',
//         meta: {
//           checked: false // true or false
//         },
//         children: [{
//           name: 'paragraph',
//           text: 'd'
//         }]
//       }
//     ]
//   },
//   {
//     name: 'paragraph',
//     text: '**blod** *emphasis* :man: <u>underline</u> <mark>highlight</mark> `inline code`~~删除~~ [百度](http://www.baidu.com) http://google.com'
//   },
//   // Thematic breaks
//   {
//     name: 'thematic-break',
//     text: '---' // --- or ___ or ***
//   },
//   {
//     name: 'atx-heading',
//     meta: {
//       level: 1 // 1 ~ 6
//     },
//     text: '# foo bar' // can not contain `\n`!
//   },
//   // Setext headings
//   {
//     name: 'setext-heading',
//     meta: {
//       level: 1,
//       underline: '===' // === or ---
//     },
//     text: 'foo\nbar' // can contain multiple lines.
//   },
//   // Block quotes
//   {
//     name: 'block-quote',
//     children: [{ // Can contains any type and number of leaf blocks.
//       name: 'paragraph',
//       text: 'foo\nbar'
//     }]
//   },
//   {
//     name: 'paragraph',
//     text: '图片![](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1592848169049&di=1bf848686f738f8697ec90a2d484a29c&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_pic%2F01%2F54%2F05%2F625746fd5b60878.jpg) bar &gt; *zar* <ruby>北京<rt>Beijing</rt></ruby> foo bar $a \\ne b$ 和自己'
//   }
// ]

const DEFAULT_MARKDOWN = `
foo bar

$$
a \\ne b
$$

\`\`\`math
a \\ne contain
\`\`\`

bar zar
`

// <div>
// foo bar
// </div>

// | foo | bar     |
// | ---:| ------- |
// | zar | foo bar |

// 0. foo
//    bar

// - foo bar1

//   foo bar2

// - [ ] a
// - [x] b
// - [ ] c
// - [ ] d

// **blod** *emphasis* :man: <u>underline</u> <mark>highlight</mark> \`inline code\`~~删除~~ [百度](http://www.baidu.com) http://google.com

// ---

// # foo bar

// foo
// bar
// ===

// > foo
// > bar

// 图片![](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1592848169049&di=1bf848686f738f8697ec90a2d484a29c&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_pic%2F01%2F54%2F05%2F625746fd5b60878.jpg) bar &gt; *zar* <ruby>北京<rt>Beijing</rt></ruby> foo bar $a \ne b$ 和自己
// `

Muya.use(EmojiPicker)
Muya.use(FormatPicker)
// Muya.use(ImagePicker)
Muya.use(ImageSelector, {
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY
})
Muya.use(ImageToolBar)
Muya.use(ImageTransformer)
Muya.use(CodePicker)

Muya.use(FrontButton)
Muya.use(TableColumnTools)
Muya.use(TableDragBar)
Muya.use(TableTools)
Muya.use(PreviewTools)

console.log(DEFAULT_MARKDOWN)

const container = document.querySelector('#editor')
const undoBtn = document.querySelector('#undo')
const redoBtn = document.querySelector('#redo')
const searchInput = document.querySelector('#search')
const previousBtn = document.querySelector('#previous')
const nextBtn = document.querySelector('#next')
const replaceInput = document.querySelector('#replace')
const singleBtn = document.querySelector('#single')
const allBtn = document.querySelector('#all')
const muya = new Muya(container, { markdown: DEFAULT_MARKDOWN })

window.muya = muya

muya.init()

undoBtn.addEventListener('click', () => {
  muya.undo()
})

redoBtn.addEventListener('click', () => {
  muya.redo()
})

searchInput.addEventListener('input', (event) => {
  const value = event.target.value

  muya.search(value)
})

previousBtn.addEventListener('click', () => {
  muya.find('previous')
})

nextBtn.addEventListener('click', () => {
  muya.find('next')
})

singleBtn.addEventListener('click', () => {
  muya.replace(replaceInput.value, { isSingle: true })
})

allBtn.addEventListener('click', () => {
  muya.replace(replaceInput.value, { isSingle: false })
})

muya.on('json-change', changes => {
  // console.log(JSON.stringify(muya.getState(), null, 2))
  // console.log(JSON.stringify(changes, null, 2))
})

// muya.on('selection-change', changes => {
//   const { anchor, focus, path } = changes
//   console.log(JSON.stringify([anchor.offset, focus.offset, path]))
// })
