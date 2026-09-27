const API_URL = "/api/containers";
const POLL_INTERVAL_MS = 6000;

const manifestEl = document.getElementById("manifest");
const emptyEl = document.getElementById("emptyState");
const rowTemplate = document.getElementById("rowTemplate");
const syncDot = document.getElementById("syncDot");
const syncLabel = document.getElementById("syncLabel");

const toggleFormBtn = document.getElementById("toggleFormBtn");
const cancelFormBtn = document.getElementById("cancelFormBtn");
const addForm = document.getElementById("addForm");
const formError = document.getElementById("formError");

const statTotal = document.getElementById("statTotal");
const statTransit = document.getElementById("statTransit");
const statArrived = document.getElementById("statArrived");
const statDelayed = document.getElementById("statDelayed");

let containers = [];
let hasLoadedOnce = false;
let isFormOpen = false;

function formatEta(iso) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHrs = Math.round(diffMs / (1000 * 60 * 60));

  const formatted = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (Number.isNaN(diffHrs)) return formatted;
  if (diffHrs > 0 && diffHrs < 48) return `${formatted} · in ${diffHrs}h`;
  if (diffHrs <= 0 && diffHrs > -48) return `${formatted} · ${Math.abs(diffHrs)}h ago`;
  return formatted;
}

function statusLabel(status) {
  return { in_transit: "In transit", delayed: "Delayed", arrived: "Arrived" }[status] || status;
}

function renderStats(list) {
  statTotal.textContent = list.length;
  statTransit.textContent = list.filter((c) => c.status === "in_transit").length;
  statArrived.textContent = list.filter((c) => c.status === "arrived").length;
  statDelayed.textContent = list.filter((c) => c.status === "delayed").length;
}

function renderManifest(list) {
  renderStats(list);

  if (list.length === 0) {
    manifestEl.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;
  manifestEl.innerHTML = "";

  for (const container of list) {
    const node = rowTemplate.content.cloneNode(true);
    const crate = node.querySelector(".crate");
    crate.dataset.id = container.id;
    crate.dataset.status = container.status;

    node.querySelector('[data-role="number"]').textContent = container.containerNumber;
    node.querySelector('[data-role="route"]').textContent =
      `${container.originPort} → ${container.destinationPort}`;
    node.querySelector('[data-role="eta"]').textContent =
      container.status === "arrived" && container.arrivedAt
        ? `Arrived ${formatEta(container.arrivedAt)}`
        : `ETA ${formatEta(container.eta)}`;
    node.querySelector('[data-role="badge"]').textContent = statusLabel(container.status);

    const notesEl = node.querySelector('[data-role="notes"]');
    if (container.notes) {
      notesEl.textContent = container.notes;
    } else {
      notesEl.remove();
    }

    node.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => handleAction(container.id, btn.dataset.action));
    });

    manifestEl.appendChild(node);
  }
}

async function handleAction(id, action) {
  if (action === "delete") {
    const ok = confirm("Remove this container from the manifest?");
    if (!ok) return;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  } else {
    await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
  }
  await loadContainers({ silent: true });
}

function setSyncing(active) {
  syncDot.classList.toggle("syncing", active);
  syncLabel.textContent = active ? "Syncing…" : "Live sync";
}

async function loadContainers({ silent } = {}) {
  if (!silent) setSyncing(true);
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to load containers");
    const data = await res.json();

    if (isFormOpen) {
      containers = data;
      return;
    }

    const changed = JSON.stringify(data) !== JSON.stringify(containers);
    containers = data;
    if (changed || !hasLoadedOnce) {
      renderManifest(containers);
    }
    hasLoadedOnce = true;
  } catch (err) {
    console.error(err);
  } finally {
    setSyncing(false);
  }
}

toggleFormBtn.addEventListener("click", () => {
  addForm.hidden = !addForm.hidden;
  isFormOpen = !addForm.hidden;
  if (isFormOpen) {
    document.getElementById("containerNumber").focus();
  }
});

cancelFormBtn.addEventListener("click", () => {
  addForm.hidden = true;
  isFormOpen = false;
  addForm.reset();
  formError.hidden = true;
});

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const payload = {
    containerNumber: document.getElementById("containerNumber").value.trim(),
    originPort: document.getElementById("originPort").value.trim(),
    destinationPort: document.getElementById("destinationPort").value.trim(),
    eta: document.getElementById("eta").value,
    notes: document.getElementById("notes").value.trim(),
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not add container");
    }

    addForm.reset();
    addForm.hidden = true;
    isFormOpen = false;
    await loadContainers({ silent: true });
  } catch (err) {
    formError.textContent = err.message;
    formError.hidden = false;
  }
});

loadContainers();
setInterval(() => loadContainers({ silent: true }), POLL_INTERVAL_MS);
