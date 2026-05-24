import "./ButtonMenu.css";

export function ButtonMenu({ text, onClick }) {
  return (
    <button onClick={onClick} className="button-menu">
      {text}
    </button>
  );
}
