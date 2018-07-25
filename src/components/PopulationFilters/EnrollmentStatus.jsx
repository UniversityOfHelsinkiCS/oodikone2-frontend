import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown } from 'semantic-ui-react'
import { shape, func } from 'prop-types'
import moment from 'moment'
import _ from 'lodash'

import { enrollmentStatus } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class EnrollmentStatus extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    samples: shape({}).isRequired
  }

  state = {
    semesters: [],
    enrolled: true
  }

  componentDidMount() {
    if (this.props.filter.notSet) {
      const options = this.createPossibleOptions(this.props.samples)
      this.setState({ options })
    }
  }

  formatSemesterCodeToText = (semester) => {
    const text = moment(moment('1950', 'YYYY').add((semester * 6), 'months')).format('YYYY.MM')
    const split = text.split('.')
    const formatted = split[1] > 6 ? `Fall ${split[0]}` : `Spring ${split[0]}`
    return formatted
  }

  createPossibleOptions = ({ minDate, maxDate }) => {
    const firstSemester = moment(minDate).diff(moment('1950', 'YYYY'), 'months') / 6
    const lastSemester = moment(maxDate).diff(moment('1950', 'YYYY'), 'months') / 6
    const allSemesters = _.range(firstSemester, lastSemester + 1)
    const options = allSemesters.map(semester =>
      ({ key: semester, text: this.formatSemesterCodeToText(semester), value: semester }))

    return options
  }

  handleTime = (e, data) => {
    this.setState({ semesters: data.value })
  }

  handleFilter = () => {
    this.props.setPopulationFilter(enrollmentStatus({
      semesters: this.state.semesters, enrolled: this.state.enrolled
    }))
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }


  render() {
    const { filter } = this.props
    console.log(this.state)
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Form.Group inline>
              <Form.Field>
                <label>Select students that {'we\'re'} </label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  selection
                  placeholder="select status"
                  onChange={(e, data) => this.setState({ enrolled: data.value })}
                  value={this.state.enrolled}
                  options={[{ key: 1, text: 'present', value: 1 }, { key: 2, text: 'absent', value: 2 }]}
                />

              </Form.Field>
              <Form.Field>
                <label> during </label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  placeholder="select semesters"
                  fluid
                  multiple
                  selection
                  options={this.state.options}
                  onChange={this.handleTime}
                />

              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleFilter}
                  disabled={this.state.semesters.length === 0}
                >
                  set filter
                </Button>
              </Form.Field>
            </Form.Group>
          </Form>
        </Segment>
      )
    }

    return (
      <Segment>
        Students that were {filter.params.enrolled === 1 ? 'present' : 'absent'} during {filter.params.semesters.map(semester => this.formatSemesterCodeToText(semester)).join(', ')}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}


export default connect(
  null,
  { setPopulationFilter, removePopulationFilter }
)(EnrollmentStatus)
