const totalStudents = document.getElementById("totalStudents");
const totalVoters = document.getElementById("totalVoters");
const notVoted = document.getElementById("notVoted");
const totalVotes = document.getElementById("totalVotes");

const electionStatus = document.getElementById("electionStatus");
const resultsArea = document.getElementById("resultsArea");

async function loadDashboard() {
    try {
        const response = await fetch("/api/admin/dashboard", {
            method: "GET",
            credentials: "include"
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = "index.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Gagal mengambil data dashboard.");
        }

        const data = await response.json();

        totalStudents.textContent = data.totalStudents;
        totalVoters.textContent = data.totalVoters;
        notVoted.textContent = data.notVoted;
        totalVotes.textContent = data.totalVotes;

        electionStatus.textContent =
            data.electionStatus === "closed" ? "Ditutup" : "Dibuka";

        if (data.electionStatus === "closed") {
            renderResults(data.results || []);
        } else {
            resultsArea.textContent =
                "Hasil suara belum dapat dilihat karena pemilihan masih berlangsung.";
        }

    } catch (error) {
        totalStudents.textContent = "—";
        totalVoters.textContent = "—";
        notVoted.textContent = "—";
        totalVotes.textContent = "—";

        electionStatus.textContent = "Belum terhubung";
        resultsArea.textContent =
            "Dashboard belum terhubung ke backend dan database.";
    }
}

function renderResults(results) {
    resultsArea.replaceChildren();

    if (results.length === 0) {
        resultsArea.textContent = "Belum ada suara masuk.";
        return;
    }

    results.forEach(function (candidate) {
        const row = document.createElement("div");
        row.className = "result-row";

        const name = document.createElement("strong");
        name.textContent = candidate.name;

        const votes = document.createElement("span");
        votes.textContent = `${candidate.votes} suara`;

        row.append(name, votes);
        resultsArea.appendChild(row);
    });
}

async function updateElectionStatus(status) {
    const confirmed = confirm(
        status === "open"
            ? "Apakah kamu yakin ingin membuka pemilihan?"
            : "Apakah kamu yakin ingin menutup pemilihan?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch("/api/admin/election-status", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error("Perubahan status gagal.");
        }

        await loadDashboard();
        alert("Status pemilihan berhasil diperbarui.");

    } catch (error) {
        alert("Belum berhasil. Backend belum tersedia atau terjadi kesalahan.");
    }
}

document.getElementById("openElection").addEventListener("click", function () {
    updateElectionStatus("open");
});

document.getElementById("closeElection").addEventListener("click", function () {
    updateElectionStatus("closed");
});

document.getElementById("logoutButton").addEventListener("click", async function () {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        });
    } finally {
        window.location.href = "index.html";
    }
});

loadDashboard();