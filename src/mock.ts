export const DEFAULT_STATE = [
  // {
  //   name: "diagram",
  //   text: "A->B: Does something",
  //   meta: {
  //     lang: "yaml",
  //     type: "sequence",
  //   },
  // },
  // {
  //   name: "diagram",
  //   text: `flowchart TD
  //   A[Hard] -->|Text| B(Round)
  //   B --> C{Decision}
  //   C -->|One| D[Result 1]
  //   C -->|Two| E[Result 2]`,
  //   meta: {
  //     lang: "yaml",
  //     type: "mermaid",
  //   },
  // },
  {
    name: "diagram",
    text: 
`@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response
@enduml`,
    meta: {
      lang: "yaml",
      type: "plantuml",
    },
  },
  // // Indented code blocks and Fenced code blocks
  // {
  //   name: "code-block",
  //   meta: {
  //     type: "indented", // indented or fenced
  //     lang: "javascript", // lang will be empty string if block is indented block. set language will auto change into fenced code block.
  //   },
  //   text: "const foo = `bar`",
  // },
  // {
  //   name: "paragraph",
  //   text: "foo bar",
  // },
  // {
  //   name: "math-block",
  //   text: "a \\ne b",
  //   meta: {
  //     mathStyle: "",
  //   },
  // },
  // {
  //   name: "html-block",
  //   text: "<div>\nfoo bar\n</div>",
  // },
  // // Table
  // {
  //   name: "table",
  //   children: [
  //     {
  //       name: "table.row",
  //       children: [
  //         {
  //           name: "table.cell",
  //           meta: {
  //             align: "right", // none left center right, cells in the same column has the same alignment.
  //           },
  //           text: "foo",
  //         },
  //         {
  //           name: "table.cell",
  //           meta: {
  //             align: "none", // none left center right, cells in the same column has the same alignment.
  //           },
  //           text: "bar",
  //         },
  //       ],
  //     },
  //     {
  //       name: "table.row",
  //       children: [
  //         {
  //           name: "table.cell",
  //           meta: {
  //             align: "right", // none left center right, cells in the same column has the same alignment.
  //           },
  //           text: "zar",
  //         },
  //         {
  //           name: "table.cell",
  //           meta: {
  //             align: "none", // none left center right, cells in the same column has the same alignment.
  //           },
  //           text: "foo bar",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // // Indented code blocks and Fenced code blocks
  // // Order List Blocks
  // {
  //   name: "order-list",
  //   meta: {
  //     start: 0, // 0 ~ 999999999
  //     loose: true, // true or false, true is loose list and false is tight.
  //     delimiter: ".", // . or )
  //   },
  //   children: [
  //     // List Item
  //     {
  //       name: "list-item", // Can contains any type and number of leaf blocks.
  //       children: [
  //         {
  //           name: "paragraph",
  //           text: "foo\nbar",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // // Bullet List Blocks
  // {
  //   name: "bullet-list",
  //   meta: {
  //     marker: "-", // - + *
  //     loose: false, // true or false
  //   },
  //   children: [
  //     // List Item
  //     {
  //       name: "list-item", // Can contains any type and number of leaf blocks.
  //       children: [
  //         {
  //           name: "paragraph",
  //           text: "foo bar1",
  //         },
  //         {
  //           name: "paragraph",
  //           text: "foo bar2",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // // Task List
  // {
  //   name: "task-list",
  //   meta: {
  //     marker: "-", // - + *
  //   },
  //   children: [
  //     {
  //       name: "task-list-item",
  //       meta: {
  //         checked: false, // true or false
  //       },
  //       children: [
  //         {
  //           name: "paragraph",
  //           text: "a",
  //         },
  //       ],
  //     },
  //     {
  //       name: "task-list-item",
  //       meta: {
  //         checked: true, // true or false
  //       },
  //       children: [
  //         {
  //           name: "paragraph",
  //           text: "b",
  //         },
  //       ],
  //     },
  //     {
  //       name: "task-list-item",
  //       meta: {
  //         checked: false, // true or false
  //       },
  //       children: [
  //         {
  //           name: "paragraph",
  //           text: "c",
  //         },
  //       ],
  //     },
  //     {
  //       name: "task-list-item",
  //       meta: {
  //         checked: false, // true or false
  //       },
  //       children: [
  //         {
  //           name: "paragraph",
  //           text: "d",
  //         },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   name: "paragraph",
  //   text: "**bold** *emphasis* :man: <u>underline</u> <mark>highlight</mark> `inline code`~~删除~~ [百度](http://www.baidu.com) http://google.com",
  // },
  // // Thematic breaks
  // {
  //   name: "thematic-break",
  //   text: "---", // --- or ___ or ***
  // },
  // {
  //   name: "atx-heading",
  //   meta: {
  //     level: 1, // 1 ~ 6
  //   },
  //   text: "# foo bar", // can not contain `\n`!
  // },
  // // Setext headings
  // {
  //   name: "setext-heading",
  //   meta: {
  //     level: 1,
  //     underline: "===", // === or ---
  //   },
  //   text: "foo\nbar", // can contain multiple lines.
  // },
  // // Block quotes
  // {
  //   name: "block-quote",
  //   children: [
  //     {
  //       // Can contains any type and number of leaf blocks.
  //       name: "paragraph",
  //       text: "foo\nbar",
  //     },
  //   ],
  // },
  {
    name: "paragraph",
    text: "Image![](https://i.ytimg.com/vi/VpZT0Xkht7I/hqdefault.jpg) bar &gt; *zar* <ruby>北京<rt>Beijing</rt></ruby> foo bar $a \\ne b$ 和自己",
  },
];

export const DEFAULT_MARKDOWN = `
foo bar^hello^~world~

<div>
foo bar
</div>

| foo | bar     |
| ---:| ------- |
| zar | foo bar |

0. foo
   bar

- foo bar1

  foo bar2

- [ ] a
- [x] b
- [ ] c
- [ ] d

**bold** *emphasis* :man: <u>underline</u> <mark>highlight</mark> \`inline code\`~~Delete~~ [Baidu](http://www.baidu.com) http://google.com

---

# foo bar

foo
bar
===

> foo
> bar
`
