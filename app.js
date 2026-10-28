/*
  STONEMOOR COUNTY COMMUNITY HUB
  Owner: M_Scott06 | Owner UserID: 2333295251
  Second Signature: RBXJosh
  Roblox Group / Experience: Stonemoor County
  Original Publication: 15/10/2026
  Configure Supabase in the section below before enabling accounts and chat.
*/
const SUPABASE_URL = "https://tlxxqqzxirqlldkteeav.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_02VOqKbgX1gc5c-JQQHW1w_BhUgg6c8";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes("PASTE_") &&
  window.supabase && window.supabase.createClient;
const db = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = (id) => document.getElementById(id);
let authMode = "signup";
let currentUser = null;
let currentProfile = null;
let messageChannel = null;
let toastTimer = null;

function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 3200);
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {day:"numeric",month:"short",year:"numeric"});
}
function showAuth(mode) {
  authMode = mode;
  $("authTitle").textContent = mode === "signup" ? "Welcome to the community" : "Welcome back";
  $("authDescription").textContent = mode === "signup" ? "Create an account to join the conversation." : "Log in to your Stonemoor account.";
  $("nameLabel").hidden = mode === "login";
  $("displayName").hidden = mode === "login";
  $("displayName").required = mode === "signup";
  $("authSubmit").innerHTML = mode === "signup" ? "Create account <span>↗</span>" : "Log in <span>↗</span>";
  $("switchText").textContent = mode === "signup" ? "Already have an account?" : "New to Stonemoor?";
  $("switchAuth").textContent = mode === "signup" ? "Log in" : "Create an account";
  $("authFeedback").textContent = "";
  $("authModal").hidden = false;
  $("email").focus();
}
function closeAuth() { $("authModal").hidden = true; }
function setAccountUI() {
  const holder = $("accountActions");
  if (!currentUser) {
    holder.innerHTML = '<button class="btn btn-quiet" id="loginOpen">Log in</button><button class="btn btn-primary" id="signupOpen">Join community <span>↗</span></button>';
    $("loginOpen").onclick = () => showAuth("login");
    $("signupOpen").onclick = () => showAuth("signup");
    $("bannerSignup").textContent = "Create your account ↗";
    $("bannerSignup").onclick = () => showAuth("signup");
    $("chatInput").placeholder = configured ? "Log in to send a message…" : "Connect Supabase to enable chat…";
    $("chatInput").disabled = true;
    $("sendButton").disabled = true;
    $("chatSubheading").textContent = "A place to say hello";
    return;
  }
  const label = currentProfile?.display_name || currentUser.email?.split("@")[0] || "Member";
  holder.innerHTML = `<span class="signed-in-label">Hi, ${escapeHtml(label)}</span><button class="btn btn-outline" id="logoutButton">Log out</button>`;
  $("logoutButton").onclick = signOut;
  $("bannerSignup").textContent = "You're part of the community ✓";
  $("bannerSignup").onclick = () => toast("You're signed in and ready to go.");
  $("chatInput").placeholder = "Write a message…";
  $("chatInput").disabled = false;
  $("sendButton").disabled = false;
  $("chatSubheading").textContent = "Signed in as " + label;
}
async function signOut() {
  if (!db) return;
  const {error} = await db.auth.signOut();
  if (error) return toast(error.message);
  toast("You've been logged out.");
}
async function loadAnnouncements() {
  if (!db) return;
  const {data, error} = await db.from("announcements").select("id,title,body,category,created_at,author_name").order("created_at",{ascending:false}).limit(6);
  if (error) { console.warn("Announcements:", error.message); return; }
  if (!data?.length) {
    $("announcementList").innerHTML = '<div class="announcement-card"><h3>No announcements yet</h3><p>When staff publish an update, it will appear here.</p></div>';
    $("newsStatus").textContent = "No announcements have been published yet.";
    return;
  }
  $("announcementList").innerHTML = data.map((item,i) => `<article class="announcement-card ${i===0?"featured":""}"><div class="announcement-top"><span class="tag ${i===0?"":"tag-muted"}">${escapeHtml((item.category||"NEWS").toUpperCase())}</span><span class="date">${escapeHtml(formatDate(item.created_at))}</span></div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p><div class="card-foot"><span class="author-dot">SC</span><span>${escapeHtml(item.author_name||"Stonemoor Team")}</span><span class="read-more">Official update</span></div></article>`).join("");
  $("newsStatus").textContent = "Latest official announcements from Stonemoor County.";
}
function renderMessages(messages) {
  const node = $("chatMessages");
  if (!messages?.length) {
    node.innerHTML = '<div class="system-message">Welcome to the Stonemoor community lounge.</div><div class="empty-chat"><div class="empty-chat-icon">✦</div><strong>Be the first to say hello</strong><p>Keep it friendly and follow the community guidelines.</p></div>';
    return;
  }
  node.innerHTML = '<div class="system-message">Welcome to the Stonemoor community lounge.</div>' + messages.map(m => {
    const name = m.display_name || "Member";
    const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "";
    return `<div class="chat-message"><div class="message-avatar">${escapeHtml(name.slice(0,2).toUpperCase())}</div><div class="message-content"><div class="message-meta"><strong>${escapeHtml(name)}</strong><time>${escapeHtml(time)}</time></div><p>${escapeHtml(m.body)}</p></div></div>`;
  }).join("");
  node.scrollTop = node.scrollHeight;
}
async function loadMessages() {
  if (!db) return;
  const {data,error} = await db.from("messages").select("id,user_id,display_name,body,created_at").order("created_at",{ascending:true}).limit(100);
  if (error) { console.warn("Messages:",error.message); $("chatFoot").textContent = "Chat setup needs attention. Check the setup guide."; return; }
  renderMessages(data);
  if (messageChannel) db.removeChannel(messageChannel);
  messageChannel = db.channel("public-community-messages")
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"}, payload => {
      // Re-fetch so that every client sees the same ordered, policy-filtered message list.
      loadMessages();
    }).subscribe();
}
async function refreshSession(session) {
  currentUser = session?.user || null;
  currentProfile = null;
  if (db && currentUser) {
    const {data} = await db.from("profiles").select("id,display_name,role").eq("id",currentUser.id).maybeSingle();
    currentProfile = data || null;
  }
  setAccountUI();
  if (currentUser && currentProfile?.role === "admin") {
    const adminButton = document.createElement("button");
    adminButton.className = "btn btn-outline";
    adminButton.textContent = "Post announcement";
    adminButton.onclick = createAnnouncement;
    $("accountActions").prepend(adminButton);
  }
  if (currentUser && db) {
    $("chatFoot").textContent = "Signed in · Be kind and keep personal information private.";
    await loadMessages();
  } else {
    if (messageChannel && db) db.removeChannel(messageChannel);
    messageChannel = null;
    if (!configured) $("chatFoot").textContent = "Finish the Supabase setup to turn on accounts and live chat.";
    else $("chatFoot").textContent = "Log in to send messages. Community guidelines apply.";
  }
}
async function createAnnouncement() {
  const title = prompt("Announcement title:");
  if (!title?.trim()) return;
  const body = prompt("Announcement message:");
  if (!body?.trim()) return;
  const category = prompt("Category (NEWS, EVENT, UPDATE):","NEWS") || "NEWS";
  const {error} = await db.from("announcements").insert({title:title.trim(),body:body.trim(),category:category.trim().slice(0,24),author_id:currentUser.id,author_name:currentProfile?.display_name || "Stonemoor Team"});
  if (error) return toast("Couldn't publish: " + error.message);
  toast("Announcement published.");
  loadAnnouncements();
}
async function sendMessage(event) {
  event.preventDefault();
  if (!db || !currentUser) return showAuth("login");
  const body = $("chatInput").value.trim();
  if (!body) return;
  $("sendButton").disabled = true;
  const {error} = await db.from("messages").insert({user_id:currentUser.id,display_name:currentProfile?.display_name || currentUser.email?.split("@")[0] || "Member",body});
  $("sendButton").disabled = false;
  if (error) return toast("Message not sent: " + error.message);
  $("chatInput").value = "";
  await loadMessages();
}
async function submitAuth(event) {
  event.preventDefault();
  if (!db) {
    $("authFeedback").textContent = "First connect a Supabase project using the setup guide.";
    return;
  }
  const email = $("email").value.trim();
  const password = $("password").value;
  $("authSubmit").disabled = true;
  $("authFeedback").textContent = authMode === "signup" ? "Creating your account…" : "Logging in…";
  let result;
  if (authMode === "signup") {
    const display_name = $("displayName").value.trim();
    result = await db.auth.signUp({email,password,options:{data:{display_name}}});
    if (!result.error && !result.data.session) {
      $("authFeedback").textContent = "Account created. Check your email to confirm it, then log in.";
      $("authSubmit").disabled = false;
      return;
    }
  } else {
    result = await db.auth.signInWithPassword({email,password});
  }
  $("authSubmit").disabled = false;
  if (result.error) { $("authFeedback").textContent = result.error.message; return; }
  closeAuth();
  toast(authMode === "signup" ? "Welcome to Stonemoor County!" : "Welcome back!");
  await refreshSession(result.data.session);
}
function setup() {
  $("loginOpen").onclick = () => showAuth("login");
  $("signupOpen").onclick = () => showAuth("signup");
  $("bannerSignup").onclick = () => showAuth("signup");
  $("modalClose").onclick = closeAuth;
  $("authModal").addEventListener("click",e=>{if(e.target === $("authModal")) closeAuth();});
  $("switchAuth").onclick = () => showAuth(authMode === "signup" ? "login" : "signup");
  $("authForm").addEventListener("submit",submitAuth);
  $("chatForm").addEventListener("submit",sendMessage);
  $("menuToggle").onclick = () => $("nav").classList.toggle("open");
  document.querySelectorAll(".nav a").forEach(a=>a.addEventListener("click",()=>$("nav").classList.remove("open")));
  if (!configured) {
    $("newsStatus").textContent = "Preview mode: connect Supabase to enable real accounts, saved chat and live announcements.";
    $("chatFoot").textContent = "Preview mode · Supabase setup is required for live community features.";
    return;
  }
  db.auth.getSession().then(({data})=>refreshSession(data.session));
  db.auth.onAuthStateChange((_event,session)=>{ setTimeout(()=>refreshSession(session),0); });
  loadAnnouncements();
}
setup();
