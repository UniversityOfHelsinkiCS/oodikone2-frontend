const { CronJob } = require('cron')
const { refreshAssociationsInRedis } = require('./services/studyrights')
const { getAllProgrammes, nonGraduatedStudentsOfElementDetail } = require('./services/studyrights')
const { productivityStatsForStudytrack, throughputStatsForStudytrack } = require('./services/studytrack')
const { calculateFacultyYearlyStats } = require('./services/faculties')
const topteachers = require('./services/topteachers')
const { isNewHYStudyProgramme } = require('./util')

const {
  setProductivity,
  setThroughput,
  patchProductivity,
  patchThroughput,
  patchFacultyYearlyStats,
  patchNonGraduatedStudents
} = require('./services/analyticsService')

const schedule = (cronTime, func) => new CronJob({ cronTime, onTick: func, start: true, timeZone: 'Europe/Helsinki' })

const refreshFacultyYearlyStats = async () => {
  try {
    console.log('Refreshing faculty yearly stats...')
    const data = await calculateFacultyYearlyStats()
    await patchFacultyYearlyStats(data)
  } catch (e) {
    console.error(e)
  }
}

const refreshStudyrightAssociations = async () => {
  try {
    console.log('Refreshing studyright associations...')
    await refreshAssociationsInRedis()
  } catch (e) {
    console.error(e)
  }
}

const refreshOverview = async () => {
  try {
    console.log('Refreshing overview...')
    const codes = (await getAllProgrammes()).map(p => p.code)
    let ready = 0
    for (const code of codes) {
      let programmeStatsSince = new Date('2017-07-31')
      if (code.includes('MH') || code.includes('KH')) {
        programmeStatsSince = new Date('2017-07-31')
      } else {
        programmeStatsSince = new Date('2000-07-31')
      }
      try {
        await patchThroughput({ [code]: { status: 'RECALCULATING' } })
        const data = await throughputStatsForStudytrack(code, programmeStatsSince.getFullYear())
        await setThroughput(data)
      } catch (e) {
        try {
          await patchThroughput({ [code]: { status: 'RECALCULATION ERRORED' } })
        } catch (e) {
          console.error(e)
        }
        console.error(e)
        console.log(`Failed to update throughput stats for code: ${code}, reason: ${e.message}`)
      }
      try {
        await patchProductivity({ [code]: { status: 'RECALCULATING' } })
        const data = await productivityStatsForStudytrack(code, programmeStatsSince)
        await setProductivity(data)
      } catch (e) {
        try {
          await patchProductivity({
            [code]: { status: 'RECALCULATION ERRORED' }
          })
        } catch (e) {
          console.error(e)
        }
        console.error(e)
        console.log(`Failed to update productivity stats for code: ${code}, reason: ${e.message}`)
      }
      ready += 1
      console.log(`RefreshOverview ${ready}/${codes.length} done`)
    }
  } catch (e) {
    console.error(e)
  }
}

const refreshTeacherLeaderboard = async () => {
  try {
    const startyearcode = new Date().getFullYear() - 1950
    const endyearcode = startyearcode + 1
    console.log('Refreshing teacher leaderboard...')
    await topteachers.findAndSaveTeachers(startyearcode, endyearcode)
  } catch (e) {
    console.log(e)
  }
}

const refreshNonGraduatedStudentsOfOldProgrammes = async () => {
  try {
    const oldProgrammeCodes = (await getAllProgrammes()).map(p => p.code).filter(c => !isNewHYStudyProgramme(c))
    let i = 0
    console.log('Refreshing non-graduated students of old programmes...')
    await Promise.all(
      oldProgrammeCodes.map(
        c =>
          new Promise(async res => {
            try {
              const [nonGraduatedStudents, studentnumbers] = await nonGraduatedStudentsOfElementDetail(c)
              await patchNonGraduatedStudents({ [c]: { formattedData: nonGraduatedStudents, studentnumbers } })
              console.log(`${++i}/${oldProgrammeCodes.length}`)
            } catch (e) {
              console.log(`Failed refreshing non-graduated students of programme ${c}!`)
            }
            res()
          })
      )
    )
  } catch (e) {
    console.log(e)
  }
}

const startCron = () => {
  if (process.env.NODE_ENV === 'production') {
    schedule('0 6 * * *', async () => {
      await refreshFacultyYearlyStats()
      await refreshStudyrightAssociations()
      await refreshOverview()
      await refreshTeacherLeaderboard()
      await refreshNonGraduatedStudentsOfOldProgrammes()
    })
  }
}

module.exports = {
  startCron
}
