
const studentForm = document.getElementById("studentForm");
const adminForm = document.getElementById("adminForm");
const studentTab = document.getElementById("studentTab");
const adminTab = document.getElementById("adminTab");
const message = document.getElementById("message");

function switchRole(role) {
    message.textContent = "";

    if (role === "student") {
        studentForm.classList.remove("hidden");
        adminForm.classList.add("hidden");
        studentTab.classList.add("active");
        adminTab.classList.remove("active");
    } else {
        adminForm.classList.remove("hidden");
        studentForm.classList.add("hidden");
        adminTab.classList.add("active");
        studentTab.classList.remove("active");
    }
}

async function sendLogin(data) {
    message.style.color = "#b54747";
    message.textContent = "Sedang memeriksa akun...";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login gagal.");
        }

        message.style.color = "#087f70";
        message.textContent = "Login berhasil. Mengalihkan halaman...";

        window.location.href = result.redirect;

    } catch (error) {
        message.style.color = "#b54747";
        message.textContent = error.message;
    }
}

// Login mahasiswa
studentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    sendLogin({
        role: "student",
        nim: document.getElementById("nim").value.trim(),
        fullName: document.getElementById("studentName").value.trim()
    });
});

// Login admin
adminForm.addEventListener("submit", function (event) {
    event.preventDefault();

    sendLogin({
        role: "admin",
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
    });
});
