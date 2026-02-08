import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'ID obrigatorio' },
        { status: 400 }
      )
    }

    // Check if exists
    const existing = await prisma.blocklist.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Registro nao encontrado' },
        { status: 404 }
      )
    }

    // Delete
    await prisma.blocklist.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Registro removido da blocklist',
    })
  } catch (error) {
    console.error('Delete blocklist error:', error)
    return NextResponse.json(
      { error: 'Erro ao remover da blocklist' },
      { status: 500 }
    )
  }
}
