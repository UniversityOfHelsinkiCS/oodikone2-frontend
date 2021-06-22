#!/usr/bin/env bash

# This script is used to run oodikone with different setups and is mainly used by
# scripts in package.json.
# Base for script: https://betterdev.blog/minimal-safe-bash-script-template/

# === Config ===

# Fail immediately if script fails, unbound variables are referenced
# or command inside pipe fails. -E ensures cleanup trap fires in rare ERR cases.
set -euoE pipefail

# Set up constants
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Set up logging
source "$PROJECT_ROOT"/scripts/utils.sh

usage() {
  cat <<EOF
Usage: $(basename "${BASH_SOURCE[0]}") option [version] command --flag

Parameters:
* Option: oodikone/updater/both/morning
* Version: anon/real/ci. Not necessary in all cases, such as when running down or logs.
* Command: will be passed to docker-compose.
EOF
  exit
}

# Parse parameters. If arguments are not correct, print usage and exit with error.
parse_params() {
  args=("$@")

  [[ ${#args[@]} -eq 0 ]] && usage && die "Wrong number of arguments"
  option=${args[0]}

  # If option is morning, other parameters aren't needed
  [[ "$option" == "morning" ]] && return 0

  # Else, parse arguments
  [[ ("$option" != "oodikone" && "$option" != "updater" && "$option" != "both") ]] && \
  usage && die "Wrong option"

  [[ ${#args[@]} -eq 1 ]] && usage && die "Wrong number of arguments"

  # Down or logs can be passed without version. Otherwise parse version and then pass
  # rest to compose
  if [[ "${args[1]}" == "down" || "${args[1]}" == "logs" ]]; then
    version=""
    compose_command=${args[*]:1}
  else
    version=${args[1]}
    [[ "$version" != "anon" && "$version" != "real" && "$version" != "ci" ]] && \
usage && die "Wrong version"
    compose_command=${args[*]:2}
  fi
  return 0
}

# Set which profile to use to launch correct services
parse_profiles() {
  if [[ "$option" == "both" ]]; then
    profiles="--profile oodikone --profile updater"
  else
    profiles="--profile $option"
  fi
  return 0
}

# Set which docker-compose files to use based on version. In ci, profiles are also
# emptied, since they're passed from github actions.
parse_env() {
  env=""
  if [[ "$version" == "real" ]]; then
    env="-f docker-compose.yml -f docker-compose.real.yml"
  elif [[ "$version" == "ci" ]]; then
    env="-f docker-compose.ci.yml"
    profiles=""
  fi
  return 0
}

# === Run script ===

parse_params "$@"

# Do only morning cleanup for morning option
if [[ "$option" == "morning" ]];then
  git checkout trunk
  git pull
  docker-compose down --rmi all --remove-orphans
  return 0
fi

# Create command that will be run. Empty command and "down" command will be handled
# differently.
parse_profiles
parse_env
if [[ "$compose_command" == "" ]]; then
  final_command="docker-compose ${env}"
elif [[ "$compose_command" == *"down"* ]]; then
  final_command="docker-compose ${compose_command}"
else
  final_command="docker-compose ${env} ${profiles} ${compose_command}"
fi

msg "${BLUE}Running: ${final_command}${NOFORMAT}"
eval "$final_command"
