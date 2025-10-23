#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <environment> <app_name> [-d] [name]"
  echo "Example: $0 dev myapp -d"
  exit 1
fi

MODE="foreground"
if [ "$3" == "-d" ]; then
  MODE="detached"
fi

CUSTOM_NAME=$4
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
  CONTAINER_NAME_ARG=""
  if [ -n "$CUSTOM_NAME" ]; then
    CONTAINER_NAME_ARG="-p $CUSTOM_NAME"
  fi
  docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" $CONTAINER_NAME_ARG up -d
else
  docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" up
fi