const { neon } = require("@neondatabase/serverless");

const MAX_NOTE_LENGTH = 280;
const MAX_SOURCE_URL_LENGTH = 280;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({
      error:
        "DATABASE_URL is not configured. Connect a Postgres database in Vercel to enable field reports.",
    });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    await ensureSchema(sql);

    if (req.method === "GET") {
      const { chainId, contractAddress, predictionId } = req.query;

      if (!chainId || !contractAddress || predictionId === undefined) {
        return res.status(400).json({
          error: "chainId, contractAddress, and predictionId are required.",
        });
      }

      const reports = await sql`
        SELECT
          id,
          chain_id,
          contract_address,
          prediction_id,
          prediction_title,
          reporter_address,
          note,
          source_url,
          created_at
        FROM field_reports
        WHERE chain_id = ${String(chainId)}
          AND LOWER(contract_address) = LOWER(${String(contractAddress)})
          AND prediction_id = ${Number(predictionId)}
        ORDER BY created_at DESC
        LIMIT 12
      `;

      return res.status(200).json({ reports });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const chainId = String(body.chainId || "").trim();
      const contractAddress = String(body.contractAddress || "").trim();
      const predictionId = Number(body.predictionId);
      const predictionTitle = String(body.predictionTitle || "").trim();
      const reporterAddress = String(body.reporterAddress || "").trim();
      const note = String(body.note || "").trim();
      const sourceUrl = String(body.sourceUrl || "").trim();

      if (!chainId || !contractAddress || Number.isNaN(predictionId)) {
        return res.status(400).json({
          error: "Prediction reference is incomplete.",
        });
      }

      if (!reporterAddress) {
        return res.status(400).json({
          error: "A connected wallet address is required to submit a report.",
        });
      }

      if (!note) {
        return res.status(400).json({
          error: "Report note is required.",
        });
      }

      if (note.length > MAX_NOTE_LENGTH) {
        return res.status(400).json({
          error: `Report note must be ${MAX_NOTE_LENGTH} characters or fewer.`,
        });
      }

      if (sourceUrl.length > MAX_SOURCE_URL_LENGTH) {
        return res.status(400).json({
          error: `Source URL must be ${MAX_SOURCE_URL_LENGTH} characters or fewer.`,
        });
      }

      if (sourceUrl && !isUrlLike(sourceUrl)) {
        return res.status(400).json({
          error: "Source URL must start with http:// or https://",
        });
      }

      const inserted = await sql`
        INSERT INTO field_reports (
          chain_id,
          contract_address,
          prediction_id,
          prediction_title,
          reporter_address,
          note,
          source_url
        )
        VALUES (
          ${chainId},
          ${contractAddress},
          ${predictionId},
          ${predictionTitle},
          ${reporterAddress},
          ${note},
          ${sourceUrl || null}
        )
        RETURNING
          id,
          chain_id,
          contract_address,
          prediction_id,
          prediction_title,
          reporter_address,
          note,
          source_url,
          created_at
      `;

      return res.status(201).json({ report: inserted[0] });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("reports api error", error);
    return res.status(500).json({
      error: "Field reports API failed to process the request.",
    });
  }
};

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS field_reports (
      id BIGSERIAL PRIMARY KEY,
      chain_id TEXT NOT NULL,
      contract_address TEXT NOT NULL,
      prediction_id INTEGER NOT NULL,
      prediction_title TEXT NOT NULL DEFAULT '',
      reporter_address TEXT NOT NULL,
      note TEXT NOT NULL,
      source_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS field_reports_lookup_idx
    ON field_reports (chain_id, contract_address, prediction_id, created_at DESC)
  `;
}

function isUrlLike(value) {
  return value.startsWith("http://") || value.startsWith("https://");
}
