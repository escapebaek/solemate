const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID ?? ''

interface ColorwayRow {
  image_url: string | null
  created_by: string | null
}

/**
 * Priority: admin account → oldest by created_at (caller must pass rows ordered ASC)
 */
export function pickBestColorwayImage(rows: ColorwayRow[]): string | null {
  const withImg = rows.filter(r => r.image_url)
  if (!withImg.length) return null
  if (ADMIN_USER_ID) {
    const adminPick = withImg.find(r => r.created_by === ADMIN_USER_ID)
    if (adminPick?.image_url) return adminPick.image_url
  }
  return withImg[0]?.image_url ?? null
}
