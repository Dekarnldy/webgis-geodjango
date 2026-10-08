import "./base.css";
import "./login.css";
import {
  AuthError,
  MissingIdentityError,
  acceptInvite,
  getSettings,
  getUser,
  handleAuthCallback,
  login,
  oauthLogin,
  requestPasswordRecovery,
  updateUser,
} from "@netlify/identity";

const views = ["login-view", "recovery-view", "password-view"] as const;
type View = (typeof views)[number];

function el<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

function show(view: View) {
  for (const v of views) el(v).hidden = v !== view;
}

function showError(message: string) {
  el("notice").hidden = true;
  el("error").textContent = message;
  el("error").hidden = false;
}

function showNotice(message: string) {
  el("error").hidden = true;
  el("notice").textContent = message;
  el("notice").hidden = false;
}

function errorMessage(error: unknown) {
  if (error instanceof MissingIdentityError) return "Login is not available: Netlify Identity is not enabled on this site.";
  if (error instanceof AuthError) {
    if (error.status === 401) return "Your email and password didn't match. Please try again.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function goToMap() {
  window.location.href = "/";
}

// Disable the submit button while a request is in flight
function onSubmit(formId: string, handler: (data: FormData) => Promise<void>) {
  const form = el<HTMLFormElement>(formId);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
    button.disabled = true;
    try {
      await handler(new FormData(form));
    } catch (error) {
      showError(errorMessage(error));
    } finally {
      button.disabled = false;
    }
  });
}

let inviteToken: string | null = null;

onSubmit("login-form", async (data) => {
  await login(String(data.get("email")), String(data.get("password")));
  goToMap();
});

onSubmit("recovery-form", async (data) => {
  await requestPasswordRecovery(String(data.get("email")));
  showNotice("If that email has an account, a password reset link is on its way.");
  show("login-view");
});

onSubmit("password-form", async (data) => {
  const password = String(data.get("password"));
  if (inviteToken) {
    await acceptInvite(inviteToken, password);
  } else {
    await updateUser({ password });
  }
  goToMap();
});

el("show-recovery").addEventListener("click", (e) => {
  e.preventDefault();
  show("recovery-view");
});

el("back-to-login").addEventListener("click", (e) => {
  e.preventDefault();
  show("login-view");
});

el("google-signin").addEventListener("click", () => oauthLogin("google"));

async function start() {
  // Handle links from Identity emails (invites, password resets, confirmations) and OAuth redirects
  try {
    const result = await handleAuthCallback();
    if (result) {
      switch (result.type) {
        case "invite":
          inviteToken = result.token ?? null;
          el("password-heading").textContent = "Accept your invite";
          show("password-view");
          return;
        case "recovery":
          el("password-heading").textContent = "Set a new password";
          show("password-view");
          return;
        default:
          goToMap();
          return;
      }
    }
  } catch (error) {
    showError(errorMessage(error));
  }

  if (await getUser()) {
    goToMap();
    return;
  }

  try {
    const settings = await getSettings();
    el("google-signin").hidden = !settings.providers.google;
  } catch {
    // Settings unavailable; keep the Google button hidden
  }
}

start();
