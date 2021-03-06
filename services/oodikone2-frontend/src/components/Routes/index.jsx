import React, { Suspense } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'
import { Loader } from 'semantic-ui-react'

// From https://dev.to/goenning/how-to-retry-when-react-lazy-fails-mb5
const retry = async (fn, retriesLeft = 3, interval = 500) =>
  new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch(error => {
        if (retriesLeft <= 1) {
          if (error && error.message && error.message.match(/loading.+chunk.+failed/gi)) {
            // We probably made a release which deletes old js and css
            // lazy load thus fails and user must reload page
            resolve(null)
            window.location.reload()
          } else {
            reject(error)
          }
          return
        }
        setTimeout(() => {
          retry(fn, retriesLeft - 1, interval).then(resolve, reject)
        }, interval)
      })
  })

const FrontPage = React.lazy(() => retry(() => import('../FrontPage')))
const Populations = React.lazy(() => retry(() => import('../PopulationStatistics')))
const StudentStatistics = React.lazy(() => retry(() => import('../StudentStatistics')))
const CourseStatistics = React.lazy(() => retry(() => import('../CourseStatistics')))
const EnableUsers = React.lazy(() => retry(() => import('../EnableUsers')))
const StudyProgramme = React.lazy(() => retry(() => import('../StudyProgramme')))
const Teachers = React.lazy(() => retry(() => import('../Teachers')))
const Sandbox = React.lazy(() => retry(() => import('../Sandbox')))
const Feedback = React.lazy(() => retry(() => import('../Feedback')))
const Faculty = React.lazy(() => retry(() => import('../Faculty')))
const CoursePopulation = React.lazy(() => retry(() => import('../CoursePopulation')))
const CustomPopulation = React.lazy(() => retry(() => import('../CustomPopulation')))
const Updater = React.lazy(() => retry(() => import('../Updater')))
const Trends = React.lazy(() => retry(() => import('../Trends')))

const routes = {
  students: '/students/:studentNumber?',
  courseStatistics: '/coursestatistics',
  teachers: '/teachers/:teacherid?',
  users: '/users/:userid?',
  faculty: '/faculties/:facultyid?',
  sandbox: '/sandbox',
  feedback: '/feedback',
  coursepopulation: '/coursepopulation',
  custompopulation: '/custompopulation',
  updater: '/updater',
  trends: '/trends'
}

const Routes = () => (
  <Suspense fallback={<Loader active inline="centered" />}>
    <Switch>
      <Route exact path="/" component={FrontPage} />
      <Route exact path="/populations" component={Populations} />
      <Route exact path="/study-programme/:studyProgrammeId?" component={StudyProgramme} />
      <Route exact path="/study-programme/:studyProgrammeId/course-group/:courseGroupId" component={StudyProgramme} />
      <Route exact path={routes.students} component={StudentStatistics} />
      <Route exact path={routes.courseStatistics} component={CourseStatistics} />
      <Route exact path={routes.faculty} component={Faculty} />
      <Route exact path={routes.users} component={EnableUsers} />
      <Route exact path={routes.teachers} component={Teachers} />
      <Route exact path={routes.sandbox} component={Sandbox} />
      <Route exact path={routes.feedback} component={Feedback} />
      <Route exact path={routes.coursepopulation} component={CoursePopulation} />
      <Route exact path={routes.custompopulation} component={CustomPopulation} />
      <Route exact path={routes.updater} component={Updater} />
      <Route path={routes.trends} component={Trends} />
      <Redirect from="/cool-data-science" to="/trends" />
      <Redirect to="/" />
    </Switch>
  </Suspense>
)

export default Routes
