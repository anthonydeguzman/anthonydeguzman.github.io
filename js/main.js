initYear();
initCopyEmail();

function initYear() {
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function initCopyEmail() {
  const button = document.querySelector("[data-copy-email]");
  const status = document.querySelector("#copy-status");
  if (!button || !navigator.clipboard?.writeText) return;
  button.hidden = false;
  let reset;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copyEmail);
      button.textContent = "Copied";
      if (status) status.textContent = "Email address copied to clipboard.";
      clearTimeout(reset);
      reset = setTimeout(() => {
        button.textContent = "Copy email";
      }, 2200);
    } catch {
      clearTimeout(reset);
      button.textContent = "Couldn’t copy";
      reset = setTimeout(() => {
        button.textContent = "Copy email";
      }, 2200);
      if (status)
        status.textContent =
          "Select the email address to copy it, or open it in your email app.";
    }
  });
}
