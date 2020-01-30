const knex = require('knex')
const Sequelize = require('sequelize')
const EventEmitter = require('events')
const Umzug = require('umzug')
const { lock } = require('../utils/redis')
const { MIGRATIONS_LOCK } = require('../config')
const { DB_URL, SIS_IMPORTER_HOST, SIS_IMPORTER_USER, SIS_IMPORTER_PASSWORD, SIS_IMPORTER_DATABASE } = process.env

class DbConnections extends EventEmitter {
  constructor() {
    super()
    this.RETRY_ATTEMPTS = 5
    this.knexConnection = false
    this.seqConnection = false

    this.sequelize = new Sequelize(DB_URL, {
      dialect: 'postgres',
      pool: {
        max: 25,
        min: 0,
        acquire: 10000,
        idle: 300000000
      }
    })
  }

  establish(conn) {
    this[conn] = true
    if (this.knexConnection && this.seqConnection) this.emit('connect')
  }

  async connect(attempt = 1) {
    try {
      if (!this.knexConnection) {
        this.knex = knex({
          client: 'pg',
          version: '9.6.3',
          connection: {
            host: SIS_IMPORTER_HOST,
            user: SIS_IMPORTER_USER,
            password: SIS_IMPORTER_PASSWORD,
            database: SIS_IMPORTER_DATABASE
          },
          pool: {
            min: 0,
            max: 25
          }
        })
        await this.knex.raw('select 1+1 as result')
        this.establish('knexConnection')
      }

      if (!this.seqConnection) {
        await this.sequelize.authenticate()
        await this.runMigrations()
        this.establish('seqConnection')
      }
    } catch (e) {
      if (attempt > this.RETRY_ATTEMPTS) {
        this.emit('error', e)
        return
      }
      console.log(`Knex database connection failed! Attempt ${attempt}/${this.RETRY_ATTEMPTS}`)
      setTimeout(() => this.connect(attempt + 1), 1000 * attempt)
    }
  }

  async runMigrations() {
    const unlock = await lock(MIGRATIONS_LOCK, 1000 * 60 * 10)
    try {
      const migrator = new Umzug({
        storage: 'sequelize',
        storageOptions: {
          sequelize: this.sequelize,
          tableName: 'migrations'
        },
        logging: console.log,
        migrations: {
          params: [this.sequelize.getQueryInterface(), Sequelize],
          path: `${process.cwd()}/src/db/migrations`,
          pattern: /\.js$/
        }
      })
      const migrations = await migrator.up()
      console.log('Migrations up to date', migrations)
    } catch (e) {
      console.log('Migration error', e)
      throw e
    } finally {
      unlock()
    }
  }
}

const dbConnections = new DbConnections()
module.exports = {
  dbConnections
}