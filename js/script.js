
const $ = id => document.getElementById(id);
const status = (id, message) => { $(id).textContent = message; };

const products = [
  { id: "supporter", name: "Supporter", price: 2.99,
    description: "Example support package. Not a real purchase." },
  { id: "elite", name: "Elite", price: 5.99,
    description: "Example rank package. Benefits are not configured." },
  { id: "cosmetics", name: "Cosmetics Pack", price: 1.99,
    description: "Example cosmetic package." },
  { id: "keys", name: "Mystery Keys", price: 3.99,
    description: "Example item. No keys will be delivered." }
];

let currentUser = null;
let wikiArticles = [];
let editingId = null;
let cart = [];

try {
  const saved = JSON.parse(localStorage.getItem("frozensv-cart") || "[]");
  if (Array.isArray(saved)) cart = saved.filter(line =>
    products.some(product => product.id === line.id) &&
    Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99
  );
} catch { cart = []; }

function isOwner(user) {
  return Boolean(user && user.id === OWNER_UID);
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
        if (line.quantity >= 99) return status("cartStatus", "Maximum quantity reached.");
        line.quantity++;
      } else {
        cart.push({ id: product.id, quantity: 1 });
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
    label.textContent = `${product.name} × ${line.quantity} — ${money(product.price * line.quantity)}`;

    const remove = document.createElement("button");
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      cart = cart.filter(item => item.id !== line.id);
      saveCart();
    });

    row.append(label, remove);
    container.append(row);
  }

  if (!cart.length) container.textContent = "Your cart is empty.";
  $("cartTotal").textContent = "Total: " + money(total);
  $("cartCount").textContent = count;
}

$("clearCart").addEventListener("click", () => {
  cart = [];
  saveCart();
  status("cartStatus", "Cart cleared.");
});

$("checkout").addEventListener("click", () => {
  status("cartStatus",
    "Demo only: checkout is not enabled. No payment was taken.");
});

$("copyIp").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("frozensv.minehut.gg");
    status("copyStatus", "Server IP copied!");
  } catch {
    status("copyStatus", "Copy failed. Server IP: frozensv.minehut.gg");
  }
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    const target = $(button.dataset.go);
    if (target) target.scrollIntoView({ behavior: "smooth" });
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
    container.textContent = "No matching articles yet.";
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

    const updated = document.createElement("small");
    updated.className = "muted";
    updated.textContent = "Updated " +
      new Date(article.updated_at).toLocaleDateString();

    card.append(title, category, content, updated);

    if (isOwner(currentUser)) {
      const edit = document.createElement("button");
      edit.textContent = "Edit";
      edit.addEventListener("click", () => beginEdit(article));

      const remove = document.createElement("button");
      remove.textContent = "Delete";
      remove.addEventListener("click", () => deleteArticle(article));

      card.append(edit, remove);
    }

    container.append(card);
  }
}

$("wikiSearch").addEventListener("input", renderWiki);

async function loadWiki() {
  const { data, error } = await supabaseClient
    .from("wiki_articles")
    .select("id,slug,title,category,content,updated_at")
    .order("title");

  if (error) {
    $("wikiArticles").textContent = "Wiki database is not configured yet.";
    return;
  }

  wikiArticles = data || [];
  renderWiki();
}

function updateAccountUI() {
  const signedIn = Boolean(currentUser);
  $("accountNav").classList.toggle("hidden", signedIn);
  $("profileNav").classList.toggle("hidden", !signedIn);
  $("profile").classList.toggle("hidden", !signedIn);
  $("loginForm").classList.toggle("hidden", signedIn);
  $("registerForm").classList.toggle("hidden", signedIn);
  $("admin").classList.toggle("hidden", !isOwner(currentUser));

  if (signedIn) {
    $("profileEmail").textContent = currentUser.email || "";
    $("profileName").textContent =
      currentUser.user_metadata?.display_name || "Player";
  }

  renderWiki();
}

$("registerForm").addEventListener("submit", async event => {
  event.preventDefault();

  const displayName = $("registerName").value.trim();
  if (!displayName) return status("authStatus", "Enter a display name.");

  const { data, error } = await supabaseClient.auth.signUp({
    email: $("registerEmail").value.trim(),
    password: $("registerPassword").value,
    options: { data: { display_name: displayName } }
  });

  if (error) return status("authStatus", error.message);

  status("authStatus", data.session
    ? "Account created!"
    : "Account created. Check your email to confirm it.");

  await refreshUser();
});

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: $("loginEmail").value.trim(),
    password: $("loginPassword").value
  });

  if (error) return status("authStatus", "Sign-in failed. Check your details.");

  await refreshUser();
  status("authStatus", "Signed in successfully.");
});

$("resetPassword").addEventListener("click", async () => {
  const email = $("loginEmail").value.trim();
  if (!email) return status("authStatus", "Enter your email first.");

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
  status("authStatus", error
    ? error.message
    : "If the account exists, a password reset email will be sent.");
});

$("signOut").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) return status("authStatus", error.message);

  await refreshUser();
  status("authStatus", "Signed out.");
});

async function refreshUser() {
  const { data, error } = await supabaseClient.auth.getUser();
  currentUser = error ? null : data.user;
  updateAccountUI();
}

function beginEdit(article) {
  editingId = article.id;
  $("articleTitle").value = article.title;
  $("articleSlug").value = article.slug;
  $("articleCategory").value = article.category;
  $("articleContent").value = article.content;
  status("globalStatus", "Editing " + article.title);
  $("admin").scrollIntoView({ behavior: "smooth" });
}

$("cancelEdit").addEventListener("click", () => {
  editingId = null;
  $("articleForm").reset();
  status("globalStatus", "Ready for a new article.");
});

$("articleForm").addEventListener("submit", async event => {
  event.preventDefault();

  const { data, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !isOwner(data.user)) {
    return status("globalStatus", "Owner login required.");
  }

  const article = {
    title: $("articleTitle").value.trim(),
    slug: $("articleSlug").value.trim(),
    category: $("articleCategory").value.trim(),
    content: $("articleContent").value
  };

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(article.slug)) {
    return status("globalStatus", "Use lowercase letters, numbers, and hyphens in the slug.");
  }

  const result = editingId
    ? await supabaseClient.from("wiki_articles")
        .update(article).eq("id", editingId)
    : await supabaseClient.from("wiki_articles").insert(article);

  if (result.error) return status("globalStatus", result.error.message);

  editingId = null;
  $("articleForm").reset();
  status("globalStatus", "Article saved.");
  await loadWiki();
});

async function deleteArticle(article) {
  if (!confirm(`Delete "${article.title}"?`)) return;

  const { data, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !isOwner(data.user)) {
    return status("globalStatus", "Owner login required.");
  }

  const { error } = await supabaseClient
    .from("wiki_articles")
    .delete()
    .eq("id", article.id);

  if (error) return status("globalStatus", error.message);

  status("globalStatus", "Article deleted.");
  await loadWiki();
}

supabaseClient.auth.onAuthStateChange(() => {
  setTimeout(refreshUser, 0);
});

renderProducts();
renderCart();
refreshUser();
loadWiki();
