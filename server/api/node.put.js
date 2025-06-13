import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import hash from '../../utils/hash'; // Adjusted path
import { setNode } from '../../utils/database'; // Adjusted path

export default defineEventHandler(async (event) => {
  // Nuxt 3 automatically maps .put.js to PUT requests.
  // Original code checked event.httpMethod === "PUT".

  try {
    // Using 'jobs_completed' in destructuring assuming that's the intended field name from client
    // and for consistency with the 'node' object property.
    let {
      eth_address,
      node_id,
      score,
      previews_sent,
      jobs_completed, // Corrected variable name here
      thumbnails_sent,
      gpus,
      password
    } = await readBody(event);

    const operator_id = hash(eth_address); // Assuming hash function is ESM default export

    // Original parsing logic
    score = !!score ? parseInt(score) : 0;
    previews_sent = !!previews_sent ? parseInt(previews_sent) : 0;
    jobs_completed = !!jobs_completed ? parseInt(jobs_completed) : 0; // Use corrected variable
    thumbnails_sent = !!thumbnails_sent ? parseInt(thumbnails_sent) : 0;

    const node = {
      id: node_id,
      score,
      previews_sent,
      jobs_completed, // Consistent naming
      thumbnails_sent,
      gpus,
      operator: operator_id,
      password
    };

    await setNode(node);
    setResponseStatus(event, 200); // OK or 201 Created could also be appropriate
    return { success: true, message: 'Node data updated/created.' };
  } catch (error) {
    console.error('Error in node.put.js:', error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }
});
