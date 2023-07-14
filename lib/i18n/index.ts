import en from "../locales/en";
import Muya from "@/index";

class I18n {
  public muya: Muya;
  public lang: string;
  public resources: {
    [propName: string]: {
      [propName: string]: string;
    };
  };

  constructor(muya, object) {
    const { name, resource } = object || en;
    this.muya = muya;
    this.lang = name;
    this.resources = {
      [name]: resource,
    };
  }

  t(key) {
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
