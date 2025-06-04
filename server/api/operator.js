import hash from './utils/hash';
import { setOperator } from './utils/database';

export default async function (req, res) {
  if (req.method === "PUT") {
    const {eth_address} = req.body;
    const id = hash(eth_address);

    const operator = {
      id,
      eth_address
    };

    let result;
    try {
      result = await setOperator(operator)
    } catch (error) {
      console.error(error);
      res.status(500).json(error);
      return;
    }

    res.status(200).json(id);
    return;
  }
  res.status(405).send("Method Not Allowed");
}