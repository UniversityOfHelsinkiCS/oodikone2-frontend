const CATEGORY = {
  FAIL_FIRST: 'failedFirst',
  PASS_FIRST: 'passedFirst',
  FAIL_RETRY: 'failedRetry',
  PASS_RETRY: 'passedRetry'
}

class CourseYearlyStatsCounter {
  constructor() {
    this.groups = {}
    this.programmes = {}
    this.facultyStats = {}
    this.history = {
      passed: new Set(),
      failed: new Set(),
      attempts: new Set()
    }
  }

  initProgramme(code, name) {
    this.programmes[code] = { name, students: {}, passed: {}, credits: {} }
  }

  initFacultyYear(code) {
    const year = `${1949 + Number(code)}-${1950 + Number(code)}`
    this.facultyStats[code] = { year, allStudents: [], allPassed: [], faculties: {}, allCredits: 0 }
  }

  initFaculty(yearcode, faculty_code, organization) {
    this.facultyStats[yearcode].faculties[faculty_code] = {
      name: organization.name,
      students: [],
      passed: [],
      credits: 0
    }
  }

  initGroup(groupcode, name, coursecode, yearcode) {
    this.groups[groupcode] = {
      code: groupcode,
      name,
      coursecode,
      attempts: {
        grades: {},
        classes: {
          passed: [],
          failed: []
        }
      },
      students: {},
      yearcode
    }
  }

  studentHistory(studentnumber) {
    const attempted = this.history.attempts.has(studentnumber)
    const passed = this.history.passed.has(studentnumber)
    const failed = this.history.failed.has(studentnumber)
    return { attempted, passed, failed }
  }

  markStudyProgramme(code, name, studentnumber, yearcode, passed, credit, faculty_code, organization) {
    if (!this.programmes[code]) {
      this.initProgramme(code, name)
    }
    if (!this.facultyStats[yearcode]) {
      this.initFacultyYear(yearcode)
    }

    if (faculty_code && !this.facultyStats[yearcode].faculties[faculty_code]) {
      this.initFaculty(yearcode, faculty_code, organization)
    }

    this.programmes[code].students[yearcode] = this.programmes[code].students[yearcode] || []
    this.programmes[code].students[yearcode].push(studentnumber)

    if (!this.programmes[code].passed[yearcode]) {
      this.programmes[code].passed[yearcode] = []
      this.programmes[code].credits[yearcode] = 0
    }

    if (faculty_code && !this.facultyStats[yearcode].allStudents.includes(studentnumber)) {
      this.facultyStats[yearcode].allStudents.push(studentnumber)
      this.facultyStats[yearcode].faculties[faculty_code].students.push(studentnumber)
    }
    if (passed && !this.programmes[code].passed[yearcode].includes(studentnumber)) {
      this.programmes[code].passed[yearcode].push(studentnumber)
      this.programmes[code].credits[yearcode] += credit
    }

    if (faculty_code && passed && !this.facultyStats[yearcode].allPassed.includes(studentnumber)) {
      this.facultyStats[yearcode].allPassed.push(studentnumber)
      this.facultyStats[yearcode].faculties[faculty_code].passed.push(studentnumber)
      this.facultyStats[yearcode].faculties[faculty_code].credits += credit
      this.facultyStats[yearcode].allCredits += credit
    }
  }

  markStudyProgrammes(studentnumber, programmes, yearcode, passed, credit) {
    programmes.forEach(({ code, name, faculty_code, organization }) => {
      this.markStudyProgramme(code, name, studentnumber, yearcode, passed, credit, faculty_code, organization)
    })
  }

  markCreditToHistory(studentnumber, passed) {
    const passedBefore = this.history.passed.has(studentnumber)
    if (!passedBefore) {
      this.history.attempts.add(studentnumber)
      if (passed) {
        this.history.passed.add(studentnumber)
        this.history.failed.delete(studentnumber)
      } else {
        this.history.failed.add(studentnumber)
      }
    }
  }

  getCreditCategory(studentnumber, passed, attempted) {
    if (!attempted) {
      return passed ? CATEGORY.PASS_FIRST : CATEGORY.FAIL_FIRST
    } else {
      return passed ? CATEGORY.PASS_RETRY : CATEGORY.FAIL_RETRY
    }
  }

  markCreditToStudents(studentnumber, passed, grade, groupcode) {
    const { students } = this.groups[groupcode]
    const { attempted } = this.studentHistory(studentnumber)
    const category = this.getCreditCategory(studentnumber, passed, attempted)
    const student = students[studentnumber]
    if (!student || passed || student.failed) {
      students[studentnumber] = { passed, category, grade }
    }
  }

  markCreditToGroup(studentnumber, passed, grade, groupcode, groupname, coursecode, yearcode) {
    if (!this.groups[groupcode]) {
      this.initGroup(groupcode, groupname, coursecode, yearcode)
    }
    this.markCreditToStudents(studentnumber, passed, grade, groupcode)
    this.markCreditToAttempts(studentnumber, passed, grade, groupcode)
    this.markCreditToHistory(studentnumber, passed)
  }

  markCreditToAttempts(studentnumber, passed, grade, groupcode) {
    const { attempts } = this.groups[groupcode]
    const { grades, classes } = attempts
    if (!grades[grade]) {
      grades[grade] = []
    }
    grades[grade].push(studentnumber)
    if (passed) {
      classes.passed.push(studentnumber)
    } else {
      classes.failed.push(studentnumber)
    }
  }

  formatStudentStatistics(students) {
    const grades = {}
    const classes = {}
    const studentnumbers = new Set()
    Object.entries(students).forEach(([studentnumber, stat]) => {
      const { grade, category } = stat
      grades[grade] = grades[grade] ? grades[grade].concat(studentnumber) : [studentnumber]
      classes[category] = classes[category] ? classes[category].concat(studentnumber) : [studentnumber]
      studentnumbers.add(studentnumber)
    })
    return { grades, classes, studentnumbers: [...studentnumbers] }
  }

  formatGroupStatistics() {
    return Object.values(this.groups).map(({ students, ...rest }) => ({
      ...rest,
      students: this.formatStudentStatistics(students)
    }))
  }

  getFinalStatistics() {
    return {
      programmes: this.programmes,
      statistics: this.formatGroupStatistics(),
      facultyStats: this.facultyStats
    }
  }
}

module.exports = { CourseYearlyStatsCounter, CATEGORY }