const router = require('express').Router()
const Student = require('../services/students')
const userService = require('../services/userService')
const Unit = require('../services/units')
const studentsV2 = require('../routesV2/students')
const useSisRouter = require('../util/useSisRouter')

const filterStudentTags = (student, userId) => {
  return {
    ...student,
    tags: student.tags.filter(({ tag }) => !tag.personal_user_id || tag.personal_user_id === userId)
  }
}

router.get('/students', async (req, res) => {
  const {
    roles,
    decodedToken: { userId },
    query: { searchTerm }
  } = req

  const trimmedSearchTerm = searchTerm ? searchTerm.trim() : undefined

  if (
    trimmedSearchTerm &&
    !Student.splitByEmptySpace(trimmedSearchTerm)
      .slice(0, 2)
      .find(t => t.length > 3)
  ) {
    return res.status(400).json({ error: 'at least one search term must be longer than 3 characters' })
  }

  if (roles && roles.includes('admin')) {
    let results = []
    if (trimmedSearchTerm) {
      results = await Student.bySearchTerm(trimmedSearchTerm)
    }
    return res
      .status(200)
      .json(results)
      .end()
  } else {
    const unitsUserCanAccess = await userService.getUnitsFromElementDetails(userId)
    const codes = unitsUserCanAccess.map(unit => unit.id)
    const matchingStudents = await Student.bySearchTermAndElements(trimmedSearchTerm, codes)
    res.json(matchingStudents)
  }
})

router.get('/students/:id', async (req, res) => {
  const { id: studentId } = req.params
  const { roles, decodedToken } = req

  if (roles && roles.includes('admin')) {
    const results = await Student.withId(studentId)
    return results.error
      ? res
          .status(400)
          .json({ error: 'error finding student' })
          .end()
      : res
          .status(200)
          .json(filterStudentTags(results, decodedToken.id))
          .end()
  }

  const uid = req.decodedToken.userId
  const student = await Student.withId(studentId)
  if (student.error) {
    return res
      .status(400)
      .json({ error: 'error finding student' })
      .end()
  }
  const units = await userService.getUnitsFromElementDetails(uid)

  const rights = await Promise.all(
    units.map(async unit => {
      const jtn = await Unit.hasStudent(unit.id, student.studentNumber)
      return jtn
    })
  )

  if (rights.some(right => right !== null)) {
    res
      .status(200)
      .json(filterStudentTags(student, decodedToken.id))
      .end()
  } else {
    res
      .status(400)
      .json({ error: 'error finding student' })
      .end()
  }
})

module.exports = useSisRouter(studentsV2, router)
