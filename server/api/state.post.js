import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import { addState } from '../../utils/database'; // Adjusted path

export default defineEventHandler(async (event) => {
  // Nuxt 3 automatically maps .post.js to POST requests.

  try {
    const { type, node_id } = await readBody(event);

    if (!type || !node_id) {
      setResponseStatus(event, 400);
      return { error: 'Missing type or node_id in request body.' };
    }

    const state = {
      type,
      node_id
    };

    await addState(state);
    setResponseStatus(event, 201); // 201 Created is appropriate for adding a new state
    return { success: true, message: 'State added successfully.' };
  } catch (error) {
    console.error('Error in state.post.js:', error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }
});
