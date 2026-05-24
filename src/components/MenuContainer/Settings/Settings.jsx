import "./Settings.css";
export function Settings({ children }) {
  return (
    <div className="settings-container">
      <h1>Настройки</h1>
      {children}
    </div>
  );
}
