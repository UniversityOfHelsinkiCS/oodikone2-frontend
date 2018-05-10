const Sequelize = require('sequelize')
const moment = require('moment')
const { Student, Credit, CourseInstance, Course, CourseTeacher } = require('../models')
const { arrayUnique } = require('../util')
const uuidv4 = require('uuid/v4')
const Op = Sequelize.Op

const byNameOrCode = (searchTerm) => Course.findAll({
  where: {
    [Op.or]: [
      {
        name: {
          [Op.iLike]: searchTerm
        }
      },
      {
        code: {
          [Op.like]: searchTerm
        }
      }
    ]
  }
})

const instanceStatistics = async (code, date) => CourseInstance.findOne({
  include: [
    {
      model: Credit,
      include: [Student]
    }
  ],
  where: {
    [Op.and]: [
      {
        course_code: {
          [Op.eq]: code
        }
      },
      {
        coursedate: {
          [Op.eq]: new Date(date)
        }
      }
    ]
  }
})

const instancesByCode = (code) => CourseInstance.findAll({
  include: [Credit, CourseTeacher],
  where: {
    course_code: {
      [Op.eq]: code
    }
  }
})

const byIds = (ids) => Student.findAll({
  include: [
    {
      model: Credit,
      include: [
        {
          model: CourseInstance,
        }
      ]
    }
  ],
  where: {
    studentnumber: {
      [Op.in]: ids
    }
  }
})

const bySearchTerm = async (term) => {
  const formatCourse = ({ name, code }) => ({ name, code })

  try {
    const result = await byNameOrCode(`%${term}%`)
    return result.map(formatCourse)
  } catch (e) {
    return {
      error: e
    }
  }
}

const statisticsOf = async (code, date, months) => {

  const getStudents = ({ credits }) => {
    const all = credits.map(c => c.student_studentnumber)
    const pass = credits.filter(Credit.passed).map(c => c.student_studentnumber)
    const fail = credits.filter(Credit.failed).map(c => c.student_studentnumber)
    return { all, pass, fail }
  }

  const starYearsOf = (students) => {
    const years = students.map(s => moment(s.dateofuniversityenrollment).year()).sort()
    return years.reduce((map, y) => { map[y] = map[y] ? map[y] + 1 : 1; return map }, {})
  }

  const currentCourse = (credit) => {
    return (credit.courseinstance.course_code !== code &&
      credit.courseinstance.coursedate !== date)
  }

  const studentStatsAfter = (studentsStats, date) => {
    const creditsAfter = (student) => {
      return student.credits
        .filter(Credit.inTimeRange(date, months))
        .filter(Credit.passed)
        .filter(currentCourse)
        .filter(Credit.notUnnecessary)
        .reduce((set, c) => set + c.credits, 0.0)
    }

    const toStudent = (set, student) => {
      set[uuidv4()] = creditsAfter(student, date)
      return set
    }

    return studentsStats.reduce(toStudent, {})
  }

  try {
    const instanceStats = await instanceStatistics(code, date)
    const students = getStudents(instanceStats)
    const studentStats = await byIds(students.all)

    const all = studentStatsAfter(studentStats.filter(s => students.all.includes(s.studentnumber)), date)
    const pass = studentStatsAfter(studentStats.filter(s => students.pass.includes(s.studentnumber)), date)
    const fail = studentStatsAfter(studentStats.filter(s => students.fail.includes(s.studentnumber)), date)
    console.log(all)
    return {
      all, pass, fail,
      startYear: starYearsOf(instanceStats.credits.map(c => c.student))
    }
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }
}

const instancesOf = async (code) => {
  const byDate = (a, b) => {
    return moment(a.coursedate).isSameOrBefore(b.coursedate) ? -1 : 1
  }

  const formatInstance = (instance) => {
    return {
      id: instance.id,
      date: instance.coursedate,
      fail: instance.credits.filter(Credit.failed).length,
      pass: instance.credits.filter(Credit.passed).length,
      students: instance.credits.length,
      teachers: instance.courseteachers.map(t => t.teacher_id).filter(arrayUnique).length
    }
  }

  try {
    const result = await instancesByCode(code)
    return result.sort(byDate).map(formatInstance)
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }
}

const oneYearStats = (instances, year, separate) => {
  const stats = []
  if (separate) {
    const fallInstances = instances.filter(inst => moment(inst.date).isBetween(String(year) + '-08-01', String(year + 1) + '-01-15'))
    const springInstances = instances.filter(inst => moment(inst.date).isBetween(String(year + 1) + '-01-15', String(year + 1) + '-06-01'))

    const passedF = fallInstances.reduce((a, b) => a + b.pass, 0)
    const failedF = fallInstances.reduce((a, b) => a + b.fail, 0)

    const passedS = springInstances.reduce((a, b) => a + b.pass, 0)
    const failedS = springInstances.reduce((a, b) => a + b.fail, 0)

    if (passedF + failedF > 0) stats.push({ passed: passedF, failed: failedF, time: String(year) + ' Fall' })
    if (passedS + failedS > 0) stats.push({ passed: passedS, failed: failedS, time: String(year + 1) + ' Spring' })
  } else {
    const yearInst = instances.filter(inst => moment(inst.date).isBetween(String(year) + '-08-01', String(year + 1) + '-06-01'))
    const passed = yearInst.reduce((a, b) => a + b.pass, 0)
    const failed = yearInst.reduce((a, b) => a + b.fail, 0)
    if (passed + failed > 0) stats.push({ passed, failed, time: String(year) + '-' + String(year + 1) })
  }
  return stats
}

const yearlyStatsOf = async (code, year, separate) => {
  const allInstances = await instancesOf(code)
  const yearInst = allInstances.filter(inst => moment(inst.date).isBetween(year.start + '-08-01', year.end + '-06-01'))
  const start = Number(year.start)
  const end = Number(year.end)
  const results = []
  let stats
  if (yearInst) {
    for (let year = start; year < end; year++) {
      stats = oneYearStats(yearInst, year, separate)
      if (stats.length > 0) results.push(...stats)
    }
    return { code, stats: results }
  }
  return
}

const courseInstanceByCodeAndDate = (code, date) => {
  return CourseInstance.findOne({
    where: {
      [Op.and]: [
        {
          course_code: {
            [Op.eq]: code
          }
        },
        {
          coursedate: {
            [Op.eq]: new Date(date)
          }
        }
      ]
    }
  })
}

const createCourse = async (code, name) => Course.create({
  code: code,
  name: name
})

const createCourseInstance = async (creditDate, course) => {
  const maxId = await CourseInstance.max('id')
  const id = parseInt(maxId) + 1
  return CourseInstance.create({
    id: id,
    coursedate: creditDate,
    course_code: course.code
  })
}

module.exports = {
  bySearchTerm, instancesOf, statisticsOf, createCourse, createCourseInstance, courseInstanceByCodeAndDate, yearlyStatsOf
}