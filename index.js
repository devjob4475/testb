const express = require("express");
const cors = require("cors"); // <-- เพิ่มตรงนี้
const axios = require("axios");
const app = express();
const port = 8080;

app.use(cors()); // <-- ให้ allow ทุก origin
app.use(express.json());

app.post("/save-m3u", async (req, res) => {
  const { content, url } = req.body;

  if (!content) {
    return res.status(400).send("Missing 'content' in request body.");
  }

  try {
    // Step 1: ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    let sha = null;
    try {
      const getResponse = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
        },
      });
      sha = getResponse.data.sha;
    } catch (err) {
      if (err.response?.status !== 404) {
        throw err; // ถ้าไม่ใช่ 404 แปลว่า error จริง
      }
    }

    // Step 2: ถ้ามีอยู่ -> ลบก่อน
    if (sha) {
      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: {
          message: "delete old file before re-uploading",
          sha: sha,
        },
      });
    }

    // Step 3: PUT ไฟล์ใหม่ (อัปโหลด)
    const putResponse = await axios.put(
      url,
      {
        message: "upload new m3u file",
        content: content, // base64 encoded already
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(putResponse.data);
  } catch (error) {
    console.error("GitHub API error:", error.response?.data || error.message);
    res.status(500).send("Failed to process GitHub operation.");
  }
});

app.listen(port, () => {
  console.log(`API Listening on Port ${port}`);
});

setInterval(async () => {
  try {
    await axios.get("https://testflix2.vercel.app");
    console.log("Pinged https://testflix2.vercel.app");
  } catch (err) {
    console.error("Failed to ping:", err.message);
  }
}, 60 * 1000); // ทุก 1 นาที

