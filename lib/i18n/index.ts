// @ts-nocheck
import en from "../locales/en";
import Muya from "@muya/index";

class I18n {
  public lang: string;
  public resources: {
    [key: string]: {
      [key: string]: string;
    };
  };

  constructor(public muya: Muya, object) {
    const { name, resource } = object || en;
    this.lang = name;
    this.resources = {
      [name]: resource,
    };
  }

  t(key: string): string {
    const { lang, resources } = this;

    return resources?.[lang]?.[key] || resources.en[key] || key;
  }

  locale(object) {
    const { name, resource } = object;
    this.lang = name;
    this.resources = {
      ...this.resources,
      [name]: resource,
    };
  }
}

export default I18n;
