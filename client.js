const yargs = require('yargs/yargs');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('@grpc/grpc-js');
const path = require('path');
const winston = require('winston');

const logger = (() => {
  const colorizer = winston.format.colorize();

  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize({
        colors: {
          timestamp: 'dim',
          prefix: 'blue',
          field: 'cyan',
          debug: 'grey',
        },
      }),
      winston.format.printf((info) => {
        const { timestamp, level, message, ...fields } = info;
        const timestampColor = colorizer.colorize('timestamp', timestamp);

        const extraFields = Object.entries(fields)
          .map(
            ([key, value]) =>
              `${colorizer.colorize('field', `${key}`)}=${value}`,
          )
          .join(' ');

        return `${timestampColor} ${level} ${message} ${extraFields}`;
      }),
    ),
    transports: [
      new winston.transports.Console({
        level: 'debug',
      }),
    ],
  });

  return logger;
})();

const argv = yargs(process.argv.slice(2))
  .options({
    host: {
      type: 'string',
      default: 'localhost:50051',
      alias: 'H',
    },
    // silent: { type: 'boolean', default: false, alias: 's' },
    parallelism: { type: 'number', default: 3, alias: 'p' },
    delayMs: { type: 'number', default: 50, alias: 'd' },
  })
  .parseSync();

const PROTO_SRC_ROOT = path.join(__dirname, 'proto');

const protoRoot = grpc.loadPackageDefinition(
  protoLoader.loadSync(
    path.join(PROTO_SRC_ROOT, 'testservice/testservice.proto'),
    {
      keepCase: true,
      includeDirs: [PROTO_SRC_ROOT],
    },
  ),
);

const client = new protoRoot.testservice.TestService(
  argv.host,
  argv.host.endsWith(':443')
    ? grpc.credentials.createSsl()
    : grpc.credentials.createInsecure(),
);

async function requestFoobars(fooId) {
  const request = {
    foo_id: fooId ?? '0',
  };

  const txns = await new Promise((resolve, reject) => {
    client.GetFoobars(request, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(resp);
    });
  });

  return txns.foobars;
}

async function requestAll() {
  const { foos } = await new Promise((resolve, reject) => {
    client.GetFoos({}, (err, resp) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(resp);
    });
  });

  for (const foo of foos) {
    await requestFoobars(foo.id);
  }
}

const delay = async (delayMs) =>
  await new Promise((resolve) => setTimeout(resolve, delayMs));

let successes = 0,
  failures = 0;

async function main() {
  logger.info('Starting', {
    host: argv.host,
    parallelism: argv.parallelism,
    delayMs: argv.delayMs,
  });

  async function loop(id) {
    logger.info('starting loop', { id });
    for (;;) {
      try {
        await requestAll();
        logger.info('request complete', { id });
        ++successes;
      } catch (e) {
        logger.info(e, { id });
        ++failures;
      }
      await delay(argv.delayMs);
    }
  }

  const promises = [...Array(argv.parallelism).keys()].map((id) => loop(id));
  await Promise.all(promises);
}

main()
  .then(() => {
    logger.info('EXIT');
  })
  .catch((e) => {
    logger.error(e);
  });

process.on('SIGINT', function () {
  logger.info('Caught interrupt signal, exiting', {
    successes,
    failures,
  });
  process.exit();
});
