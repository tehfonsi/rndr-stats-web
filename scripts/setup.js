import { setup } from '../functions/utils/database';

const bootstrap = async () => {
  await setup();
}

bootstrap();