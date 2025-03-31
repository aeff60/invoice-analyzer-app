import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ status: "error", message: "No file part" }, { status: 400 })
    }

    // Forward the request to the Flask backend
    const flaskFormData = new FormData()
    flaskFormData.append("file", file)

    const flaskResponse = await fetch("http://localhost:5000/analyze-upload", {
      method: "POST",
      body: flaskFormData,
    })

    const data = await flaskResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json({ status: "error", message: "Failed to process file" }, { status: 500 })
  }
}

