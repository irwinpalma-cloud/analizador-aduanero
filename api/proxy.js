export default async function handler(req, res) {
  try {
    res.status(200).json({
      ok: true,
      message: "API funcionando desde /api/proxy"
    });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
}
