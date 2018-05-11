import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { Form, Button, Header, Checkbox } from 'semantic-ui-react'
import Datetime from 'react-datetime'
import Timeout from '../Timeout'
import CourseSearch from '../CourseSearch'
import CoursePassRateChart from '../CoursePassRateChart'
import { getCourseStatistics } from '../../redux/courseStatistics'
import { isValidYear, isInDateFormat, reformatDate } from '../../common'


import style from './courseStatistics.css'
import sharedStyles from '../../styles/shared'

const { shape, func, array } = PropTypes

const INITIAL_YEARS = {
  start: '2017',
  end: '2018'
}

class CourseStatistics extends Component {
  state = {
    selectedCourse: { name: 'No course selected', code: '' },
    ...INITIAL_YEARS,
    validYear: true
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ selectedCourse: result }, () => {
      this.fetchCourseStatistics()
    })
  }

  fetchCourseStatistics = () => {
    const { code } = this.state.selectedCourse
    const { start, end } = this.state
    this.props.getCourseStatistics({ code, start, end, separate: true })
  }

  handleYearSelection = (year) => {
    const validYear = isInDateFormat(year, 'YYYY') && isValidYear(year)
    if (validYear) {
      this.setState({
        validYear,
        start: reformatDate(year, 'YYYY')
      })
    } else {
      this.setState({ validYear })
    }
  }

  renderEnrollmentDateSelector = () => {
    const { validYear, start, end } = this.state

    return (
      <Form>
        <Form.Group key="year" className={style.enrollmentSelectorGroup}>
          <Form.Field error={!validYear} className={style.yearSelect}>
            <label>Start year</label>
            <Datetime
              className={style.yearSelectInput}
              control={Datetime}
              dateFormat="YYYY"
              timeFormat={false}
              closeOnSelect
              value={start}
              isValidDate={isValidYear}
              onChange={this.handleYearSelection}
            />
          </Form.Field>
          <Form.Field className={style.yearControl}>
            <Button.Group basic vertical className={style.yearControlButtonGroup}>
              <Button
                icon="plus"
                className={style.yearControlButton}
                onClick={this.addYear}
              />
              <Button
                icon="minus"
                className={style.yearControlButton}
                onClick={this.subtractYear}
              />
            </Button.Group>
          </Form.Field>
          <Form.Field error={!validYear} className={style.yearSelect}>
            <label>End year</label>
            <Datetime
              className={style.yearSelectInput}
              control={Datetime}
              dateFormat="YYYY"
              timeFormat={false}
              closeOnSelect
              value={end}
              isValidDate={isValidYear}
              onChange={this.handleYearSelection}
            />
          </Form.Field>
          <Form.Field className={style.yearControl}>
            <Button.Group basic vertical className={style.yearControlButtonGroup}>
              <Button
                icon="plus"
                className={style.yearControlButton}
                onClick={this.addYear}
              />
              <Button
                icon="minus"
                className={style.yearControlButton}
                onClick={this.subtractYear}
              />
            </Button.Group>
          </Form.Field>
          <Form.Field>
            <Checkbox label="Separate Spring/Fall" />
            <label>Select semester thing</label>
          </Form.Field>
        </Form.Group>
      </Form>
    )
  }

  render() {
    const { data } = this.props.courseStatistics
    return (
      <div className={style.container}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Course Statistics
        </Header>
        {this.renderEnrollmentDateSelector()}
        <CourseSearch handleResultSelect={this.handleResultSelect} />

        {data.map(course => <CoursePassRateChart key={course.name} stats={course} />)}
      </div>
    )
  }
}

CourseStatistics.propTypes = {
  getCourseStatistics: func.isRequired,
  courseStatistics: shape({
    data: array.isRequired,
    selected: array.isRequired
  }).isRequired
}

const mapStateToProps = ({ courses, courseStatistics }) => ({
  courses,
  courseStatistics
})

const mapDispatchToProps = dispatch => ({
  getCourseStatistics: query =>
    dispatch(getCourseStatistics(query))
})


export default connect(mapStateToProps, mapDispatchToProps)(Timeout(CourseStatistics))
