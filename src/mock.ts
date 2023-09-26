export const DEFAULT_STATE = [
  {
    name: "frontmatter",
    text: "title: muya",
    meta: {
      lang: "yaml", // yaml | toml | json
      style: "-", // `-` for yaml | `+` for toml | `;;;` and `{}` for json
    },
  },
  {
    name: "atx-heading",
    meta: {
      level: 1, // 1 ~ 6
    },
    text: "# Inline Format", // can not contain `\n`!
  },
  {
    name: "paragraph",
    text: "**strong** *emphasis* `inline code` &gt; <u>underline</u> <mark>highlight</mark> <ruby>北京<rt>Beijing</rt></ruby> [Baidu](http://www.baidu.com) H0~2~ X^5^",
  },
  // Setext headings
  {
    name: "setext-heading",
    meta: {
      level: 1,
      underline: "===", // === or ---
    },
    text: "GitHub and Extra\nInline format", // can contain multiple lines.
  },
  {
    name: "paragraph",
    text: ":man:  ~~del~~ http://google.com $a \\ne b$",
  },
  {
    name: "atx-heading",
    meta: {
      level: 1, // 1 ~ 6
    },
    text: "# Line Break", // can not contain `\n`!
  },
  {
    name: "paragraph",
    text: `soft line break
hard line break  
line end`,
  },
  {
    name: "diagram",
    text: "A->B: Does something",
    meta: {
      lang: "yaml",
      type: "sequence",
    },
  },
  {
    name: "diagram",
    text: `flowchart TD
    A[Hard] -->|Text| B(Round)
    B --> C{Decision}
    C -->|One| D[Result 1]
    C -->|Two| E[Result 2]`,
    meta: {
      lang: "yaml",
      type: "mermaid",
    },
  },
  {
    name: "diagram",
    text: `@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response
@enduml`,
    meta: {
      lang: "yaml",
      type: "plantuml",
    },
  },
  // Indented code blocks and Fenced code blocks
  {
    name: "code-block",
    meta: {
      type: "indented", // indented or fenced
      lang: "javascript", // lang will be empty string if block is indented block. set language will auto change into fenced code block.
    },
    text: "const foo = `bar`",
  },
  {
    name: "math-block",
    text: "a \\ne b",
    meta: {
      mathStyle: "",
    },
  },
  {
    name: "html-block",
    text: "<div>\nfoo bar\n</div>",
  },
  // Table
  {
    name: "table",
    children: [
      {
        name: "table.row",
        children: [
          {
            name: "table.cell",
            meta: {
              align: "right", // none left center right, cells in the same column has the same alignment.
            },
            text: "foo",
          },
          {
            name: "table.cell",
            meta: {
              align: "none", // none left center right, cells in the same column has the same alignment.
            },
            text: "bar",
          },
        ],
      },
      {
        name: "table.row",
        children: [
          {
            name: "table.cell",
            meta: {
              align: "right", // none left center right, cells in the same column has the same alignment.
            },
            text: "zar",
          },
          {
            name: "table.cell",
            meta: {
              align: "none", // none left center right, cells in the same column has the same alignment.
            },
            text: "foo bar",
          },
        ],
      },
    ],
  },
  // Indented code blocks and Fenced code blocks
  // Order List Blocks
  {
    name: "order-list",
    meta: {
      start: 0, // 0 ~ 999999999
      loose: true, // true or false, true is loose list and false is tight.
      delimiter: ".", // . or )
    },
    children: [
      // List Item
      {
        name: "list-item", // Can contains any type and number of leaf blocks.
        children: [
          {
            name: "paragraph",
            text: "foo\nbar",
          },
        ],
      },
    ],
  },
  // Bullet List Blocks
  {
    name: "bullet-list",
    meta: {
      marker: "-", // - + *
      loose: false, // true or false
    },
    children: [
      // List Item
      {
        name: "list-item", // Can contains any type and number of leaf blocks.
        children: [
          {
            name: "paragraph",
            text: "foo bar1",
          },
          {
            name: "paragraph",
            text: "foo bar2",
          },
        ],
      },
    ],
  },
  // Task List
  {
    name: "task-list",
    meta: {
      marker: "-", // - + *
    },
    children: [
      {
        name: "task-list-item",
        meta: {
          checked: false, // true or false
        },
        children: [
          {
            name: "paragraph",
            text: "a",
          },
        ],
      },
      {
        name: "task-list-item",
        meta: {
          checked: true, // true or false
        },
        children: [
          {
            name: "paragraph",
            text: "b",
          },
        ],
      },
      {
        name: "task-list-item",
        meta: {
          checked: false, // true or false
        },
        children: [
          {
            name: "paragraph",
            text: "c",
          },
        ],
      },
      {
        name: "task-list-item",
        meta: {
          checked: false, // true or false
        },
        children: [
          {
            name: "paragraph",
            text: "d",
          },
        ],
      },
    ],
  },
  // Thematic breaks
  {
    name: "thematic-break",
    text: "---", // --- or ___ or ***
  },
  // Block quotes
  {
    name: "block-quote",
    children: [
      {
        // Can contains any type and number of leaf blocks.
        name: "paragraph",
        text: "foo\nbar",
      },
    ],
  },
  {
    name: "paragraph",
    text: "![](https://jingan2.guankou.net/haopic/jj20/389023/010323033238341796.jpg)",
  },
];

export const DEFAULT_MARKDOWN = `---
title: muya
author: jocs
---

# Inline Format

**strong** *emphasis* \`inline code\` &gt; <u>underline</u> <mark>highlight</mark> <ruby>北京<rt>Beijing</rt></ruby> [Baidu](http://www.baidu.com) H0~2~ X^5^

GitHub and Extra
Inline format
===

:man:  ~~del~~ http://google.com $a \\ne b$

# Line Break

soft line break
hard line break  
line end

    const a = "nice"
    function add(){}

\`\`\`
const b = "foo"
\`\`\`

\`\`\`math
a \\ne b
\`\`\`

\`\`\`sequence
A->B: Does something
\`\`\`

\`\`\`mermaid
flowchart TD
    A[Hard] -->|Text| B(Round)
    B --> C{Decision}
    C -->|One| D[Result 1]
    C -->|Two| E[Result 2]
\`\`\`

\`\`\`plantuml
@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response
@enduml
\`\`\`

\`\`\`javascript
const foo = \`bar\`
\`\`\`

$$
a \\ne b
$$

<div>
foo bar
</div>

| foo | bar     |
| ---:| ------- |
| zar | foo\\|bar |

0. foo
   bar
- foo bar1
  
  foo bar2

- [ ] a
- [x] b
- [ ] c
- [ ] d

---

> foo
> bar

![](https://jingan2.guankou.net/haopic/jj20/389023/010323033238341796.jpg)IMAGE`;

