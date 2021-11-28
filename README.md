# rndr-stats-web

# database

## operators

id: hashed eth address

eth_address: from registry
created: date

## gpus

id: random
name: eg RTX 3090

## nodes 
id: random

node_id: node id from registry
added: date
password: password set by user
operator: ref to operator
jobs_completed: from registry
previews_sent: from registry
thumbnails_sent: from registry
score: from registry
gpus: list with ref to gpus

## states

id: random
node_id: ref to node
type: 'Startup' | 'Idle' | 'Rendering' | 'Mining'
start: date

## jobs

id: random
node_id: ref to node
start: date
end: date
time: time in seconds
result: 'Success' | 'Cancel' | 'Fail'