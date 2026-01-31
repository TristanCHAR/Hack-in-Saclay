import express from "express";
import cors from "cors";
import "./db";
import criseHistoryRouter from "./routes/criseHistory";
import drugHistoryRouter from "./routes/drugHistory";
import flashPopHistoryRouter from "./routes/flashPopHistory";
import noiseGameHistoryRouter from "./routes/noiseGameHistory";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/crise-history", criseHistoryRouter);
app.use("/drug-history", drugHistoryRouter);
app.use("/flash-pop-history", flashPopHistoryRouter);
app.use("/noise-game-history", noiseGameHistoryRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
