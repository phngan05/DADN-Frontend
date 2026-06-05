import toast, { Toast } from 'react-hot-toast';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

const CustomToast = ({ t, type, title, message, icon }: { 
    t: Toast, 
    type: string, 
    title: string, 
    message: string, 
    icon: React.ReactNode 
}) => {
  return (
    <div
      className={`toast ${type}`}
      style={{
        opacity: t.visible ? 1 : 0,
        transition: 'opacity 300ms ease-in-out',
      }}
    >
      <div className="container-1">
        {icon}
      </div>
      
      <div className="container-2">
        <p className='text-lg text-gray-600 font-semibold'>{title}</p>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <button onClick={() => toast.dismiss(t.id)}>
        <X size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export const notify = {
  success: (message: string) => {
    toast.custom(
      (t) => <CustomToast t={t} type="success" title="Success" message={message} icon={<CheckCircle2 strokeWidth={2} />} />,
      { duration: 3000 }
    );
  },

  error: ( message: string) => {
    toast.custom(
      (t) => <CustomToast t={t} type="error" title="Error" message={message} icon={<XCircle strokeWidth={2} />} />,
      { duration: 4000 }
    );
  },

  warning: ( message: string) => {
    toast.custom(
      (t) => <CustomToast t={t} type="warning" title="Warning" message={message} icon={<AlertTriangle strokeWidth={2} />} />,
      { duration: 3500 }
    );
  },

  info: (message: string) => {
    toast.custom(
      (t) => <CustomToast t={t} type="info" title="Info" message={message} icon={<Info strokeWidth={2} />} />,
      { duration: 3000 }
    );
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};