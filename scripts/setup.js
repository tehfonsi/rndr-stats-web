const Database = require('../functions/utils/database');

const bootstrap = async () => {
  await Database.setup();
}

bootstrap();