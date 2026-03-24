import { SessionEntryModal } from './SessionEntryModal';

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (sessionId: string) => void | Promise<void>;
  preselectedClientId?: string;
  initialDate?: string;
  initialTime?: string;
}

export function NewSessionModal(props: NewSessionModalProps) {
  return <SessionEntryModal {...props} mode="schedule" />;
}
