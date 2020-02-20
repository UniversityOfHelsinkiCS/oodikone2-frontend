const { Model, STRING, DATE } = require('sequelize')
const { dbConnections } = require('../databaseV2/connection')

class StudyrightElement extends Model {}

StudyrightElement.init(
  {
    id: {
      type: STRING,
      primaryKey: true
    },
    startdate: {
      type: DATE
    },
    enddate: {
      type: DATE
    },
    studyrightid: {
      type: STRING,
      references: {
        model: 'studyright',
        key: 'studyrightid'
      }
    },
    code: {
      type: STRING,
      references: {
        model: 'element_details',
        key: 'code'
      }
    },
    studentnumber: {
      type: STRING,
      references: {
        model: 'student',
        key: 'studentnumber'
      }
    },
    createdAt: {
      type: DATE
    },
    updatedAt: {
      type: DATE
    }
  },
  {
    underscored: false,
    sequelize: dbConnections.sequelize,
    modelName: 'studyright_element',
    tableName: 'studyright_elements'
  }
)

module.exports = StudyrightElement
