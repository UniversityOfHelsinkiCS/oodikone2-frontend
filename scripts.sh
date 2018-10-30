#!/bin/bash

DATA=data
REPOS=repos
DB_BACKUP=data/staging.bak

init_dirs () {
    mkdir -p $DATA $REPOS
}

echo_path () {
    echo $(pwd)
}

purge () {
    git clean -f -fdX
    docker-compose down
}

pull () {
    pushd $REPOS
    git clone https://github.com/UniversityOfHelsinkiCS/oodikone2-backend.git
    git clone https://github.com/UniversityOfHelsinkiCS/oodikone2-frontend.git
    git clone https://github.com/UniversityOfHelsinkiCS/oodilearn.git
    popd
}

copyenv () {
    cp ./configs/backend $REPOS/oodikone2-backend/.env
}

get_dump () {
    scp oodikone.cs.helsinki.fi:/home/tkt_oodi/backups/staging.bak $DB_BACKUP
}

install_oodilearn () {
    docker build repos/oodilearn/server
    docker build repos/oodilearn/training
}

setup_oodilearn () {
    pushd repos/oodilearn
    mkdir -p models
    popd
}

install_backend () {
    pushd repos/oodikone2-backend
    npm install
    popd
}

install_frontend () {
    pushd repos/oodikone2-frontend
    npm install
    popd
}

setup_docker () {
    docker-compose up -d
}

db_drop_create_dump () {
    docker exec -u postgres oodi_db dropdb "tkt_oodi"
    docker exec -u postgres oodi_db createdb "tkt_oodi"
    cat $DB_BACKUP | docker exec -i -u postgres oodi_db psql -d tkt_oodi
}

run_setup () {
  echo "Creating directories."
  init_dirs
  echo "Pulling repositories."
  pull
  echo "Copying environment variables."
  copyenv
  echo "Setting up Docker images."
  setup_docker
  echo "Installing oodilearn."
  install_oodilearn
  echo "Installing backend."
  install_backend
  echo "Installing frontend."
  install_frontend
  echo "Getting DB dump from server, this will require your password."
  get_dump
  echo "Creating DB, this will take a while."
  db_drop_create_dump
  echo "Setup finished."
}

cd $(dirname "$0")
