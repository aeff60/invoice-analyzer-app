import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Redirect to the Flask export endpoint
    return NextResponse.redirect("http://localhost:5000/export")
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ status: "error", message: "Failed to export data" }, { status: 500 })
  }
}

