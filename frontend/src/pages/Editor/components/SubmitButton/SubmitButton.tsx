interface SubmitButtonProps {
    onClick: () => void;
    disabled?: boolean;
    label?: string;
}

function SubmitButton({ onClick, disabled, label = "Submit" }: SubmitButtonProps) {
    return (
        <button
            type="button"
            className="submit-button"
            onClick={onClick}
            disabled={disabled}
        >
            {label}
        </button>
    );
}

export default SubmitButton;