import { getLatestTransactions } from './utils/polygonscan.js';

const updatePackages = async (req, res) => {
  const {id} = req.query;

  // if (!id) {
  //   return {statusCode: 400, body: 'id parameter is missing'};
  // }

  const operatorId = parseInt(id);

  const transactions = await getLatestTransactions();
  const blocks = transactions.result;

  if (!blocks || blocks.length === 0) {
    res.status(204).send("No transactions found");
    return;
  }

  res.status(200).json(blocks);
}

export default async function (req, res) {
  if (req.method === "GET") {
    return updatePackages(req, res);
  }
  res.status(405).send("Method Not Allowed");
}