#!/usr/bin/env bash

# This file includes functions that are used to setup oodikone. File doesn't run anything
# by itself and should be sourced from other script.

# === Config ===

# Set up constants
## Folders
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
DUMP_DIR="$PROJECT_ROOT/.databasedumps"
USER_DATA_FILE="$DUMP_DIR/hyuserdata"

## Following the naming convention in docker-compose, these are names for services
## and for the anonymous database. Real databases have suffix "-real".
ANALYTICS_DB_NAME="analytics-db"
KONE_DB_NAME="kone-db"
SIS_DB_NAME="sis-db"
SIS_IMPORTER_DB_NAME="sis-importer-db"
USER_DB_NAME="user-db"
DATABASES=("$ANALYTICS_DB_NAME" "$KONE_DB_NAME" "$SIS_DB_NAME" "$SIS_IMPORTER_DB_NAME" "$USER_DB_NAME")
OODI_DB_NAME="oodi-db" # TODO: Remove when oodi is removed

## Urls should be in same order as databases
ANALYTICS_DB_REAL_DUMP_URL="oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/latest-analytics-pg.sqz"
KONE_DB_REAL_DUMP_URL="oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/latest-kone-pg.sqz"
SIS_DB_REAL_DUMP_URL="svm-96.cs.helsinki.fi:/home/updater_user/backups/latest-sis.sqz"
SIS_IMPORTER_DB_REAL_DUMP_URL="importer:/home/importer_user/importer-db/backup/importer-db.sqz"
USER_DB_REAL_DUMP_URL="oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/latest-user-pg.sqz"
REAL_DUMP_URLS=("$ANALYTICS_DB_REAL_DUMP_URL" "$KONE_DB_REAL_DUMP_URL" "$SIS_DB_REAL_DUMP_URL" "$SIS_IMPORTER_DB_REAL_DUMP_URL" "$USER_DB_REAL_DUMP_URL")
OODI_DB_REAL_DUMP_URL="svm-77.cs.helsinki.fi:/home/tkt_oodi/backups/latest-pg.sqz" # TODO: Remove when oodi is removed

# Source utility functions
source "$PROJECT_ROOT"/scripts/utils.sh

# === Function ===

draw_mopo() {
  # Some hacks to print mopo as green, since colours from common config don't work
  # Please feel free to fix this. And tell otahontas how you did it!
  local mopogreen=$(tput setaf 34)
  local normal=$(tput sgr0)
  if [ "$(tput cols)" -gt "100" ]; then
    while IFS="" read -r p || [ -n "$p" ]; do
      printf '%40s\n' "${mopogreen}$p${normal}"
    done < "$PROJECT_ROOT"/scripts/assets/mopo.txt
  fi
}

retry () {
  sleep 5
  for i in {1..60}; do
    "$@" && break || warningmsg "Retry attempt $i failed, waiting..." && sleep 5;
  done
}

download_real_dump() {
  local database=$1
  local pannu_url=$2
  local dump_destination="$DUMP_DIR/$database.sqz"
  scp -r -o ProxyCommand="ssh -l $username -W %h:%p melkki.cs.helsinki.fi" "$username@$pannu_url" "$dump_destination"
}

check_if_postgres_is_ready() {
  local container=$1
  local database=$2
  retry docker exec -u postgres "$container" pg_isready --dbname="$database"
}

reset_databases() {
  local databases=("$@")
  local database_name_suffix="-real"
  local database_dump_dir=$DUMP_DIR

  infomsg "Restoring PostgreSQL dumps from backups. This might take a while."

  docker-compose down
  docker-compose up -d ${databases[*]}

  for database in ${databases[@]}; do
    local database_dump="$database_dump_dir/$database.sqz"
    local database_container="$database"
    local database_name="$database$database_name_suffix"

    infomsg "Attempting to create database $database_name from dump $database_dump inside container $database_container"

    infomsg "Trying to remove possibly existing previous version of database"
    check_if_postgres_is_ready "$database_container" "$database_name"
    docker exec -u postgres "$database_container" dropdb "$database_name" || warningmsg "This is okay, continuing"

    infomsg "Trying to create new database"
    check_if_postgres_is_ready "$database_container" "$database_name"
    docker exec -u postgres "$database_container" createdb "$database_name" || warningmsg "This is okay, continuing"

    infomsg "Restoring database from dump database"
    msg "1. Copying dump..."
    docker cp "$database_dump" "$database_container:/asd.sqz"
    msg "2. Writing database..."
    docker exec "$database_container" pg_restore -U postgres --no-owner -F c --dbname="$database_name" -j4 /asd.sqz
    msg ""
  done

  successmsg "Database setup finished"
}

reset_all_real_data() {
  infomsg "Downloading real data dumps, asking for pannu password when needed"
  for i in ${!DATABASES[*]}; do
    local database="${DATABASES[$i]}"
    local url="${REAL_DUMP_URLS[$i]}"
    download_real_dump "$database" "$url"
  done
  reset_databases ${DATABASES[*]}
}

reset_sis_importer_data() {
  infomsg "Downloading sis-importer-db dump"
  local database=$SIS_IMPORTER_DB_NAME
  local url=$SIS_IMPORTER_DB_REAL_DUMP_URL
  download_real_dump $database $url
  reset_databases $database
}

reset_old_oodi_data() {
  infomsg "Downloading old oodi-db dump"
  local database=$OODI_DB_NAME
  local url=$OODI_DB_REAL_DUMP_URL
  download_real_dump $database $url
  reset_databases $database
}

set_up_oodikone() {
  draw_mopo

  infomsg "Installing npm packages locally to enable linting"

  folders_to_set_up=(
    "$PROJECT_ROOT"
    "$PROJECT_ROOT/services/oodikone2-analytics"
    "$PROJECT_ROOT/services/oodikone2-frontend"
    "$PROJECT_ROOT/services/oodikone2-userservice"
    "$PROJECT_ROOT/services/backend/oodikone2-backend"
  )

  for folder in "${folders_to_set_up[@]}"; do
    cd "$folder" || return 1
    ([[ -d node_modules ]] && warningmsg "Packages already installed in $folder") || npm ci
  done
  cd "$PROJECT_ROOT" || return 1

  infomsg "Cleaning up previous docker containers, volumes and networks"
  "$PROJECT_ROOT"/run.sh both down --remove-orphans --volumes

  infomsg "Pulling images"
  "$PROJECT_ROOT"/run.sh oodikone anon build

  infomsg "Building images"
  "$PROJECT_ROOT"/run.sh oodikone anon build

  successmsg "Setup ready, oodikone can be started! See README for more info."
}

init_dirs() {
  if [[ ! -d "$DUMP_DIR" ]]; then
    infomsg "Creating directory for dumps"
    mkdir "$DUMP_DIR"
  fi
}

# If username is not set, get username from data file.
# Ask user to provide username, if username was not found from data file.
get_username() {
  if [ ! -f "$USER_DATA_FILE" ]; then
    warningmsg "University username is needed to get database dumps from toska servers, please enter it now:"
    read -r username
    echo "$username" > "$USER_DATA_FILE"
    successmsg "Succesfully saved username for later usage."
  fi
  username=$(head -n 1 < "$USER_DATA_FILE")

  infomsg "Using your university username - $username - for getting database dumps"
}
