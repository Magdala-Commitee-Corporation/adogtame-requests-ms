import type { SQSBatchResponse, SQSEvent } from "aws-lambda";

/**
 * Consumes the events this service subscribes to (adog_MS.md §7).
 * Each SQS record wraps an SNS notification whose `tipo` attribute names the event.
 * Handlers per event type are added with the business logic (I1).
 */
export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  for (const record of event.Records) {
    const notification = JSON.parse(record.body);
    const tipo = notification.MessageAttributes?.tipo?.Value ?? "desconocido";
    console.log(JSON.stringify({ service: "requests", tipo, messageId: notification.MessageId }));
  }
  return { batchItemFailures: [] };
};
