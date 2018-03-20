import React, { Component } from 'react';
import { connect } from 'react-redux';
import { func, arrayOf, object } from 'prop-types';
import { Form, Button, Message, Radio, Dropdown } from 'semantic-ui-react';
import { getTranslate } from 'react-localize-redux';
import uuidv4 from 'uuid/v4';
import Datetime from 'react-datetime';
import { isEqual } from 'lodash';
import { getPopulationStatistics } from '../../redux/population';
import { getPopulationStatisticsAction, clearPopulationsAction, getStudyProgrammesAction } from '../../actions';
import { isInDateFormat, momentFromFormat, reformatDate } from '../../common';

import style from './populationSearchForm.css';
import { dropdownType } from '../../constants/types';

const YEAR_DATE_FORMAT = 'YYYY';

const INITIAL_QUERY = {
  year: '2017',
  semester: 'FALL',
  studyRights: []
};


class PopulationSearchForm extends Component {
  static propTypes = {
    translate: func.isRequired,
    dispatchGetPopulationStatistics: func.isRequired,
    getPopulationStatistics: func.isRequired,
    dispatchClearPopulations: func.isRequired,
    dispatchGetStudyProgrammes: func.isRequired,
    queries: arrayOf(object).isRequired,
    studyProgrammes: arrayOf(dropdownType).isRequired
  };

  state = {
    query: INITIAL_QUERY,
    isLoading: false,
    isValidYear: true
  };

  componentDidMount() {
    const { studyProgrammes, dispatchGetStudyProgrammes } = this.props;
    if (studyProgrammes.length === 0) {
      dispatchGetStudyProgrammes();
    }
  }

  validateQuery = () => {
    const { queries } = this.props;
    const { query } = this.state;
    return queries.some(q => isEqual(q, query));
  };

  clearPopulations = () => {
    const { dispatchClearPopulations } = this.props;
    dispatchClearPopulations();
  };

  fetchPopulation = () => {
    const { query } = this.state;
    const { dispatchGetPopulationStatistics } = this.props;

    query.uuid = uuidv4();

    this.setState({ isLoading: true });
    dispatchGetPopulationStatistics(query)
      .then(
        () => this.setState({ isLoading: false }),
        () => this.setState({ isLoading: false })
      );
    this.props.getPopulationStatistics(query);
  };

  isValidYear = year => (year.isSameOrBefore(Datetime.moment(), 'year')
    && year.isAfter(Datetime.moment('1900', YEAR_DATE_FORMAT), 'year'));

  handleYearSelection = (year) => {
    const { query } = this.state;
    const isValidYear = isInDateFormat(year, YEAR_DATE_FORMAT) && this.isValidYear(year);
    if (isValidYear) {
      this.setState({
        isValidYear,
        query: { ...query, year: reformatDate(year, YEAR_DATE_FORMAT) }
      });
    } else {
      this.setState({ isValidYear });
    }
  };

  addYear = () => {
    const { year } = this.state.query;
    const nextYear = momentFromFormat(year, YEAR_DATE_FORMAT).add(1, 'year');
    this.handleYearSelection(nextYear);
  };

  subtractYear = () => {
    const { year } = this.state.query;
    const previousYear = momentFromFormat(year, YEAR_DATE_FORMAT).subtract(1, 'year');
    this.handleYearSelection(previousYear);
  };

  handleSemesterSelection = (e, { value }) => {
    const { query } = this.state;
    this.setState({ query: { ...query, semester: value } });
  };

  handleStudyRightChange = (e, { value }) => {
    const { query } = this.state;
    value.sort();
    this.setState({
      query: {
        ...query,
        studyRights: value
      }
    });
  };


  renderEnrollmentDateSelector = () => {
    const { translate } = this.props;
    const { query, isValidYear } = this.state;
    const { semester, year } = query;

    const semesters = ['FALL', 'SPRING'];

    return (
      <Form.Group key="year" className={style.enrollmentSelectorGroup}>
        <Form.Field error={!isValidYear} className={style.yearSelect}>
          <label>{translate('populationStatistics.enrollmentYear')}</label>
          <Datetime
            className={style.yearSelectInput}
            control={Datetime}
            dateFormat={YEAR_DATE_FORMAT}
            timeFormat={false}
            closeOnSelect
            value={year}
            isValidDate={this.isValidYear}
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
          <label>{translate('populationStatistics.semester')}</label>
          {semesters.map(s => (
            <Radio
              className={style.semesterRadio}
              key={s}
              label={translate(`populationStatistics.${s}`)}
              value={s}
              name="semesterGroup"
              checked={semester === s}
              onChange={this.handleSemesterSelection}
            />
          ))}

        </Form.Field>
      </Form.Group>
    );
  };

  renderStudyGroupSelector = () => {
    const { studyProgrammes, translate } = this.props;
    const { studyRights } = this.state.query;

    return (
      <Form.Group id="rightGroup">
        <Form.Field width={8}>
          <label htmlFor="rightGroup">{translate('populationStatistics.studyRights')}</label>
          <Dropdown
            placeholder={translate('populationStatistics.selectStudyRights')}
            multiple
            search
            selection
            noResultsMessage={translate('populationStatistics.noSelectableStudyRights')}
            value={studyRights}
            options={studyProgrammes}
            onChange={this.handleStudyRightChange}
            closeOnChange
          />
        </Form.Field>
      </Form.Group>
    );
  };

  render() {
    const { translate } = this.props;
    const { isLoading, isValidYear } = this.state;

    let errorText = translate('populationStatistics.alreadyFetched');
    let isQueryInvalid = this.validateQuery();

    if (!isValidYear) {
      isQueryInvalid = true;
      errorText = translate('populationStatistics.selectValidYear');
    }

    return (
      <Form error={isQueryInvalid} loading={isLoading}>
        {this.renderEnrollmentDateSelector()}
        {this.renderStudyGroupSelector()}

        <Message
          error
          header={errorText}
        />
        <Button onClick={this.fetchPopulation} disabled={isQueryInvalid}>{translate('populationStatistics.addPopulation')}</Button>
        <Button onClick={this.clearPopulations}>{translate('populationStatistics.clearPopulations')}</Button>

      </Form>
    );
  }
}

/* TODO: move to reselect */
const mapRightsToDropdown = rights => (
  rights.map(r => ({
    key: r.id, value: r.id, text: r.name
  }))
);

const mapStateToProps = ({ populationReducer, studyProgrammesReducer, locale }) => ({
  queries: populationReducer.queries,
  translate: getTranslate(locale),
  studyProgrammes: mapRightsToDropdown(studyProgrammesReducer.studyProgrammes)
});

const mapDispatchToProps = dispatch => ({
  getPopulationStatistics: request =>
    dispatch(getPopulationStatistics(request)),
  dispatchGetPopulationStatistics: request =>
    dispatch(getPopulationStatisticsAction(request)),
  dispatchClearPopulations: () =>
    dispatch(clearPopulationsAction()),
  dispatchGetStudyProgrammes: () => {
    dispatch(getStudyProgrammesAction());
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchForm);
