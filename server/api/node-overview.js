import { getOperatorPackage, getNodeOverview } from '../utils/database';
import { defineEventHandler, getQuery, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);

  if (!id) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'id parameter is missing' }));
  }

  const operatorId = parseInt(id);


  try {
  return await getNodeOverview(operatorId);
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }

  // check operator package
  // let result;
  // try {
  //   result = await Promise.all([
  //     getOperatorPackage(operatorId),
  //     getNodeOverview(operatorId)
  //   ]);
  // } catch (error) {
  //   console.error(error);
  //   return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  // }

  // const pckg = result[0];
  // const nodes = result[1];

  // if (!pckg.length) {
  //   nodes.forEach((node) => {
  //     delete node.updated;
  //   });
  // }

  // return nodes;
});