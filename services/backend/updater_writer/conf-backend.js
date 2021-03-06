require('dotenv').config()

const { NODE_ENV } = process.env
let DB_URL = process.env.DB_URL
let DB_SCHEMA = process.env.DB_SCHEMA || 'public'
const isTest = NODE_ENV === 'test'
if (isTest) {
  DB_URL = process.env.TEST_DB
  DB_SCHEMA = process.env.TEST_DB_SCHEMA
} else if (NODE_ENV === 'anon') {
  DB_URL = process.env.ANON_DB
}
const frontend_addr = process.env.FRONT_URL
const redis = process.env.REDIS
const TOKEN_SECRET = process.env.TOKEN_SECRET
const CERT_PATH = process.env.CERT_PATH // production/staging only
const KEY_PATH = process.env.KEY_PATH // production/staging only
const USERSERVICE_URL = process.env.USERSERVICE_URL
const ANALYTICS_URL = process.env.ANALYTICS_URL
const PORT = isTest ? 8079 : 8080
const OODI_SECRET = process.env.OODI_SECRET

const FEATURES = {
  ERROR_HANDLER: false
}

const formatURL = url => {
  return !!url && !url.startsWith('http') ? `http://${url}` : url
}

if (process.env.NODE_ENV === 'dev' && process.env.FEATURES) {
  const toggled = process.env.FEATURES.split(',')
  toggled
    .map(toggle => toggle.trim())
    .forEach(feature => {
      if (FEATURES[feature] !== undefined) {
        FEATURES[feature] = true
      }
    })
}

const OODI = {
  test: 'http://localhost',
  anon: process.env.OODI_ADDR_ANON
}

const OODI_ADDR = OODI[process.env.NODE_ENV] || process.env.OODI_ADDR
const ACCESS_TOKEN_HEADER_KEY = 'x-access-token'
const OODI_SECRET_HEADER_KEY = 'x-oodi-secret'

let requiredGroup = ['grp-oodikone-users', 'grp-oodikone-basic-users']
if (process.env.NODE_ENV === 'staging') {
  requiredGroup = ['grp-oodikone-staging-users', 'grp-oodikone-basic-staging-users']
}
if (process.env.NODE_ENV === 'dev' || isTest) {
  requiredGroup = null
}

module.exports = {
  frontend_addr,
  DB_URL,
  redis,
  TOKEN_SECRET,
  DB_SCHEMA,
  OODI_ADDR,
  CERT_PATH,
  KEY_PATH,
  FEATURES,
  USERSERVICE_URL: formatURL(USERSERVICE_URL),
  ACCESS_TOKEN_HEADER_KEY,
  PORT,
  ANALYTICS_URL: formatURL(ANALYTICS_URL),
  requiredGroup,
  OODI_SECRET,
  OODI_SECRET_HEADER_KEY,
  isTest
}
