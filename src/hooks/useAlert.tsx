import React, { useState } from 'react';
import { Alert, AlertButton, AlertType } from '../components/Alert';

interface UseAlertReturn {
  alert: (title: string, message?: string, buttons?: AlertButton[], type?: AlertType) => void;
  AlertComponent: React.ReactNode;
}

export const useAlert = (): UseAlertReturn => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | undefined>();
  const [buttons, setButtons] = useState<AlertButton[] | undefined>();
  const [type, setType] = useState<AlertType>('info');

  const showAlert = (
    alertTitle: string,
    alertMessage?: string,
    alertButtons?: AlertButton[],
    alertType: AlertType = 'info'
  ) => {
    setTitle(alertTitle);
    setMessage(alertMessage);
    setButtons(alertButtons);
    setType(alertType);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return {
    alert: showAlert,
    AlertComponent: (
      <Alert
        visible={visible}
        title={title}
        message={message}
        type={type}
        buttons={buttons}
        onClose={hideAlert}
      />
    ),
  };
};

