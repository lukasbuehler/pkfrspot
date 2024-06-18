#!/bin/bash

# read environment variables from the system
PORT=${PORT}
GOOGLE_API_KEY=${GOOGLE_API_KEY}

# Check if the environment variables are set
echo "Checking if the environment variables are set..."
echo "PORT: ${PORT}"
echo "GOOGLE_API_KEY: ${GOOGLE_API_KEY}"

if [ -z "${GOOGLE_API_KEY}" ]; then
  echo "GOOGLE_API_KEY is not set. Please set the PORT environment variable."
  exit 1
fi

# create the JSON file
cat <<EOF >./src/environments/env.json
{
  "PORT": "${PORT}",
  "GOOGLE_API_KEY": "${GOOGLE_API_KEY}"
}
EOF
