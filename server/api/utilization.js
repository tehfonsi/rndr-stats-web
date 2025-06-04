import { getUtilizationForAllNodes } from './utils/database';

const CACHE = new Map();

const getKey = (start,end) => {
  return `${start}-${end}`;
}

const getUtilizationOverview = async (req, res) => {
  let {start, end} = req.query;

  if (!start) {
    var d = new Date();
    d.setDate(d.getDate()-1);
    start = d.toISOString();
  } else {
    start = new Date(parseInt(start * 1000)).toISOString();
  }

  if (!end) {
    end = new Date().toISOString();
  } else {
    end = new Date(parseInt(end * 1000)).toISOString();
  }

  const key = getKey(start,end);
  console.log(key);

  // if (CACHE.has(key)) {
  //   const utilization = CACHE.get(key);
  //   res.setHeader('Cache-Control', 'public, s-maxage=3600');
  //   res.status(200).json(utilization);
  //   return;
  // }

  let result;
  try {
    result = await getUtilizationForAllNodes(start, end)
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
    return;
  }

  const utilization = [
    {from: 1, to: 99, tier: 3, nodes: 0, utilization: 0.0},
    {from: 100, to: 199, tier: 3, nodes: 0, utilization: 0.0},
    {from: 200, to: 300, tier: 3, nodes: 0, utilization: 0.0},
    {from: 301, to: 999, tier: 2, nodes: 0, utilization: 0.0},
    {from: 1000, to: 1999, tier: 2, nodes: 0, utilization: 0.0},
    {from: 2000, to: 3999, tier: 2, nodes: 0, utilization: 0.0},
    {from: 4000, to: 9999, tier: 2, nodes: 0, utilization: 0.0},
    {from: 10000, to: 14999, tier: 2, nodes: 0, utilization: 0.0},
    {from: 15000, to: 20000, tier: 2, nodes: 0, utilization: 0.0},
  ];

  result.forEach((node) => {
    const object = utilization.find((u) => u.from <= node.score && node.score <= u.to);
    if (object) {
      object.nodes ++;
      object.utilization = (object.utilization + node.utilization) / 2;
    }
  });

  if (CACHE.size > 5) {
    CACHE.clear();
  }
  CACHE.set(key, utilization);
  
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.status(200).json(utilization);
}

export default async function (req, res) {
  if (req.method === "GET") {
    return getUtilizationOverview(req, res);
  }
  res.status(405).send("Method Not Allowed");
}