import "./FrameContainer.css";

export function FrameContainer({ children, className = "", ref }) {
  return (
    <div className={`frame-container ${className}`} ref={ref}>
      <div className="frame-container__content">{children}</div>
    </div>
  );
}
