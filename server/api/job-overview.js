import { getJobOverview } from './utils/database';

const getOverview = async (req, res) => {
  let {id, start, end} = req.query;

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

  if (!id) {
    res.status(400).send('id parameter is missing');
    return;
  }

  let result;
  try {
    result = await getJobOverview(parseInt(id), start, end)
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
    return;
  }
  
  res.status(200).json(result);
}

export default async function (req, res) {
  if (req.method === "GET") {
    return getOverview(req, res);
  }
  res.status(405).send("Method Not Allowed");
}