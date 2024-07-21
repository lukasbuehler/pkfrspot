#!/bin/bash

# read environment variables from the system
PORT=${PORT}
GOOGLE_API_KEY=${GOOGLE_API_KEY}

# Check if the environment variables are set
echo "Checking if the environment variables are set..."
echo "PORT: ${PORT}"
echo "GOOGLE_API_KEY: ${GOOGLE_API_KEY}"
echo "LOCAL": ${LOCAL}

if [ -z "${GOOGLE_API_KEY}" ]; then
  echo "GOOGLE_API_KEY is not set. Please set the PORT environment variable."
 
  # if a file .env exists, read the environment variables from it
  if [ -f .env ]; then
    echo "Reading environment variables from .env file..."
    export $(cat .env | xargs)
  else
    exit 1
  fi
fi

# create the JSON file
cat <<EOF >./src/environments/env.json
{
  "PORT": "${PORT}",
  "GOOGLE_API_KEY": "${GOOGLE_API_KEY}"
}
EOF
