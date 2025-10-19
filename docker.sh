#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <environment> <app_name> [-d]"
  echo "Example: $0 dev myapp -d"
  exit 1
fi

MODE="foreground"
if [ "$3" == "-d" ]; then
  MODE="detached"
fi

ENV_FILE=".env.$1"
DOCKER_COMPOSE_FILE="apps/$2/docker-compose.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file '$ENV_FILE' does not exist."
  exit 1
fi

if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
  echo "Error: Docker Compose file '$DOCKER_COMPOSE_FILE' does not exist."
  exit 1
fi

if [ "$MODE" == "detached" ]; then
  docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" up -d
else
  docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" up
fi
