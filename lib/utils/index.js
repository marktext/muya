export const isLengthEven = (str = '') => str.length % 2 === 0

export const snakeToCamel = name => name.replace(/_([a-z])/g, (p0, p1) => p1.toUpperCase())

export const union = ({ start: tStart, end: tEnd }, { start: lStart, end: lEnd, active }) => {
  if (!(tEnd <= lStart || lEnd <= tStart)) {
    if (lStart < tStart) {
      return {
        start: tStart,
        end: tEnd < lEnd ? tEnd : lEnd,
        active
      }
    } else {
      return {
        start: lStart,
        end: tEnd < lEnd ? tEnd : lEnd,
        active
      }
    }
  }
  return null
}

// mixins
export const mixins = (constructor, ...object) => {
  return Object.assign(constructor.prototype, ...object)
}