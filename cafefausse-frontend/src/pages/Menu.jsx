import { MENU } from "../content";

export default function Menu() {
  return (
    <div className="wrap">
      <header className="page-intro">
        <h1>Menu</h1>
        <p>Dinner, listed by course.</p>
      </header>
      <div className="menu-groups">
        {MENU.map((group) => (
          <section key={group.category} className="menu-group">
            <h2>{group.category}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.name} className={item.image ? "dish dish-feature" : "dish"}>
                  {item.image ? <img src={item.image} alt="Ribeye steak" /> : null}
                  <div>
                    <div className="dish-line">
                      <h3>{item.name}</h3>
                      <p className="price">{item.price}</p>
                    </div>
                    <p>{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
