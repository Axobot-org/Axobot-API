import {
  CrowdinFileAddedEvent,
  CrowdinFileFullyTranslatedEvent,
  CrowdinFileUpdatedEvent,
  CrowdinSourceStringAddedEvent,
  CrowdinSourceStringDeletedEvent,
  CrowdinSourceStringUpdatedEvent,
} from "./events";

export type CrowdinFileEvent =
  | CrowdinFileAddedEvent
  | CrowdinFileFullyTranslatedEvent
  | CrowdinFileUpdatedEvent;

export type CrowdinStringEvent =
  | CrowdinSourceStringAddedEvent
  | CrowdinSourceStringUpdatedEvent
  | CrowdinSourceStringDeletedEvent;

export type AnyCrowdinEvent = CrowdinFileEvent | CrowdinStringEvent;

export interface CrowdinBatchEvents {
  events: AnyCrowdinEvent[];
}

export function isFileEvent(object: AnyCrowdinEvent): object is CrowdinFileEvent {
  return object.event.startsWith("file.");
}

export function isStringEvent(object: AnyCrowdinEvent): object is CrowdinStringEvent {
  return object.event.startsWith("string.");
}
