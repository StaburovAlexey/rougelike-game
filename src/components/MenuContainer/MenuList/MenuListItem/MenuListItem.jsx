
export function MenuListItem({ title, onClick, type }) {

  return <li onClick={() => onClick(type)}>{title}</li>;
}
