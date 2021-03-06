const router = require('express').Router()
const crypto = require('crypto')
const Course = require('../servicesV2/courses')
const { validateParamLength } = require('../util')
const logger = require('../util/logger')

/* router.get('/courses', async (req, res) => {
  let results = []
  if (req.query.name) {
    results = await Course.bySearchTerm(req.query.name, req.query.language)
  }

  res.json(results)
}) */

/* router.get('/coursesmulti', async (req, res) => {
  let results = []
  if (req.query.name || req.query.discipline || req.query.type) {
    results = await Course.bySearchTermTypeAndDiscipline(
      req.query.name,
      req.query.type,
      req.query.discipline,
      req.query.language
    ) // eslint-disable-line
  }
  res.json(results)
}) */

router.get('/v2/coursesmulti', async (req, res) => {
  let results = { courses: [], groups: {}, groupMeta: {} }
  const { name, code } = req.query

  if (!(validateParamLength(name, 5) || validateParamLength(code, 2))) {
    return res.status(400).json({ error: 'name or code invalid' })
  }

  results = await Course.byNameAndOrCodeLike(name, code)
  res.json(results)
})

/* router.get('/coursetypes', async (req, res) => {
  const coursetypes = await Course.getAllCourseTypes()
  res.json(coursetypes)
}) */

/* router.get('/coursedisciplines', async (req, res) => {
  const courseDisciplines = await Course.getAllDisciplines()
  res.json(courseDisciplines)
}) */

router.get('/v3/courseyearlystats', async (req, res) => {
  try {
    const { rights, roles } = req

    const allowedRoles = roles && ['admin', 'courseStatistics'].find(role => roles.includes(role))

    // If user has rights to see at least one programme, then they are allowed
    // to see all of them
    if (!allowedRoles && rights.length < 1) {
      return res.status(403).json({ error: 'No programmes so no access to course stats' })
    }

    const { codes, separate: sep, unifyOpenUniCourses: unify } = req.query

    const separate = !sep ? false : JSON.parse(sep)
    const unifyOpenUniCourses = !unify ? false : JSON.parse(unify)
    if (!codes) {
      res.status(422).send('Missing required query parameters')
    } else {
      // Studentnumbers should be obfuscated to all other users except admins
      // and users with rights to any specific study programmes
      const anonymize = allowedRoles !== 'admin' && rights.length < 1
      const anonymizationSalt = anonymize ? crypto.randomBytes(12).toString('hex') : null
      const results = await Course.courseYearlyStats(codes, separate, unifyOpenUniCourses, anonymizationSalt)
      res.json(results)
    }
  } catch (e) {
    logger.error(e.message)
    console.log(e)
    res.status(500).send('Something went wrong with handling the request.')
  }
})

/* router.get('/courses/duplicatecodes/:programme', async (req, res) => {
  // const { programme } = req.params
  const results = await Course.getMainCourseToCourseMap()
  return res.json(results)
}) */

/* router.post('/courses/duplicatecodes/:code1/:code2', async (req, res) => {
  const { code1, code2 } = req.params
  await Course.setDuplicateCode(code1, code2)
  const results = await Course.getMainCourseToCourseMap()
  res.status(200).json(results)
}) */

/* router.delete('/courses/duplicatecodes/:code', async (req, res) => {
  const { code } = req.params
  await Course.deleteDuplicateCode(code)
  const results = await Course.getMainCourseToCourseMap()
  res.status(200).json(results)
}) */

router.use('*', (req, res, next) => next())

module.exports = router
