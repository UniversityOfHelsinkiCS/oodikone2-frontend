import {
  chart1,
  chart2,
  chart3,
  chart4,
  chart5,
  chart6,
  chart7,
  chart8,
  chart9,
  chart10,
  chart11,
  chart12,
  chart13,
  chart14,
  chart15,
  chart16,
  chart17,
  chart18,
  chart19,
  chart20,
  chart21,
  chart22,
  chart23,
  chart24,
  chart25,
  chart26,
  chart27,
  chart28,
  chart29,
  chart30,
  chart31,
  chart32,
  chart33,
  chart34,
  chart35

} from '../styles/variables'

export const routes = {
  index: { route: '/' },
  populations: { route: '/populations', translateId: 'populations' },
  students: { route: '/students/:studentNumber?', translateId: 'students' },
  courseStatistics: { route: '/coursestatistics', translateId: 'courseStatistics' },
  teachers: { route: '/teachers/:teacherid?', translateId: 'teachers' },
  users: { route: '/users/:userid?', translateId: 'users', admin: true },
  settings: { route: '/settings', translateId: 'settings', admin: true },
  usage: { route: '/usage', translateId: 'usage', admin: true }
}

const assumeBasename = () => {
  const POSSIBLE_BASENAMES = ['staging', 'testing']
  const haystack = window.location.pathname.split('/')
  const needle = haystack.find(path => POSSIBLE_BASENAMES.includes(path))
  return needle ? `/${needle}/` : '/'
}

export const BASE_PATH = assumeBasename()

export const API_BASE_PATH = `${assumeBasename()}api`

export const AVAILABLE_LANGUAGES = ['en']
export const DEFAULT_LANG = 'en'

export const DISPLAY_DATE_FORMAT = 'DD.MM.YYYY'
export const API_DATE_FORMAT = 'YYYY.MM.DD'

export const TOKEN_NAME = window.location.pathname.includes('/staging') ? 'staging_token' : window.location.pathname.includes('/testing') ? 'testing_token' : 'token' //eslint-disable-line

export const CHART_COLORS = [
  chart1,
  chart2,
  chart3,
  chart4,
  chart5,
  chart6,
  chart7,
  chart8,
  chart9,
  chart10,
  chart11,
  chart12,
  chart13,
  chart14,
  chart15,
  chart16,
  chart17,
  chart18,
  chart19,
  chart20,
  chart21,
  chart22,
  chart23,
  chart24,
  chart25,
  chart26,
  chart27,
  chart28,
  chart29,
  chart30,
  chart31,
  chart32,
  chart33,
  chart34,
  chart35
]
