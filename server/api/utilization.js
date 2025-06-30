import { getUtilizationForAllNodes } from '../utils/database';
import { defineEventHandler, getQuery, sendError, createError } from 'h3';

const CACHE = new Map();

const getKey = (start, end) => {
  return `${start}-${end}`;
};

export default defineEventHandler(async (event) => {
  let { start, end } = getQuery(event);

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

  const key = getKey(startDate, endDate);
  console.log(key);

  // if (CACHE.has(key)) {
  //   const utilization = CACHE.get(key);
  //   return { statusCode: 200, headers: { 'Cache-Control': 'public, s-maxage=3600' }, body: JSON.stringify(utilization, null, 2) };
  // }

  let result;
  try {
    result = await getUtilizationForAllNodes(startDate, endDate);
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }

  const utilization = [
    { from: 1, to: 99, tier: 3, nodes: 0, utilization: 0.0 },
    { from: 100, to: 199, tier: 3, nodes: 0, utilization: 0.0 },
    { from: 200, to: 300, tier: 3, nodes: 0, utilization: 0.0 },
    { from: 301, to: 999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 1000, to: 1999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 2000, to: 3999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 4000, to: 9999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 10000, to: 14999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 15000, to: 20000, tier: 2, nodes: 0, utilization: 0.0 },
  ];

  result.forEach((node) => {
    const object = utilization.find((u) => u.from <= node.score && node.score <= u.to);
    if (object) {
      object.nodes++;
      object.utilization = (object.utilization + node.utilization) / 2;
    }
  });

  if (CACHE.size > 5) {
    CACHE.clear();
  }
  CACHE.set(key, utilization);

  return utilization;
});