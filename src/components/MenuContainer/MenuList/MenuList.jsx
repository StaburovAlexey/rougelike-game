import "./MenuList.css";

export function MenuList({ children, ref }) {
  return (
    <div className="menu-list" ref={ref}>
      {children}
    </div>
  );
}
