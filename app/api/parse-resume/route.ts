/* eslint-disable @typescript-eslint/no-explicit-any */
import pdf from "pdf-parse/lib/pdf-parse.js" // ✅ IMPORTANT CHANGE

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Invalid file" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ✅ PASS BUFFER CORRECTLY
    const data = await pdf(buffer)

    return Response.json({
      text: data.text || "",
    })
  } catch (error: any) {
    console.error("❌ ERROR:", error)

    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}