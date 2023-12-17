import en from '../locales/en';
import Muya from '@muya/index';

import type { Locale } from './types';

class I18n {
  public lang: string;
  public resources: Record<string, Locale['resource']>;

  constructor(public muya: Muya, object: Locale) {
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

  locale(object: Locale) {
    const { name, resource } = object;
    this.lang = name;
    this.resources = {
      ...this.resources,
      [name]: resource,
    };
  }
}

export default I18n;
