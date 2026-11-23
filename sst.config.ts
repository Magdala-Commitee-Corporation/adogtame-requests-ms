/// <reference path="./.sst/platform/config.d.ts" />

const ROOT_DOMAIN = "vieerr.xyz";
const SERVICE = "requests";

export default $config({
  app(input) {
    return {
      name: "adogtame-requests",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: input?.stage === "prod",
      home: "aws",
      providers: {
        aws: { profile: "bier-personal", region: "us-east-1" },
      },
    };
  },
  async run() {
    const isProd = $app.stage === "prod";
    const base = isProd ? `adogtame.${ROOT_DOMAIN}` : `${$app.stage}.adogtame.${ROOT_DOMAIN}`;

    const api = new sst.aws.ApiGatewayV2("Api", {
      domain: { name: `${SERVICE}-api.${base}`, dns: sst.aws.dns() },
      transform: {
        // RNF-23: 50 requests/s with bursts of 100; API Gateway answers 429 above that.
        stage: (args) => {
          args.defaultRouteSettings = {
            ...args.defaultRouteSettings,
            throttlingRateLimit: 50,
            throttlingBurstLimit: 100,
          };
        },
      },
    });

    // Public functions: 30 s (I0.2, adog_ARCH.md §4.4).
    api.route("GET /health", { handler: "src/handlers/health.handler", timeout: "30 seconds", environment: { STAGE: $app.stage } });

    // Events (adog_ARCH.md §4.2): one queue per consumer, DLQ after 5 attempts.
    // Consumers time out at 60 s; SQS hides a message for 6x that time.
    const topicArn = (publisher: string) =>
      aws.ssm.getParameterOutput({
        name: `/adogtame/${$app.stage}/topics/${publisher}-events-arn`,
      }).value;

    const eventsDlq = new sst.aws.Queue("EventsDlq");
    const events = new sst.aws.Queue("Events", {
      visibilityTimeout: "6 minutes",
      dlq: { queue: eventsDlq.arn, retry: 5 },
    });
    events.subscribe({ handler: "src/handlers/events.handler", timeout: "60 seconds" });
    sst.aws.SnsTopic.get("DogsEvents", topicArn("dogs")).subscribeQueue("DogsEventsToQueue", events, {
      filter: { tipo: ["PerroAdoptado", "PerroEliminado"] },
    });
    sst.aws.SnsTopic.get("AuthEvents", topicArn("auth")).subscribeQueue("AuthEventsToQueue", events, {
      filter: { tipo: ["CuentaEliminada"] },
    });
    sst.aws.SnsTopic.get("RequestsEvents", topicArn("requests")).subscribeQueue("RequestsEventsToQueue", events, {
      filter: { tipo: ["CorreoSolicitado"] },
    });

    return { api: api.url, eventsQueue: events.url, eventsDlq: eventsDlq.url };
  },
});
