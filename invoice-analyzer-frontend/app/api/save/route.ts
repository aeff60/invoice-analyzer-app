import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const flaskResponse = await fetch("http://localhost:5000/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const responseData = await flaskResponse.json()
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error saving invoice:", error)
    return NextResponse.json({ status: "error", message: "Failed to save invoice" }, { status: 500 })
  }
}

