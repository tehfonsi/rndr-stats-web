import { getOperatorPackage, getNodeOverview } from './utils/database.js';

const getOverview = async (req, res) => {
  const {id} = req.query;

  if (!id) {
    res.status(400).send('id parameter is missing');
    return;
  }

  const operatorId = parseInt(id);

  let result;
  try {
    result = await Promise.all([getOperatorPackage(operatorId), getNodeOverview(operatorId)]);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
    return;
  }

  const pckg = result[0];
  const nodes = result[1];

  if (!pckg.length) {
    nodes.forEach((node) => {
      delete node.updated;
    })
  }
  
  res.status(200).json(nodes);
}

export default async function (req, res) {
  if (req.method === "GET") {
    return getOverview(req, res);
  }
  res.status(405).send("Method Not Allowed");
}