import pdf from "pdf-parse/lib/pdf-parse.js"

const MAX_BYTES = 2 * 1024 * 1024
const PDF_MAGIC = "%PDF-"

const fail = (status: number, error: string) => Response.json({ error }, { status })

export async function POST(req: Request) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return fail(400, "Invalid request")
  }

  const file = formData.get("file")
  if (!file || typeof file === "string" || typeof (file as Blob).arrayBuffer !== "function") {
    return fail(400, "Invalid file")
  }
  if (file.size === 0) return fail(400, "Invalid file")
  if (file.size > MAX_BYTES) return fail(413, "File too large")

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) return fail(400, "Invalid file")
    if (buffer.length > MAX_BYTES) return fail(413, "File too large")
    if (buffer.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
      return fail(400, "Invalid file")
    }

    const data = await pdf(buffer)
    return Response.json({ text: data.text || "" })
  } catch (error) {
    console.error("parse-resume failed:", error)
    return fail(500, "Could not read the file")
  }
}
