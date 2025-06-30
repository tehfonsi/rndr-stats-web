import { addJob } from '../utils/database';
import { defineEventHandler, readBody, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }));
  }
  const body = await readBody(event);
  const { node_id, start, end, time, result } = body;

  const startTimestamp = Date.parse(start) / 1000;
  const endTimestamp = Date.parse(end) / 1000;
  const job = {
    start: startTimestamp,
    end: endTimestamp,
    time: parseFloat(time),
    result,
    node: node_id
  };

  try {
    await addJob(job);
  } catch (err) {
    console.error(err);
    return sendError(event, createError({ statusCode: 500, statusMessage: err.message }));
  }
});