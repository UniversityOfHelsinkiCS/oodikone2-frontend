import { combineReducers } from 'redux';

import departmentSuccess from './departmentSuccess';

import {

} from '../actions';

/* collect reducers here from subfolders */
const reducers = combineReducers({
  departmentSuccess

});

export default reducers;
