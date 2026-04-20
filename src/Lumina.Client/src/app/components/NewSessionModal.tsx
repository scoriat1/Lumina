import { SessionEntryModal } from './SessionEntryModal';

interface NewSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (sessionId: string) => void | Promise<void>;
  preselectedClientId?: string;
  preselectedBillingMode?: 'payPerSession' | 'package';
  preselectedPackageId?: string;
  preselectedClientPackageId?: string;
  prefilledSessionType?: string;
  prefilledDuration?: number;
  preselectedLocation?: 'zoom' | 'phone' | 'office';
  forceSingleSession?: boolean;
  initialDate?: string;
  initialTime?: string;
}

export function NewSessionModal(props: NewSessionModalProps) {
  return <SessionEntryModal {...props} mode="schedule" />;
}
