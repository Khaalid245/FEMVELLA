#!/bin/sh
# Substitute env vars in alertmanager config then exec the real binary
envsubst < /etc/alertmanager/alertmanager.yml > /tmp/alertmanager.yml
exec /bin/alertmanager \
  --config.file=/tmp/alertmanager.yml \
  --storage.path=/alertmanager \
  --cluster.advertise-address=0.0.0.0:9093 \
  "$@"
