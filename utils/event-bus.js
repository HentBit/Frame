import { EventEmitter } from "events";

class EventBus extends EventEmitter {}
const eventBus = new EventBus();

export const BOOK_EVENTS = {
  CREATED: "book_created",
  UPDATED: "book_updated",
  DELETED: "book_deleted"
};

export default eventBus;
