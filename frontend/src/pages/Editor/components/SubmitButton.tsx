import "./SubmitButton.css"

interface SubmitButtonProps {
    onClick: () => void;
}

function SubmitButton({ onClick }: SubmitButtonProps) {
    return (
        <button type="button" className="submit-button" onClick={onClick}>
            Send to backend
        </button>
    );
}

export default SubmitButton;