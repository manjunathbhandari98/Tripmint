import type { MessageType } from "../messageTemplate";

export type DraftType = MessageType & {
  id: string;
  savedAt: string;
};