import { NextResponse } from 'next/server';
import { favoriteQueries } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const favorites = favoriteQueries.getAll();
    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, from_stop_id, to_stop_id, preferred_routes, priority_mode } = body;

    if (!name || !from_stop_id || !to_stop_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = favoriteQueries.create({
      name,
      from_stop_id,
      to_stop_id,
      preferred_routes: preferred_routes || [],
      priority_mode: priority_mode || 'time'
    });

    const favorite = favoriteQueries.getById(id);
    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Error creating favorite:', error);
    return NextResponse.json(
      { error: 'Failed to create favorite' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing favorite ID' },
        { status: 400 }
      );
    }

    favoriteQueries.update(id, updates);
    const favorite = favoriteQueries.getById(id);

    return NextResponse.json(favorite);
  } catch (error) {
    console.error('Error updating favorite:', error);
    return NextResponse.json(
      { error: 'Failed to update favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing favorite ID' },
        { status: 400 }
      );
    }

    favoriteQueries.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    );
  }
}
