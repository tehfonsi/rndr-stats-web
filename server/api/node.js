import hash from './utils/hash';
import { setNode } from './utils/database';

const newNode = async (req, res) => {
  let {eth_address, node_id, score, previews_sent, jobs_completet, thumbnails_sent, gpus, password} = req.body;
  const operator_id = hash(eth_address);

  score = !!score ? parseInt(score) : 0;
  previews_sent = !!previews_sent ? parseInt(previews_sent) : 0;
  jobs_completet = !!jobs_completet ? parseInt(jobs_completet) : 0;
  thumbnails_sent = !!thumbnails_sent ? parseInt(thumbnails_sent) : 0;

  const node = {
    id: node_id,
    score,
    previews_sent,
    jobs_completed: jobs_completet,
    thumbnails_sent,
    gpus,
    operator: operator_id,
    password
  };

  try {
    await setNode(node)
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
    return;
  }
  
  res.status(200).send();
}

export default async function (req, res) {
  if (req.method === "PUT") {
    return newNode(req, res);
  }
  res.status(405).send("Method Not Allowed");
}