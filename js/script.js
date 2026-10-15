
const $ = id => document.getElementById(id);
const status = (id, message) => {
  $(id).textContent = message;
};

const SERVER_IP = "frozensv.minehut.gg";

const products = [
  {
    id: "supporter",
    name: "Supporter",
    price: 2.99,
    description: "Example rank package. Not a real purchase."
  },
  {
    id: "elite",
    name: "Elite",
    price: 5.99,
    description: "Example rank package. Benefits are not configured."
  },
  {
    id: "cosmetics",
    name: "Cosmetics Pack",
    price: 1.99,
    description: "Example cosmetic package."
  },
  {
    id: "keys",
    name: "Mystery Keys",
    price: 3.99,
    description: "Example item. No keys will be delivered."
  }
];

// Edit or add wiki articles here.
const wikiArticles = [
  {
    title: "Welcome to FrozenSV",
    category: "Getting Started",
    content:
      "Welcome to FrozenSV, a survival Minecraft server!\n\n" +
      "Explore the world, gather resources, build a home, " +
      "and enjoy your adventure.\n\n" +
      "Server IP: " + SERVER_IP + "\n" +
      "Edition: Minecraft Java"
  },
  {
    title: "Survival Tips",
    category: "Guides",
    content:
      "• Gather wood and make basic tools.\n" +
      "• Build a safe shelter before night.\n" +
      "• Keep food with you while exploring.\n" +
      "• Store valuable items somewhere safe.\n" +
      "• Be respectful to other players."
  },
  {
    title: "Server Rules",
    category: "Rules",
    content:
      "1. Treat other players with respect.\n" +
      "2. Do not cheat or exploit bugs.\n" +
      "3. Do not spam or harass players.\n" +
      "4. Follow staff instructions.\n\n" +
      "Edit this article to match your official rules."
  },
  {
    title: "Useful Information",
    category: "Information",
    content:
      "Server address: " + SERVER_IP + "\n" +
      "Game mode: Vanilla Survival\n\n" +
      "Check this page for server information."
  }
];

let cart = [];

try {
  const saved = JSON.parse(
    localStorage.getItem("frozensv-cart") || "[]"
  );

  if (Array.isArray(saved)) {
    cart = saved.filter(line =>
      products.some(product => product.id === line.id) &&
      Number.isInteger(line.quantity) &&
      line.quantity > 0 &&
      line.quantity <= 99
    );
  }
} catch {
  cart = [];
}

function money(value) {
  return "€" + value.toFixed(2);
}

function saveCart() {
  localStorage.setItem("frozensv-cart", JSON.stringify(cart));
  renderCart();
}

function renderProducts() {
  const grid = $("storeGrid");
  grid.replaceChildren();

  for (const product of products) {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description;
    description.className = "muted";

    const price = document.createElement("p");
    price.className = "price";
    price.textContent = money(product.price);

    const button = document.createElement("button");
    button.className = "primary";
    button.textContent = "Add to cart";

    button.addEventListener("click", () => {
      const line = cart.find(item => item.id === product.id);

      if (line) {
        if (line.quantity >= 99) {
          status("cartStatus", "Maximum quantity reached.");
          return;
        }

        line.quantity++;
      } else {
        cart.push({
          id: product.id,
          quantity: 1
        });
      }

      saveCart();
      status("cartStatus", "Added to demo cart.");
    });

    card.append(title, description, price, button);
    grid.append(card);
  }
}

function renderCart() {
  const container = $("cartItems");
  container.replaceChildren();

  let total = 0;
  let count = 0;

  for (const line of cart) {
    const product = products.find(item => item.id === line.id);
    if (!product) continue;

    total += product.price * line.quantity;
    count += line.quantity;

    const row = document.createElement("div");
    row.className = "cart-line";

    const label = document.createElement("span");
    label.textContent =
      `${product.name} × ${line.quantity} — ` +
      money(product.price * line.quantity);

    const remove = document.createElement("button");
    remove.textContent = "Remove";

    remove.addEventListener("click", () => {
      cart = cart.filter(item => item.id !== line.id);
      saveCart();
      status("cartStatus", "Item removed.");
    });

    row.append(label, remove);
    container.append(row);
  }

  if (!cart.length) {
    container.textContent = "Your cart is empty.";
  }

  $("cartTotal").textContent = "Total: " + money(total);
  $("cartCount").textContent = count;
}

$("clearCart").addEventListener("click", () => {
  cart = [];
  saveCart();
  status("cartStatus", "Cart cleared.");
});

$("checkout").addEventListener("click", () => {
  status(
    "cartStatus",
    "Demo only: checkout is not enabled. No payment was taken."
  );
});

$("copyIp").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(SERVER_IP);
    status("copyStatus", "Server IP copied!");
  } catch {
    status(
      "copyStatus",
      "Copy failed. Server IP: " + SERVER_IP
    );
  }
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    const target = $(button.dataset.go);

    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

function renderWiki() {
  const container = $("wikiArticles");
  const query = $("wikiSearch").value.trim().toLowerCase();

  container.replaceChildren();

  const filtered = wikiArticles.filter(article =>
    [article.title, article.category, article.content]
      .some(value => value.toLowerCase().includes(query))
  );

  if (!filtered.length) {
    container.textContent = "No matching articles found.";
    return;
  }

  for (const article of filtered) {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = article.title;

    const category = document.createElement("span");
    category.className = "pill";
    category.textContent = article.category;

    const content = document.createElement("p");
    content.className = "article-content";
    content.textContent = article.content;

    card.append(title, category, content);
    container.append(card);
  }
}

$("wikiSearch").addEventListener("input", renderWiki);

renderProducts();
renderCart();
renderWiki();
