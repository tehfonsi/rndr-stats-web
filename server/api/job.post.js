import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import { addJob } from '../../utils/database'; // Adjusted path

export default defineEventHandler(async (event) => {
  // Nuxt 3 automatically maps .post.js to POST requests.
  // Original code checked for event.httpMethod === "POST".

  try {
    const { node_id, start, end, time, result } = await readBody(event);

    // Original logic for timestamp conversion
    const startTimestamp = Date.parse(start) / 1000;
    const endTimestamp = Date.parse(end) / 1000;

    const job = {
      start: startTimestamp,
      end: endTimestamp,
      time: parseFloat(time),
      result,
      node: node_id // Ensure this matches the field name expected by addJob
    };

    await addJob(job);
    setResponseStatus(event, 200); // Successfully created or processed
    return { success: true }; // Or return the created job if appropriate
  } catch (error) {
    console.error(error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }
});
