import { getJobOverview } from '../utils/database';
import { defineEventHandler, getQuery, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const { id, start, end } = getQuery(event);

  let startDate, endDate;
  if (!start) {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    startDate = d.toISOString();
  } else {
    startDate = new Date(parseInt(start * 1000)).toISOString();
  }

  if (!end) {
    endDate = new Date().toISOString();
  } else {
    endDate = new Date(parseInt(end * 1000)).toISOString();
  }

  if (!id) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'id parameter is missing' }));
  }

  let result;
  try {
    result = await getJobOverview(parseInt(id), startDate, endDate);
    return result;
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }
});