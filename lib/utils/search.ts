import execAll from 'execall'

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

    return execAll(SEARCH_REG, text)
  } catch (err) {
    return []
  }
}

export const buildRegexValue = (match, value) => {
  const groups = value.match(/(?<!\\)\$\d/g)

  if (Array.isArray(groups) && groups.length) {
    for (const group of groups) {
      const index = parseInt(group.replace(/^\$/, ''))
      if (index === 0) {
        value = value.replace(group, match.match)
      } else if (index > 0 && index <= match.subMatches.length) {
        value = value.replace(group, match.subMatches[index - 1])
      }
    }
  }

  return value
}
