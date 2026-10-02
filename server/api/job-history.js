import { getJobHistory } from '../utils/database';
import { defineEventHandler, getQuery, sendError, createError } from 'h3';

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

// bucket size so every range renders roughly 24-28 points
const bucketFor = (seconds) => {
  if (seconds <= 2 * DAY) return HOUR;
  if (seconds <= 14 * DAY) return 6 * HOUR;
  return DAY;
};

export default defineEventHandler(async (event) => {
  const { id, start, end } = getQuery(event);

  if (!id) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'id parameter is missing' }));
  }

  const endTs = end ? parseInt(end) : Math.floor(Date.now() / 1000);
  const startTs = start ? parseInt(start) : endTs - DAY;
  if (isNaN(startTs) || isNaN(endTs) || startTs >= endTs) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'invalid start or end' }));
  }
  const bucket = bucketFor(endTs - startTs);

  try {
    const rows = await getJobHistory(parseInt(id), startTs, endTs, bucket);
    return {
      start: startTs,
      end: endTs,
      bucket,
      rows: rows.map((r) => ({
        node: r.node,
        bucket: Number(r.bucket),
        busy: Number(r.busy) || 0,
        job_count: Number(r.job_count) || 0,
      })),
    };
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }
});
