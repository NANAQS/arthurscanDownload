const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const archiver = require("archiver");
const stream = require("stream");

const app = express();
app.use(express.json())
const PORT = 3000;

app.get("/", (req, res) => {
  res.sendFile('index.html', { root: __dirname })
})

app.post("/proxy", async (req, res) => {
  const body = req.body
  try {
    const url = body.url;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const images = [];

    $(".page-break img").each((index, element) => {
      const src = $(element).attr("src");
      if (src) {
        images.push(src.trim());
      }
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="images.zip"');

    const zip = archiver("zip");
    zip.pipe(res);

    for (const imageUrl of images) {
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      zip.append(imageResponse.data, { name: imageUrl.split('/').pop() }); 
    }

    zip.finalize();
  } catch (error) {
    console.error("Erro ao buscar a URL:", error);
    res.status(500).send("Erro ao buscar a URL");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});
