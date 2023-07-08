import Muya from '../lib'
import EmojiPicker from '../lib/ui/emojiPicker'
import FormatPicker from '../lib/ui/formatPicker'
// import ImagePicker from '../lib/ui/imagePicker'
import ImageSelector from '../lib/ui/imageSelector'
import ImageToolBar from '../lib/ui/imageToolbar'
import ImageTransformer from '../lib/ui/transformer'
import CodePicker from '../lib/ui/codePicker'
import TableColumnTools from '../lib/ui/tableColumnTools'
import QuickInsert from '../lib/ui/quickInsert'
import TableDragBar from '../lib/ui/tableDragBar'
import TableTools from '../lib/ui/tableTools'
import PreviewTools from '../lib/ui/previewTools'

import FrontButton from '../lib/ui/frontButton'
import FrontMenu from '../lib/ui/frontMenu'

import zh from '../lib/locales/zh'

const DEFAULT_STATE = [
  {
    name: 'diagram',
    text: 'A->B: Does something',
    meta: {
      lang: 'yaml',
      type: 'sequence'
    }
  },
  {
    name: 'diagram',
    text: `flowchart TD
    A[Hard] -->|Text| B(Round)
    B --> C{Decision}
    C -->|One| D[Result 1]
    C -->|Two| E[Result 2]`,
    meta: {
      lang: 'yaml',
      type: 'mermaid'
    }
  },
  // Indented code blocks and Fenced code blocks
  {
    name: 'code-block',
    meta: {
      type: 'indented', // indented or fenced
      lang: 'javascript' // lang will be enpty string if block is indented block. set language will auto change into fenced code block.
    },
    text: 'const foo = `bar`'
  },
  {
    name: 'paragraph',
    text: 'foo bar'
  },
  {
    name: 'math-block',
    text: 'a \\ne b',
    meta: {
      mathStyle: ''
    }
  },
  {
    name: 'html-block',
    text: '<div>\nfoo bar\n</div>'
  },
  // Table
  {
    name: 'table',
    children: [
      {
        name: 'table.row',
        children: [
          {
            name: 'table.cell',
            meta: {
              align: 'right' // none left center right, cells in the same column has the same alignment.
            },
            text: 'foo'
          },
          {
            name: 'table.cell',
            meta: {
              align: 'none' // none left center right, cells in the same column has the same alignment.
            },
            text: 'bar'
          }
        ]
      },
      {
        name: 'table.row',
        children: [
          {
            name: 'table.cell',
            meta: {
              align: 'right' // none left center right, cells in the same column has the same alignment.
            },
            text: 'zar'
          },
          {
            name: 'table.cell',
            meta: {
              align: 'none' // none left center right, cells in the same column has the same alignment.
            },
            text: 'foo bar'
          }
        ]
      }
    ]
  },
  // Indented code blocks and Fenced code blocks
  // Order List Blocks
  {
    name: 'order-list',
    meta: {
      start: 0, // 0 ~ 999999999
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
            text: 'foo\nbar'
          }
        ]
      }
    ]
  },
  // Bullet List Blocks
  {
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
            text: 'foo bar1'
          },
          {
            name: 'paragraph',
            text: 'foo bar2'
          }
        ]
      }
    ]
  },
  // Task List
  {
    name: 'task-list',
    meta: {
      marker: '-' // - + *
    },
    children: [
      {
        name: 'task-list-item',
        meta: {
          checked: false // true or false
        },
        children: [
          {
            name: 'paragraph',
            text: 'a'
          }
        ]
      },
      {
        name: 'task-list-item',
        meta: {
          checked: true // true or false
        },
        children: [
          {
            name: 'paragraph',
            text: 'b'
          }
        ]
      },
      {
        name: 'task-list-item',
        meta: {
          checked: false // true or false
        },
        children: [
          {
            name: 'paragraph',
            text: 'c'
          }
        ]
      },
      {
        name: 'task-list-item',
        meta: {
          checked: false // true or false
        },
        children: [
          {
            name: 'paragraph',
            text: 'd'
          }
        ]
      }
    ]
  },
  {
    name: 'paragraph',
    text: '**blod** *emphasis* :man: <u>underline</u> <mark>highlight</mark> `inline code`~~删除~~ [百度](http://www.baidu.com) http://google.com'
  },
  // Thematic breaks
  {
    name: 'thematic-break',
    text: '---' // --- or ___ or ***
  },
  {
    name: 'atx-heading',
    meta: {
      level: 1 // 1 ~ 6
    },
    text: '# foo bar' // can not contain `\n`!
  },
  // Setext headings
  {
    name: 'setext-heading',
    meta: {
      level: 1,
      underline: '===' // === or ---
    },
    text: 'foo\nbar' // can contain multiple lines.
  },
  // Block quotes
  {
    name: 'block-quote',
    children: [
      {
        // Can contains any type and number of leaf blocks.
        name: 'paragraph',
        text: 'foo\nbar'
      }
    ]
  },
  {
    name: 'paragraph',
    text: 'Image![](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1592848169049&di=1bf848686f738f8697ec90a2d484a29c&imgtype=0&src=http%3A%2F%2Fbpic.588ku.com%2Felement_pic%2F01%2F54%2F05%2F625746fd5b60878.jpg) bar &gt; *zar* <ruby>北京<rt>Beijing</rt></ruby> foo bar $a \\ne b$ 和自己'
  }
]

// const DEFAULT_MARKDOWN = `
// foo bar^hello^~world~

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

// **blod** *emphasis* :man: <u>underline</u> <mark>highlight</mark> \`inline code\`~~Delete~~ [Baidu](http://www.baidu.com) http://google.com

// ---

// # foo bar

// foo
// bar
// ===

// > foo
// > bar
const DEFAULT_MARKDOWN = `
我与父亲不相见已二年余了，我最不能忘记的是他的背影。

那年冬天，祖母死了，父亲的差使⑴也交卸了，正是祸不单行的日子。我从北京到徐州，打算跟着父亲奔丧⑵回家。到徐州见着父亲，看见满院狼藉⑶的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已如此，不必难过，好在天无绝人之路！”

回家变卖典质⑷，父亲还了亏空；又借钱办了丧事。这些日子，家中光景很是惨澹⑸，一半为了丧事，一半为了父亲赋闲⑹。丧事完毕，父亲要到南京谋事，我也要回北京念书，我们便同行。

到南京时，有朋友约去游逛，勾留⑺了一日；第二日上午便须渡江到浦口，下午上车北去。父亲因为事忙，本已说定不送我，叫旅馆里一个熟识的茶房⑻陪我同去。他再三嘱咐茶房，甚是仔细。但他终于不放心，怕茶房不妥帖⑼；颇踌躇⑽了一会。其实我那年已二十岁，北京已来往过两三次，是没有什么要紧的了。他踌躇了一会，终于决定还是自己送我去。我再三劝他不必去；他只说：“不要紧，他们去不好！”
我们过了江，进了车站。我买票，他忙着照看行李。行李太多了，得向脚夫⑾行些小费才可过去。他便又忙着和他们讲价钱。我那时真是聪明过分，总觉他说话不大漂亮，非自己插嘴不可，但他终于讲定了价钱；就送我上车。他给我拣定了靠车门的一张椅子；我将他给我做的紫毛大衣铺好座位。他嘱我路上小心，夜里要警醒些，不要受凉。又嘱托茶房好好照应我。我心里暗笑他的迂；他们只认得钱，托他们只是白托！而且我这样大年纪的人，难道还不能料理自己么？我现在想想，我那时真是太聪明了。

我说道：“爸爸，你走吧。”他往车外看了看，说：“我买几个橘子去。你就在此地，不要走动。”我看那边月台的栅栏外有几个卖东西的等着顾客。走到那边月台，须穿过铁道，须跳下去又爬上去。父亲是一个胖子，走过去自然要费事些。我本来要去的，他不肯，只好让他去。我看见他戴着黑布小帽，穿着黑布大马褂⑿，深青布棉袍，蹒跚⒀地走到铁道边，慢慢探身下去，尚不大难。可是他穿过铁道，要爬上那边月台，就不容易了。他用两手攀着上面，两脚再向上缩；他肥胖的身子向左微倾，显出努力的样子。这时我看见他的背影，我的泪很快地流下来了。我赶紧拭干了泪。怕他看见，也怕别人看见。我再向外看时，他已抱了朱红的橘子往回走了。过铁道时，他先将橘子散放在地上，自己慢慢爬下，再抱起橘子走。到这边时，我赶紧去搀他。他和我走到车上，将橘子一股脑儿放在我的皮大衣上。于是扑扑衣上的泥土，心里很轻松似的。过一会儿说：“我走了，到那边来信！”我望着他走出去。他走了几步，回过头看见我，说：“进去吧，里边没人。”等他的背影混入来来往往的人里，再找不着了，我便进来坐下，我的眼泪又来了。

近几年来，父亲和我都是东奔西走，家中光景是一日不如一日。他少年出外谋生，独力支持，做了许多大事。哪知老境却如此颓唐！他触目伤怀，自然情不能自已。情郁于中，自然要发之于外；家庭琐屑便往往触他之怒。他待我渐渐不同往日。但最近两年不见，他终于忘却我的不好，只是惦记着我，惦记着我的儿子。我北来后，他写了一信给我，信中说道：“我身体平安，惟膀子疼痛厉害，举箸⒁提笔，诸多不便，大约大去之期⒂不远矣。”我读到此处，在晶莹的泪光中，又看见那肥胖的、青布棉袍黑布马褂的背影。唉！我不知何时再能与他相见！
`

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
Muya.use(FrontMenu)
Muya.use(TableColumnTools)
Muya.use(QuickInsert)
Muya.use(TableDragBar)
Muya.use(TableTools)
Muya.use(PreviewTools)

const container = document.querySelector('#editor')
const undoBtn = document.querySelector('#undo')
const redoBtn = document.querySelector('#redo')
const searchInput = document.querySelector('#search')
const previousBtn = document.querySelector('#previous')
const nextBtn = document.querySelector('#next')
const replaceInput = document.querySelector('#replace')
const singleBtn = document.querySelector('#single')
const allBtn = document.querySelector('#all')
const setContentBtn = document.querySelector('#set-content')

const imagePathPicker = async () => {
  return 'https://pics.ettoday.net/images/2253/d2253152.jpg'
}

const imageAction = async () => {
  return 'https://pics.ettoday.net/images/2469/d2469498.jpg'
}

const muya = new Muya(container, { markdown: DEFAULT_MARKDOWN, disableHtml: true, imagePathPicker, imageAction })

window.muya = muya

muya.locale(zh)

muya.init()

undoBtn.addEventListener('click', () => {
  muya.undo()
})

redoBtn.addEventListener('click', () => {
  muya.redo()
})

searchInput.addEventListener('input', (event) => {
  const value = event.target.value

  muya.search(value, { isRegexp: true })
})

previousBtn.addEventListener('click', () => {
  muya.find('previous')
})

nextBtn.addEventListener('click', () => {
  muya.find('next')
})

singleBtn.addEventListener('click', () => {
  muya.replace(replaceInput.value, { isSingle: true, isRegexp: true })
})

allBtn.addEventListener('click', () => {
  muya.replace(replaceInput.value, { isSingle: false })
})

const content = [
  {
    name: 'paragraph',
    text: 'foo bar'
  }
]

setContentBtn.addEventListener('click', () => {
  muya.setContent(content, true)
})

muya.on('json-change', (changes) => {
  // console.log(JSON.stringify(muya.getState(), null, 2))
  // console.log(muya.getMarkdown())
  // console.log(JSON.stringify(changes, null, 2))
})

// muya.on('selection-change', changes => {
//   const { anchor, focus, path } = changes
//   console.log(JSON.stringify([anchor.offset, focus.offset, path]))
// })
