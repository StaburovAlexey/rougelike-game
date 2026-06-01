import "./ButtonMenu.css";

export function ButtonMenu({ text, onClick, disabled = false }) {
  return (
    <button onClick={onClick} className="button-menu" disabled={disabled}>
      {text}
    </button>
  );
}
