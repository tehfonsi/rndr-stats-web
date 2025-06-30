import hash from '../utils/hash';
import { setNode } from '../utils/database';
import { defineEventHandler, readBody, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  if (event.method !== 'PUT') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }));
  }
  const body = await readBody(event);
  let { eth_address, node_id, score, previews_sent, jobs_completet, thumbnails_sent, gpus, password } = body;
  const operator_id = hash(eth_address);

  score = !!score ? parseInt(score) : 0;
  previews_sent = !!previews_sent ? parseInt(previews_sent) : 0;
  jobs_completet = !!jobs_completet ? parseInt(jobs_completet) : 0;
  thumbnails_sent = !!thumbnails_sent ? parseInt(thumbnails_sent) : 0;

  const node = {
    id: node_id,
    score,
    previews_sent,
    jobs_completed: jobs_completet,
    thumbnails_sent,
    gpus,
    operator: operator_id,
    password
  };

  try {
    await setNode(node);
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }
});