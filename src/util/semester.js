const moment = require('moment')

const SPRING = { start: 0, end: 6 }

const isSpring = date => SPRING.start <= date.month() && date.month() <= SPRING.end

const getSemester = date => isSpring(date) ? 'SPRING' : 'FALL'

const getPassingSemester = (startYear, date) => {
  const mDate = moment(date).add(1, 'day')
  const year = mDate.year()
  const semester = getSemester(mDate)
  const yearDiff = year - startYear
  const yearCount = semester === 'SPRING' ? yearDiff - 1 : yearDiff

  if (year < startYear || (semester === 'SPRING' && yearDiff <= 0)) {
    return 'BEFORE'
  }

  return (yearCount < 6) ? `${yearCount}-${semester}` : 'LATER'
}

module.exports = {
  getPassingSemester
}
