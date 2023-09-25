// import diff from 'fast-diff'
import Parent from "@muya/block/base/parent";
import ScrollPage from "@muya/block/scrollPage";
// import { diffToTextOp } from '@muya/utils'
import { loadLanguage } from "@muya/utils/prism";
// import { operateClassName } from '@muya/utils/dom'
import logger from "@muya/utils/logger";
import { IFrontmatterMeta, IFrontmatterState } from "../../../state/types";

const debug = logger("frontmatter:");

class Frontmatter extends Parent {
  public meta: IFrontmatterMeta;

  static blockName = "frontmatter";

  static create(muya, state) {
    const frontmatter = new Frontmatter(muya, state);
    const { lang } = state.meta;
    const code = ScrollPage.loadBlock("code").create(muya, state);

    frontmatter.append(code);

    if (lang) {
      frontmatter.lang = lang;
    }

    return frontmatter;
  }

  get lang() {
    return this.meta.lang;
  }

  set lang(value) {
    this.meta.lang = value;

    // TODO update json state
    // if (this.meta.type !== 'fenced') {
    //   this.meta.type = 'fenced'
    //   // dispatch change to modify json state
    //   const diffs = diff('indented', 'fenced')
    //   const { path } = this
    //   path.push('meta', 'type')
    //   this.jsonState.pushOperation('editOp', path, 'text-unicode', diffToTextOp(diffs))
    //   operateClassName(this.domNode, 'remove', 'mu-indented-code')
    //   operateClassName(this.domNode, 'add', 'mu-fenced-code')
    // }

    !!value &&
      loadLanguage(value)
        .then((infoList) => {
          if (!Array.isArray(infoList)) return;
          // There are three status `loaded`, `noexist` and `cached`.
          // if the status is `loaded`, indicated that it's a new loaded language
          const needRender = infoList.some(
            ({ status }) => status === "loaded" || status === "cached"
          );
          if (needRender) {
            this.lastContentInDescendant().update();
          }
        })
        .catch((err) => {
          // if no parameter provided, will cause error.
          debug.warn(err);
        });
  }

  get path() {
    const { path: pPath } = this.parent;
    const offset = this.parent.offset(this);

    return [...pPath, offset];
  }

  constructor(muya, { meta }) {
    super(muya);
    this.tagName = "pre";
    this.meta = meta;
    this.classList = ["mu-frontmatter"];
    this.createDomNode();
  }

  queryBlock(path) {
    if (path.length === 0) {
      return this;
    } else {
      if (path[0] === "meta" || path[0] === "type") {
        return this;
      } else if (path[0] === "lang") {
        // TODO is there right?
        return this.firstContentInDescendant();
      } else {
        return this.lastContentInDescendant();
      }
    }
  }

  getState(): IFrontmatterState {
    const state: IFrontmatterState = {
      name: "frontmatter",
      meta: { ...this.meta },
      text: this.lastContentInDescendant().text,
    };

    return state;
  }
}

export default Frontmatter;
