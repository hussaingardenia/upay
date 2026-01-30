import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const TOKEN = process.env.UPAYMENTS_TOKEN || "jtest123";

app.post("/api/upayments/create", async (req, res) => {
  try {
    const r = await fetch("https://sandboxapi.upayments.com/api/v1/charge", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
