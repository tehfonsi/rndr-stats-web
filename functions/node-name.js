import { sha256 } from 'js-sha256';
import { getPasswords, updateName } from './utils/database';

const changeName = async (event) => {
  let {node_id, name, password} = JSON.parse(event.body);

  password = sha256(password);

  let savedPasswords;
  try {
    savedPasswords = (await getPasswords(node_id)).map((row) => row.password);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }

  const correctPassword = savedPasswords.map((p) => p !== null && p === password).reduce((p, c) => p && c);

  if (!correctPassword) {
    await new Promise(r => setTimeout(r, 1000));
    console.warn('Wrong password');
    return {
      statusCode: 403,
      body: 'Password does not match'
    };
  }

  try {
    await updateName(node_id, name);
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
  
  return {
    statusCode: 200
  };
}

export async function handler(event, _context) {
  if (event.httpMethod === "POST") {
    return changeName(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}