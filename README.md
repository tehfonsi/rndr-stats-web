# rndr-stats-web

# database

## operators

id: hashed eth address
eth_address: from registry

## gpus

id: random
name: eg RTX 3090

## nodes

id: node id from registry
date_added: date
password: password set by user
operator: ref to operator
jobs_completed: from registry
previews_sent: from registry
score: from registry
gpus: list with ref to gpus

## states

id: random
date
node: ref to node
state: 'idle' | 'start_render' | 'rendering' | 'finish_render' | 'mining' | 'not_responding'
score: from registry