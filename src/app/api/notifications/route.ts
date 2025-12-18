import { NextResponse } from "next/server";

export async function GET(){
    return NextResponse.json({message: "Liste des notifications chargées."}, { status: 200 });
}