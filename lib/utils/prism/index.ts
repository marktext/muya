import Prism from "prismjs";
import Fuse from "fuse.js";
import initLoadLanguage, {
  loadedLanguages,
  transfromAliasToOrigin,
} from "./loadLanguage";
import { languages } from "prismjs/components.js";

const prism = Prism;
window.Prism = Prism;
/* eslint-disable */
import("prismjs/plugins/keep-markup/prism-keep-markup");
/* eslint-enable */

const langs = [];

for (const name of Object.keys(languages)) {
  const lang = languages[name];
  langs.push({
    name,
    ...lang,
  });
  if (lang.alias) {
    if (typeof lang.alias === "string") {
      langs.push({
        name: lang.alias,
        ...lang,
      });
    } else if (Array.isArray(lang.alias)) {
      langs.push(
        ...lang.alias.map((a) => ({
          name: a,
          ...lang,
        }))
      );
    }
  }
}

const loadLanguage = initLoadLanguage(Prism);

const search = (text) => {
  if (!text || typeof text !== "string") {
    return [];
  }

  const fuse = new Fuse(langs, {
    includeScore: true,
    keys: ["name", "title", "alias"],
  });

  return fuse.search(text).map((i) => i.item);
};

// pre load latex and yaml and html for `math block` \ `front matter` and `html block`
loadLanguage("latex");
loadLanguage("yaml");

export { search, loadLanguage, loadedLanguages, transfromAliasToOrigin };

export default prism;
