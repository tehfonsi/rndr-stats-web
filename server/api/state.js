import { addState } from './utils/database';

const newState = async (req, res) => {
  const {type, node_id} = req.body;

  const state = {
    type,
    node_id
  };

  try {
      await addState(state);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
    return;
  }

  res.status(200).send();
}

export default async function (req, res) {
  if (req.method === "POST") {
    return newState(req, res);
  }
  res.status(405).send("Method Not Allowed");
}