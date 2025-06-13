import { defineEventHandler, getQuery, setResponseStatus } from 'h3';
import { getOperatorPackage, getNodeOverview } from '../../utils/database.js'; // Adjusted path

export default defineEventHandler(async (event) => {
  // Nuxt 3 automatically maps .get.js to GET requests.
  const { id } = getQuery(event);

  if (!id) {
    setResponseStatus(event, 400);
    return { error: 'id parameter is missing' };
  }

  const operatorId = parseInt(id);
  if (isNaN(operatorId)) {
    setResponseStatus(event, 400);
    return { error: 'id parameter must be a valid number' };
  }

  try {
    const [operatorPackage, nodes] = await Promise.all([
      getOperatorPackage(operatorId),
      getNodeOverview(operatorId)
    ]);

    // Original logic: if package is empty, remove 'updated' field from nodes
    if (!operatorPackage || operatorPackage.length === 0) {
      nodes.forEach((node) => {
        delete node.updated;
      });
    }

    setResponseStatus(event, 200);
    return nodes; // Directly return the (potentially modified) nodes array
  } catch (error) {
    console.error(error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }
});
