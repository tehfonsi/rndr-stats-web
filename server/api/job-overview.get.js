import { defineEventHandler, getQuery, setResponseStatus } from 'h3';
import { getJobOverview } from '../../utils/database'; // Adjusted path

export default defineEventHandler(async (event) => {
  let { id, start, end } = getQuery(event);

  if (!start) {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    start = d.toISOString();
  } else {
    // Ensure start is processed correctly (original logic for parsing int from string)
    // The original did start * 1000, assuming start was a Unix timestamp string
    start = new Date(parseInt(start) * 1000).toISOString();
  }

  if (!end) {
    end = new Date().toISOString();
  } else {
    // Ensure end is processed correctly
    end = new Date(parseInt(end) * 1000).toISOString();
  }

  if (!id) {
    setResponseStatus(event, 400);
    return { error: 'id parameter is missing' };
  }

  try {
    // Ensure id is parsed as an integer if that's what getJobOverview expects
    const result = await getJobOverview(parseInt(id), start, end);
    setResponseStatus(event, 200);
    return result; // Directly return the result
  } catch (error) {
    console.error(error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }
});
