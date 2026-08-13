export type AssignmentUserOption = {
  id: string
  label: string
}

export function buildAssignmentUserOptions(
  profileRows: Array<{
    user_id?: string | null
    friendly_name?: string | null
  }>,
  fallbackUserId?: string | null,
): AssignmentUserOption[] {
  const seenUserIds = new Set<string>()
  const options: AssignmentUserOption[] = []

  for (const profile of profileRows) {
    const userId = profile.user_id?.trim()
    if (!userId || seenUserIds.has(userId)) {
      continue
    }

    seenUserIds.add(userId)

    const displayName = profile.friendly_name?.trim()
    options.push({
      id: userId,
      label: displayName ? `${displayName}` : userId,
    })
  }

  if (options.length === 0 && fallbackUserId?.trim()) {
    const fallbackId = fallbackUserId.trim()
    options.push({ id: fallbackId, label: fallbackId })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label))
}
