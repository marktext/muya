import en from '../locales/en'

class I18n {
  constructor (muya, object) {
    const { name, resource } = object || en
    this.muya = muya
    this.lang = name
    this.resources = {
      [name]: resource
    }
  }

  t (key) {
    const { lang, resources } = this

    return resources?.[lang]?.[key] || resources.en[key] || key
  }

  locale (object) {
    const { name, resource } = object
    this.lang = name
    this.resources = {
      ...this.resources,
      [name]: resource
    }
  }
}

export default I18n
