import type { IncomingMessage, ServerResponse } from 'http';

export default async (req: IncomingMessage, res: ServerResponse) => {
  console.log(req.url);
  res.writeHead(301, { Location: '/' });
  res.end();
  // if (req.url === '/login') {
  //   res.writeHead(301, { Location: '/' });
  //   res.end();
  // } else if (isAuthenticated || req.url === '/login') {
  //   next();
  // } else {
  //   res.writeHead(301, { Location: '/login' });
  //   res.end();
  // }
};
