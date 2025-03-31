import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const data = await request.json()

    const flaskResponse = await fetch(`http://localhost:5000/update/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const responseData = await flaskResponse.json()
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ status: "error", message: "Failed to update invoice" }, { status: 500 })
  }
}

