import execall from 'execall'

export const matchString = (text, value, options) => {
  const { isCaseSensitive, isWholeWord, isRegexp } = options
  /* eslint-disable no-useless-escape */
  const SPECIAL_CHAR_REG = /[\[\]\\^$.\|\?\*\+\(\)\/]{1}/g
  /* eslint-enable no-useless-escape */
  let SEARCH_REG = null
  let regStr = value
  let flag = 'g'

  if (!isCaseSensitive) {
    flag += 'i'
  }

  if (!isRegexp) {
    regStr = value.replace(SPECIAL_CHAR_REG, (p) => {
      return p === '\\' ? '\\\\' : `\\${p}`
    })
  }

  if (isWholeWord) {
    regStr = `\\b${regStr}\\b`
  }

  try {
    // Add try catch expression because not all string can generate a valid RegExp. for example `\`.
    SEARCH_REG = new RegExp(regStr, flag)

    return execall(SEARCH_REG, text)
  } catch (err) {
    return []
  }
}
