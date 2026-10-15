
const $ = id => document.getElementById(id);

const articlesEl = $("articles");
const statusEl = $("status");
const adminEl = $("admin");
const editorEl = $("editor");
const loginForm = $("loginForm");
const articleForm = $("articleForm");

let articles = [];
let editingId = null;

function showStatus(message) {
  statusEl.textContent = message;
}

function isOwner(user) {
  return Boolean(user && user.id === OWNER_UID);
}

function makeArticleCard(article) {
  const card = document.createElement("article");
  card.className = "article";

  const title = document.createElement("h2");
  title.textContent = article.title;

  const category = document.createElement("p");
  category.className = "muted";
  category.textContent = article.category;

  const content = document.createElement("p");
  content.textContent = article.content;
  content.style.whiteSpace = "pre-wrap";

  const updated = document.createElement("small");
  updated.className = "muted";
  updated.textContent =
    "Updated: " + new Date(article.updated_at).toLocaleDateString();

  card.append(title, category, content, updated);
  return card;
}

async function loadArticles() {
  articlesEl.textContent = "Loading articles...";

  const { data, error } = await supabaseClient
    .from("wiki_articles")
    .select("id,slug,title,category,content,updated_at")
    .order("title");

  if (error) {
    articlesEl.textContent = "Could not load wiki articles.";
    return;
  }

  articles = data || [];
  renderArticles();
  if (editorEl.style.display !== "none") renderManageArticles();
}

function renderArticles() {
  const query = $("search").value.trim().toLowerCase();
  articlesEl.replaceChildren();

  const filtered = articles.filter(article =>
    [article.title, article.category, article.content]
      .some(value => value.toLowerCase().includes(query))
  );

  if (!filtered.length) {
    articlesEl.textContent = "No articles found.";
    return;
  }

  filtered.forEach(article =>
    articlesEl.append(makeArticleCard(article))
  );
}

$("search").addEventListener("input", renderArticles);

$("adminLink").addEventListener("click", async () => {
  adminEl.style.display = "block";
  await checkSession();
});

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  showStatus("Signing in...");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: $("email").value,
    password: $("password").value
  });

  if (error) {
    showStatus("Sign-in failed. Check your email and password.");
    return;
  }

  await checkSession();
});

async function checkSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    showStatus("Could not check login.");
    return;
  }

  const user = data.session?.user;

  if (isOwner(user)) {
    loginForm.style.display = "none";
    editorEl.style.display = "block";
    editorEl.classList.remove("hidden");
    await loadArticles();
    showStatus("Owner signed in.");
  } else {
    editorEl.style.display = "none";
    editorEl.classList.add("hidden");
    loginForm.style.display = "block";
  }
}

$("logout").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  resetForm();
  await checkSession();
  showStatus("Signed out.");
});

function resetForm() {
  editingId = null;
  articleForm.reset();
  $("formTitle").textContent = "Create article";
}

$("newArticle").addEventListener("click", resetForm);

articleForm.addEventListener("submit", async event => {
  event.preventDefault();

  const { data, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError || !isOwner(data.user)) {
    showStatus("Owner login required.");
    await checkSession();
    return;
  }

  const article = {
    title: $("title").value.trim(),
    slug: $("slug").value.trim(),
    category: $("category").value.trim(),
    content: $("content").value
  };

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(article.slug)) {
    showStatus("Use lowercase letters, numbers, and hyphens in the slug.");
    return;
  }

  showStatus("Saving...");

  const result = editingId
    ? await supabaseClient.from("wiki_articles")
        .update(article).eq("id", editingId)
    : await supabaseClient.from("wiki_articles").insert(article);

  if (result.error) {
    showStatus("Save failed: " + result.error.message);
    return;
  }

  resetForm();
  showStatus("Article saved!");
  await loadArticles();
});

function renderManageArticles() {
  const container = $("manageArticles");
  container.replaceChildren();

  articles.forEach(article => {
    const row = document.createElement("div");
    row.className = "article";

    const name = document.createElement("p");
    name.textContent = article.title;

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.addEventListener("click", () => {
      editingId = article.id;
      $("title").value = article.title;
      $("slug").value = article.slug;
      $("category").value = article.category;
      $("content").value = article.content;
      $("formTitle").textContent = "Edit article";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!confirm(`Delete "${article.title}"?`)) return;

      const { data, error: authError } =
        await supabaseClient.auth.getUser();

      if (authError || !isOwner(data.user)) {
        showStatus("Owner login required.");
        return;
      }

      const { error } = await supabaseClient
        .from("wiki_articles")
        .delete()
        .eq("id", article.id);

      if (error) {
        showStatus("Delete failed: " + error.message);
        return;
      }

      showStatus("Article deleted.");
      await loadArticles();
    });

    row.append(name, edit, remove);
    container.append(row);
  });
}

supabaseClient.auth.onAuthStateChange(() => {
  setTimeout(() => checkSession(), 0);
});

checkSession();
loadArticles();
