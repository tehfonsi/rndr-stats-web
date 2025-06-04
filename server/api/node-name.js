import { sha256 } from 'js-sha256';
import { getPasswords, updateName } from './utils/database';

const changeName = async (req, res) => {
  let {node_id, name, password} = req.body;

  password = sha256(password);

  let savedPasswords;
  try {
    savedPasswords = (await getPasswords(node_id)).map((row) => row.password);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
    return;
  }

  const correctPassword = savedPasswords.map((p) => p !== null && p === password).reduce((p, c) => p && c);

  if (!correctPassword) {
    await new Promise(r => setTimeout(r, 1000));
    console.warn('Wrong password');
    res.status(403).send('Password does not match');
    return;
  }

  try {
    await updateName(node_id, name);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
    return;
  }
  
  res.status(200).send();
}

export default async function (req, res) {
  if (req.method === "POST") {
    return changeName(req, res);
  }
  res.status(405).send("Method Not Allowed");
}