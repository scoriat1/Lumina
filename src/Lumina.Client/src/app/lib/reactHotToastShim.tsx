import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';

type ToastOptions = {
  duration?: number;
};

type ToasterProps = {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  toastOptions?: ToastOptions;
};

export function Toaster({ position = 'top-right', toastOptions }: ToasterProps) {
  return <SonnerToaster position={position} duration={toastOptions?.duration} />;
}

const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
};

export default toast;
