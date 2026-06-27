import React, { useRef } from 'react';

interface UploadFieldProps {
  label?: string;
  buttonText?: string;
  buttonIcon?: string;
  accept?: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

const UploadField: React.FC<UploadFieldProps> = ({
  label,
  buttonText = 'اختر صوره',
  buttonIcon = '📤',
  accept = '*/*',
  multiple = false,
  onChange,
  disabled = false,
  required = false,
  className = '',
  variant = 'primary',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  const getButtonStyles = () => {
    const styles = {
      primary: {
        background: '#2b6cb0',
        color: 'white',
        border: 'none',
      },
      secondary: {
        background: '#718096',
        color: 'white',
        border: 'none',
      },
      outline: {
        background: 'transparent',
        color: '#2b6cb0',
        border: '2px solid #2b6cb0',
      },
    };
    return styles[variant] || styles.primary;
  };

  const buttonStyle = {
    ...getButtonStyles(),
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  };

  return (
    <div className={`upload-field ${className}`}>
      {label && (
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
          {label}
          {required && <span style={{ color: 'red', marginRight: '4px' }}>*</span>}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onChange(e.target.files)}
        disabled={disabled}
        required={required}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!disabled && variant !== 'outline') {
            e.currentTarget.style.opacity = '0.8';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && variant !== 'outline') {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        {buttonIcon} {buttonText}
      </button>
    </div>
  );
};

export default UploadField;
