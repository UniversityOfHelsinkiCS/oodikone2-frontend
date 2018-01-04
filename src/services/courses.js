const Sequelize = require('sequelize')
const moment = require('moment')
const { Student, Credit, CourseInstance, Course, CourseTeacher } = require('../models')
const { arrayUnique } = require('../util')
const Op = Sequelize.Op

const byNameOrCode = (searchTerm) => {
  return Course.findAll({
    limit: 10,
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
}

const instanceStatistics = (code, date) => {
  return CourseInstance.findOne({
    include: [ 
      { 
        model: Credit,
        include: [ Student ] 
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
}

const instancesByCode = (code) => {
  return CourseInstance.findAll({
    include: [ Credit, CourseTeacher ],
    where: {
      course_code: {
        [Op.eq]: code
      } 
    }
  })
}

const byIds = (ids) => {
  return Student.findAll({
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
}

async function bySearchTerm(term) {
  const formatCourse = ({name, code}) => ({name, code})
  
  try {
    const result = await byNameOrCode(`%${term}%`)
    return result.map(formatCourse)
  } catch (e) {
    return {
      error: e
    }
  } 
}

async function statisticsOf(code, date, months) {

  const getStudents = ({credits}) => {
    const all = credits.map(c=>c.student_studentnumber)
    const pass = credits.filter(Credit.passed).map(c=>c.student_studentnumber)
    const fail = credits.filter(Credit.failed).map(c=>c.student_studentnumber)
    return {all, pass, fail}  
  }

  const starYearsOf = (students) => {
    const years = students.map(s=> moment(s.dateofuniversityenrollment).year()).sort()
    return years.reduce((map, y) => { map[y] = map[y] ? map[y]+1 : 1; return map}, {})
  }

  const studentStatsAfter = (studentsStats, date) => {      

    const creditsAfter = (student) => {
      return student.credits
        .filter(Credit.inTimeRange(date, months))
        .filter(Credit.passed)
        .filter(Credit.notUnnecessary)
        .reduce((set, c) => set+c.credits, 0.0)
    }

    const toStudent = (set, student) => {
      set[student.studentnumber] = creditsAfter(student, date)
      return set
    }    

    return studentsStats.reduce(toStudent, {})
  }

  try {
    const instanceStats = await instanceStatistics(code, date)
    const students = getStudents(instanceStats)
    const studentStats = await byIds(students.all) 

    const all = studentStatsAfter(studentStats.filter(s=>students.all.includes(s.studentnumber)), date)
    const pass = studentStatsAfter(studentStats.filter(s=>students.pass.includes(s.studentnumber)), date)
    const fail = studentStatsAfter(studentStats.filter(s=>students.fail.includes(s.studentnumber)), date)    
    return {
      all, pass, fail,
      startYear: starYearsOf(instanceStats.credits.map(c=>c.student))
    }
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  } 
}

async function instancesOf(code) {
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
      teachers: instance.courseteachers.map(t=>t.teacher_id).filter(arrayUnique).length
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

module.exports = {
  bySearchTerm, instancesOf, statisticsOf
}