async function run() {
  try {
    console.log("Registering user...");
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Test",
        email: "test3@test.com",
        password: "password123"
      })
    });
    console.log("Registered:", await regRes.json());

    console.log("Logging in...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "test3@test.com",
        password: "password123"
      })
    });
    console.log("Logged in:", await loginRes.json());
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
