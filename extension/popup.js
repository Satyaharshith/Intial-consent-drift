// ConsentDrift Chrome Extension Popup Script

const BACKEND_URL = "http://localhost:8000";
const FRONTEND_URL = "http://localhost:5173";

let currentAnalysisId = null;

document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  setupLinks();
  await checkBackendStatus();
  await loadConsents();
  await checkPendingEvidence();
  setupForms();
});

// Check backend connectivity and mode
async function checkBackendStatus() {
  const dot = document.getElementById("status-dot");
  const text = document.getElementById("status-text");
  const banner = document.getElementById("offline-banner");

  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      dot.className = "status-dot online";
      text.textContent = `Online (${data.mode})`;
      banner.style.display = "none";
      return true;
    }
  } catch (err) {
    // Offline
  }

  dot.className = "status-dot offline";
  text.textContent = "Offline";
  banner.style.display = "block";
  return false;
}

// Fetch list of consents from backend
async function loadConsents() {
  const select = document.getElementById("consent-select");
  try {
    const res = await fetch(`${BACKEND_URL}/api/consents`);
    if (!res.ok) throw new Error("Failed to load");
    const consents = await res.json();

    select.innerHTML = "";
    if (consents.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No baselines found. Create one first!";
      select.appendChild(opt);
    } else {
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "-- Select a Consent Baseline --";
      select.appendChild(defaultOpt);

      consents.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.service_name} (${c.organisation})`;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    select.innerHTML = '<option value="">Error connecting to backend</option>';
  }
}

// Check if context menu saved any pending evidence
async function checkPendingEvidence() {
  if (typeof chrome === "undefined" || !chrome.storage) return;

  chrome.storage.local.get(["pending_evidence"], (result) => {
    if (result.pending_evidence && result.pending_evidence.content) {
      const p = result.pending_evidence;
      document.getElementById("evidence-content").value = p.content;
      if (p.title) {
        document.getElementById("evidence-title").value = p.title;
      }
      document.getElementById("pending-alert").style.display = "flex";
      chrome.action.setBadgeText({ text: "" });
    }
  });

  document.getElementById("clear-pending-btn").addEventListener("click", () => {
    document.getElementById("pending-alert").style.display = "none";
    document.getElementById("evidence-content").value = "";
    chrome.storage.local.remove(["pending_evidence"]);
  });
}

// Setup tab navigation
function setupTabs() {
  const evTabBtn = document.getElementById("tab-evidence-btn");
  const baseTabBtn = document.getElementById("tab-baseline-btn");
  const evPane = document.getElementById("pane-evidence");
  const basePane = document.getElementById("pane-baseline");

  evTabBtn.addEventListener("click", () => {
    evTabBtn.classList.add("active");
    baseTabBtn.classList.remove("active");
    evPane.classList.add("active");
    basePane.classList.remove("active");
  });

  baseTabBtn.addEventListener("click", async () => {
    baseTabBtn.classList.add("active");
    evTabBtn.classList.remove("active");
    basePane.classList.add("active");
    evPane.classList.remove("active");
    await populateActiveTabInfo();
  });
}

// Extract current active tab title/url/text into baseline form
async function populateActiveTabInfo() {
  if (typeof chrome === "undefined" || !chrome.tabs) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    let org = "Web Service";
    if (tab.url) {
      try {
        org = new URL(tab.url).hostname.replace(/^www\./, "");
      } catch (e) {}
    }

    document.getElementById("baseline-org").value = org;
    document.getElementById("baseline-service").value = tab.title ? tab.title.slice(0, 80) : "Web Baseline";

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body ? document.body.innerText.trim().slice(0, 5000) : ""
    });

    if (results && results[0] && results[0].result) {
      document.getElementById("baseline-purpose").value = results[0].result;
    }
  } catch (err) {
    console.log("Could not inspect current tab:", err);
  }
}

// Setup form submission handlers
function setupForms() {
  // Evidence Analysis Form
  const evForm = document.getElementById("evidence-form");
  const analyseBtn = document.getElementById("analyse-btn");
  const resultCard = document.getElementById("analysis-result");
  const resetBtn = document.getElementById("reset-evidence-btn");
  const openAnalysisBtn = document.getElementById("open-analysis-btn");

  evForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const consentId = document.getElementById("consent-select").value;
    const evidenceType = document.getElementById("evidence-type").value;
    const title = document.getElementById("evidence-title").value.trim();
    const content = document.getElementById("evidence-content").value.trim();

    if (!consentId) {
      alert("Please select a baseline consent record first.");
      return;
    }

    analyseBtn.disabled = true;
    analyseBtn.innerHTML = "<span>Analyzing...</span>";

    try {
      const res = await fetch(`${BACKEND_URL}/api/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent_id: parseInt(consentId, 10),
          title: title,
          evidence_type: evidenceType,
          content: content,
          source: "Chrome Extension"
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      currentAnalysisId = data.analysis.id;

      // Render results
      const risk = data.analysis.risk;
      const riskBadge = document.getElementById("result-risk-badge");
      riskBadge.className = `badge-risk risk-${risk}`;
      riskBadge.textContent = risk.replace("_", " ");

      document.getElementById("result-mode-text").textContent = `mode: ${data.analysis.mode}`;
      document.getElementById("result-explanation").textContent = data.analysis.explanation;
      document.getElementById("result-quotes-count").textContent = `${data.analysis.evidence_quotes.length} validated quotes`;
      document.getElementById("result-signals-count").textContent = `${data.analysis.rule_signals.length} signals`;

      evForm.style.display = "none";
      resultCard.style.display = "block";

      // Clear pending storage
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.remove(["pending_evidence"]);
      }
    } catch (err) {
      alert(`Error analyzing evidence: ${err.message}`);
    } finally {
      analyseBtn.disabled = false;
      analyseBtn.innerHTML = "<span>Analyse Purpose Drift</span>";
    }
  });

  resetBtn.addEventListener("click", () => {
    evForm.reset();
    evForm.style.display = "block";
    resultCard.style.display = "none";
    document.getElementById("pending-alert").style.display = "none";
  });

  openAnalysisBtn.addEventListener("click", () => {
    if (currentAnalysisId) {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.create({ url: `${FRONTEND_URL}/analyses/${currentAnalysisId}` });
      } else {
        window.open(`${FRONTEND_URL}/analyses/${currentAnalysisId}`, "_blank");
      }
    }
  });

  // Save Baseline Form
  const baseForm = document.getElementById("baseline-form");
  const saveBaseBtn = document.getElementById("save-baseline-btn");
  const baseSuccess = document.getElementById("baseline-success");

  baseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const org = document.getElementById("baseline-org").value.trim();
    const service = document.getElementById("baseline-service").value.trim();
    const purpose = document.getElementById("baseline-purpose").value.trim();

    saveBaseBtn.disabled = true;
    saveBaseBtn.textContent = "Saving...";

    try {
      const res = await fetch(`${BACKEND_URL}/api/consents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation: org,
          service_name: service,
          original_purpose: purpose,
          data_categories: [],
          source_type: "official_text"
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to save baseline: HTTP ${res.status}`);
      }

      baseSuccess.style.display = "block";
      baseForm.reset();
      await loadConsents();

      setTimeout(() => {
        baseSuccess.style.display = "none";
        document.getElementById("tab-evidence-btn").click();
      }, 1500);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      saveBaseBtn.disabled = false;
      saveBaseBtn.textContent = "Save Consent Baseline";
    }
  });
}

function setupLinks() {
  document.getElementById("open-app-link").addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: FRONTEND_URL });
    } else {
      window.open(FRONTEND_URL, "_blank");
    }
  });
}
